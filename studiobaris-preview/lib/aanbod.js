// Aanbodpagina op de preview ("Dit wil ik", /<slug>/aanbod) en de
// terugbelverzoeken die daar binnenkomen (okt 2026).
// Server-only: gebruikt de service-role key. Nooit client-side importeren.
//
// Database (workflow): aanbod_bezoek (bekeken, per slug), preview_aanvraag
// (terugbelverzoeken). Functies: sb_aanbod_info, sb_aanbod_bezocht,
// sb_aanvraag_nieuw, sb_aanvragen_overzicht, sb_aanvraag_afhandelen.

import { BOT } from "./proef";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ipiqrsxbsgylxhgzlhsd.supabase.co";

async function rpc(naam, body) {
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
  try { return t ? JSON.parse(t) : true; } catch { return true; }
}

// ---- Prijs ------------------------------------------------------------------
// Volgt de brief, zodat preview en brief nooit botsen (A/B-test met/zonder prijs):
//  - brief met prijs, actie loopt nog → € 399 i.p.v. € 599 t/m de einddatum
//    (zelfde regel als lib/brieven.js: een maand na de verzenddatum)
//  - brief met prijs, actie voorbij  → gewone prijs
//  - brief zonder prijs              → geen bedragen op de aanbodpagina
//  - geen brief                      → gewone prijs
export const PRIJS = { website: 599, actie: 399, maand: 29.95 };

function leesDatum(s) {
  const m = String(s || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCMonth() === +m[2] - 1 ? d : null;
}
function plusMaand(d) {
  const j = d.getUTCFullYear(), m = d.getUTCMonth() + 1, dag = d.getUTCDate();
  const laatste = new Date(Date.UTC(j, m + 1, 0)).getUTCDate();
  return new Date(Date.UTC(j, m, Math.min(dag, laatste)));
}
function vandaagNL() {
  const s = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Amsterdam" });
  const [j, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(j, m - 1, d));
}

export function prijsVoor(brief) {
  if (brief && brief.verzonden && leesDatum(brief.verzonden)) {
    if (brief.prijs === false) return null;
    const einde = plusMaand(leesDatum(brief.verzonden));
    if (vandaagNL().getTime() <= einde.getTime()) {
      return {
        website: PRIJS.actie, oud: PRIJS.website, maand: PRIJS.maand,
        tot: einde.toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }),
      };
    }
  }
  return { website: PRIJS.website, oud: null, maand: PRIJS.maand, tot: null };
}

export function euro(n) {
  const v = Number(n) || 0;
  return "€ " + (Number.isInteger(v) ? String(v) : v.toFixed(2).replace(".", ","));
}

// ---- Lezen / tellen -------------------------------------------------------

export async function getAanbodInfo(slug) {
  try {
    const d = await rpc("sb_aanbod_info", { p_slug: slug });
    return d && d.bestaat ? d : null;
  } catch {
    return null;
  }
}

// Zelfde regels als "Preview bekeken": geen team, geen bots/linkvoorbeelden.
export async function telAanbod(slug, { ingelogd, userAgent }) {
  if (!slug || ingelogd) return;
  if (!userAgent || BOT.test(userAgent)) return;
  try { await rpc("sb_aanbod_bezocht", { p_slug: slug }); } catch {}
}

export async function nieuweAanvraag({ slug, soort, telefoon, moment }) {
  return rpc("sb_aanvraag_nieuw", { p_slug: slug, p_soort: soort, p_telefoon: telefoon, p_moment: moment || "" });
}

// Per preview: aanbod bekeken + laatste open aanvraag. Faalt dit, dan een
// lege lijst: het dashboard moet altijd laden.
export async function getAanvragenOverzicht() {
  try {
    const d = await rpc("sb_aanvragen_overzicht", {});
    return Array.isArray(d) ? d : [];
  } catch {
    return [];
  }
}

export async function handelAanvraagAf(id, door) {
  return rpc("sb_aanvraag_afhandelen", { p_id: Number(id), p_door: door || "" });
}

// Een telefoonnummer om vooraf in te vullen: alleen als het echt lijkt
// (geen voorbeeldnummer uit lib/preview-voorbeeld.js).
export function echtNummer(t) {
  const s = String(t || "").trim();
  const cijfers = s.replace(/[^0-9]/g, "");
  if (!/^(0|\+31|0031)/.test(s.replace(/\s/g, ""))) return "";
  if (cijfers.length < 10 || cijfers.endsWith("612345678")) return "";
  return s;
}
