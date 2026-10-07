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

// Gedeelde huisstijl-variabelen uit het merk-blok (voor alle stijlen en detailpagina's).
export function brandVars(m = {}) {
  const sec = m.secundaire_kleur || "#FF8300";
  return {
    "--black": m.primaire_kleur || "#0F0F0F",
    "--soft": m.primaire_kleur || "#1a1a1a",
    "--orange": sec,
    "--orange-d": "color-mix(in srgb, " + sec + " 85%, black)",
    "--orange-ink": inkt(sec),
    "--on-orange": opAccent(sec),
    "--bg": m.accent_kleur || "#F8F9FA",
    "--line": "#E5E7EB",
    "--gtext": "#334155",
    "--gsoft": "#94A3B8",
    "--font-head": m.koppen_font ? `'${m.koppen_font}', system-ui, sans-serif` : "system-ui, sans-serif",
    "--font-body": m.tekst_font ? `'${m.tekst_font}', system-ui, sans-serif` : "system-ui, sans-serif",
  };
}
