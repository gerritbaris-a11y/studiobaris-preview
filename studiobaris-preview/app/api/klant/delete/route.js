import { NextResponse } from "next/server";
import { deleteKlant } from "../../../../lib/server-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Verwijdert een klant/preview definitief (incl. inzendingen).
export async function POST(req) {
  try {
    const { slug } = await req.json();
    if (!slug) return NextResponse.json({ ok: false, error: "slug ontbreekt." }, { status: 400 });
    const res = await deleteKlant(slug);
    if (!res) return NextResponse.json({ ok: false, error: "Verwijderen mislukt (server-key?)." }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
