import { NextResponse } from "next/server";
import { boek, agendaVoorBedrijf, meldNieuweAfspraak, isUuid, isDatum, isTijd, CORS } from "../../../../lib/agenda";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

const FOUTEN = {
  bezet: "Deze tijd is net door iemand anders geboekt. Kies een andere tijd.",
  gegevens: "Vul je naam en een telefoonnummer of e-mailadres in.",
  limiet: "Er zijn vandaag al veel testboekingen gedaan op deze voorbeeldsite. Probeer het morgen weer.",
  onbekend: "Deze behandeling is niet (meer) te boeken.",
};

// Afspraak boeken vanuit de widget (preview of klantsite).
export async function POST(req) {
  const b = await req.json().catch(() => null);
  if (!b) return NextResponse.json({ ok: false, error: "Ongeldig verzoek." }, { status: 400, headers: CORS });
  // Honeypot: een verborgen veld dat alleen bots invullen.
  if (b.website) return NextResponse.json({ ok: true }, { headers: CORS });
  if (!isUuid(b.c) || !isUuid(b.b) || !isDatum(b.d) || !isTijd(b.t)) {
    return NextResponse.json({ ok: false, error: "Kies een behandeling, dag en tijd." }, { status: 400, headers: CORS });
  }
  const email = String(b.email || "").trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "Dit e-mailadres klopt niet." }, { status: 400, headers: CORS });
  }
  try {
    const r = await boek({
      companyId: b.c, behandelingId: b.b, datum: b.d, tijd: b.t,
      naam: String(b.naam || "").slice(0, 120), telefoon: String(b.telefoon || "").slice(0, 40),
      email, opmerking: String(b.opmerking || "").slice(0, 500),
      bron: b.bron === "preview" ? "preview" : "site",
    });
    if (!r || !r.ok) {
      const code = (r && r.fout) || "onbekend";
      return NextResponse.json({ ok: false, code, error: FOUTEN[code] || "Boeken is niet gelukt." }, { status: 409, headers: CORS });
    }
    const a = r.afspraak;
    try {
      const agenda = await agendaVoorBedrijf(b.c);
      if (agenda) await meldNieuweAfspraak(a, agenda);
    } catch {}
    return NextResponse.json({
      ok: true,
      afspraak: { start: a.start, eind: a.eind, behandeling: a.behandeling_naam, token: a.token, test: a.test },
    }, { headers: CORS });
  } catch {
    return NextResponse.json({ ok: false, error: "Agenda niet bereikbaar. Probeer het zo nog eens." }, { status: 500, headers: CORS });
  }
}
