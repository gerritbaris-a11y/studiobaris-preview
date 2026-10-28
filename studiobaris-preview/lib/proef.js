// Proefperiode van de persoonlijke demo-app (okt 2026).
//
// De prospect kan in zijn demo-app (demo.studiobaris.nl/<slug>) zelf maximaal
// 3 projecten plaatsen. Die projecten tonen we hier bovenop de eigen
// preview-inhoud, zodat hij ziet hoe het op zijn website komt.
//
// Server-only: gebruikt de service-role key. Nooit client-side importeren.
// Of de proefperiode voor een preview geldt, bepaalt de database
// (workflow.proef_instelling). Geldt hij niet, dan verandert er niets.

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ipiqrsxbsgylxhgzlhsd.supabase.co";

export const DEMO_BASIS = "https://demo.studiobaris.nl/";

const UIT = { actief: false, projecten: [], tot: null, geplaatst: 0 };

export async function getProef(slug) {
  const k = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!k || !slug) return UIT;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/sb_proef_preview`, {
      method: "POST",
      headers: { apikey: k, Authorization: `Bearer ${k}`, "Content-Type": "application/json" },
      body: JSON.stringify({ p_slug: slug }),
      cache: "no-store",
    });
    if (!res.ok) return UIT;
    const d = await res.json();
    if (!d || !d.actief) return UIT;
    return {
      actief: true,
      tot: d.tot || null,
      geplaatst: Number(d.geplaatst) || 0,
      projecten: (Array.isArray(d.projecten) ? d.projecten : []).map((p) => ({
        titel: p.titel || "Project",
        plaats: p.plaats || "",
        omschrijving: p.omschrijving || "",
        beeld_url: p.beeld_url || "",
        // Voor / Tijdens / Na (eerste foto van elk), zoals op een echte site.
        fases: (Array.isArray(p.fases) ? p.fases : [])
          .filter((f) => f && f.url)
          .map((f) => ({ label: String(f.label || ""), url: String(f.url) })),
        nieuw: true,
      })),
    };
  } catch {
    // De preview moet altijd blijven werken, ook als dit even faalt.
    return UIT;
  }
}

// Zelf geplaatste projecten bovenaan, daarna de eigen preview-projecten.
export function metProefProjecten(content, proef) {
  if (!content || !proef || !proef.actief || proef.projecten.length === 0) return content;
  const eigen = Array.isArray(content.projecten) ? content.projecten : [];
  return { ...content, projecten: [...proef.projecten, ...eigen] };
}

// "13 november" (Nederlandse tijd). Leeg als er geen of een verlopen datum is.
export function proefDatum(tot) {
  if (!tot) return "";
  const d = new Date(tot);
  if (isNaN(d.getTime()) || d.getTime() < Date.now()) return "";
  return d.toLocaleDateString("nl-NL", { day: "numeric", month: "long", timeZone: "Europe/Amsterdam" });
}

// ---- Dashboard -------------------------------------------------------------

async function rpcProef(naam, body) {
  const k = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!k) return null;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${naam}`, {
    method: "POST",
    headers: { apikey: k, Authorization: `Bearer ${k}`, "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
    cache: "no-store",
  });
  if (!res.ok) return null;
  const t = await res.text();
  try { return t ? JSON.parse(t) : null; } catch { return null; }
}

// Alle previews waarvoor de proefperiode geldt, met hun status.
// Faalt dit, dan geven we een lege lijst: het dashboard moet altijd laden.
export async function getProefOverzicht() {
  try {
    const d = await rpcProef("sb_proef_overzicht", {});
    return Array.isArray(d) ? d : [];
  } catch {
    return [];
  }
}

export async function startProef(slug) {
  return rpcProef("sb_proef_start", { p_slug: slug, p_via: "knop" });
}

export async function verlengProef(slug) {
  return rpcProef("sb_proef_verleng", { p_slug: slug });
}

// Korte datum voor het dashboard: "14 nov".
export function korteDatum(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("nl-NL", { day: "numeric", month: "short", timeZone: "Europe/Amsterdam" });
}

// ---- Preview bekeken ---------------------------------------------------------
// Telt een bezoek aan de preview, voor "Preview bekeken" in Mijn previews.
// Niet geteld: wie is ingelogd op het teamdashboard (cookie sb_sessie), en
// bots/linkvoorbeelden (WhatsApp, Facebook, Google, curl enz.). Herladen of
// terugkeren binnen 30 minuten telt de database niet als nieuw bezoek.
export const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|slack|discord|linkedin|skype|google|bing|yandex|vercel|curl|wget|python|node-fetch|axios|headless|lighthouse|pagespeed/i;

export async function telBezoek(slug, { ingelogd, userAgent }) {
  if (!slug || ingelogd) return;
  if (!userAgent || BOT.test(userAgent)) return;
  try {
    await rpcProef("sb_preview_bezocht", { p_slug: slug });
  } catch {
    // Tellen mag de preview nooit tegenhouden.
  }
}
