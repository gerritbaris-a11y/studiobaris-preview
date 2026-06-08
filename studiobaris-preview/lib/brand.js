// Gedeelde huisstijl-variabelen uit het merk-blok (voor hoofdpagina en detailpagina's).
export function brandVars(m = {}) {
  return {
    "--black": m.primaire_kleur || "#0F0F0F",
    "--soft": m.primaire_kleur || "#1a1a1a",
    "--orange": m.secundaire_kleur || "#FF8300",
    "--orange-d": "color-mix(in srgb, " + (m.secundaire_kleur || "#FF8300") + " 85%, black)",
    "--bg": m.accent_kleur || "#F8F9FA",
    "--line": "#E5E7EB",
    "--gtext": "#334155",
    "--gsoft": "#94A3B8",
    "--font-head": m.koppen_font ? `'${m.koppen_font}', system-ui, sans-serif` : "system-ui, sans-serif",
    "--font-body": m.tekst_font ? `'${m.tekst_font}', system-ui, sans-serif` : "system-ui, sans-serif",
  };
}
