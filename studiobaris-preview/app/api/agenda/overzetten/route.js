import { NextResponse } from "next/server";
import { leesSessie, isBeheer } from "../../../../lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ipiqrsxbsgylxhgzlhsd.supabase.co";
const FOUT = {
  geen_demo: "Deze preview heeft nog geen agenda.",
  geen_account: "Er is (nog) geen app-account voor deze klant.",
  al_agenda: "Dit app-account heeft al een agenda.",
};

// Beheer: bij klant worden de agenda van de preview overzetten naar het echte
// app-account (behandelingen, rooster, instellingen; geen testboekingen).
// Daarna staat de agenda live. Controleert zelf de login (staat niet in de matcher).
export async function POST(req) {
  const sessie = leesSessie();
  if (!isBeheer(sessie)) return NextResponse.json({ ok: false, error: "Geen toegang." }, { status: 403 });
  const b = await req.json().catch(() => null);
  if (!b || !b.slug || !/^[0-9a-f-]{36}$/i.test(String(b.naar || ""))) {
    return NextResponse.json({ ok: false, error: "Ongeldig verzoek." }, { status: 400 });
  }
  const k = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/sb_agenda_overzetten`, {
    method: "POST", cache: "no-store",
    headers: { apikey: k, Authorization: `Bearer ${k}`, "Content-Type": "application/json" },
    body: JSON.stringify({ p_van_slug: String(b.slug), p_naar: b.naar, p_email: b.email || null }),
  });
  const r = res.ok ? await res.json() : null;
  if (!r || !r.ok) return NextResponse.json({ ok: false, error: FOUT[r && r.fout] || "Overzetten mislukt." }, { status: 409 });
  return NextResponse.json({ ok: true, behandelingen: r.behandelingen });
}
