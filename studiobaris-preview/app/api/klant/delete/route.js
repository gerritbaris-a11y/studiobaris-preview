import { NextResponse } from "next/server";
import { deleteKlant } from "../../../../lib/server-data";
import { verwijderDemoApp } from "../../../../lib/demo-app";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Verwijdert een klant/preview definitief (incl. inzendingen).
export async function POST(req) {
  try {
    const { slug } = await req.json();
    if (!slug) return NextResponse.json({ ok: false, error: "slug ontbreekt." }, { status: 400 });
    // Eerst de persoonlijke demo-app opruimen (bedrijf, projecten, reviews en het inlogaccount).
    try { await verwijderDemoApp(slug); } catch (e) { console.error("demo-app opruimen:", e && e.message); }

    const res = await deleteKlant(slug);
    if (!res) return NextResponse.json({ ok: false, error: "Verwijderen mislukt (server-key?)." }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
