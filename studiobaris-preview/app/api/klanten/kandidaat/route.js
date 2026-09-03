import { NextResponse } from "next/server";
import { maakKlantKandidaat } from "../../../../lib/server-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Een bestaande lead/preview aan het Klantenregister toevoegen als
// "toekomstige klant" (geen klantnummer, geen andere wijzigingen).
export async function POST(req) {
  try {
    const body = await req.json();
    const slug = body.slug;
    if (!slug) return NextResponse.json({ ok: false, error: "slug ontbreekt." }, { status: 400 });

    const res = await maakKlantKandidaat(slug);
    if (!res || res.ok !== true) {
      return NextResponse.json({ ok: false, error: "Toevoegen mislukt (server-key?)." }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
