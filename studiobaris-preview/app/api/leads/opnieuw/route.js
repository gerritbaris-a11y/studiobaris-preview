import { NextResponse } from "next/server";
import { leesSessie, isBeheer } from "../../../../lib/auth";
import { updateLead } from "../../../../lib/server-data";
import { POST as leadPreviewPost } from "../preview/route";
import { POST as intakePost } from "../../intake/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ipiqrsxbsgylxhgzlhsd.supabase.co";
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://preview.studiobaris.nl";
const hdr = () => ({ apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" });

function schoon(w) {
  let t = String(w || "").trim();
  if (t && !/^https?:\/\//i.test(t)) t = "https://" + t;
  return t;
}

// "Preview opnieuw maken" vanuit Mijn previews. Hangt de preview aan een lead,
// dan gaat het via dezelfde route als op de leadlijst (incl. rechtencheck).
// Zonder lead (bijv. via het intakeformulier gemaakt): alleen beheer, en dan
// opnieuw maken met de gegevens die al in de preview staan.
// In beide gevallen blijft de link (slug) hetzelfde.
export async function POST(req) {
  const sessie = leesSessie();
  if (!sessie) return NextResponse.json({ ok: false, error: "Niet ingelogd." }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const slug = String(body.slug || "").trim();
  if (!/^[a-z0-9-]{1,120}$/.test(slug)) return NextResponse.json({ ok: false, error: "Geen preview opgegeven." }, { status: 400 });
  const website = schoon(body.website);

  const res = await fetch(`${SUPABASE_URL}/rest/v1/leads?select=id&preview_slug=eq.${encodeURIComponent(slug)}&limit=1`, { headers: hdr(), cache: "no-store" });
  const rijen = res.ok ? await res.json() : [];
  const lead = Array.isArray(rijen) && rijen[0];

  if (lead) {
    if (website) await updateLead(lead.id, { website });
    return leadPreviewPost(new Request("http://intern/api/leads/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: lead.id, opnieuw: true }),
    }));
  }

  if (!isBeheer(sessie)) {
    return NextResponse.json({ ok: false, error: "Deze preview hangt niet aan een lead. Vraag Gerrit of Levi om hem opnieuw te maken." }, { status: 403 });
  }

  const b = await fetch(`${SUPABASE_URL}/rest/v1/rpc/sb_huisstijl_basis`, { method: "POST", headers: hdr(), body: JSON.stringify({ p_slug: slug }), cache: "no-store" });
  const basis = b.ok ? await b.json() : null;
  if (!basis) return NextResponse.json({ ok: false, error: "Preview niet gevonden." }, { status: 404 });
  const bedrijf = (basis.content && basis.content.bedrijf) || {};
  const notes = basis.notes || {};
  // Onze eigen terugval-contactgegevens niet als klantgegevens meesturen.
  const eigen = (w) => /studiobaris/i.test(String(w || "")) || String(w || "").replace(/\D/g, "").endsWith("616732105");

  const fd = new FormData();
  const zet = (k, w) => { const t = w ? String(w).trim() : ""; if (t) fd.set(k, t); };
  zet("naam", basis.naam || bedrijf.naam);
  zet("branche", bedrijf.branche);
  zet("regio", bedrijf.regio);
  if (!eigen(bedrijf.telefoon)) zet("telefoon", bedrijf.telefoon);
  if (!eigen(bedrijf.email)) zet("email", bedrijf.email);
  zet("adres", bedrijf.adres);
  const site = website || notes.website || "";
  zet("website", site);
  zet("oude_website", site);
  if (notes.bron) zet("bron", notes.bron);
  fd.set("stijl", "stoer");

  let uit;
  try {
    const r = await intakePost(new Request("http://intern/api/intake", {
      method: "POST", body: fd,
      headers: { "x-sb-intern": KEY || "", "x-sb-overschrijf": slug },
    }));
    uit = await r.json();
  } catch (e) {
    uit = { ok: false, error: String((e && e.message) || e) };
  }
  if (uit && uit.ok) return NextResponse.json({ ok: true, slug, url: `${SITE_URL}/${slug}` });
  return NextResponse.json({ ok: false, error: String((uit && uit.error) || "Opnieuw maken mislukt.").slice(0, 300) }, { status: 500 });
}
