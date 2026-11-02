// Segment van een preview of lead: vakman (standaard) of esthetiek
// (kappers, barbiers, nagel-, beauty- en schoonheidssalons, wimpers/brows).
// Sinds nov 2026: esthetiek = sector Boeking & Sfeer (zie SECTOREN onderaan).
//
// Een preview heeft geen apart segment-veld: we herkennen het aan de branche
// die bij het maken is ingevuld (content.bedrijf.branche, via get_overview als
// b_branche). Een lead uit de esthetieklijst heeft lijst = 'esthetiek'.

const ESTHETIEK = /kap(per|sal|ster)|haar(studio|salon|stylist|werk)|barbier|barber|nagel|nail|beauty|schoonheid|wimper|lash|brow|wenkbrauw|visagie|make-?up|pedicure|manicure|huidverzorg|huidtherap|sal(on|ons)\b/i;

// Spoedvakken: herkenning alleen als voorstel in de intake; de sector zelf is
// altijd een bewuste keuze (bestaande loodgieters zijn Portfolio).
const SPOED = /loodgiet|ontstop|riool|slotenmak|sleutelserv|cv[- ]?(monteur|ketel|install)|storingsdienst|lekkage|elektric|glaszet|ongedierte/i;
export function isSpoedBranche(tekst) {
  return SPOED.test(String(tekst || ""));
}

export function isEsthetiekBranche(tekst) {
  return ESTHETIEK.test(String(tekst || ""));
}

// Preview-rij uit get_overview.
export function isEsthetiekPreview(r) {
  return !!r && isEsthetiekBranche(r.b_branche);
}

// Lead-rij (sb_mijn_leads / sb_leads_zoek_v2).
export function isEsthetiekLead(l) {
  if (!l) return false;
  if (l.lijst) return l.lijst === "esthetiek";
  return isEsthetiekBranche(l.vakgebied);
}

// ── Sectoren (nov 2026) ────────────────────────────────────────────────────
// Onder Previews kies je eerst een sector, daarna Mijn previews / Benaderd /
// Leads. Een preview kan een expliciet sectorveld hebben (content.sector, via
// get_overview als `sector`); zonder dat veld volgt de sector uit de branche:
// salon → boeking, anders portfolio. Spoed is altijd expliciet, want bestaande
// loodgieters en elektriciens horen bij Portfolio.
// Verkopers zien voorlopig alleen Portfolio.

// Nov 2026: Spoed & Lead is geen eigen sector meer maar een variant binnen
// Vakmannen (zelfde doelgroep; anders beconcurreren we ons eigen pakket met
// app). Spoedpreviews (content.sector = 'spoed') en de spoed-leadlijst staan
// dus onder Portfolio, met een label "spoedsite".
export const SECTOREN = [
  { id: "portfolio", label: "Portfolio & Offerte", kort: "vakmannen", lijst: "vakman" },
  { id: "boeking", label: "Boeking & Sfeer", kort: "salons", lijst: "esthetiek" },
];
const SECTOR_IDS = SECTOREN.map((s) => s.id);

export function sectorInfo(id) {
  return SECTOREN.find((s) => s.id === id) || SECTOREN[0];
}

// Sector uit de URL (?sector=…), met de regel dat verkopers alleen Portfolio zien.
export function kiesSector(waarde, beheer) {
  if (!beheer) return "portfolio";
  return SECTOR_IDS.includes(waarde) ? waarde : "portfolio";
}

// Is dit een spoedsite (variant binnen Vakmannen)?
export function isSpoedsite(r) {
  return !!r && r.sector === "spoed";
}

export function sectorVanPreview(r) {
  if (!r) return "portfolio";
  if (r.sector === "spoed") return "portfolio";
  if (SECTOR_IDS.includes(r.sector)) return r.sector;
  return isEsthetiekBranche(r.b_branche) ? "boeking" : "portfolio";
}

export function sectorVanLead(l) {
  if (!l) return "portfolio";
  if (l.lijst === "esthetiek") return "boeking";
  if (l.lijst === "spoed") return "portfolio";
  if (l.lijst) return "portfolio";
  return isEsthetiekBranche(l.vakgebied) ? "boeking" : "portfolio";
}

// Link naar een scherm binnen een sector; Portfolio zonder parameter, zodat de
// bestaande links (/klanten, /benaderd, /leads) blijven werken.
export function sectorPad(pad, sector, extra = "") {
  const q = [];
  if (sector && sector !== "portfolio") q.push("sector=" + sector);
  if (extra) q.push(extra);
  return pad + (q.length ? "?" + q.join("&") : "");
}
