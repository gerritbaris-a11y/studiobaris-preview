// Brieven voor het offline marketingmodel (Adressenlijst → knop "Brief").
// Server-only.
//
// Per online preview één printklare A4-brief, geschreven vanuit "wij"
// (StudioBaris), ondertekend door degene die de brief maakt.
//
// Opbouw hoofdtekst (Boron-stijl: persoonlijk, korte zinnen, P.S.):
//   1  kop "Een website voor X. Hij is al gemaakt."            (vast)
//   2  aanhef + persoonlijke opening                         (Claude)
//   3  eigen regel, optioneel                                (met de hand)
//   4  de website staat klaar, gratis kijken                 (vast)
//   5  probeer de app zelf (demo-app, 3 proefprojecten)      (vast)
//   6  beeld uit hun vak: projecten + reviews, betrouwbaar
//      tegenover beunhazen                                    (Claude)
//   7  kernzin "Je zet je projecten online vanaf je telefoon.
//      Wij doen de rest." + wat wij regelen                   (vast)
//   8  wat nu: kijken, proberen, bel/app, of weggooien        (vast)
//   P.S. prijsvariant: actie + deadline; zonder prijs: proefapp een maand
//
// De prijs staat alleen in de zijkolom (brief-actie € 399 i.p.v. € 599, 3
// weken na de dagtekening). Voor de A/B-test kan de prijs per brief uit
// (teksten.prijs = false): dan vervalt het actieblok en wordt de P.S. anders.
// Lukt de Claude-aanroep niet, dan valt elke alinea terug op een nette
// standaardtekst, zodat de knop altijd een brief oplevert.
import { PDFDocument, rgb } from "pdf-lib";
import QRCode from "qrcode";
import { BEDRIJF } from "./facturen";
import { jakartaFonts } from "./plus-jakarta-font";
import { bodoniFonts } from "./bodoni-moda-font";
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
    .replace(/[   ]/g, " ")
    .replace(/[^\x09\x0A\x0D\x20-\x7E -ÿ€]/g, "")
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

const SYSTEEM = `Je schrijft twee alinea's voor een persoonlijke papieren brief van StudioBaris aan een Nederlandse vakman/vakvrouw. De brief wordt aan de deur afgegeven of in de bus gedaan. StudioBaris heeft al een complete voorbeeldwebsite voor dit bedrijf gemaakt (via een QR-code te bekijken). De rest van de brief (website staat klaar, app uitproberen, prijs, contact) staat er al; jij schrijft alleen de opening en de vak-alinea.

Wat StudioBaris levert: een website plus een APP waarmee de vakman zijn website zelf bijhoudt vanaf zijn telefoon. Klus af: foto's maken, kort inspreken of typen wat hij deed, StudioBaris schrijft de tekst en het project staat binnen enkele minuten op de site (nooit "direct" of "binnen een minuut"). Reviews: de VAKMAN stuurt zijn klant met één tik via WhatsApp een reviewverzoek (de klant vraagt daar niet zelf om). Goede reviews komen op de website, kritiek blijft privé bij de vakman.

Waarom dit ertoe doet (de invalshoek): vakmensen hebben werk genoeg. Het gaat er niet om meer werk te krijgen, maar om betrouwbaar over te komen bij wie hen opzoekt. De markt zit vol beunhazen; echte projecten en echte reviews van echte klanten laten zien wie wél vakwerk levert.

Stijl: persoonlijke brief van mens tot mens (Boron-letter-stijl). Korte zinnen, nuchter, warm, geen marketingtaal, geen superlatieven, geen uitroeptekens, geen emoji. Schrijf in de wij-vorm namens StudioBaris ("wij", "we"), nooit "ik". Nooit iets negatiefs over het bedrijf noemen. Beweer niets over hun huidige website of hoe zichtbaar ze online zijn: dat weten we niet. Gebruik ALLEEN feiten die in de aangeleverde gegevens staan; verzin geen jaartallen, scores, namen, plaatsen of diensten.

Aanspreekvorm: kies "je" of "jullie" en houd die in ALLE zinnen consequent aan (bij "jullie" ook "jullie website", "jullie telefoon", nooit "je" ertussen).

Lever uitsluitend JSON, zonder uitleg:
{
  "vorm": "je" of "jullie"   (je als er een contactpersoon bekend is of het duidelijk een eenpitter is, anders jullie),
  "aanhef": "Beste Jan," of "Beste team van <bedrijfsnaam>,"  (voornaam alleen als die echt in de gegevens staat),
  "opening": "2 zinnen: iets concreets en positiefs over dit bedrijf dat laat zien dat we echt gekeken hebben (vakgebied, werkgebied, waar ze goed in zijn, wat klanten zeggen). Geen oordeel over hun online aanwezigheid. Max 45 woorden.",
  "app": "3-4 zinnen, een op zichzelf staande alinea. Hoe de app werkt (foto, inspreken, binnen enkele minuten online) staat al in de alinea ervoor: herhaal dat NIET. Begin met een concreet beeld uit HUN vak (bv. de net opgeleverde tuin, boven op het dak, de afgemonteerde groepenkast) en hoe dat werk straks als project op hun site te zien is; dan de reviewtool in hetzelfde beeld, met de vakman die het verzoek via WhatsApp stuurt en 'goede reviews online, kritiek blijft privé' in eigen woorden; eindig met wat het oplevert: wie hen opzoekt ziet echt werk en echte reviews, en dat onderscheidt hen van de beunhazen. Max 65 woorden."
}`;

