// Server-only: het Aanpassen-scherm voor previews.
// - Werkversie: wijzigingen die je eerst zelf bekijkt (/<slug>?werk=1).
// - Live zetten: huidige versie gaat naar het archief, de nieuwe wordt live.
// - Versies: oude versies terugzetten kan altijd.

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ipiqrsxbsgylxhgzlhsd.supabase.co";

async function rpc(name, body) {
  const k = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!k) throw new Error("SUPABASE_SERVICE_ROLE_KEY ontbreekt.");
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: "POST",
    cache: "no-store",
    headers: { apikey: k, Authorization: `Bearer ${k}`, "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
  });
  const tekst = await res.text();
  if (!res.ok) {
    let msg = tekst;
    try { msg = JSON.parse(tekst).message || tekst; } catch {}
    throw new Error(msg || `Databasefout (${res.status})`);
  }
  if (!tekst) return null;
  try { return JSON.parse(tekst); } catch { return null; }
}

export const laadVoorAanpassen = (slug) => rpc("sb_aanpassen_laden", { p_slug: slug });
export const bewaarWerk = (slug, content, door) => rpc("sb_aanpassen_werk", { p_slug: slug, p_content: content, p_door: door || null });
export const getWerk = (slug) => rpc("sb_aanpassen_get_werk", { p_slug: slug }).catch(() => null);
export const publiceer = (slug, content, note, door) =>
  rpc("sb_aanpassen_publiceer", { p_slug: slug, p_content: content, p_note: note || null, p_door: door || null });
export const versies = (slug) => rpc("sb_aanpassen_versies", { p_slug: slug });
export const zetTerug = (slug, versieId, door) => rpc("sb_aanpassen_terug", { p_slug: slug, p_versie_id: versieId, p_door: door || null });

// Wie mag deze preview aanpassen? Beheer altijd; anders alleen wie hem maakte.
export function magAanpassen(sessie, rij) {
  if (!sessie || !rij) return false;
  if (sessie.rol === "beheer") return true;
  return !!rij.verzamelaar && rij.verzamelaar === sessie.naam;
}

// --- Invoer schoonmaken ---------------------------------------------------

// Alleen lettertypes die alle gewichten 400–800 hebben: googleFontsHref vraagt
// die allemaal op, en Google weigert de hele aanvraag als er één ontbreekt.
export const FONTS = [
  "Montserrat", "Inter", "Poppins", "Barlow", "Barlow Condensed", "Archivo",
  "Work Sans", "DM Sans", "Open Sans", "Roboto", "Roboto Slab", "Playfair Display",
  "Bitter", "Nunito", "Raleway", "Rubik",
];
export const STIJLEN = ["stoer", "modern", "persoonlijk"];

const HEX = /^#[0-9a-fA-F]{6}$/;
const MAX_TEKST = 4000;

