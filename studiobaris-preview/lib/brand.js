import { hexNaarRgb, rgbNaarHex, contrast } from "./huisstijl";

// Tekstkleur óp de accentkleur (knoppen): wit, tenzij de accentkleur zo licht
// is (geel, lichtgroen) dat wit wegvalt. Dan donkere tekst, zodat we de echte
// merkkleur kunnen houden in plaats van hem te verbloemen.
function opAccent(hex) {
  const rgb = hexNaarRgb(hex);
  if (!rgb) return "#fff";
  return contrast(rgb, [255, 255, 255]) >= 2.2 ? "#fff" : "#111111";
}

// Accentkleur als tekst op een lichte achtergrond (labels, links, sterren):
// zo nodig iets donkerder, zodat hij leesbaar blijft. Zelfde tint.
function inkt(hex) {
  let rgb = hexNaarRgb(hex);
  if (!rgb) return hex;
  for (let i = 0; i < 20 && contrast(rgb, [255, 255, 255]) < 3; i++) rgb = rgb.map((v) => v * 0.92);
  return rgbNaarHex(rgb);
}

// Accentkleur als tekst op een DONKERE achtergrond (het accentwoord in de kop
// over de hero-foto, labels op donker): lichter maken tot hij duidelijk afsteekt
// tegen de basiskleur. Een donkergroen accent op een donkere foto viel weg.
// Lukt dat niet (bijv. lichte basiskleur), dan gewoon wit.
function opDonker(hex, achter) {
  let rgb = hexNaarRgb(hex);
  const bg = hexNaarRgb(achter) || [15, 15, 15];
  if (!rgb) return "#fff";
  for (let i = 0; i < 25 && contrast(rgb, bg) < 6; i++) rgb = rgb.map((v) => v + (255 - v) * 0.12);
  return contrast(rgb, bg) >= 6 ? rgbNaarHex(rgb) : "#fff";
}

// Gedeelde huisstijl-variabelen uit het merk-blok (voor alle stijlen en detailpagina's).
export function brandVars(m = {}) {
  const sec = m.secundaire_kleur || "#FF8300";
  return {
    "--black": m.primaire_kleur || "#0F0F0F",
    "--soft": m.primaire_kleur || "#1a1a1a",
    "--orange": sec,
    "--orange-d": "color-mix(in srgb, " + sec + " 85%, black)",
    "--orange-ink": inkt(sec),
    "--orange-hero": opDonker(sec, m.primaire_kleur || "#0F0F0F"),
    "--orange-zwart": opDonker(sec, "#0F1214"), // stijl Strak: accent op bijna-zwart
    "--on-orange": opAccent(sec),
    "--bg": m.accent_kleur || "#F8F9FA",
    "--line": "#E5E7EB",
    "--gtext": "#334155",
    "--gsoft": "#94A3B8",
    "--font-head": m.koppen_font ? `'${m.koppen_font}', system-ui, sans-serif` : "system-ui, sans-serif",
    "--font-body": m.tekst_font ? `'${m.tekst_font}', system-ui, sans-serif` : "system-ui, sans-serif",
  };
}
