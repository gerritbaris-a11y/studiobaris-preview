import { NextResponse } from "next/server";
import { getBetaalinfo, setRest } from "../../../../lib/server-data";
import { mollie, mollieConfigured, inclBtw } from "../../../../lib/mollie";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://preview.studiobaris.nl";

// Start de restbetaling: de tweede helft van het websitebedrag, bij oplevering.
// Losse iDEAL-betaling, geen nieuwe machtiging.
export async function POST(req) {
  try {
    if (!mollieConfigured()) {
      return NextResponse.json({ ok: false, error: "Betalen is nog niet ingesteld." }, { status: 500 });
    }
    const { slug } = await req.json();
    if (!slug) return NextResponse.json({ ok: false, error: "slug ontbreekt." }, { status: 400 });

    const info = await getBetaalinfo(slug);
    if (!info) return NextResponse.json({ ok: false, error: "Klant niet gevonden." }, { status: 404 });

    if (info.rest_status === "betaald") {
      return NextResponse.json({ ok: false, error: "Het restbedrag is al voldaan." }, { status: 400 });
    }

    const rest = Number(info.restbedrag);
    if (!rest || rest <= 0) {
      return NextResponse.json({ ok: false, error: "Er staat geen verkoopbedrag ingevuld voor deze klant." }, { status: 400 });
    }

    const payment = await mollie("/payments", "POST", {
      amount: { currency: "EUR", value: inclBtw(rest).toFixed(2) },
      customerId: info.betaal_klant_id || undefined,
      sequenceType: "oneoff",
      method: "ideal",
      description: `Restbedrag website ${info.company_name || slug}`,
      redirectUrl: `${SITE_URL}/restbetaling/${slug}?status=klaar`,
      webhookUrl: `${SITE_URL}/api/mollie/webhook`,
      metadata: { slug, soort: "rest" },
    });

    await setRest(slug, "open", payment.id);

    const checkout = payment && payment._links && payment._links.checkout && payment._links.checkout.href;
    if (!checkout) return NextResponse.json({ ok: false, error: "Geen betaal-URL ontvangen van Mollie." }, { status: 502 });

    return NextResponse.json({ ok: true, checkoutUrl: checkout });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
