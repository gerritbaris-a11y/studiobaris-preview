// Kleine hulpjes die de stijlen Ambacht en Strak delen (de oudere stijlen
// hebben hun eigen kopie; die laten we ongemoeid).

export function waLink(n) {
  if (!n) return null;
  let d = String(n).replace(/[^0-9]/g, "");
  if (d.startsWith("0")) d = "31" + d.slice(1);
  return "https://wa.me/" + d;
}

// Kop in twee delen: [gewoon deel, accentwoord(en)]. Uit de slogan als die er
// is, anders uit hero.kop + hero.kop_accent. Zelfde logica als de andere stijlen.
export function kopDelen(c) {
  const b = c.bedrijf || {};
  const hero = c.hero || {};
  if (b.slogan) {
    const t = String(b.slogan).trim();
    const ci = t.lastIndexOf(",");
    if (ci > 0 && ci < t.length - 2) return [t.slice(0, ci + 1) + " ", t.slice(ci + 1).trim()];
    const w = t.split(/\s+/);
    const n = w.length >= 6 ? 3 : w.length >= 4 ? 2 : w.length >= 2 ? 1 : 0;
    return n ? [w.slice(0, w.length - n).join(" ") + " ", w.slice(w.length - n).join(" ")] : [t, ""];
  }
  const acc = hero.kop_accent || "";
  const kop = hero.kop || b.naam || "";
  if (acc && kop.toLowerCase().trim().endsWith(acc.toLowerCase().trim())) {
    return [kop.slice(0, kop.toLowerCase().lastIndexOf(acc.toLowerCase())).trim() + " ", acc];
  }
  return [kop, ""];
}

export const sterren = (score) => "★".repeat(Math.max(0, Math.min(5, score || 5)));
