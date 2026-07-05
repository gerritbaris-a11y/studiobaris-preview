import { NextResponse } from "next/server";
import { getBetaalinfo, setBetaling } from "../../../../lib/server-data";
import { mollie, eenMaandVooruit, inclBtw } from "../../../../lib/mollie";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://studiobaris-preview.vercel.app";

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

    // Alleen handelen op de eerste (machtigings)betaling.
    if (payment.sequenceType === "first") {
      if (payment.status === "paid") {
        const info = await getBetaalinfo(slug);
        const maand = Number(info && info.maandbedrag);
        // Geen dubbel abonnement aanmaken. Abonnement draait op het MAANDBEDRAG
        // (de eerste betaling kan een afwijkende aanbetaling zijn geweest).
        if (info && !info.betaal_abonnement_id && payment.customerId && maand > 0) {
          const sub = await mollie(`/customers/${payment.customerId}/subscriptions`, "POST", {
            amount: { currency: "EUR", value: inclBtw(maand).toFixed(2) },
            interval: "1 month",
            startDate: eenMaandVooruit(),
            description: `Maandelijkse website-vergoeding ${slug}`,
            webhookUrl: `${SITE_URL}/api/mollie/webhook`,
            metadata: { slug },
          });
          await setBetaling(slug, {
            status: "actief",
            abonnement_id: sub.id,
            mandaat_id: payment.mandateId || null,
          });
        } else {
          await setBetaling(slug, { status: "actief", mandaat_id: payment.mandateId || null });
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
