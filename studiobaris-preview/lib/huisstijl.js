// Huisstijl overnemen van de bestaande website van een prospect.
//
// Waarom: de AI raadde de kleuren tot nu toe vaak, want het logo werd nooit
// opgehaald. Daardoor leek een preview soms nauwelijks op de echte huisstijl.
// Nu halen we de kleuren in een vaste volgorde op:
//   1. het logo van de bestaande site  (leidend)
//   2. de kleuren uit de CSS van die site (knoppen, header, theme-color)
//   3. pas als beide niets opleveren: wat de AI uit de branche afleidt
// En we controleren altijd het contrast, zodat witte tekst op de hero en op de
// knoppen leesbaar blijft.
//
// Alles hier is "best effort": lukt iets niet (site plat, logo in een raar
// formaat), dan gaat de preview gewoon door met wat er wél is. Nooit een fout.

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36";

// ---------- kleur-rekenwerk ----------

export function hexNaarRgb(hex) {
  let h = String(hex || "").trim().replace(/^#/, "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (!/^[0-9a-f]{6}$/i.test(h)) return null;
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

export function rgbNaarHex([r, g, b]) {
  const c = (x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, "0");
  return ("#" + c(r) + c(g) + c(b)).toUpperCase();
}

function hsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h * 60, s, l];
}

function lum([r, g, b]) {
  const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

export function contrast(a, b) {
  const la = lum(a), lb = lum(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

function meng(a, b, t) {
  return [0, 1, 2].map((i) => a[i] * (1 - t) + b[i] * t);
}

const WIT = [255, 255, 255];
const ZWART = [0, 0, 0];

// Maak een kleur stap voor stap donkerder tot witte tekst erop genoeg contrast
// heeft. De tint blijft hetzelfde, dus het blijft herkenbaar "hun" kleur.
function donkerTot(rgb, minContrast) {
  let c = rgb;
  for (let i = 0; i < 20 && contrast(c, WIT) < minContrast; i++) c = meng(c, ZWART, 0.08);
  return c;
}

function afstand(a, b) {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
}

function isKleurig(rgb) {
  const [, s, l] = hsl(rgb);
  return s > 0.22 && l > 0.1 && l < 0.9;
}

// ---------- ophalen ----------

function absoluut(href, basis) {
  try { return new URL(href, basis).toString(); } catch { return null; }
}

async function haal(url, { ms = 8000, max = 600_000, binair = false } = {}) {
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: binair ? "image/*,*/*" : "text/html,text/css,*/*" }, redirect: "follow", signal: AbortSignal.timeout(ms) });
    if (!res.ok) return null;
    const type = (res.headers.get("content-type") || "").split(";")[0].toLowerCase();
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > max) return null;
    return { buf, type, url: res.url || url };
  } catch {
    return null;
  }
}

