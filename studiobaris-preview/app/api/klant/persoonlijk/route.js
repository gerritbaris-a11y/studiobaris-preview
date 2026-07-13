import { NextResponse } from "next/server";
import { leesSessie } from "../../../../lib/auth";
import { setPersoonlijk } from "../../../../lib/server-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// De persoonlijke zin die bovenaan het verkoopappje komt.
export async function POST(req) {
  const sessie = leesSessie();
  if (!sessie) return NextResponse.json({ ok: false, error: "Niet ingelogd." }, { status: 401 });
  try {
    const { slug, tekst } = await req.json();
    if (!slug) return NextResponse.json({ ok: false, error: "slug ontbreekt." }, { status: 400 });
    await setPersoonlijk(slug, String(tekst || "").slice(0, 400));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
