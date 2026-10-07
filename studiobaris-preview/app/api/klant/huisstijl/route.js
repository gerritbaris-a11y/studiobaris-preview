import { NextResponse } from "next/server";
import { leesSessie, isBeheer } from "../../../../lib/auth";
import { leesHuisstijl, borgContrast } from "../../../../lib/huisstijl";
import { log } from "../../../../lib/server-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ipiqrsxbsgylxhgzlhsd.supabase.co";
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = "klant-media";

async function rpc(naam, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${naam}`, {
    method: "POST",
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`${naam} mislukt: ${(await res.text()).slice(0, 200)}`);
  const t = await res.text();
  return t ? JSON.parse(t) : null;
}

async function upload(buf, type, pad) {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${pad}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, apikey: KEY, "Content-Type": type, "x-upsert": "true" },
    body: buf,
  });
  if (!res.ok) throw new Error("Logo opslaan mislukt");
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${pad}`;
}

// Huisstijl (logo + kleuren) opnieuw ophalen van de bestaande website van een
// prospect en in de preview zetten. Teksten en foto's blijven ongemoeid.
export async function POST(req) {
  const sessie = leesSessie();
  if (!isBeheer(sessie)) return NextResponse.json({ ok: false, error: "Alleen voor beheer." }, { status: 403 });
  if (!KEY) return NextResponse.json({ ok: false, error: "Server niet geconfigureerd." }, { status: 500 });
  try {
    const { slug } = await req.json();
    if (!slug) return NextResponse.json({ ok: false, error: "Geen klant opgegeven." }, { status: 400 });
    const basis = await rpc("sb_huisstijl_basis", { p_slug: slug });
    if (!basis) return NextResponse.json({ ok: false, error: "Preview niet gevonden." }, { status: 404 });
    const website = basis.notes && basis.notes.website;
    if (!website) return NextResponse.json({ ok: false, error: "Geen bestaande website bekend." }, { status: 400 });

    const hs = await Promise.race([
      leesHuisstijl(website, basis.naam),
      new Promise((klaar) => setTimeout(() => klaar(null), 40000)),
    ]);
    if (!hs || !hs.primaire_kleur) {
      return NextResponse.json({ ok: false, error: "Geen logo of kleuren gevonden op de site (site plat, afgeschermd of alleen tekst)." }, { status: 422 });
    }

    const oud = (basis.content && basis.content.merk) || {};
    const merk = { primaire_kleur: hs.primaire_kleur, secundaire_kleur: hs.secundaire_kleur };
    // Een logo dat de klant zelf aanleverde laten we staan.
    const eigenLogo = oud.logo_url && !/\/logo-site\./.test(oud.logo_url);
    if (hs.logo && hs.logoTonen && !eigenLogo) {
      try {
        const ext = { "image/svg+xml": "svg", "image/jpeg": "jpg", "image/jpg": "jpg", "image/webp": "webp", "image/gif": "gif" }[hs.logo.type] || "png";
        merk.logo_url = await upload(hs.logo.buf, hs.logo.type, `${slug}/logo-site.${ext}`);
      } catch {}
    }
    const geborgd = borgContrast({ ...oud, ...merk });
    const nieuwMerk = {
      primaire_kleur: geborgd.merk.primaire_kleur,
      secundaire_kleur: geborgd.merk.secundaire_kleur,
      accent_kleur: geborgd.merk.accent_kleur,
      ...(merk.logo_url ? { logo_url: merk.logo_url } : {}),
    };
    await rpc("sb_set_huisstijl", {
      p_slug: slug,
      p_merk: nieuwMerk,
      p_notes: { kleur_bron: hs.bron, huisstijl_opgehaald: new Date().toISOString() },
    });
    await log({ persoon: sessie.naam, soort: "huisstijl", slug, bedrijf: basis.naam || null, van: `${oud.primaire_kleur || ""} / ${oud.secundaire_kleur || ""}`, naar: `${nieuwMerk.primaire_kleur} / ${nieuwMerk.secundaire_kleur}` }).catch(() => {});
    return NextResponse.json({ ok: true, bron: hs.bron, merk: nieuwMerk, logo: !!merk.logo_url, notities: geborgd.notities });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String((e && e.message) || e).slice(0, 300) }, { status: 500 });
  }
}
