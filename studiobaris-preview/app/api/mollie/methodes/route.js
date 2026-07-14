import { NextResponse } from "next/server";
import { leesSessie, isBeheer } from "../../../../lib/auth";
import { mollie, mollieConfigured } from "../../../../lib/mollie";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Diagnose (alleen beheer): welke betaalmethodes staan aan, en welke daarvan
// kunnen een machtiging afgeven (sequenceType=first)? Zonder machtiging kunnen
// we geen maandelijkse incasso doen en faalt de akkoordlink.
export async function GET() {
  const sessie = leesSessie();
  if (!isBeheer(sessie)) {
    return NextResponse.json({ ok: false, error: "Alleen voor beheer." }, { status: 403 });
  }
  if (!mollieConfigured()) {
    return NextResponse.json({ ok: false, error: "MOLLIE_API_KEY ontbreekt." }, { status: 500 });
  }

  const uit = { ok: true };
  try {
    const key = process.env.MOLLIE_API_KEY || "";
    uit.sleutel = key.startsWith("live_") ? "live" : key.startsWith("test_") ? "test" : "onbekend";

    const alle = await mollie("/methods?locale=nl_NL", "GET");
    uit.actief = (alle?._embedded?.methods || []).map((m) => m.id);

    try {
      const eerste = await mollie("/methods?sequenceType=first&locale=nl_NL", "GET");
      uit.machtiging = (eerste?._embedded?.methods || []).map((m) => m.id);
    } catch (e) {
      uit.machtiging = [];
      uit.machtiging_fout = String(e.message || e);
    }

    try {
      const herhaal = await mollie("/methods?sequenceType=recurring&locale=nl_NL", "GET");
      uit.herhaling = (herhaal?._embedded?.methods || []).map((m) => m.id);
    } catch (e) {
      uit.herhaling = [];
      uit.herhaling_fout = String(e.message || e);
    }

    uit.incasso_aan = (uit.herhaling || []).includes("directdebit");
    uit.ideal_machtiging = (uit.machtiging || []).includes("ideal");
    uit.oordeel = !uit.incasso_aan
      ? "SEPA-incasso staat NIET aan op het Mollie-account. Zonder incasso kan Mollie geen machtiging vastleggen en geen maandbedrag afschrijven: de akkoordlink faalt met 'The payment method selected does not accept recurring payments'."
      : uit.ideal_machtiging
        ? "Incasso staat aan en iDEAL kan een machtiging afgeven. De akkoordlink hoort te werken."
        : "Incasso staat aan, maar iDEAL geeft geen machtiging af. Kies een andere eerste betaalmethode.";
    return NextResponse.json(uit);
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
