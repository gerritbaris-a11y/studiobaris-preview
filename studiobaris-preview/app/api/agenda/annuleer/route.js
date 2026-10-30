import { NextResponse } from "next/server";
import { annuleer, agendaVoorBedrijf, meldAnnulering } from "../../../../lib/agenda";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Klant annuleert zijn afspraak via de link uit de bevestigingsmail.
export async function POST(req) {
  const b = await req.json().catch(() => null);
  const token = String((b && b.token) || "");
  if (!/^[0-9a-f]{20,64}$/.test(token)) return NextResponse.json({ ok: false, error: "Onbekende afspraak." }, { status: 400 });
  try {
    const r = await annuleer(token, "klant");
    if (!r || !r.ok) {
      const msg = r && r.fout === "te_laat"
        ? `Annuleren kan online tot ${r.uur} uur van tevoren. Bel de salon even.`
        : "Deze afspraak is niet gevonden.";
      return NextResponse.json({ ok: false, error: msg }, { status: 409 });
    }
    if (!r.al) {
      try {
        const agenda = await agendaVoorBedrijf(r.afspraak.company_id);
        if (agenda) await meldAnnulering(r.afspraak, agenda, "klant");
      } catch {}
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Annuleren mislukt. Probeer het zo nog eens." }, { status: 500 });
  }
}
