// Vakfoto's: eigen beeldbank per vakgebied (schilder, loodgieter, ...), die
// beheer via /vakfotos uploadt. Staan in de opslag onder
// klant-media/vakfotos/<vakgebied>/. Een nieuwe preview zonder eigen foto's
// krijgt hieruit een achtergrondfoto voor de hero en twee projectfoto's.
//
// Hero-foto's staan apart in klant-media/vakfotos/<vakgebied>/hero/. Dat zijn
// brede foto's in hoge resolutie, speciaal voor de achtergrond bovenaan. Is
// die map voor een vakgebied leeg, dan pakt de preview (zoals voorheen) een
// gewone vakfoto als achtergrond.
// Is er voor een vakgebied (nog) niets, dan valt de preview terug op de
// standaard stockfoto's uit preview-assets.js, zoals voorheen.

import { nicheKey } from "./preview-assets";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ipiqrsxbsgylxhgzlhsd.supabase.co";
const BUCKET = "klant-media";
export const VAK_MAP = "vakfotos";
export const HERO_MAP = "hero";

// Minimale breedte (px) van een hero-foto. Smaller wordt hij op een
// laptopscherm uitgerekt en dus onscherp.
export const HERO_MIN_BREEDTE = 1920;

// Map in de opslag voor een vakgebied: gewone foto's of hero-foto's.
function mapVoor(key, soort) {
  return soort === "hero" ? `${VAK_MAP}/${key}/${HERO_MAP}` : `${VAK_MAP}/${key}`;
}

// Volgorde en namen zoals ze op de uploadpagina staan. De sleutel is dezelfde
// als nicheKey() oplevert, zodat "Schildersbedrijf" en "behanger" ook bij de
// schilderfoto's uitkomen en "installateur" bij de loodgieter.
export const VAKGEBIEDEN = [
  { key: "schilder", label: "Schilder" },
  { key: "timmerman", label: "Timmerman" },
  { key: "loodgieter", label: "Loodgieter / installateur" },
  { key: "hovenier", label: "Hovenier" },
  { key: "dakdekker", label: "Dakdekker" },
  { key: "elektricien", label: "Elektricien" },
  { key: "metselaar", label: "Metselaar" },
  { key: "stukadoor", label: "Stukadoor" },
  { key: "tegelzetter", label: "Tegelzetter" },
  { key: "aannemer", label: "Aannemer / klusbedrijf" },
];

export function isVakgebied(key) {
  return VAKGEBIEDEN.some((v) => v.key === key);
}

function sleutel() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || "";
}

export function publiekeUrl(pad) {
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${pad}`;
}

// Alle foto's van één vakgebied, nieuwste eerst. Bij een fout: lege lijst.
// soort "hero" geeft de hero-foto's; anders de gewone vakfoto's (de submap
// hero/ telt daar niet mee: mappen hebben in de lijst geen id).
export async function getVakfotos(key, soort) {
  const k = sleutel();
  if (!k || !isVakgebied(key)) return [];
  try {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/list/${BUCKET}`, {
      method: "POST",
      headers: { apikey: k, Authorization: `Bearer ${k}`, "Content-Type": "application/json" },
      body: JSON.stringify({ prefix: mapVoor(key, soort), limit: 200, offset: 0, sortBy: { column: "created_at", order: "desc" } }),
      cache: "no-store",
    });
    if (!res.ok) return [];
    const rijen = await res.json();
    return (Array.isArray(rijen) ? rijen : [])
      .filter((r) => r && r.id && r.name && !r.name.startsWith("."))
      .map((r) => ({ naam: r.name, url: publiekeUrl(`${mapVoor(key, soort)}/${r.name}`) }));
  } catch {
    return [];
  }
}

export async function getAlleVakfotos() {
  const [lijsten, heros] = await Promise.all([
    Promise.all(VAKGEBIEDEN.map((v) => getVakfotos(v.key))),
    Promise.all(VAKGEBIEDEN.map((v) => getVakfotos(v.key, "hero"))),
  ]);
  return VAKGEBIEDEN.map((v, i) => ({ ...v, fotos: lijsten[i], heros: heros[i] }));
}

export async function verwijderVakfoto(key, naam, soort) {
  const k = sleutel();
  if (!k || !isVakgebied(key) || !naam || naam.includes("/")) return false;
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}`, {
    method: "DELETE",
    headers: { apikey: k, Authorization: `Bearer ${k}`, "Content-Type": "application/json" },
    body: JSON.stringify({ prefixes: [`${mapVoor(key, soort)}/${naam}`] }),
  });
  return res.ok;
}

// Vaste maar per bedrijf verschillende keuze: dezelfde slug geeft steeds
// dezelfde foto's, twee schilders naast elkaar krijgen (meestal) andere.
function hash(tekst) {
  let h = 2166136261;
  for (const c of String(tekst || "")) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}

function gehusseld(lijst, zaad) {
  const uit = lijst.slice();
  let h = hash(zaad) || 1;
  for (let i = uit.length - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0;
    const j = h % (i + 1);
    [uit[i], uit[j]] = [uit[j], uit[i]];
  }
  return uit;
}

// Achtergrond + twee à drie projectfoto's voor een preview (drie vult het
// raster op de site mooi). Zijn er hero-foto's voor het vakgebied, dan komt de
// achtergrond daaruit en blijven alle gewone foto's over voor de projecten.
// Zo niet, dan wordt (zoals voorheen) een gewone vakfoto de achtergrond, en is
// die nooit ook een projectfoto.
export async function vakfotosVoor(branche, zaad) {
  const key = nicheKey(branche);
  if (!isVakgebied(key)) return { key, hero: null, projecten: [] };
  const [gewoon, heros] = await Promise.all([getVakfotos(key), getVakfotos(key, "hero")]);
  const fotos = gehusseld(gewoon, zaad).map((f) => f.url);
  const hero = gehusseld(heros, zaad).map((f) => f.url)[0];
  if (hero) return { key, hero, projecten: fotos.slice(0, 3) };
  return { key, hero: fotos[0] || null, projecten: fotos.slice(1, 4) };
}
