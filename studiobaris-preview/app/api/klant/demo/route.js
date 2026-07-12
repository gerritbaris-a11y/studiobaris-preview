import { NextResponse } from "next/server";
import { leesSessie, isBeheer } from "../../../../lib/auth";
import { maakDemoAppVoorSlug } from "../../../../lib/demo-app";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Maakt (of vernieuwt) de persoonlijke demo-app van een klant.
// Nieuwe previews krijgen die automatisch; dit is voor oudere previews en om
// een demo bij te werken nadat de preview is aangepast.
export async function POST(req) {
  const sessie = leesSessie();
  if (!sessie || !isBeheer(sessie)) {
    return NextResponse.json({ ok: false, error: "Geen toegang." }, { status: 403 });
  }
  try {
    const { slug } = await req.json();
    if (!slug) return NextResponse.json({ ok: false, error: "slug ontbreekt." }, { status: 400 });
    const demo = await maakDemoAppVoorSlug(slug);
    return NextResponse.json({ ok: true, demo });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