function tekst(v, max = MAX_TEKST) {
  if (v === null || v === undefined) return "";
  return String(v).slice(0, max);
}
function url(v) {
  const s = tekst(v, 1000).trim();
  return /^https:\/\/[^\s"'<>()]+$/i.test(s) ? s : "";
}
function kleur(v, standaard) {
  const s = tekst(v, 7).trim();
  return HEX.test(s) ? s : standaard;
}
function lijst(v, max) {
  return Array.isArray(v) ? v.slice(0, max) : [];
}

// Houdt alles van de bestaande inhoud vast, en schoont alleen de velden op die
// het aanpasscherm (of de AI) mag wijzigen. Onbekende velden blijven staan.
export function schoonInhoud(nieuw, oud) {
  if (!nieuw || typeof nieuw !== "object") throw new Error("Ongeldige inhoud.");
  const c = JSON.parse(JSON.stringify(nieuw));
  const o = oud || {};
  if (JSON.stringify(c).length > 300000) throw new Error("Inhoud te groot.");

  c.bedrijf = c.bedrijf && typeof c.bedrijf === "object" ? c.bedrijf : {};
  for (const k of ["naam", "branche", "slogan", "telefoon", "whatsapp", "email", "adres", "regio", "openingstijden", "kvk", "btw"]) {
    if (k in c.bedrijf) c.bedrijf[k] = tekst(c.bedrijf[k], 400);
  }
  if (!c.bedrijf.naam || !c.bedrijf.naam.trim()) throw new Error("Bedrijfsnaam mag niet leeg zijn.");

  const om = o.merk || {};
  c.merk = c.merk && typeof c.merk === "object" ? c.merk : {};
  c.merk.primaire_kleur = kleur(c.merk.primaire_kleur, om.primaire_kleur || "");
  c.merk.secundaire_kleur = kleur(c.merk.secundaire_kleur, om.secundaire_kleur || "");
  c.merk.accent_kleur = kleur(c.merk.accent_kleur, om.accent_kleur || "#F8F9FA");
  c.merk.tekst_kleur = kleur(c.merk.tekst_kleur, om.tekst_kleur || "#334155");
  if (!FONTS.includes(c.merk.koppen_font)) c.merk.koppen_font = om.koppen_font || "Montserrat";
  if (!FONTS.includes(c.merk.tekst_font)) c.merk.tekst_font = om.tekst_font || "Inter";
  if (!STIJLEN.includes(c.merk.stijl)) c.merk.stijl = om.stijl || "stoer";
  c.merk.logo_url = url(c.merk.logo_url);
  c.merk.persoon_foto = url(c.merk.persoon_foto);

  c.hero = c.hero && typeof c.hero === "object" ? c.hero : {};
  for (const k of ["kop", "kop_accent", "subkop", "cta_tekst"]) if (k in c.hero) c.hero[k] = tekst(c.hero[k], 600);
  c.hero.achtergrond = url(c.hero.achtergrond);

  c.over_ons = tekst(c.over_ons);
  c.diensten = lijst(c.diensten, 12).map((d) => ({ ...d, titel: tekst(d && d.titel, 200), omschrijving: tekst(d && d.omschrijving, 1500), beeld_url: url(d && d.beeld_url) }));
  c.voordelen = lijst(c.voordelen, 8).map((v) => ({ ...v, icoon: tekst(v && v.icoon, 8), titel: tekst(v && v.titel, 200), tekst: tekst(v && v.tekst, 800) }));
  c.projecten = lijst(c.projecten, 20).map((p) => ({ ...p, titel: tekst(p && p.titel, 200), plaats: tekst(p && p.plaats, 200), beeld_url: url(p && p.beeld_url) }));
  c.usps = lijst(c.usps, 8).map((u) => tekst(u, 300)).filter((u) => u.trim());
  c.reviews = lijst(c.reviews, 20).map((r) => ({ ...r, naam: tekst(r && r.naam, 120), tekst: tekst(r && r.tekst, 1500), score: Math.max(1, Math.min(5, Number(r && r.score) || 5)) }));
  c.cta_blok = c.cta_blok && typeof c.cta_blok === "object" ? c.cta_blok : {};
  for (const k of ["kop", "tekst", "knop"]) if (k in c.cta_blok) c.cta_blok[k] = tekst(c.cta_blok[k], 600);

  c.seo = c.seo && typeof c.seo === "object" ? c.seo : {};
  c.seo.noindex = true; // previews worden nooit geïndexeerd
  delete c._review;
  return c;
}

// Na een AI-opdracht: beeld en stijl die de AI heeft laten vallen terugzetten.
export function behoudMedia(oud, nieuw) {
  const o = oud || {};
  const n = nieuw || {};
  n.merk = n.merk || {};
  const om = o.merk || {};
  for (const k of ["logo_url", "persoon_foto", "stijl"]) if (!n.merk[k] && om[k]) n.merk[k] = om[k];
  n.hero = n.hero || {};
  if (!n.hero.achtergrond && o.hero && o.hero.achtergrond) n.hero.achtergrond = o.hero.achtergrond;
  const plak = (veld, sleutel) => {
    const ol = Array.isArray(o[veld]) ? o[veld] : [];
    if (!Array.isArray(n[veld])) return;
    n[veld].forEach((item, i) => {
      if (!item || item.beeld_url) return;
      const zelfde = ol.find((x) => x && x[sleutel] && item[sleutel] && x[sleutel] === item[sleutel]);
      const bron = zelfde || ol[i];
      if (bron && bron.beeld_url) item.beeld_url = bron.beeld_url;
    });
  };
  plak("projecten", "titel");
  plak("diensten", "titel");
  return n;
}
