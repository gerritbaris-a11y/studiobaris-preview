// Brieven voor het offline marketingmodel (Adressenlijst → knop "Brief").
// Server-only.
//
// Per online preview één printklare A4-brief: persoonlijke opening en een
// app-alinea met een beeld uit het eigen vak (door Claude geschreven op basis
// van de preview-inhoud), een QR-code naar de eigen preview, de brief-actie
// (€399 i.p.v. €599) die 3 weken na de dagtekening afloopt, en een witregel-
// blok waar degene die de brief maakt met de hand ondertekent.
//
// Opbouw van de tekst: Boron-stijl (persoonlijk, één-op-één, korte zinnen,
// P.S.) in een AIDA-volgorde:
//   A  kop "Hij is al gemaakt." + persoonlijke opening       (Claude)
//   I  de website staat klaar, scan de QR-code              (vast)
//   D  de app + reviewtool in een beeld uit hun vak          (Claude)
//   A  prijs + deadline, scan/bel/app, P.S.                  (vast)
// Lukt de Claude-aanroep niet, dan valt elke alinea terug op een nette
// standaardtekst, zodat de knop altijd een brief oplevert.
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import QRCode from "qrcode";
import { BEDRIJF } from "./facturen";
import { BODONI_BOLD_BASE64 } from "./bodoni-moda-font";
import { callClaude } from "./anthropic";

const PREVIEW_BASIS = "https://preview.studiobaris.nl/";
export const ACTIE_DAGEN = 21; // brief-actie loopt 3 weken na dagtekening

const MAANDEN = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];
const DAGEN = ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"];

