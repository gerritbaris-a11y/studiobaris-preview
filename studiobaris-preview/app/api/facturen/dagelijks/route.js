import { NextResponse } from "next/server";
import {
  getFacturenTeMaken, maakFactuur, setFactuurStatus, getSlottermijnTeIncasseren,
} from "../../../../lib/abonnementen-data";
import { factuurPdf, mailFactuur, OMSCHRIJVING } from "../../../../lib/facturen";
import { backupNaarDrive } from "../../../../lib/drive-backup";
import { berekenSlottermijn } from "../../../../lib/betaling-berekening";
import { mollie, mollieConfigured, inclBtw } from "../../../../lib/mollie";
import { setRest } from "../../../../lib/server-data";
import { maakTaak, getTaken } from "../../../../lib/taken-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://preview.studiobaris.nl";

// Draait elke ochtend via Vercel Cron (zie vercel.json).
//
// Veertien dagen vóór de incassodatum gaat de maandfactuur de deur uit. Dat is
// geen keuze maar een verplichting: bij SEPA moet de klant vooraf weten wat er
// wordt afgeschreven, en deze factuur ís die vooraankondiging.
//
// De taak mag gerust twee keer draaien: sb_factuur_maak weigert een tweede
// factuur voor dezelfde maand, en een mail die gisteren mislukte wordt vandaag
// vanzelf opnieuw geprobeerd (de factuur staat dan nog op 'concept').
const DAGEN_VOORAF = 14;

function isoDatum(d) {
  return d.toISOString().slice(0, 10);
}

export async function GET(req) {
  // Wie mag deze route aanroepen? Drie manieren, in volgorde van stevigheid:
  //  1. Vercel Cron met een Bearer-token, als CRON_SECRET is ingesteld.
  //  2. Handmatig, met ?sleutel=<CRON_SECRET> — handig om 'm een keer te testen.
  //  3. Vercel's eigen cron-user-agent, zodat de taak ook draait zolang er nog
  //     geen CRON_SECRET is ingevuld. Zet 'm alsnog: dan valt deze derde weg.
  const geheim = process.env.CRON_SECRET;
  const kop = req.headers.get("authorization") || "";
  const agent = req.headers.get("user-agent") || "";
  const sleutel = new URL(req.url).searchParams.get("sleutel") || "";
  const magDoor = geheim
    ? kop === `Bearer ${geheim}` || sleutel === geheim
    : agent.startsWith("vercel-cron/");
  if (!magDoor) {
    return NextResponse.json({ ok: false, error: "Geen toegang." }, { status: 401 });
  }

  const doel = new Date();
  doel.setDate(doel.getDate() + DAGEN_VOORAF);
  const incassodatum = isoDatum(doel);
  const periode = incassodatum.slice(0, 7);

  const klanten = await getFacturenTeMaken(incassodatum);
  const gedaan = [];

  for (const k of klanten) {
    try {
      const factuur = await maakFactuur({
        slug: k.slug,
        soort: "maandelijks",
        periode,
        incassodatum,
        regels: [{ omschrijving: OMSCHRIJVING.maandelijks, bedrag_excl: Number(k.maandbedrag), periode }],
      });
      if (!factuur || !factuur.nummer) {
        gedaan.push({ slug: k.slug, ok: false, reden: "factuur niet aangemaakt" });
        continue;
      }
      if (factuur.status === "verstuurd") {
        gedaan.push({ slug: k.slug, nummer: factuur.nummer, ok: true, reden: "stond al verstuurd" });
        continue;
      }
      const pdf = await factuurPdf(factuur);
      const mail = await mailFactuur(factuur, pdf);
      if (mail.sent) await setFactuurStatus(factuur.nummer, "verstuurd");
      backupNaarDrive(factuur, pdf).catch(() => {});
      gedaan.push({ slug: k.slug, nummer: factuur.nummer, ok: mail.sent, reden: mail.reason || "verstuurd" });
    } catch (e) {
      gedaan.push({ slug: k.slug, ok: false, reden: String(e.message || e) });
    }
  }

  // Slottermijnen (optie 5) waarvan de 14-dagen-termijn na de aankondiging
  // voorbij is. Alleen automatisch incasseren als er een bruikbaar mandaat
  // is (sequenceType "recurring" — dat kan zonder de klant erbij, want er
  // is al eerder een machtiging afgegeven). Zonder mandaat kán een Mollie-
  // betaling nooit stil op de achtergrond: "first" vereist altijd dat de
  // klant zelf de checkout afrondt. Dan dus geen betaling starten, maar een
  // taak op het Bord — met de bestaande handmatige /restbetaling-link als
  // wat iemand zelf kan versturen.
  const slottermijnen = await getSlottermijnTeIncasseren();
  const slottermijnGedaan = [];

  for (const k of slottermijnen) {
    try {
      const berekening = berekenSlottermijn({
        company_name: k.company_name, slug: k.slug,
        slottermijn_bedrag: k.bedrag,
        betaal_mandaat_id: k.betaal_mandaat_id, betaal_status: k.betaal_status,
      });

      if (berekening.sequenceType !== "recurring") {
        const titel = `Slottermijn zonder mandaat: ${k.company_name || k.slug}`;
        const taken = await getTaken();
        const bestaatAl = (Array.isArray(taken) ? taken : []).some(
          (t) => t.kolom !== "klaar" && t.titel === titel
        );
        if (!bestaatAl) {
          await maakTaak({
            titel,
            omschrijving: `De 14-dagen-termijn voor de slottermijn (${OMSCHRIJVING.slottermijn}, € ${Number(k.bedrag).toFixed(2)}) is voorbij, maar er is geen bruikbaar SEPA-mandaat om automatisch te incasseren. Stuur zelf de betaallink via /restbetaling/${k.slug}.`,
            prioriteit: "normaal",
            kolom: "te_doen",
            klantSlug: k.slug,
            aangemaaktDoor: "Cron (slottermijn)",
          });
        }
        slottermijnGedaan.push({ slug: k.slug, ok: false, reden: "geen mandaat, taak aangemaakt" });
        continue;
      }

      if (!mollieConfigured()) {
        slottermijnGedaan.push({ slug: k.slug, ok: false, reden: "MOLLIE_API_KEY ontbreekt" });
        continue;
      }

      const payment = await mollie("/payments", "POST", {
        amount: { currency: "EUR", value: inclBtw(berekening.bedrag).toFixed(2) },
        customerId: k.betaal_klant_id,
        sequenceType: "recurring",
        description: berekening.omschrijving,
        webhookUrl: `${SITE_URL}/api/mollie/webhook`,
        metadata: { slug: k.slug, soort: "slottermijn" },
      });
      // 'open' zet 'm meteen buiten bereik van de query van morgen
      // (sb_slottermijn_te_incasseren sluit rest_status 'open'/'betaald' uit)
      // — de webhook zet 'm dadelijk op 'betaald' of 'mislukt' zodra Mollie
      // de uitkomst meldt.
      await setRest(k.slug, "open", payment.id);
      slottermijnGedaan.push({ slug: k.slug, ok: true, reden: "betaling gestart" });
    } catch (e) {
      slottermijnGedaan.push({ slug: k.slug, ok: false, reden: String(e.message || e) });
    }
  }

  return NextResponse.json({
    ok: true, incassodatum, periode, aantal: klanten.length, gedaan,
    slottermijnAantal: slottermijnen.length, slottermijnGedaan,
  });
}
