import { NextResponse } from "next/server";
import { leesSessie, isBeheer } from "../../../../lib/auth";
import { verlengProef } from "../../../../lib/proef";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Verlengt een lopende proefperiode met 30 dagen. Alleen Gerrit en Levi.
export async function POST(req) {
  const sessie = leesSessie();
  if (!sessie || !isBeheer(sessie)) return NextResponse.json({ ok: false, error: "Geen toegang." }, { status: 403 });
  try {
    const { slug } = await req.json();
    if (!slug) return NextResponse.json({ ok: false, error: "slug ontbreekt." }, { status: 400 });
    const r = await verlengProef(String(slug));
    if (!r || !r.ok) return NextResponse.json({ ok: false, error: (r && r.error) || "Verlengen mislukt." }, { status: 500 });
    return NextResponse.json({ ok: true, tot: r.tot });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