// Datum "vandaag" in Nederlandse tijd (Vercel draait in UTC).
export function vandaagNL() {
  const s = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Amsterdam" }); // YYYY-MM-DD
  const [j, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(j, m - 1, d));
}
export function plusDagen(datum, n) {
  return new Date(datum.getTime() + n * 86400000);
}
export function datumLang(d, metDag = false) {
  const basis = `${d.getUTCDate()} ${MAANDEN[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  return metDag ? `${DAGEN[d.getUTCDay()]} ${basis}` : basis;
}

// pdf-lib's standaardlettertypen kennen alleen WinAnsi; vervang wat Claude
// soms gebruikt aan tekens daarbuiten.
function schoon(s) {
  return String(s == null ? "" : s)
    .replace(/[‘’‚]/g, "'")
    .replace(/[“”„]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/[   ]/g, " ")
    .replace(/[^\x09\x0A\x0D\x20-\x7E -ÿ€]/g, "")
    .trim();
}

function parseJson(tekst) {
  const m = String(tekst || "").match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}

function notities(rij) {
  const n = rij && rij.internal_notes;
  if (!n) return {};
  if (typeof n === "object") return n;
  try { return JSON.parse(n); } catch { return {}; }
}

const SYSTEEM = `Je schrijft twee alinea's voor een persoonlijke papieren brief van StudioBaris aan een Nederlandse vakman/vakvrouw. De brief wordt aan de deur afgegeven of in de bus gedaan. StudioBaris heeft al een complete voorbeeldwebsite voor dit bedrijf gemaakt (via een QR-code te bekijken).

Propositie: een website kan iedereen maken; StudioBaris geeft vakmensen een APP waarmee ze hun website volledig zelf beheren vanaf hun telefoon. Klus af: foto's maken, kort inspreken wat je deed, StudioBaris schrijft de tekst en het project staat binnen een minuut op de site. Reviewtool: de klant krijgt met een tik via WhatsApp een reviewverzoek; goede reviews komen online, kritiek blijft privé. Doel: betrouwbaar overkomen bij wie hen opzoekt, zonder laptop of webbouwer.

Stijl: als een persoonlijke brief van mens tot mens (Boron-letter-stijl). Korte zinnen, nuchter, warm, geen marketingtaal, geen superlatieven, geen uitroeptekens, geen emoji. Nooit iets negatiefs over het bedrijf noemen (geen matige reviews, ontbrekende gegevens). Gebruik ALLEEN feiten die in de aangeleverde gegevens staan; verzin geen jaartallen, scores, namen of diensten. Schrijf in de ik-vorm namens de afzender.

Lever uitsluitend JSON, zonder uitleg:
{
  "vorm": "je" of "jullie"   (je als er een contactpersoon bekend is of het duidelijk een eenpitter is, anders jullie),
  "aanhef": "Beste Jan," of "Beste team van <bedrijfsnaam>,"  (voornaam alleen als die echt in de gegevens staat),
  "opening": "2-3 zinnen: iets concreets en positiefs over dit bedrijf dat laat zien dat je echt gekeken hebt (vakgebied, werkgebied, ervaring, wat klanten zeggen), eindigend met waarom het zonde is dat dit online niet goed te zien is. Max 55 woorden.",
  "app": "3-4 zinnen, beginnend NA de zin 'Het echte verschil zit in de app die erbij hoort.' (die zin staat er al): een concreet beeld uit HUN vak (bv. de net opgeleverde tuin, boven op het dak, de afgemonteerde groepenkast), foto + inspreken, staat online; dan de reviewtool in hetzelfde beeld incl. 'goede reviews komen online, kritiek blijft privé' in eigen woorden; eindig met wat het oplevert. Max 75 woorden. Gebruik de gekozen vorm (je/jullie)."
}`;

function standaardTeksten(bedrijf, vorm) {
  const je = vorm === "je";
  return {
    vorm,
    aanhef: je ? "Beste vakman," : `Beste team van ${bedrijf},`,
    opening: `Ik kwam ${bedrijf} tegen en zag mooi vakwerk. Alleen: wie ${je ? "je" : "jullie"} opzoekt, ziet daar online nog weinig van terug. Dat is zonde.`,
    app: je
      ? "Klus af? Je maakt een paar foto's, spreekt kort in wat je gedaan hebt, en een minuut later staat het als project op je site. Je klant krijgt met één tik via WhatsApp een reviewverzoek. Goede reviews komen online, kritiek blijft tussen jullie. Zo ziet iedereen die je opzoekt meteen je nieuwste werk en wat klanten ervan vinden."
      : "Klus af? Jullie maken een paar foto's, spreken kort in wat er gedaan is, en een minuut later staat het als project op jullie site. De klant krijgt met één tik via WhatsApp een reviewverzoek. Goede reviews komen online, kritiek blijft privé. Zo ziet iedereen die jullie opzoekt meteen het nieuwste werk en wat klanten ervan vinden.",
  };
}

// Persoonlijke teksten via Claude, met nette terugval.
export async function briefTeksten(rij, content) {
  const c = content || {};
  const b = c.bedrijf || {};
  const naam = schoon(rij.company_name || b.naam || rij.slug);
  const n = notities(rij);
  const gegevens = {
    bedrijfsnaam: naam,
    contactpersoon: rij.contactpersoon || null,
    branche: b.branche || null,
    regio: b.regio || null,
    adres: b.adres || rij.b_adres || null,
    slogan: b.slogan || null,
    usps: c.usps || null,
    diensten: Array.isArray(c.diensten) ? c.diensten.map((d) => (d && (d.titel || d.naam)) || d).slice(0, 8) : null,
    over_ons: c.over_ons || null,
    voordelen: Array.isArray(c.voordelen) ? c.voordelen.map((x) => x && x.tekst).filter(Boolean) : null,
    reviews: Array.isArray(c.reviews) ? c.reviews.slice(0, 3).map((r) => (r && (r.tekst || r.text)) || r) : null,
    onderzoeksnotities: [].concat(n.let_op || [], n.afgeleid || []).slice(0, 12),
    persoonlijke_notitie: rij.persoonlijk || null,
  };

  try {
    const antwoord = await callClaude(SYSTEEM, "Gegevens van het bedrijf (JSON):\n" + JSON.stringify(gegevens, null, 1));
    const j = parseJson(antwoord);
    if (j && j.opening && j.app && j.aanhef) {
      const vorm = j.vorm === "je" ? "je" : "jullie";
      return { vorm, aanhef: schoon(j.aanhef), opening: schoon(j.opening), app: schoon(j.app), bron: "claude" };
    }
  } catch (e) {
    console.error("brief: Claude-tekst mislukt, standaardtekst gebruikt:", e && e.message);
  }
  const vorm = rij.contactpersoon ? "je" : "jullie";
  return { ...standaardTeksten(naam, vorm), bron: "standaard" };
}

// Woorden over regels verdelen binnen een maximale breedte.
function wrap(tekst, font, size, maxBreedte) {
  const regels = [];
  for (const alinea of String(tekst).split("\n")) {
    let regel = "";
    for (const w of alinea.split(/ +/).filter(Boolean)) {
      const probeer = regel ? regel + " " + w : w;
      if (font.widthOfTextAtSize(probeer, size) > maxBreedte && regel) {
        regels.push(regel);
        regel = w;
      } else regel = probeer;
    }
    regels.push(regel);
  }
  return regels;
}

// opties: { rij, content, teksten, afzender, dagtekening (Date) }
export async function briefPdf({ rij, content, teksten, afzender, dagtekening }) {
  const c = content || {};
  const b = c.bedrijf || {};
  const bedrijf = schoon(rij.company_name || b.naam || rij.slug);
  const adres = schoon(rij.b_adres || b.adres || "");
  const je = teksten.vorm === "je";
  const v = (jeTekst, jullieTekst) => (je ? jeTekst : jullieTekst);
  const datum = dagtekening || vandaagNL();
  const einde = plusDagen(datum, ACTIE_DAGEN);
  const eindeTekst = datumLang(einde, true);
  const url = PREVIEW_BASIS + rij.slug;
  const naamAfzender = schoon(afzender || "Gerrit & Levi");
  // Telefoonnummer niet over twee regels laten breken (harde spaties).
  const TEL = BEDRIJF.telefoon.replace(/ /g, "\u00A0");

  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  pdf.setTitle(`Brief ${bedrijf}`);
  pdf.setAuthor("StudioBaris");
  const pagina = pdf.addPage([595.28, 841.89]); // A4
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const vet = await pdf.embedFont(StandardFonts.HelveticaBold);
  const italic = await pdf.embedFont(StandardFonts.HelveticaOblique);
  const merk = await pdf.embedFont(Buffer.from(BODONI_BOLD_BASE64, "base64"));

  // Zelfde huisstijl als facturen/offertes.
  const INKT = rgb(0.102, 0.169, 0.239);
  const GRIJS = rgb(0.42, 0.38, 0.33);
  const LIJN = rgb(0.88, 0.86, 0.82);
  const VLAK = rgb(0.972, 0.961, 0.943);
  const WIT = rgb(1, 1, 1);
  const GOUD = rgb(0.780, 0.604, 0.337);

  const L = 50;
  const R = 545;
  const KOL_R = 372; // rechterrand hoofdtekst
  const ZIJ_L = 392; // linkerrand zijkolom

  const tekst = (s, x, y, o = {}) =>
    pagina.drawText(schoon(s), { x, y, size: o.size || 10, font: o.merk ? merk : o.italic ? italic : o.vet ? vet : font, color: o.kleur || INKT });
  const breedte = (s, o = {}) => (o.merk ? merk : o.vet ? vet : o.italic ? italic : font).widthOfTextAtSize(schoon(s), o.size || 10);
  const rechts = (s, xEind, y, o = {}) => tekst(s, xEind - breedte(s, o), y, o);
  const midden = (s, x0, x1, y, o = {}) => tekst(s, x0 + (x1 - x0 - breedte(s, o)) / 2, y, o);
  const vlak = (x, y, w, h, kleur) => pagina.drawRectangle({ x, y, width: w, height: h, color: kleur });

  // ── Gouden topbalk + kop (zelfde als offertes) ────────────────────────────
  vlak(0, 838.89, 595.28, 3, GOUD);
  let y = 785;
  vlak(L, y - 28, 32, 32, INKT);
  pagina.drawEllipse({ x: L + 27, y: y - 1, xScale: 3.4, yScale: 3.4, color: GOUD });
  tekst("B", L + 10, y - 18, { size: 16, merk: true, kleur: WIT });
  tekst(BEDRIJF.naam, L + 42, y - 10, { size: 17, merk: true });
  pagina.drawLine({ start: { x: L + 42, y: y - 14 }, end: { x: L + 42 + breedte(BEDRIJF.naam, { merk: true, size: 17 }), y: y - 14 }, thickness: 1.3, color: GOUD });
  rechts(BEDRIJF.naam, R, y, { size: 9.5, vet: true });
  rechts(BEDRIJF.adres, R, y - 12, { size: 9 });
  rechts(BEDRIJF.postcode, R, y - 24, { size: 9 });
  rechts(BEDRIJF.telefoon + " · " + BEDRIJF.web, R, y - 36, { size: 8.5, kleur: GRIJS });

  // ── Geadresseerde + dagtekening ───────────────────────────────────────────
  y = 712;
  tekst(bedrijf, L, y, { vet: true, size: 10.5 });
  const adresDelen = adres.split(",").map((s) => s.trim()).filter(Boolean);
  adresDelen.forEach((d, i) => tekst(d, L, y - 14 * (i + 1), { size: 10 }));
  // Dagtekening: plaats van StudioBaris + datum van vandaag.
  const plaatsSB = BEDRIJF.postcode.replace(/^\d{4}\s?[A-Z]{2}\s*/i, "");
  rechts(`${plaatsSB}, ${datumLang(datum)}`, R, y, { size: 9.5, kleur: GRIJS });

  // ── Zijkolom: QR-code + actieblok ─────────────────────────────────────────
  const zijTop = 640;
  const ZIJ_H = 360;
  const zijB = R - ZIJ_L;
  vlak(ZIJ_L, zijTop - ZIJ_H, zijB, ZIJ_H, VLAK);
  vlak(ZIJ_L, zijTop - ZIJ_H, zijB, 3, GOUD);
  tekst(v("SCAN: JOUW WEBSITE", "SCAN: JULLIE WEBSITE"), ZIJ_L + 12, zijTop - 20, { size: 7.5, vet: true, kleur: GRIJS });
  const qr = QRCode.create(url, { errorCorrectionLevel: "M" });
  const n = qr.modules.size;
  const qrMaat = zijB - 24;
  const cel = qrMaat / (n + 2); // 1 module stille zone rondom
  const qrX = ZIJ_L + 12;
  const qrY = zijTop - 32 - qrMaat;
  vlak(qrX, qrY, qrMaat, qrMaat, WIT);
  for (let r = 0; r < n; r++) {
    for (let k = 0; k < n; k++) {
      if (qr.modules.get(r, k)) vlak(qrX + (k + 1) * cel, qrY + qrMaat - (r + 2) * cel, cel + 0.05, cel + 0.05, INKT);
    }
  }
  // Onder de QR: het adres voluit, zodat niemand hoeft te scannen. Mensen
  // zijn (terecht) voorzichtig met QR-codes op post; een leesbaar adres op
  // ons eigen domein, plus "geen inlog of betaalgegevens", neemt dat weg.
  let uy = qrY - 13;
  for (const regel of wrap(v("Liever niet scannen? Typ dan dit adres in je browser:", "Liever niet scannen? Typ dan dit adres in jullie browser:"), font, 7.5, zijB - 24)) {
    tekst(regel, qrX, uy, { size: 7.5, kleur: GRIJS });
    uy -= 10;
  }
  uy -= 3;
  // Op de "/" afbreken: een URL heeft geen spaties om op te wrappen.
  for (const regel of wrap(url.replace("https://", "").replace("/", "/ "), vet, 9, zijB - 24).map((r) => r.replace("/ ", "/"))) {
    tekst(regel, qrX, uy, { size: 9, vet: true });
    uy -= 12;
  }
  uy -= 2;
  for (const regel of wrap("Gewoon kijken: geen inlog, geen betaalgegevens.", italic, 7.5, zijB - 24)) {
    tekst(regel, qrX, uy, { size: 7.5, italic: true, kleur: GRIJS });
    uy -= 10;
  }
  uy -= 8;
  pagina.drawLine({ start: { x: ZIJ_L + 12, y: uy + 4 }, end: { x: R - 12, y: uy + 4 }, thickness: 0.75, color: LIJN });
  uy -= 10;
  tekst("BRIEF-ACTIE", ZIJ_L + 12, uy, { size: 7.5, vet: true, kleur: GRIJS });
  uy -= 14;
  tekst("Website + app, eenmalig", ZIJ_L + 12, uy, { size: 9 });
  uy -= 24;
  const oud = "€599";
  tekst(oud, ZIJ_L + 12, uy, { size: 14, kleur: GRIJS });
  const oudB = breedte(oud, { size: 14 });
  pagina.drawLine({ start: { x: ZIJ_L + 11, y: uy + 5 }, end: { x: ZIJ_L + 13 + oudB, y: uy + 5 }, thickness: 1.2, color: GRIJS });
  tekst("€399", ZIJ_L + 22 + oudB, uy - 1, { size: 21, vet: true });
  uy -= 15;
  tekst("daarna €29,95 per maand", ZIJ_L + 12, uy, { size: 8.5 });
  uy -= 11;
  tekst("alle bedragen excl. btw", ZIJ_L + 12, uy, { size: 8, italic: true, kleur: GRIJS });
  // Deadlinebalk onderaan het blok
  const balkY = zijTop - ZIJ_H + 3;
  vlak(ZIJ_L, balkY, zijB, 30, INKT);
  midden(`Reageer t/m ${datumLang(einde)}`, ZIJ_L, R, balkY + 11, { size: 8.5, vet: true, kleur: WIT });

  // ── Hoofdtekst ────────────────────────────────────────────────────────────
  // Kop: bedrijfsnaam-zin, en "Hij is al gemaakt." altijd op een eigen regel.
  const kop = `Een website voor ${bedrijf}.\nHij is al gemaakt.`;
  const alineas = [
    { t: teksten.aanhef },
    { t: teksten.opening },
    { t: v(
        "Je bent vakman, geen websitebouwer. Daarom heb ik het werk alvast gedaan. Er staat een complete website voor je klaar, met je naam en je diensten erop. Scan de QR-code hiernaast of typ het adres eronder in je browser, en je ziet hem meteen. Je hoeft nergens in te loggen of iets in te vullen.",
        "Jullie zijn vakmensen, geen websitebouwers. Daarom heb ik het werk alvast gedaan. Er staat een complete website voor jullie klaar, met jullie naam en diensten erop. Scan de QR-code hiernaast of typ het adres eronder in jullie browser, en jullie zien hem meteen. Jullie hoeven nergens in te loggen of iets in te vullen.") },
    { t: "Het echte verschil zit in de app die erbij hoort. " + teksten.app },
    { t: v(
        `Wat kost het? Normaal €599 eenmalig, en daarna €29,95 per maand. Allebei excl. btw. Geen kleine lettertjes. Omdat je deze brief van ons hebt gekregen, betaal je geen €599 maar €399. Die actie geldt alleen voor wie deze brief ontvangt, tot en met ${eindeTekst}.`,
        `Wat kost het? Normaal €599 eenmalig, en daarna €29,95 per maand. Allebei excl. btw. Geen kleine lettertjes. Omdat jullie deze brief van ons hebben gekregen, betalen jullie geen €599 maar €399. Die actie geldt alleen voor wie deze brief ontvangt, tot en met ${eindeTekst}.`) },
    { t: v(
        `Wat je nu doet: scan de QR-code of typ het adres in, en bekijk je website. Bevalt hij? Bel of app me op ${TEL}, dan regelen wij de rest. Vind je hem niks? Dan gooi je deze brief gewoon weg.`,
        `Wat jullie nu doen: scan de QR-code of typ het adres in, en bekijk jullie website. Bevalt hij? Bel of app me op ${TEL}, dan regelen wij de rest. Vinden jullie hem niks? Dan gooien jullie deze brief gewoon weg.`) },
  ];
  const ps = `P.S. De €399 geldt tot en met ${eindeTekst}. Daarna is het weer €599. Eén appje naar ${TEL} is genoeg.`;

  // Past alles op één pagina? Zo niet: lettergrootte stapsgewijs omlaag.
  const kolB = KOL_R - L;
  const ONDERGRENS = 92; // ruimte voor voetregels
  const HANDTEKENING = 56; // witruimte voor de handtekening
  let size = 10.5;
  let opmaak;
  for (; size >= 8.5; size -= 0.25) {
    const lead = size * 1.38;
    const kopRegels = wrap(kop, vet, size + 5, kolB);
    const blokken = alineas.map((a) => wrap(a.t, font, size, kolB));
    const psRegels = wrap(ps, italic, size, R - L);
    const hoogte =
      kopRegels.length * (size + 5) * 1.2 + 14 +
      blokken.reduce((s, r) => s + r.length * lead + lead * 0.6, 0) +
      lead * 2 + HANDTEKENING + lead * 2 + 10 +
      psRegels.length * lead;
    opmaak = { lead, kopRegels, blokken, psRegels };
    if (640 - hoogte >= ONDERGRENS) break;
  }

  y = 640;
  for (const r of opmaak.kopRegels) {
    tekst(r, L, y - (size + 5), { vet: true, size: size + 5 });
    y -= (size + 5) * 1.2;
  }
  y -= 14 + size;
  opmaak.blokken.forEach((regels, i) => {
    regels.forEach((r) => {
      tekst(r, L, y, { size });
      y -= opmaak.lead;
    });
    y -= opmaak.lead * 0.6;
  });

  // ── Groet + handgeschreven handtekening ───────────────────────────────────
  tekst("Met vriendelijke groet,", L, y, { size });
  y -= HANDTEKENING; // bewust leeg: hier zet de afzender zijn handtekening
  pagina.drawLine({ start: { x: L, y: y + 8 }, end: { x: L + 150, y: y + 8 }, thickness: 0.5, color: LIJN });
  y -= opmaak.lead * 0.4;
  tekst(naamAfzender, L, y, { size, vet: true });
  y -= opmaak.lead;
  tekst("StudioBaris", L, y, { size, kleur: GRIJS });
  y -= opmaak.lead + 10;

  for (const r of opmaak.psRegels) {
    tekst(r, L, y, { size, italic: true });
    y -= opmaak.lead;
  }

  // ── Voet ─────────────────────────────────────────────────────────────────
  pagina.drawLine({ start: { x: L, y: 62 }, end: { x: R, y: 62 }, thickness: 0.75, color: LIJN });
  midden(`Vragen of opmerkingen? Bel of app ons: ${BEDRIJF.telefoon} · ${BEDRIJF.web}`, L, R, 48, { size: 8, kleur: GRIJS });
  midden(`Liever geen post van ons? Laat het weten via ${BEDRIJF.telefoon} of ${BEDRIJF.email}, dan sturen we niets meer.`, L, R, 36, { size: 7.5, kleur: GRIJS });
  midden(`${BEDRIJF.naam} · KvK ${BEDRIJF.kvk}`, L, R, 24, { size: 7, kleur: GRIJS });

  return await pdf.save();
}
