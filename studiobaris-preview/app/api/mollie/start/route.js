import { NextResponse } from "next/server";
import { getBetaalinfo, setBetaling } from "../../../../lib/server-data";
import { mollie, mollieConfigured, inclBtw } from "../../../../lib/mollie";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://preview.studiobaris.nl";

// Start de eerste betaling/machtiging. Geeft een Mollie-checkout-URL terug.
//
// Eén link voor alles: de klant betaalt in één keer het websitedeel én de
// eerste maand, en geeft daarmee meteen de SEPA-machtiging af. Het abonnement
// begint pas een maand later, dus zonder die eerste maand hier zou die maand
// nooit gefactureerd worden — precies wat er in de oude opzet misging.
export async function POST(req) {
  try {
    if (!mollieConfigured()) {
      return NextResponse.json({ ok: false, error: "Betalen is nog niet ingesteld (MOLLIE_API_KEY ontbreekt)." }, { status: 500 });
    }
    const { slug, voorwaarden } = await req.json();
    if (!slug) return NextResponse.json({ ok: false, error: "slug ontbreekt." }, { status: 400 });
    if (voorwaarden !== true) {
      return NextResponse.json({ ok: false, error: "Je moet eerst akkoord gaan met de algemene voorwaarden." }, { status: 400 });
    }

    const info = await getBetaalinfo(slug);
    if (!info) return NextResponse.json({ ok: false, error: "Klant niet gevonden." }, { status: 404 });

    const maand = Number(info.maandbedrag) || 0;
    if (maand <= 0) {
      return NextResponse.json({ ok: false, error: "Er is nog geen maandbedrag ingesteld voor deze klant." }, { status: 400 });
    }

    // Websitedeel dat nu betaald wordt: bij 'ineens' het hele bedrag, bij twee
    // termijnen de eerste helft. Daar komt altijd de eerste maand bovenop.
    const websitedeel = Number(info.aanbetaling) || 0;
    const eerste = Math.round((websitedeel + maand) * 100) / 100;
    if (eerste <= 0) {
      return NextResponse.json({ ok: false, error: "Er is geen bedrag ingesteld voor deze klant." }, { status: 400 });
    }

    const naam = info.company_name || slug;
    const eersteOmschrijving = websitedeel > 0
      ? `Website + eerste maand ${naam}`
      : `Eerste maand website ${naam}`;

    // Klant (Mollie customer) aanmaken of hergebruiken.
    let klantId = info.betaal_klant_id;
    if (!klantId) {
      const customer = await mollie("/customers", "POST", {
        name: naam,
        email: info.lead_email || undefined,
        metadata: { slug },
      });
      klantId = customer.id;
      await setBetaling(slug, { provider: "mollie", klant_id: klantId });
    }

    // Eerste betaling met machtiging (sequenceType: first).
    const payment = await mollie("/payments", "POST", {
      amount: { currency: "EUR", value: inclBtw(eerste).toFixed(2) },
      customerId: klantId,
      sequenceType: "first",
      method: "ideal",
      description: eersteOmschrijving,
      redirectUrl: `${SITE_URL}/akkoord/${slug}?status=klaar`,
      webhookUrl: `${SITE_URL}/api/mollie/webhook`,
      metadata: { slug },
    });

    await setBetaling(slug, { status: "akkoord", provider: "mollie", klant_id: klantId, voorwaarden: true });

    const checkout = payment && payment._links && payment._links.checkout && payment._links.checkout.href;
    if (!checkout) return NextResponse.json({ ok: false, error: "Geen betaal-URL ontvangen van Mollie." }, { status: 502 });

    return NextResponse.json({ ok: true, checkoutUrl: checkout });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
