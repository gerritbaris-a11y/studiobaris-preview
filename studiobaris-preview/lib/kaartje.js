// Fotokaartje bij de brief (Adressenlijst → bewerkvenster).
// Server-only.
//
// Staat in de brief het vinkje "kaartje" aan, dan komt het kaartje als
// pagina 2 mee in de brief-PDF: een A4 met het kaartje (A6) en snijlijnen.
// Los op te vragen via /api/brieven/kaartje.
//
// Het kaartje, A6 liggend: links een telefoon met de bovenkant van de eigen preview
// (merkkleuren, hoofdfoto, kop en de balk "Probeer je eigen app"), rechts
// "Zo ziet jullie website eruit" met QR-code en adres. Het kaartje gaat met
// een paperclip op de brief; de brief verwijst ernaar als teksten.kaartje aan
// staat. Het telefoonbeeld is een nagebouwde weergave van de preview (opgebouwd
// uit dezelfde inhoud en kleuren), geen schermafbeelding.
import { PDFDocument, rgb } from "pdf-lib";
import QRCode from "qrcode";
import sharp from "sharp";
import { jakartaFonts } from "./plus-jakarta-font";
import { bodoniFonts } from "./bodoni-moda-font";
import { heroFoto } from "./preview-assets";
import { hexNaarRgb } from "./huisstijl";

const PREVIEW_BASIS = "https://preview.studiobaris.nl/";

function schoon(s) {
  return String(s == null ? "" : s)
    .replace(/[‘’‚]/g, "'")
    .replace(/[“”„]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/[^\x09\x0A\x0D\x20-\x7E -ÿ€]/g, "")
    .trim();
}

function kleur(hex, terugval) {
  const r = hexNaarRgb(hex) || hexNaarRgb(terugval);
  return rgb(r[0] / 255, r[1] / 255, r[2] / 255);
}
function lichtheid(hex) {
  const r = hexNaarRgb(hex) || [0, 0, 0];
  return (0.299 * r[0] + 0.587 * r[1] + 0.114 * r[2]) / 255;
}

function wrap(tekst, font, size, maxBreedte, maxRegels = 99) {
  const regels = [];
  let regel = "";
  for (const w of String(tekst).split(/ +/).filter(Boolean)) {
    const probeer = regel ? regel + " " + w : w;
    if (font.widthOfTextAtSize(probeer, size) > maxBreedte && regel) {
      regels.push(regel);
      regel = w;
    } else regel = probeer;
  }
  if (regel) regels.push(regel);
  if (regels.length > maxRegels) {
    const kort = regels.slice(0, maxRegels);
    let laatste = kort[maxRegels - 1];
    while (laatste && font.widthOfTextAtSize(laatste + "...", size) > maxBreedte) laatste = laatste.replace(/\s*\S+$/, "");
    kort[maxRegels - 1] = laatste + "...";
    return kort;
  }
  return regels;
}

// Rechthoek met ronde hoeken als SVG-pad (pdf-lib: y loopt omlaag in paden).
function rondPad(w, h, r) {
  return `M ${r} 0 H ${w - r} A ${r} ${r} 0 0 1 ${w} ${r} V ${h - r} A ${r} ${r} 0 0 1 ${w - r} ${h} H ${r} A ${r} ${r} 0 0 1 0 ${h - r} V ${r} A ${r} ${r} 0 0 1 ${r} 0 Z`;
}

// Afbeelding ophalen en bijsnijden tot precies de gevraagde verhouding.
async function haalBeeld(url, breedte, hoogte) {
  if (!url) return null;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return await sharp(buf).resize(Math.round(breedte), Math.round(hoogte), { fit: "cover" }).jpeg({ quality: 82 }).toBuffer();
  } catch {
    return null;
  }
}
async function haalLogo(url, maxB, maxH) {
  if (!url) return null;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return await sharp(buf).resize(Math.round(maxB), Math.round(maxH), { fit: "inside" }).png().toBuffer();
  } catch {
    return null;
  }
}

