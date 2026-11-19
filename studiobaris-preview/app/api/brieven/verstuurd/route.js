import { NextResponse } from "next/server";
import { getBrief, zetBriefVerstuurd } from "../../../../lib/server-data";
import { vandaagNL, datumIso, leesDatum } from "../../../../lib/brieven";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/brieven/verstuurd  { slug, verstuurd: boolean, datum?: "YYYY-MM-DD" }
// Zet een brief op verstuurd (datum ligt vanaf dan vast, actie op de preview
// gaat lopen) of terug op niet verstuurd (datum loopt weer mee met vandaag).
// Alleen voor beheer (API_BEHEER "/api/brieven" in middleware.js).
export async function POST(req) {
  let body = {};
  try { body = await req.json(); } catch {}
  const slug = body && String(body.slug || "");
  if (!slug) return NextResponse.json({ ok: false, error: "slug ontbreekt." }, { status: 400 });
  const brief = await getBrief(slug);
  if (!brief) return NextResponse.json({ ok: false, error: "Voor dit adres is nog geen brief gemaakt." }, { status: 404 });
  const verzonden = body.verstuurd ? datumIso(leesDatum(body.datum) || vandaagNL()) : null;
  try {
    await zetBriefVerstuurd(slug, verzonden);
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Opslaan mislukt." }, { status: 500 });
  }
  return NextResponse.json({ ok: true, slug, verzonden });
}