function standaardTeksten(bedrijf, vorm) {
  const je = vorm === "je";
  return {
    vorm,
    aanhef: je ? "Beste vakman," : `Beste team van ${bedrijf},`,
    opening: `We kwamen ${bedrijf} tegen en hebben eens goed gekeken naar wat ${je ? "je" : "jullie"} doen. Goed vakwerk verdient een plek waar klanten het kunnen zien.`,
    app: je
      ? "Zo komt elke klus die je afrondt als project op je website te staan. Na afloop stuur je je klant met één tik via WhatsApp een reviewverzoek. Goede reviews komen online, kritiek blijft tussen jullie. Wie je opzoekt, ziet zo echt werk en echte reviews. Dat is precies wat je onderscheidt van de beunhazen."
      : "Zo komt elke klus die jullie afronden als project op jullie website te staan. Na afloop sturen jullie de klant met één tik via WhatsApp een reviewverzoek. Goede reviews komen online, kritiek blijft bij jullie. Wie jullie opzoekt, ziet zo echt werk en echte reviews. Dat is precies wat jullie onderscheidt van de beunhazen.",
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

// URL over regels verdelen: breekpunten na "/" en "-".
function urlRegels(u, font, size, maxBreedte) {
  const stukken = u.match(/[^/-]*[/-]|[^/-]+$/g) || [u];
  const regels = [];
  let regel = "";
  for (const st of stukken) {
    if (regel && font.widthOfTextAtSize(regel + st, size) > maxBreedte) {
      regels.push(regel);
      regel = st;
    } else regel += st;
  }
  if (regel) regels.push(regel);
  return regels;
}

// Teksten die in het bewerkvenster zijn aangepast: schoonmaken, lengte
// begrenzen (alles moet op één A4 passen) en de vorm controleren.
// prijs: true = brief met brief-actie (standaard), false = zonder prijs (A/B).
const MAX = { aanhef: 80, opening: 500, eigen: 400, app: 700 };
export function normaliseerTeksten(t) {
  const x = t || {};
  const uit = { vorm: x.vorm === "je" ? "je" : "jullie", prijs: x.prijs !== false };
  for (const veld of Object.keys(MAX)) uit[veld] = schoon(x[veld] || "").slice(0, MAX[veld]);
  return uit;
}

// opties: { rij, content, teksten, afzender, dagtekening (Date), notitieVlak }
// teksten: { vorm, prijs, aanhef, opening, eigen (optioneel), app }
// notitieVlak: lege lijntjes in de rechterkolom voor een handgeschreven notitie.
export async function briefPdf({ rij, content, teksten, afzender, dagtekening, notitieVlak = true }) {
  const c = content || {};
  const b = c.bedrijf || {};
  const bedrijf = schoon(rij.company_name || b.naam || rij.slug);
  const adres = schoon(rij.b_adres || b.adres || "");
  const je = teksten.vorm === "je";
  const metPrijs = teksten.prijs !== false;
  const v = (jeTekst, jullieTekst) => (je ? jeTekst : jullieTekst);
  const datum = dagtekening || vandaagNL();
  const einde = plusDagen(datum, ACTIE_DAGEN);
  const eindeTekst = datumLang(einde, true);
  const url = PREVIEW_BASIS + rij.slug;
  const naamAfzender = schoon(afzender || "Gerrit & Levi");
  // Telefoonnummer niet over twee regels laten breken (harde spaties).
  const TEL = BEDRIJF.telefoon.replace(/ /g, " ");

  const pdf = await PDFDocument.create();
  pdf.setTitle(`Brief ${bedrijf}`);
  pdf.setAuthor("StudioBaris");
  const pagina = pdf.addPage([595.28, 841.89]); // A4
  // Plus Jakarta Sans, zelfde als de facturen/offertes (zie lib/plus-jakarta-font.js).
  const { font, vet, italic, merk } = await jakartaFonts(pdf);
  const { regular: bodoniReg, bold: bodoniBold } = await bodoniFonts(pdf);

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
    pagina.drawText(schoon(s), { x, y, size: o.size || 10, font: o.font || (o.merk ? merk : o.italic ? italic : o.vet ? vet : font), color: o.kleur || INKT });
  const breedte = (s, o = {}) => (o.font || (o.merk ? merk : o.vet ? vet : o.italic ? italic : font)).widthOfTextAtSize(schoon(s), o.size || 10);
  const rechts = (s, xEind, y, o = {}) => tekst(s, xEind - breedte(s, o), y, o);
  const midden = (s, x0, x1, y, o = {}) => tekst(s, x0 + (x1 - x0 - breedte(s, o)) / 2, y, o);
  const vlak = (x, y, w, h, kleur) => pagina.drawRectangle({ x, y, width: w, height: h, color: kleur });

  // ── Gouden topbalk + kop (zelfde als offertes) ────────────────────────────
  vlak(0, 838.89, 595.28, 3, GOUD);
  let y = 785;
  vlak(L, y - 28, 32, 32, INKT);
  pagina.drawEllipse({ x: L + 27, y: y - 1, xScale: 3.4, yScale: 3.4, color: GOUD });
  // "B" en "StudioBaris" in Bodoni Moda — zie toelichting in facturen.js.
  tekst("B", L + 10.5, y - 17.5, { size: 17, font: bodoniBold, kleur: WIT });
  tekst("Studio", L + 42, y - 10, { size: 17, font: bodoniReg });
  const studioBreedte = breedte("Studio", { size: 17, font: bodoniReg });
  tekst("Baris", L + 42 + studioBreedte, y - 10, { size: 17, font: bodoniBold });
  const naamBreedte = studioBreedte + breedte("Baris", { size: 17, font: bodoniBold });
  pagina.drawLine({ start: { x: L + 42, y: y - 14 }, end: { x: L + 42 + naamBreedte, y: y - 14 }, thickness: 1.3, color: GOUD });
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

  // ── Zijkolom: QR-code, stappen en (optioneel) actieblok ───────────────────
  // Eerst droog uitrekenen hoe hoog de kolom wordt, dan pas tekenen: de
  // achtergrond moet vóór de inhoud getekend worden.
  const zijTop = 640;
  const zijB = R - ZIJ_L;
  const zijTekstB = zijB - 24;
  const zx = ZIJ_L + 12;
  const qr = QRCode.create(url, { errorCorrectionLevel: "M" });
  const n = qr.modules.size;
  const qrMaat = zijTekstB;
  const BALK_H = 30;

  function zijkolom(teken) {
    const t = teken ? tekst : () => {};
    const lijn = (yy) => teken && pagina.drawLine({ start: { x: zx, y: yy }, end: { x: R - 12, y: yy }, thickness: 0.75, color: LIJN });
    let uy = zijTop - 20;
    for (const regel of wrap(v("BEKIJK HOE JOUW WEBSITE ERUITZIET", "BEKIJK HOE JULLIE WEBSITE ERUITZIET"), vet, 7.5, zijTekstB)) {
      t(regel, zx, uy, { size: 7.5, vet: true, kleur: GRIJS });
      uy -= 10;
    }
    // QR-code
    const qrY = uy - 2 - qrMaat;
    if (teken) {
      const cel = qrMaat / (n + 2); // 1 module stille zone rondom
      vlak(zx, qrY, qrMaat, qrMaat, WIT);
      for (let r = 0; r < n; r++) {
        for (let k = 0; k < n; k++) {
          if (qr.modules.get(r, k)) vlak(zx + (k + 1) * cel, qrY + qrMaat - (r + 2) * cel, cel + 0.05, cel + 0.05, INKT);
        }
      }
    }
    // Onder de QR: het adres voluit, zodat niemand hoeft te scannen. Mensen
    // zijn (terecht) voorzichtig met QR-codes op post; een leesbaar adres op
    // ons eigen domein, plus "geen inlog of betaalgegevens", neemt dat weg.
    uy = qrY - 13;
    for (const regel of wrap(v("Liever niet scannen? Typ dan dit adres in je browser:", "Liever niet scannen? Typ dan dit adres in jullie browser:"), font, 7.5, zijTekstB)) {
      t(regel, zx, uy, { size: 7.5, kleur: GRIJS });
      uy -= 10;
    }
    uy -= 3;
    // Een URL heeft geen spaties: afbreken na "/" of "-", zodat ook een
    // lange slug binnen de kolom blijft.
    for (const regel of urlRegels(url.replace("https://", ""), vet, 9, zijTekstB)) {
      t(regel, zx, uy, { size: 9, vet: true });
      uy -= 12;
    }
    uy -= 2;
    for (const regel of wrap("Gratis kijken: geen inlog, geen betaalgegevens.", italic, 7.5, zijTekstB)) {
      t(regel, zx, uy, { size: 7.5, italic: true, kleur: GRIJS });
      uy -= 10;
    }

    // Drie stappen
    uy -= 4;
    lijn(uy + 4);
    uy -= 10;
    t("ZO WERKT HET", zx, uy, { size: 7.5, vet: true, kleur: GRIJS });
    uy -= 13;
    const stappen = [
      v("Bekijk je website.", "Bekijk jullie website."),
      v("Tik onderaan op 'Open je app' en zet er zelf een project op.", "Tik onderaan op 'Open je app' en zet er zelf een project op."),
      v(`Bevalt het? Bel of app ons: ${TEL}`, `Bevalt het? Bel of app ons: ${TEL}`),
    ];
    stappen.forEach((s, i) => {
      t(`${i + 1}.`, zx, uy, { size: 8.5, vet: true });
      for (const regel of wrap(s, font, 8.5, zijTekstB - 12)) {
        t(regel, zx + 12, uy, { size: 8.5 });
        uy -= 11;
      }
      uy -= 3;
    });

    // Actieblok (alleen in de prijsvariant)
    if (metPrijs) {
      uy -= 2;
      lijn(uy + 4);
      uy -= 10;
      t("BRIEF-ACTIE", zx, uy, { size: 7.5, vet: true, kleur: GRIJS });
      uy -= 14;
      t("Website + app, eenmalig", zx, uy, { size: 9 });
      uy -= 24;
      const oud = "€ 599";
      t(oud, zx, uy, { size: 14, kleur: GRIJS });
      const oudB = breedte(oud, { size: 14 });
      if (teken) pagina.drawLine({ start: { x: zx - 1, y: uy + 5 }, end: { x: zx + 1 + oudB, y: uy + 5 }, thickness: 1.2, color: GRIJS });
      t("€ 399", zx + 10 + oudB, uy - 1, { size: 21, vet: true });
      uy -= 15;
      t("daarna € 29,95 per maand", zx, uy, { size: 8.5 });
      uy -= 11;
      t("alle bedragen excl. btw", zx, uy, { size: 8, italic: true, kleur: GRIJS });
      uy -= 11;
      for (const regel of wrap("Eerste jaar vast, daarna per maand opzegbaar.", italic, 8, zijTekstB)) {
        t(regel, zx, uy, { size: 8, italic: true, kleur: GRIJS });
        uy -= 10;
      }
    }
    // Ruimte voor de onderbalk
    return zijTop - (uy - 8 - BALK_H);
  }

  const ZIJ_H = zijkolom(false);
  vlak(ZIJ_L, zijTop - ZIJ_H, zijB, ZIJ_H, VLAK);
  vlak(ZIJ_L, zijTop - ZIJ_H, zijB, 3, GOUD);
  zijkolom(true);
  // Balk onderaan het blok: deadline (prijsvariant) of telefoonnummer.
  const balkY = zijTop - ZIJ_H + 3;
  vlak(ZIJ_L, balkY, zijB, BALK_H, INKT);
  midden(metPrijs ? `Reageer t/m ${datumLang(einde)}` : `Bel of app: ${BEDRIJF.telefoon}`, ZIJ_L, R, balkY + 11, { size: 8.5, vet: true, kleur: WIT });

  // ── Notitievlak: lege lijnen voor een handgeschreven persoonlijke noot ────
  // Bewust zonder kop of label, zodat het als een gewone marge oogt als je er
  // niets op schrijft. Loopt van onder de zijkolom tot net boven de voet.
  if (notitieVlak) {
    for (let ly = zijTop - ZIJ_H - 26; ly >= 96; ly -= 22) {
      pagina.drawLine({ start: { x: ZIJ_L, y: ly }, end: { x: R, y: ly }, thickness: 0.5, color: LIJN });
    }
  }

  // ── Hoofdtekst ────────────────────────────────────────────────────────────
  // Kop: bedrijfsnaam-zin, en "Hij is al gemaakt." altijd op een eigen regel.
  const kop = `Een website voor ${bedrijf}.\nHij is al gemaakt.`;
  const alineas = [
    { t: teksten.aanhef },
    { t: teksten.opening },
    // Eigen regel uit het bewerkvenster (bv. "We kwamen vandaag even langs").
    ...(teksten.eigen && teksten.eigen.trim() ? [{ t: teksten.eigen.trim() }] : []),
    { t: v(
        "Je bent vakman, geen websitebouwer. Daarom hebben wij het werk alvast gedaan. Er staat een complete website voor je klaar, met je naam en je diensten erop. Scan de QR-code hiernaast of typ het adres eronder in je browser. Kijken kost niets en je hoeft nergens in te loggen.",
        "Jullie zijn vakmensen, geen websitebouwers. Daarom hebben wij het werk alvast gedaan. Er staat een complete website voor jullie klaar, met jullie naam en diensten erop. Scan de QR-code hiernaast of typ het adres eronder in jullie browser. Kijken kost niets en jullie hoeven nergens in te loggen.") },
    { t: v(
        "Bij die website hoort een app, en die kun je nu al uitproberen. Tik onderaan de website op 'Open je app'. Maak een foto van een klus, typ in een paar woorden wat je gedaan hebt, en binnen enkele minuten staat het als project op je eigen website. Drie projecten mag je zelf plaatsen.",
        "Bij die website hoort een app, en die kunnen jullie nu al uitproberen. Tik onderaan de website op 'Open je app'. Maak een foto van een klus, typ in een paar woorden wat er gedaan is, en binnen enkele minuten staat het als project op jullie eigen website. Drie projecten mogen jullie zelf plaatsen.") },
    { t: teksten.app },
    { t: v(
        "Kort gezegd: je zet je projecten online vanaf je telefoon. Wij doen de rest. Domeinnaam, hosting, e-mail, updates en onderhoud regelen wij.",
        "Kort gezegd: jullie zetten jullie projecten online vanaf de telefoon. Wij doen de rest. Domeinnaam, hosting, e-mail, updates en onderhoud regelen wij.") },
    { t: v(
        `Wat je nu doet: bekijk je website en probeer de app. Bevalt het? Bel of app ons op ${TEL}, dan kun je volgende week al beginnen. Vind je het niks? Dan gooi je deze brief gewoon weg.`,
        `Wat jullie nu doen: bekijk jullie website en probeer de app. Bevalt het? Bel of app ons op ${TEL}, dan kunnen jullie volgende week al beginnen. Vinden jullie het niks? Dan gooien jullie deze brief gewoon weg.`) },
  ];
  const ps = metPrijs
    ? v(
        `P.S. Omdat je deze brief van ons hebt gekregen, betaal je € 399 in plaats van € 599 eenmalig. Dat geldt tot en met ${eindeTekst}. Eén appje naar ${TEL} is genoeg.`,
        `P.S. Omdat jullie deze brief van ons hebben gekregen, betalen jullie € 399 in plaats van € 599 eenmalig. Dat geldt tot en met ${eindeTekst}. Eén appje naar ${TEL} is genoeg.`)
    : v(
        `P.S. De proefapp blijft een maand actief vanaf het moment dat je hem voor het eerst opent. Eén appje naar ${TEL} is genoeg om te beginnen.`,
        `P.S. De proefapp blijft een maand actief vanaf het moment dat jullie hem voor het eerst openen. Eén appje naar ${TEL} is genoeg om te beginnen.`);

  // Past alles op één pagina? Zo niet: lettergrootte stapsgewijs omlaag.
  const kolB = KOL_R - L;
  const ONDERGRENS = 92; // ruimte voor voetregels
  const HANDTEKENING = 50; // witruimte voor de handtekening
  let size = 10.5;
  let opmaak;
  for (; size >= 8; size -= 0.25) {
    const lead = size * 1.38;
    const kopRegels = wrap(kop, vet, size + 5, kolB);
    const blokken = alineas.map((a) => wrap(a.t, font, size, kolB));
    const psRegels = wrap(ps, italic, size, notitieVlak ? kolB : R - L);
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
  opmaak.blokken.forEach((regels) => {
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