// Het kaartje zelf, als losse A6-pagina (bytes). Wordt op een A4 met
// snijlijnen gezet door kaartjeOpA4.
async function kaartjeA6({ rij, content, vorm = "jullie" }) {
  const c = content || {};
  const b = c.bedrijf || {};
  const m = c.merk || {};
  const hero = c.hero || {};
  const je = vorm === "je";
  const v = (a, z) => (je ? a : z);
  const bedrijf = schoon(rij.company_name || b.naam || rij.slug);
  const url = PREVIEW_BASIS + rij.slug;

  const PRIM = m.primaire_kleur || "#0F0F0F";
  const SEC = m.secundaire_kleur || "#FF8300";
  const cPrim = kleur(PRIM, "#0F0F0F");
  const cSec = kleur(SEC, "#FF8300");
  const opSec = lichtheid(SEC) > 0.62 ? rgb(0.07, 0.07, 0.07) : rgb(1, 1, 1);

  const INKT = rgb(0.102, 0.169, 0.239);
  const GRIJS = rgb(0.42, 0.38, 0.33);
  const VLAK = rgb(0.972, 0.961, 0.943);
  const WIT = rgb(1, 1, 1);
  const GOUD = rgb(0.780, 0.604, 0.337);

  const pdf = await PDFDocument.create();
  pdf.setTitle(`Kaartje ${bedrijf}`);
  pdf.setAuthor("StudioBaris");
  const W = 419.53; // A6 liggend
  const H = 297.64;
  const pagina = pdf.addPage([W, H]);
  const { font, vet, italic } = await jakartaFonts(pdf);
  const { regular: bodoniReg, bold: bodoniBold } = await bodoniFonts(pdf);

  const tekst = (s, x, y, o = {}) =>
    pagina.drawText(schoon(s), { x, y, size: o.size || 9, font: o.font || (o.vet ? vet : o.italic ? italic : font), color: o.kleur || INKT, opacity: o.opacity });
  const breedte = (s, o = {}) => (o.font || (o.vet ? vet : o.italic ? italic : font)).widthOfTextAtSize(schoon(s), o.size || 9);
  const vlak = (x, y, w, h, k, opacity) => pagina.drawRectangle({ x, y, width: w, height: h, color: k, opacity });
  const rond = (x, y, w, h, r, k) => pagina.drawSvgPath(rondPad(w, h, r), { x, y: y + h, color: k });

  // Achtergrond + gouden rand bovenaan
  vlak(0, 0, W, H, VLAK);
  vlak(0, H - 3, W, 3, GOUD);

  // ── Telefoon ────────────────────────────────────────────────────────────
  const TW = 138, TH = 264;
  const TX = 34, TY = (H - TH) / 2 - 2;
  rond(TX, TY, TW, TH, 20, rgb(0.09, 0.09, 0.1)); // behuizing
  const RAND = 6;
  const SX = TX + RAND, SY = TY + RAND, SW = TW - 2 * RAND, SH = TH - 2 * RAND;
  rond(SX, SY, SW, SH, 15, WIT); // scherm
  let top = SY + SH;

  // Statusbalk + koptekst met logo of naam en een knop
  top -= 14;
  const kopH = 22;
  top -= kopH;
  const logo = await haalLogo(m.logo_url, 140, 40);
  if (logo) {
    const img = await pdf.embedPng(logo);
    const schaal = Math.min(60 / img.width, 13 / img.height);
    pagina.drawImage(img, { x: SX + 8, y: top + (kopH - img.height * schaal) / 2, width: img.width * schaal, height: img.height * schaal });
  } else {
    const naam = wrap(bedrijf, vet, 6, 74, 1)[0];
    tekst(naam, SX + 8, top + 8, { vet: true, size: 6, kleur: cPrim });
  }
  const knop = schoon(hero.cta_tekst || "Offerte");
  const knopKort = wrap(knop, vet, 4.6, 34, 1)[0];
  const kb = breedte(knopKort, { vet: true, size: 4.6 }) + 9;
  rond(SX + SW - 8 - kb, top + 6, kb, 10, 5, cSec);
  tekst(knopKort, SX + SW - 8 - kb + 4.5, top + 9.4, { vet: true, size: 4.6, kleur: opSec });

  // Hero: foto met merkkleur eroverheen, kop, subkop, knop
  const heroH = 132;
  top -= heroH;
  const beeld = await haalBeeld(hero.achtergrond || heroFoto(b.branche), SW * 4, heroH * 4);
  if (beeld) {
    const img = await pdf.embedJpg(beeld);
    pagina.drawImage(img, { x: SX, y: top, width: SW, height: heroH });
    vlak(SX, top, SW, heroH, cPrim, 0.66);
  } else {
    vlak(SX, top, SW, heroH, cPrim);
  }
  let hy = top + heroH - 20;
  const ix = SX + 9, iw = SW - 18;
  tekst(wrap(String(b.branche || bedrijf).toUpperCase(), vet, 4.8, iw, 1)[0], ix, hy, { vet: true, size: 4.8, kleur: cSec });
  hy -= 13;
  const acc = schoon(hero.kop_accent || "");
  let kop = schoon(hero.kop || bedrijf);
  if (acc && kop.toLowerCase().endsWith(acc.toLowerCase())) kop = kop.slice(0, kop.length - acc.length).trim();
  for (const r of wrap(kop, vet, 11, iw, 2)) { tekst(r, ix, hy, { vet: true, size: 11, kleur: WIT }); hy -= 12.5; }
  for (const r of wrap(acc, vet, 11, iw, 2)) { tekst(r, ix, hy, { vet: true, size: 11, kleur: cSec }); hy -= 12.5; }
  hy -= 2;
  for (const r of wrap(schoon(hero.subkop || ""), font, 5.4, iw, 2)) { tekst(r, ix, hy, { size: 5.4, kleur: WIT, opacity: 0.9 }); hy -= 7.4; }
  hy -= 6;
  const hk = wrap(schoon(hero.cta_tekst || "Offerte aanvragen") + " ->", vet, 5.4, iw, 1)[0];
  const hkb = breedte(hk, { vet: true, size: 5.4 }) + 14;
  rond(ix, hy - 4, hkb, 13, 6.5, cSec);
  tekst(hk, ix + 7, hy, { vet: true, size: 5.4, kleur: opSec });

  // Onder de hero: specialiteiten (twee kaartjes)
  top -= 8;
  tekst("Onze specialiteiten", SX + 9, top - 8, { vet: true, size: 6.2, kleur: cPrim });
  const diensten = (Array.isArray(c.diensten) ? c.diensten : []).map((d) => schoon((d && (d.titel || d.naam)) || d)).filter(Boolean).slice(0, 2);
  const kw = (SW - 18 - 6) / 2;
  diensten.forEach((d, i) => {
    const kx = SX + 9 + i * (kw + 6);
    vlak(kx, top - 36, kw, 22, rgb(0.95, 0.95, 0.96));
    vlak(kx, top - 36, 2, 22, cSec);
    wrap(d, vet, 4.8, kw - 8, 2).forEach((r, k) => tekst(r, kx + 5, top - 21 - k * 6, { vet: true, size: 4.8, kleur: INKT }));
  });

  // Balk onderaan: "Probeer je eigen app" + "Open je app" (zoals op de preview)
  const balkH = 30;
  const by = SY + 10;
  rond(SX + 6, by, SW - 12, balkH, 7, INKT);
  tekst("Probeer je eigen app", SX + 13, by + 18, { vet: true, size: 6, kleur: WIT });
  tekst("3 projecten zelf plaatsen", SX + 13, by + 9, { size: 4.6, kleur: WIT, opacity: 0.8 });
  const ok = "Open je app";
  const okb = breedte(ok, { vet: true, size: 5 }) + 10;
  rond(SX + SW - 12 - okb, by + 9, okb, 12, 6, GOUD);
  tekst(ok, SX + SW - 12 - okb + 5, by + 13, { vet: true, size: 5, kleur: WIT });

  // ── Rechterkant: kop, uitleg, QR, adres ──────────────────────────────────
  const RX = TX + TW + 30;
  const RB = W - RX - 28;
  let ry = H - 50;
  for (const r of wrap(v("Zo ziet jouw website eruit.", "Zo ziet jullie website eruit."), vet, 16, RB)) { tekst(r, RX, ry, { vet: true, size: 16 }); ry -= 19; }
  ry -= 2;
  for (const r of wrap(`Gemaakt voor ${bedrijf}. ${v("Scan de code en bekijk hem echt, of probeer meteen je eigen app.", "Scan de code en bekijk hem echt, of probeer meteen jullie eigen app.")}`, font, 8.5, RB)) {
    tekst(r, RX, ry, { size: 8.5, kleur: GRIJS }); ry -= 11.5;
  }
  ry -= 8;
  const qr = QRCode.create(url, { errorCorrectionLevel: "M" });
  const n = qr.modules.size;
  const qrMaat = 92;
  const cel = qrMaat / (n + 2);
  const qy = ry - qrMaat;
  vlak(RX, qy, qrMaat, qrMaat, WIT);
  for (let r = 0; r < n; r++) {
    for (let k = 0; k < n; k++) {
      if (qr.modules.get(r, k)) vlak(RX + (k + 1) * cel, qy + qrMaat - (r + 2) * cel, cel + 0.05, cel + 0.05, INKT);
    }
  }
  ry = qy - 12;
  const kortUrl = url.replace("https://", "");
  const stukken = kortUrl.match(/[^/-]*[/-]|[^/-]+$/g) || [kortUrl];
  let regel = "";
  for (const st of stukken) {
    if (regel && vet.widthOfTextAtSize(regel + st, 7.5) > RB) { tekst(regel, RX, ry, { vet: true, size: 7.5 }); ry -= 9.5; regel = st; }
    else regel += st;
  }
  if (regel) { tekst(regel, RX, ry, { vet: true, size: 7.5 }); ry -= 9.5; }
  tekst("Gratis kijken: geen inlog, geen betaalgegevens.", RX, ry - 2, { italic: true, size: 6.5, kleur: GRIJS });

  // Merk onderaan rechts
  const by2 = 22;
  tekst("Studio", RX, by2, { size: 10, font: bodoniReg });
  const sb = bodoniReg.widthOfTextAtSize("Studio", 10);
  tekst("Baris", RX + sb, by2, { size: 10, font: bodoniBold });
  tekst("06 16 73 21 05", RX + sb + bodoniBold.widthOfTextAtSize("Baris", 10) + 10, by2 + 1, { size: 7, kleur: GRIJS });

  return await pdf.save();
}

