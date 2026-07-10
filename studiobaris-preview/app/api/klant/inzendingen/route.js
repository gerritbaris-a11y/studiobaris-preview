import { NextResponse } from "next/server";
import { getInzendingen } from "../../../../lib/server-data";
import { leesSessie } from "../../../../lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Geeft de intake- en feedback-inzendingen van een klant terug (alleen ingelogd).
export async function POST(req) {
  try {
    const sessie = leesSessie();
    if (!sessie) return NextResponse.json({ ok: false, error: "Geen toegang." }, { status: 403 });

    const { slug } = await req.json();
    if (!slug) return NextResponse.json({ ok: false, error: "slug ontbreekt." }, { status: 400 });

    const inzendingen = await getInzendingen(slug);
    return NextResponse.json({ ok: true, inzendingen });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
