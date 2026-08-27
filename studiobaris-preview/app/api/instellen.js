import { NextResponse } from "next/server";
import { setAfspraak } from "../../../../lib/abonnementen-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// De afspraak vastleggen vanuit het kopje Abonnementen. Deze route staat in
// middleware.js onder API_BEHEER: alleen Gerrit en Levi komen hier langs.
function getal(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const slug = String(body.slug || "").trim();
    if (!slug) return NextResponse.json({ ok: false, error: "slug ontbreekt." }, { status: 400 });

    const betaalwijze = body.betaalwijze ? String(body.betaalwijze) : null;
    if (betaalwijze && !["ineens", "twee_termijnen"].includes(betaalwijze)) {
      return NextResponse.json({ ok: false, error: "Onbekende betaalwijze." }, { status: 400 });
    }

    const resultaat = await setAfspraak(slug, {
      websiteprijs: getal(body.websiteprijs),
      maandbedrag: getal(body.maandbedrag),
      betaalwijze,
      incassodag: getal(body.incassodag),
    });

    return NextResponse.json({ ok: true, afspraak: resultaat });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
