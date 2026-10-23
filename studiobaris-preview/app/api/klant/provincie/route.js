import { NextResponse } from "next/server";
import { leesSessie, isBeheer } from "../../../../lib/auth";
import { PROVINCIES } from "../../../../lib/regio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ipiqrsxbsgylxhgzlhsd.supabase.co";

// Provincie van een preview met de hand zetten (alleen beheer). Leeg = weer
// automatisch bepalen (lead, postcode of plaatsnaam). Bepaalt welke verkoper
// met een regio de preview op Mijn previews ziet.
export async function POST(req) {
  const sessie = leesSessie();
  if (!sessie) return NextResponse.json({ ok: false, error: "Niet ingelogd." }, { status: 401 });
  if (!isBeheer(sessie)) return NextResponse.json({ ok: false, error: "Alleen voor beheer." }, { status: 403 });
  try {
    const { slug, provincie } = await req.json();
    if (!slug) return NextResponse.json({ ok: false, error: "slug ontbreekt." }, { status: 400 });
    const prov = provincie ? String(provincie) : "";
    if (prov && !PROVINCIES.includes(prov)) {
      return NextResponse.json({ ok: false, error: "Onbekende provincie." }, { status: 400 });
    }
    const k = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/sb_preview_provincie_zet`, {
      method: "POST",
      cache: "no-store",
      headers: { apikey: k, Authorization: `Bearer ${k}`, "Content-Type": "application/json" },
      body: JSON.stringify({ p_slug: String(slug), p_provincie: prov || null }),
    });
    if (!res.ok) return NextResponse.json({ ok: false, error: "Opslaan mislukt." }, { status: 500 });
    const d = await res.json();
    return NextResponse.json({ ok: !!(d && d.ok), provincie: d ? d.provincie : null });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String((e && e.message) || e) }, { status: 500 });
  }
}