// A4 met het kaartje bovenaan in het midden en snijlijnen in de hoeken.
// Voegt een pagina toe aan een bestaand PDF-document (bv. de brief).
export async function kaartjeOpA4(pdf, opties) {
  const [kaart] = await pdf.embedPdf(await kaartjeA6(opties));
  const A4W = 595.28, A4H = 841.89;
  const KW = kaart.width, KH = kaart.height;
  const x = (A4W - KW) / 2;
  const y = A4H - 70 - KH;
  const pagina = pdf.addPage([A4W, A4H]);
  pagina.drawPage(kaart, { x, y, width: KW, height: KH });
  // Snijlijnen: korte streepjes buiten elke hoek.
  const GAT = 4, LEN = 14, DIK = 0.5;
  const zwart = rgb(0.3, 0.3, 0.3);
  const lijn = (x1, y1, x2, y2) => pagina.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness: DIK, color: zwart });
  for (const [cx, cy, sx, sy] of [[x, y, -1, -1], [x + KW, y, 1, -1], [x, y + KH, -1, 1], [x + KW, y + KH, 1, 1]]) {
    lijn(cx + sx * GAT, cy, cx + sx * (GAT + LEN), cy);
    lijn(cx, cy + sy * GAT, cx, cy + sy * (GAT + LEN));
  }
  const { font } = await jakartaFonts(pdf);
  const uitleg = "Snijd uit langs de hoekmarkeringen (148 x 105 mm). Print deze pagina op fotokarton van ca. 250 g/m2.";
  const ub = font.widthOfTextAtSize(uitleg, 7.5);
  pagina.drawText(uitleg, { x: (A4W - ub) / 2, y: y - 34, size: 7.5, font, color: rgb(0.42, 0.38, 0.33) });
  return pagina;
}

// Los kaartje (route /api/brieven/kaartje): één A4 met snijlijnen.
export async function kaartjePdf(opties) {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Kaartje ${schoon(opties.rij.company_name || opties.rij.slug)}`);
  pdf.setAuthor("StudioBaris");
  await kaartjeOpA4(pdf, opties);
  return await pdf.save();
}
