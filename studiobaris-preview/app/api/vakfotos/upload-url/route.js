import { NextResponse } from "next/server";
import { leesSessie, isBeheer } from "../../../../lib/auth";
import { isVakgebied, VAK_MAP, HERO_MAP, publiekeUrl } from "../../../../lib/vakfotos";
import { TOEGESTANE_EXTENSIES, MAX_BESTAND_BYTES, extensieVan } from "../../../../lib/bestand-validatie";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ipiqrsxbsgylxhgzlhsd.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = "klant-media";

// Tijdelijke uploadlinks voor vakfoto's, op een pad dat wij bepalen
// (vakfotos/<vakgebied>/<uniek>.<ext>, of .../hero/<uniek>.<ext> voor hero-foto's). Zelfde opzet als /api/upload-url;
// de browser stuurt de bestanden daarna rechtstreeks naar de opslag.
export async function POST(req) {
  if (!isBeheer(leesSessie())) return NextResponse.json({ ok: false, error: "Alleen voor beheer." }, { status: 403 });
  if (!SERVICE_KEY) return NextResponse.json({ ok: false, error: "Server niet geconfigureerd." }, { status: 500 });

  const body = await req.json().catch(() => null);
  const vakgebied = body && body.vakgebied;
  const bestanden = body && Array.isArray(body.bestanden) ? body.bestanden : [];
  const map = body && body.soort === "hero" ? `${VAK_MAP}/${vakgebied}/${HERO_MAP}` : `${VAK_MAP}/${vakgebied}`;
  if (!isVakgebied(vakgebied)) return NextResponse.json({ ok: false, error: "Onbekend vakgebied." }, { status: 400 });
  if (!bestanden.length || bestanden.length > 40) {
    return NextResponse.json({ ok: false, error: "Kies 1 tot 40 foto's per keer." }, { status: 400 });
  }

  const uit = [];
  for (const b of bestanden) {
    const ext = TOEGESTANE_EXTENSIES.includes(extensieVan(b && b.naam)) ? extensieVan(b.naam) : "jpg";
    if (Number((b && b.grootte) || 0) > MAX_BESTAND_BYTES) {
      return NextResponse.json({ ok: false, error: `"${b.naam}" is te groot.` }, { status: 400 });
    }
    const pad = `${map}/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/upload/sign/${BUCKET}/${pad}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${SERVICE_KEY}`, apikey: SERVICE_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ expiresIn: 60 * 30 }),
    });
    if (!res.ok) return NextResponse.json({ ok: false, error: "Kon de upload niet voorbereiden. Probeer het zo nog eens." }, { status: 502 });
    const data = await res.json();
    uit.push({ naam: (b && b.naam) || "", uploadUrl: `${SUPABASE_URL}/storage/v1${data.url}`, publiekeUrl: publiekeUrl(pad) });
  }
  return NextResponse.json({ ok: true, bestanden: uit });
}
