import { NextResponse } from "next/server";
import { setContactpersoon } from "../../../../lib/server-data";
import { leesSessie } from "../../../../lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const sessie = leesSessie();
    if (!sessie) return NextResponse.json({ ok: false, error: "Geen toegang." }, { status: 403 });

    const { slug, naam } = await req.json();
    if (!slug) return NextResponse.json({ ok: false, error: "slug ontbreekt." }, { status: 400 });

    await setContactpersoon(slug, String(naam || ""));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
