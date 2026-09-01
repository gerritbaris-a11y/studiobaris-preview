import { NextResponse } from "next/server";
import {
  getFacturenTeMaken, maakFactuur, setFactuurStatus,
} from "../../../../lib/abonnementen-data";
import { factuurPdf, mailFactuur, OMSCHRIJVING } from "../../../../lib/facturen";
import { backupNaarDrive } from "../../../../lib/drive-backup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

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

  return NextResponse.json({ ok: true, incassodatum, periode, aantal: klanten.length, gedaan });
}