function attr(tag, naam) {
  const m = tag.match(new RegExp(`\\s${naam}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  return m ? (m[2] ?? m[3] ?? m[4] ?? "") : "";
}

// Zoek het logo in de HTML. We geven elke kandidaat punten en nemen de beste.
function zoekLogo(html, basis, bedrijfsnaam) {
  const kandidaten = [];
  const naamWoord = String(bedrijfsnaam || "").toLowerCase().split(/\s+/).filter((w) => w.length > 3);
  const headerEind = (() => {
    const i = html.search(/<\/header>/i);
    return i > 0 ? i : Math.min(html.length, 15000);
  })();

  // 1. <img>-tags
  const imgRe = /<img\b[^>]*>/gi;
  let m, volgorde = 0;
  while ((m = imgRe.exec(html))) {
    const tag = m[0];
    const src = attr(tag, "src") || attr(tag, "data-src") || (attr(tag, "srcset").split(/\s+/)[0] || "");
    if (!src) continue;
    const alles = (src + " " + attr(tag, "alt") + " " + attr(tag, "class") + " " + attr(tag, "id")).toLowerCase();
    let punten = 0;
    if (alles.includes("logo")) punten += 6;
    if (m.index < headerEind) punten += 2;
    if (naamWoord.some((w) => alles.includes(w))) punten += 2;
    if (volgorde === 0) punten += 1;
    if (/icon|avatar|flag|vlag|whatsapp|facebook|instagram|linkedin|keurmerk|trustpilot|google/.test(alles)) punten -= 4;
    volgorde++;
    if (punten < 3) continue;
    const url = src.startsWith("data:") ? src : absoluut(src, basis);
    if (url) kandidaten.push({ url, punten });
  }

  // 2. Inline <svg> met "logo" in class/id
  const svgRe = /<svg\b[^>]*(class|id)\s*=\s*["'][^"']*logo[^"']*["'][^>]*>[\s\S]*?<\/svg>/gi;
  while ((m = svgRe.exec(html))) {
    kandidaten.push({ svg: m[0], punten: 7 + (m.index < headerEind ? 2 : 0) });
  }

  // 3. Terugval: apple-touch-icon (meestal het logo in kleur), dan favicon-png.
  const linkRe = /<link\b[^>]*>/gi;
  while ((m = linkRe.exec(html))) {
    const rel = attr(m[0], "rel").toLowerCase();
    const href = attr(m[0], "href");
    if (!href) continue;
    if (rel.includes("apple-touch-icon")) kandidaten.push({ url: absoluut(href, basis), punten: 2, icoon: true });
    else if (rel.includes("icon") && /\.(png|svg)(\?|$)/i.test(href)) kandidaten.push({ url: absoluut(href, basis), punten: 1, icoon: true });
  }

  return kandidaten.filter((k) => k.url || k.svg).sort((a, b) => b.punten - a.punten);
}

// ---------- kleuren uit CSS ----------

// Standaardpalet van WordPress/Gutenberg: staat in vrijwel elke WP-site, maar
// zegt niets over de huisstijl. Negeren.
const WP_STANDAARD = new Set(["#ABB8C3", "#FF6900", "#FCB900", "#7BDCB5", "#00D084", "#8ED1FC", "#0693E3", "#9B51E0", "#CF2E2E", "#F78DA7", "#32373C", "#EEEEEE", "#313131", "#000000", "#FFFFFF"]);

function cssKleuren(css) {
  const telling = new Map();
  const tel = (hex, gewicht) => {
    const rgb = hexNaarRgb(hex);
    if (!rgb) return;
    const H = rgbNaarHex(rgb);
    if (WP_STANDAARD.has(H)) return;
    telling.set(H, (telling.get(H) || 0) + gewicht);
  };
  // Regels met hun selector, zodat knoppen/header zwaarder tellen.
  const regelRe = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = regelRe.exec(css))) {
    const sel = m[1].toLowerCase();
    const body = m[2];
    if (/wp--preset--color/.test(body)) continue;
    let gewicht = 1;
    if (/btn|button|cta|primary|accent|elementor-button|header|nav|menu|brand|hero/.test(sel)) gewicht = 4;
    if (/--(primary|primair|brand|accent|main|theme|e-global-color-primary|e-global-color-accent|e-global-color-secondary)/.test(body)) gewicht = Math.max(gewicht, 4);
    const kleurRe = /#([0-9a-f]{6}|[0-9a-f]{3})\b|rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/gi;
    let k;
    while ((k = kleurRe.exec(body))) {
      if (k[1]) tel("#" + k[1], gewicht);
      else tel(rgbNaarHex([+k[2], +k[3], +k[4]]), gewicht);
    }
  }
  return [...telling.entries()]
    .map(([hex, n]) => ({ rgb: hexNaarRgb(hex), n }))
    .filter((x) => isKleurig(x.rgb))
    .sort((a, b) => b.n - a.n);
}

// ---------- kleuren uit het logo ----------

async function logoAnalyse(buf) {
  let sharp;
  try {
    sharp = (await import("sharp")).default;
  } catch {
    return null; // sharp niet beschikbaar: de AI kijkt dan zelf naar het logo
  }
  try {
    const { data, info } = await sharp(buf, { density: 96 })
      .resize(96, 96, { fit: "inside", withoutEnlargement: false })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const emmers = new Map();
    let dekkend = 0, donker = [0, 0, 0, 0], licht = 0;
    for (let i = 0; i < data.length; i += info.channels) {
      const a = data[i + 3];
      if (a < 140) continue;
      const rgb = [data[i], data[i + 1], data[i + 2]];
      dekkend++;
      const [, s, l] = hsl(rgb);
      if (l > 0.9) { licht++; continue; }
      if (l < 0.22 && s < 0.5) { donker[0] += rgb[0]; donker[1] += rgb[1]; donker[2] += rgb[2]; donker[3]++; continue; }
      if (!isKleurig(rgb)) continue;
      const sleutel = (rgb[0] >> 4) * 256 + (rgb[1] >> 4) * 16 + (rgb[2] >> 4);
      const e = emmers.get(sleutel) || [0, 0, 0, 0];
      e[0] += rgb[0]; e[1] += rgb[1]; e[2] += rgb[2]; e[3]++;
      emmers.set(sleutel, e);
    }
    if (!dekkend) return null;
    // Emmers samenvoegen die op elkaar lijken (anti-aliasing geeft tussentinten).
    const ruw = [...emmers.values()].map((e) => ({ rgb: [e[0] / e[3], e[1] / e[3], e[2] / e[3]], n: e[3] })).sort((a, b) => b.n - a.n);
    const groepen = [];
    for (const r of ruw) {
      const g = groepen.find((x) => afstand(x.rgb, r.rgb) < 48);
      if (g) { g.rgb = meng(g.rgb, r.rgb, r.n / (g.n + r.n)); g.n += r.n; }
      else groepen.push({ ...r });
    }
    groepen.sort((a, b) => b.n - a.n);
    const kleurig = groepen.filter((g) => g.n / dekkend > 0.03);
    return {
      kleuren: kleurig.map((g) => ({ rgb: g.rgb, aandeel: g.n / dekkend })),
      donker: donker[3] / dekkend > 0.08 ? [donker[0] / donker[3], donker[1] / donker[3], donker[2] / donker[3]] : null,
      // Wit logo (bedoeld voor een donkere balk): niet tonen in onze witte header.
      bijnaWit: licht / dekkend > 0.7,
    };
  } catch {
    return null;
  }
}

// ---------- palet samenstellen ----------

function palet({ logo, css }) {
  let prim = null, sec = null;
  const bronnen = [];

  if (logo && logo.kleuren.length) {
    const [c1, ...rest] = logo.kleuren;
    const c2 = rest.find((c) => afstand(c.rgb, c1.rgb) > 70 && c.aandeel > c1.aandeel * 0.12);
    if (c2) {
      const [a, b] = lum(c1.rgb) <= lum(c2.rgb) ? [c1.rgb, c2.rgb] : [c2.rgb, c1.rgb];
      prim = a; sec = b;
    } else if (logo.donker) {
      prim = logo.donker; sec = c1.rgb;
    } else {
      sec = c1.rgb;
      prim = meng(c1.rgb, [11, 15, 20], 0.62); // diepe tint van dezelfde kleur
    }
    bronnen.push("logo");
  } else if (logo && logo.donker) {
    prim = logo.donker; // zwart/wit logo: donker basispalet, accent uit de site
    bronnen.push("logo");
  }

  if (css && css.length) {
    if (!sec) {
      // Accent van de site: liefst iets dat duidelijk afwijkt van de basiskleur.
      const kies = css.find((c) => !prim || afstand(c.rgb, prim) > 70) || css[0];
      sec = kies.rgb;
      if (!bronnen.includes("website")) bronnen.push("website");
    }
    if (!prim) {
      const donkerste = css.filter((c) => c.n >= css[0].n * 0.15).sort((a, b) => lum(a.rgb) - lum(b.rgb))[0];
      if (donkerste && lum(donkerste.rgb) < 0.25 && afstand(donkerste.rgb, sec) > 40) prim = donkerste.rgb;
      else prim = meng(sec, [11, 15, 20], 0.62);
      if (!bronnen.includes("website")) bronnen.push("website");
    }
  }

  if (!prim || !sec) return null;
  return { prim, sec, bron: bronnen.join("+") };
}

// Contrast bewaken en de merk-velden invullen. Werkt ook op AI-kleuren, zodat
// elke preview leesbaar is, ongeacht waar de kleuren vandaan komen.
export function borgContrast(merk = {}) {
  const uit = { ...merk };
  const notities = [];
  const p = hexNaarRgb(uit.primaire_kleur);
  const s = hexNaarRgb(uit.secundaire_kleur);
  if (p && contrast(p, WIT) < 4.5) {
    uit.primaire_kleur = rgbNaarHex(donkerTot(p, 4.5));
    notities.push(`Basiskleur iets donkerder gemaakt (${merk.primaire_kleur} -> ${uit.primaire_kleur}) zodat witte tekst leesbaar is.`);
  }
  if (s && contrast(s, WIT) < 2.2) {
    notities.push(`Accentkleur ${uit.secundaire_kleur} is erg licht: knoppen krijgen donkere tekst, labels een iets donkerdere tint. Even nakijken.`);
  }
  // Lichte achtergrondtint voor de afwisselende secties: een vleugje van de
  // accentkleur in plaats van altijd hetzelfde grijs.
  const s2 = hexNaarRgb(uit.secundaire_kleur);
  if (s2) {
    uit.accent_kleur = rgbNaarHex(meng(WIT, s2, 0.07));
  }
  return { merk: uit, notities };
}

// ---------- hoofdfunctie ----------

/**
 * Lees de huisstijl van een bestaande website.
 * Geeft terug: { primaire_kleur, secundaire_kleur, bron, logo: {buf, type, url} | null, logoTonen, notities }
 * of null als er niets bruikbaars gevonden is.
 */
export async function leesHuisstijl(website, bedrijfsnaam) {
  if (!website) return null;
  let start = String(website).trim();
  if (!/^https?:\/\//i.test(start)) start = "https://" + start;

  const pagina = await haal(start, { max: 2_500_000 });
  if (!pagina || !/html/.test(pagina.type || "html")) return null;
  const html = pagina.buf.toString("utf8");
  const basis = pagina.url;

  // CSS verzamelen: inline <style>, style-attributen, theme-color en een paar
  // eigen stylesheets (niet die van Google Fonts of plugins van derden).
  let css = "";
  const themeColor = (html.match(/<meta[^>]+name=["']theme-color["'][^>]*>/i) || [""])[0];
  const tc = attr(themeColor, "content");
  if (tc) css += `meta-theme-color{--brand:${tc}}\n`;
  const styleRe = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
  let m;
  while ((m = styleRe.exec(html))) css += m[1] + "\n";
  const sheets = [];
  const linkRe = /<link\b[^>]*rel=["']?stylesheet[^>]*>/gi;
  while ((m = linkRe.exec(html))) {
    const href = absoluut(attr(m[0], "href"), basis);
    if (!href || /fonts\.googleapis|cdnjs|jsdelivr|unpkg|font-?awesome|wp-includes|block-library|dashicons/.test(href)) continue;
    sheets.push(href);
  }
  const opgehaald = await Promise.all(sheets.slice(0, 5).map((h) => haal(h, { ms: 6000, max: 800_000 })));
  for (const s of opgehaald) if (s) css += s.buf.toString("utf8") + "\n";
  const cssPalet = cssKleuren(css);

  // Logo zoeken en analyseren (beste kandidaat die echt een afbeelding is).
  let logo = null, analyse = null;
  for (const k of zoekLogo(html, basis, bedrijfsnaam).slice(0, 4)) {
    let bestand = null;
    if (k.svg) {
      bestand = { buf: Buffer.from(k.svg.includes("xmlns") ? k.svg : k.svg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"')), type: "image/svg+xml", url: null };
    } else if (k.url.startsWith("data:")) {
      const d = k.url.match(/^data:(image\/[a-z+]+);base64,(.+)$/i);
      if (d) bestand = { buf: Buffer.from(d[2], "base64"), type: d[1].toLowerCase(), url: null };
    } else {
      bestand = await haal(k.url, { binair: true, max: 3_000_000 });
    }
    if (!bestand || !/^image\/(png|jpe?g|webp|gif|svg\+xml)$/.test(bestand.type || "")) continue;
    const a = await logoAnalyse(bestand.buf);
    logo = { ...bestand, icoon: !!k.icoon };
    analyse = a;
    break;
  }

  const p = palet({ logo: analyse, css: cssPalet });
  if (!p && !logo) return null;
  return {
    primaire_kleur: p ? rgbNaarHex(p.prim) : null,
    secundaire_kleur: p ? rgbNaarHex(p.sec) : null,
    bron: p ? p.bron : null,
    logo,
    // Alleen een echt logo (geen favicon) en geen wit-op-transparant logo in de header.
    logoTonen: !!(logo && !logo.icoon && !(analyse && analyse.bijnaWit)),
    cssKandidaten: cssPalet.slice(0, 5).map((c) => rgbNaarHex(c.rgb)),
  };
}
