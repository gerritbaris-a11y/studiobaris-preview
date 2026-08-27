import { NextResponse } from "next/server";
import { getBetaalinfo, setBetaling, setRest } from "../../../../lib/server-data";
import { mollie, eersteIncasso, inclBtw, incassodagVoor } from "../../../../lib/mollie";
import { setIncassodag, maakFactuur, setFactuurStatus } from "../../../../lib/abonnementen-data";
import {
  factuurPdf, mailFactuur, regelsEersteBetaling, soortEersteBetaling, OMSCHRIJVING,
} from "../../../../lib/facturen";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://preview.studiobaris.nl";

// Factuur maken én mailen. Gaat dit mis, dan blijft de betaling gewoon staan:
// Mollie mag hier nooit een fout op terugkrijgen, anders blijft hij herhalen.
// De factuur blijft dan op 'concept' en kan met één knop opnieuw de deur uit.
async function factureer(opties) {
  try {
    const factuur = await maakFactuur(opties);
    if (!factuur || !factuur.nummer) return null;
    if (factuur.status === "verstuurd") return factuur;
    const pdf = await factuurPdf(factuur);
    const mail = await mailFactuur(factuur, pdf);
    if (mail.sent) await setFactuurStatus(factuur.nummer, "verstuurd");
    return factuur;
  } catch {
    return null;
  }
}

// Mollie roept dit aan na een betaling. Body bevat 'id' (payment-id).
export async function POST(req) {
  try {
    let id = "";
    try {
      const form = await req.formData();
      id = String(form.get("id") || "");
    } catch {
      const text = await req.text();
      const m = text.match(/id=([^&]+)/);
      if (m) id = decodeURIComponent(m[1]);
    }
    if (!id) return new NextResponse("geen id", { status: 200 });

    const payment = await mollie(`/payments/${id}`);
    const slug = payment && payment.metadata && payment.metadata.slug;
    if (!slug) return new NextResponse("geen slug", { status: 200 });

    // Restbetaling (de tweede termijn van het websitebedrag, bij oplevering).
    if (payment.metadata && payment.metadata.soort === "rest") {
      if (payment.status === "paid") {
        await setRest(slug, "betaald", payment.id);
        const info = await getBetaalinfo(slug);
        const rest = Number(info && info.restbedrag) || 0;
        if (rest > 0) {
          await factureer({
            slug, soort: "slottermijn", paymentId: payment.id, vervaldagen: 7,
            regels: [{ omschrijving: OMSCHRIJVING.slottermijn, bedrag_excl: rest }],
          });
        }
      } else if (["failed", "canceled", "expired"].includes(payment.status)) {
        await setRest(slug, "mislukt", payment.id);
      }
      return new NextResponse("ok", { status: 200 });
    }

    // Alleen handelen op de eerste (machtigings)betaling.
    if (payment.sequenceType === "first") {
      if (payment.status === "paid") {
        const info = await getBetaalinfo(slug);
        const maand = Number(info && info.maandbedrag) || 0;

        // Geen dubbel abonnement aanmaken. Het abonnement draait op het
        // MAANDBEDRAG; de eerste betaling was website + eerste maand samen.
        if (info && !info.betaal_abonnement_id && payment.customerId && maand > 0) {
          const start = eersteIncasso(payment.paidAt || undefined);
          const sub = await mollie(`/customers/${payment.customerId}/subscriptions`, "POST", {
            amount: { currency: "EUR", value: inclBtw(maand).toFixed(2) },
            interval: "1 month",
            startDate: start.datum,
            description: `Maandelijkse website-vergoeding ${slug}`,
            webhookUrl: `${SITE_URL}/api/mollie/webhook`,
            metadata: { slug },
          });
          await setBetaling(slug, {
            status: "actief",
            abonnement_id: sub.id,
            mandaat_id: payment.mandateId || null,
          });
          // Vanaf nu weet het dashboard wanneer er geïncasseerd wordt, en dus
          // ook wanneer de maandfactuur veertien dagen vooraf moet uitgaan.
          await setIncassodag(slug, start.dag);
        } else {
          await setBetaling(slug, { status: "actief", mandaat_id: payment.mandateId || null });
          if (info && !info.incassodag && payment.paidAt) {
            await setIncassodag(slug, incassodagVoor(new Date(payment.paidAt).getDate()));
          }
        }

        // De factuur voor wat er zojuist is afgerekend: het websitedeel plus de
        // eerste maand. Vastgeklonken aan het betaal-id van Mollie, dus een
        // herhaalde webhook levert nooit een tweede factuurnummer op.
        const verse = await getBetaalinfo(slug);
        const regels = regelsEersteBetaling(verse || {});
        if (regels.length > 0) {
          const soort = soortEersteBetaling(verse || {});
          await factureer({
            slug,
            soort,
            paymentId: payment.id,
            periode: soort === "maandelijks"
              ? String(payment.paidAt || new Date().toISOString()).slice(0, 7)
              : null,
            vervaldagen: 14,
            regels,
          });
        }
      } else if (["failed", "canceled", "expired"].includes(payment.status)) {
        await setBetaling(slug, { status: "mislukt" });
      }
    }

    return new NextResponse("ok", { status: 200 });
  } catch (e) {
    // Mollie verwacht 200; loggen kan via Vercel-logs.
    return new NextResponse("fout: " + String(e.message || e), { status: 200 });
  }
}
