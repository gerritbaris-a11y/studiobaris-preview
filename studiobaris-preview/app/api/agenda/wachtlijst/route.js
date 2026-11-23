import { NextResponse } from "next/server";
import { isUuid, isDatum, CORS, agendaVoorBedrijf, wachtlijstAanmelden, meldAanmeldingWachtlijst } from "../../../../lib/agenda";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

// Klant zet zich op de wachtlijst voor een (volle) dag. Alleen als de salon
// de module Wachtlijst heeft; dat controleert de database.
export async function POST(req) {
  const b = await req.json().catch(() => null);
  if (!b || b.website) return NextResponse.json({ ok: true }, { headers: CORS });   // honeypot
  if (!isUuid(b.c) || !isDatum(b.datum)) return NextResponse.json({ ok: false, error: "Onbekende agenda of dag." }, { status: 400, headers: CORS });
  try {
    const rij = await wachtlijstAanmelden({
      company: b.c, behandeling: isUuid(b.b) ? b.b : null, datum: b.datum,
      naam: String(b.naam || "").slice(0, 120), email: String(b.email || "").slice(0, 200), telefoon: String(b.telefoon || "").slice(0, 30),
    });
    try {
      const agenda = await agendaVoorBedrijf(b.c);
      if (agenda && rij) await meldAanmeldingWachtlijst(rij, agenda);
    } catch {}
    return NextResponse.json({ ok: true }, { headers: CORS });
  } catch (e) {
    const msg = String((e && e.message) || "");
    const nette = msg.match(/"message":"([^"]+)"/);
    return NextResponse.json({ ok: false, error: nette ? nette[1] : "Aanmelden lukte niet." }, { status: 400, headers: CORS });
  }
}
