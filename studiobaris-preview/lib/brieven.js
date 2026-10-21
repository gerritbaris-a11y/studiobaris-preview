// Brieven voor het offline marketingmodel (Adressenlijst → knop "Brief").
// Server-only.
//
// Per online preview één printklare A4-brief, geschreven vanuit "wij"
// (StudioBaris), ondertekend door degene die de brief maakt.
//
// Opbouw hoofdtekst (Boron-stijl: persoonlijk, korte zinnen, P.S.):
//   kop     "Een website voor X. Hij is al gemaakt."          (vast)
//   aanhef + persoonlijke opening                           (Claude)
//   eigen regel, optioneel                                  (met de hand)
//   de website staat klaar, scan de QR                      (vast)
//   APP-BLOK: kernzin + 3 stappen om de demo-app te proberen (vast)
//   vak-alinea: reviews, betrouwbaar tegenover beunhazen    (Claude)
//   wat nu: bel/app, wat wij regelen, of weggooien          (vast)
//   P.S.    prijsvariant: actie + deadline; anders: proefapp een maand
//
// Zijkolom: QR + adres voluit, (optioneel) brief-actie € 399 i.p.v. € 599,
// en daaronder lege lijntjes voor een handgeschreven persoonlijke boodschap.
// De actie loopt één maand vanaf de dag dat de brief de deur uit gaat
// (teksten.verzonden, in het bewerkvenster in te stellen; standaard vandaag).
// Voor de A/B-test kan de prijs per brief uit (teksten.prijs = false).
// Lukt de Claude-aanroep niet, dan valt elke alinea terug op een nette
// standaardtekst, zodat de knop altijd een brief oplevert.
import { PDFDocument, rgb } from "pdf-lib";
import QRCode from "qrcode";
import { BEDRIJF } from "./facturen";
import { jakartaFonts } from "./plus-jakarta-font";
import { bodoniFonts } from "./bodoni-moda-font";
import { callClaude } from "./anthropic";
import { AFZENDER_FOTOS, BRIEF_REVIEWS, BRIEF_ONDERTEKENAAR } from "./brief-instellingen";

const PREVIEW_BASIS = "https://preview.studiobaris.nl/";

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
// Zelfde dag een maand later (31 jan → 28/29 feb).
export function plusMaand(datum) {
  const j = datum.getUTCFullYear(), m = datum.getUTCMonth() + 1, d = datum.getUTCDate();
  const laatste = new Date(Date.UTC(j, m + 1, 0)).getUTCDate();
  return new Date(Date.UTC(j, m, Math.min(d, laatste)));
}
// "YYYY-MM-DD" → Date (UTC), of null als het geen geldige datum is.
export function leesDatum(s) {
  const m = String(s || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCMonth() === +m[2] - 1 ? d : null;
}
export function datumIso(d) {
  return d.toISOString().slice(0, 10);
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

const SYSTEEM = `Je schrijft twee alinea's voor een persoonlijke papieren brief van StudioBaris aan een Nederlandse vakman/vakvrouw. De brief wordt aan de deur afgegeven of in de bus gedaan. StudioBaris heeft al een complete voorbeeldwebsite voor dit bedrijf gemaakt (via een QR-code te bekijken). De rest van de brief (website staat klaar, app uitproberen, prijs, contact) staat er al; jij schrijft alleen de opening en de vak-alinea. Houd het kort: de brief moet in één keer te lezen zijn.

Wat StudioBaris levert: een website plus een APP waarmee de vakman zijn website zelf bijhoudt vanaf zijn telefoon. Klus af: foto's maken, kort inspreken of typen wat hij deed, StudioBaris schrijft de tekst en het project staat binnen enkele minuten op de site (nooit "direct" of "binnen een minuut"). Reviews: de VAKMAN stuurt zijn klant met één tik via WhatsApp een reviewverzoek (de klant vraagt daar niet zelf om). Goede reviews komen op de website, kritiek blijft privé bij de vakman.

Waarom dit ertoe doet (de invalshoek): vakmensen hebben werk genoeg. Het gaat er niet om meer werk te krijgen, maar om betrouwbaar over te komen bij wie hen opzoekt. De markt zit vol beunhazen; echte projecten en echte reviews van echte klanten laten zien wie wél vakwerk levert.

Stijl: persoonlijke brief van mens tot mens (Boron-letter-stijl). Korte zinnen, nuchter, warm, geen marketingtaal, geen superlatieven, geen uitroeptekens, geen emoji. Schrijf in de wij-vorm namens StudioBaris ("wij", "we"), nooit "ik". Nooit iets negatiefs over het bedrijf noemen. Beweer niets over hun huidige website of hoe zichtbaar ze online zijn: dat weten we niet. Gebruik ALLEEN feiten die in de aangeleverde gegevens staan; verzin geen jaartallen, scores, namen, plaatsen of diensten.

Aanspreekvorm: kies "je" of "jullie" en houd die in ALLE zinnen consequent aan (bij "jullie" ook "jullie website", "jullie telefoon", nooit "je" ertussen).

Lever uitsluitend JSON, zonder uitleg:
{
  "vorm": "je" of "jullie"   (je als er een contactpersoon bekend is of het duidelijk een eenpitter is, anders jullie),
  "aanhef": "Beste Jan," of "Beste team van <bedrijfsnaam>,"  (voornaam alleen als die echt in de gegevens staat),
  "opening": "1-2 zinnen: iets concreets en positiefs over dit bedrijf dat laat zien dat we echt gekeken hebben (vakgebied, werkgebied, waar ze goed in zijn, wat klanten zeggen). Geen oordeel over hun online aanwezigheid. Max 35 woorden.",
  "app": "2 zinnen, een op zichzelf staande alinea. Hoe de app werkt staat al in een blok erboven, en direct eronder staat een echte klantreview: herhaal of verklaar die dingen NIET. Zin 1: een kort, concreet beeld uit HUN vak (bv. de net opgeleverde tuin, boven op het dak, de afgemonteerde groepenkast) waarna de vakman zijn klant via WhatsApp om een review vraagt; goede reviews online, kritiek blijft privé. Zin 2: wie hen opzoekt ziet echt werk en echte reviews, en dat onderscheidt hen van de beunhazen. Max 35 woorden."
}`;

function standaardTeksten(bedrijf, vorm) {
  const je = vorm === "je";
  return {
    vorm,
    aanhef: je ? "Beste vakman," : `Beste team van ${bedrijf},`,
    opening: `We kwamen ${bedrijf} tegen en hebben goed gekeken naar wat ${je ? "je doet" : "jullie doen"}. Dat vakwerk verdient het om gezien te worden.`,
    app: je
      ? "Klus af? Dan vraag je je klant via WhatsApp om een review: goede reviews komen online, kritiek blijft tussen jullie. Zo ziet wie je opzoekt echt werk en echte reviews, en dat onderscheidt je van de beunhazen."
      : "Klus af? Dan vragen jullie de klant via WhatsApp om een review: goede reviews komen online, kritiek blijft bij jullie. Zo ziet wie jullie opzoekt echt werk en echte reviews, en dat onderscheidt jullie van de beunhazen.",
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

// Tekst met **vet** erin over regels verdelen. Elke regel is een lijst
// woorden { w, vet }. Twee sterretjes aan weerszijden maken een stuk vet.
function rijkeRegels(tekst, size, maxBreedte, basis, vetFont) {
  const woorden = [];
  // plak: woord hoort zonder spatie aan het vorige vast (bv. de punt na **vet**).
  let vorigeEindigdeMetSpatie = true;
  String(tekst).split(/(\*\*[^*]+\*\*)/).forEach((deel) => {
    if (!deel) return;
    const isVet = /^\*\*[^*]+\*\*$/.test(deel);
    const t = isVet ? deel.slice(2, -2) : deel;
    const begintMetSpatie = /^\s/.test(t);
    t.split(/ +/).filter(Boolean).forEach((w, i) => {
      const plak = i === 0 && woorden.length > 0 && !begintMetSpatie && !vorigeEindigdeMetSpatie;
      woorden.push({ w, vet: isVet, plak });
    });
    vorigeEindigdeMetSpatie = /\s$/.test(t);
  });
  const spatie = basis.widthOfTextAtSize(" ", size);
  const b = (wd) => (wd.vet ? vetFont : basis).widthOfTextAtSize(wd.w, size);
  const regels = [];
  let regel = [];
  let breed = 0;
  for (const wd of woorden) {
    const extra = (regel.length && !wd.plak ? spatie : 0) + b(wd);
    if (regel.length && breed + extra > maxBreedte && !wd.plak) {
      regels.push(regel);
      regel = [wd];
      breed = b(wd);
    } else {
      regel.push(wd);
      breed += extra;
    }
  }
  regels.push(regel);
  return regels;
}

// Teksten die in het bewerkvenster zijn aangepast: schoonmaken, lengte
// begrenzen (alles moet op één A4 passen) en de vorm controleren.
// prijs: true = brief met brief-actie (standaard), false = zonder prijs (A/B).
// verzonden: dag dat de brief de deur uit gaat ("YYYY-MM-DD"); de actie
// loopt tot en met dezelfde dag een maand later. Ontbreekt hij: vandaag.
const MAX = { aanhef: 80, opening: 400, eigen: 300, app: 450 };
// Versie van de brieftekst. Brieven opgeslagen vóór de nieuwe brief (okt 2026,
// ik-vorm en oude opbouw) hebben geen versie en tellen niet als gecontroleerd:
// bij openen schrijft Claude een nieuwe tekst, en de stapel slaat ze over.
export const BRIEF_VERSIE = 2;
export function isActueleBrief(teksten) {
  return !!teksten && Number(teksten.versie) === BRIEF_VERSIE;
}

export function normaliseerTeksten(t) {
  const x = t || {};
  const verzonden = leesDatum(x.verzonden);
  const uit = { versie: BRIEF_VERSIE, vorm: x.vorm === "je" ? "je" : "jullie", prijs: x.prijs !== false, kaartje: x.kaartje === true, verzonden: datumIso(verzonden || vandaagNL()) };
  for (const veld of Object.keys(MAX)) uit[veld] = schoon(x[veld] || "").slice(0, MAX[veld]);
  return uit;
}

// opties: { rij, content, teksten, afzender, dagtekening (Date), notitieVlak }
// teksten: { vorm, prijs, kaartje, verzonden, aanhef, opening, eigen (optioneel), app }
// kaartje: true = er zit een fotokaartje van de website bij (paperclip); de
//   website-alinea verwijst er dan naar. Het kaartje zelf wordt per stapel
//   geprint vanuit de Adressenlijst (lib/kaartje.js).
// dagtekening: valt terug op teksten.verzonden, dan op vandaag.
// notitieVlak: lege lijntjes in de rechterkolom voor een handgeschreven notitie.
export async function briefPdf({ rij, content, teksten, afzender, dagtekening, notitieVlak = true }) {
  const c = content || {};
  const b = c.bedrijf || {};
  const bedrijf = schoon(rij.company_name || b.naam || rij.slug);
  const adres = schoon(rij.b_adres || b.adres || "");
  const je = teksten.vorm === "je";
  const metPrijs = teksten.prijs !== false;
  const metKaartje = teksten.kaartje === true;
  // Review voor deze brief: vast per preview (som van de tekens van de slug).
  const reviews = (BRIEF_REVIEWS || []).filter((r) => r && r.tekst);
  const review = reviews.length
    ? reviews[[...String(rij.slug)].reduce((s, ch) => s + ch.charCodeAt(0), 0) % reviews.length]
    : null;
  const v = (jeTekst, jullieTekst) => (je ? jeTekst : jullieTekst);
  const datum = leesDatum(teksten.verzonden) || dagtekening || vandaagNL();
  const einde = plusMaand(datum);
  const eindeTekst = datumLang(einde, true);
  const url = PREVIEW_BASIS + rij.slug;
  // Ondertekenaar: vaste naam uit brief-instellingen, anders wie ingelogd is.
  const naamAfzender = schoon(BRIEF_ONDERTEKENAAR || afzender || "Gerrit & Levi");
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
  const KOL_R = 378; // rechterrand hoofdtekst
  const ZIJ_L = 396; // linkerrand zijkolom

  const tekst = (s, x, y, o = {}) =>
    pagina.drawText(schoon(s), { x, y, size: o.size || 10, font: o.font || (o.merk ? merk : o.italic ? italic : o.vet ? vet : font), color: o.kleur || INKT });
  const breedte = (s, o = {}) => (o.font || (o.merk ? merk : o.vet ? vet : o.italic ? italic : font)).widthOfTextAtSize(schoon(s), o.size || 10);
  const rechts = (s, xEind, y, o = {}) => tekst(s, xEind - breedte(s, o), y, o);
  const midden = (s, x0, x1, y, o = {}) => tekst(s, x0 + (x1 - x0 - breedte(s, o)) / 2, y, o);
  const vlak = (x, y, w, h, kleur) => pagina.drawRectangle({ x, y, width: w, height: h, color: kleur });
  // Eén regel uit rijkeRegels tekenen.
  const rijkeRegel = (regel, x, y, size, basis = font, kleur = INKT) => {
    const spatie = basis.widthOfTextAtSize(" ", size);
    regel.forEach((wd, i) => {
      if (i > 0 && wd.plak) x -= spatie;
      const f = wd.vet ? vet : basis;
      pagina.drawText(schoon(wd.w), { x, y, size, font: f, color: kleur });
      x += f.widthOfTextAtSize(schoon(wd.w), size) + spatie;
    });
  };

  // ── Gouden topbalk + kop (zelfde als offertes) ────────────────────────────
  vlak(0, 838.89, 595.28, 3, GOUD);
  let y = 800;
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
  rechts(`KvK ${BEDRIJF.kvk}`, R, y - 48, { size: 8.5, kleur: GRIJS });

  // ── Geadresseerde + dagtekening ───────────────────────────────────────────
  y = 727;
  tekst(bedrijf, L, y, { vet: true, size: 10.5 });
  const adresDelen = adres.split(",").map((s) => s.trim()).filter(Boolean);
  adresDelen.forEach((d, i) => tekst(d, L, y - 14 * (i + 1), { size: 10 }));
  // Dagtekening: plaats van StudioBaris + datum van vandaag.
  const plaatsSB = BEDRIJF.postcode.replace(/^\d{4}\s?[A-Z]{2}\s*/i, "");
  rechts(`${plaatsSB}, ${datumLang(datum)}`, R, y, { size: 9.5, kleur: GRIJS });

  // ── Zijkolom: QR-code, stappen en (optioneel) actieblok ───────────────────
  // Eerst droog uitrekenen hoe hoog de kolom wordt, dan pas tekenen: de
  // achtergrond moet vóór de inhoud getekend worden.
  const zijTop = 658;
  const zijB = R - ZIJ_L;
  const zijTekstB = zijB - 24;
  const zx = ZIJ_L + 12;
  const qr = QRCode.create(url, { errorCorrectionLevel: "M" });
  const n = qr.modules.size;
  const qrMaat = 104; // ruim scanbaar, laat ruimte voor review en notitielijntjes
  const qrX = zx + (zijTekstB - qrMaat) / 2;
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
      vlak(qrX, qrY, qrMaat, qrMaat, WIT);
      for (let r = 0; r < n; r++) {
        for (let k = 0; k < n; k++) {
          if (qr.modules.get(r, k)) vlak(qrX + (k + 1) * cel, qrY + qrMaat - (r + 2) * cel, cel + 0.05, cel + 0.05, INKT);
        }
      }
    }
    // Onder de QR: het adres voluit, zodat niemand hoeft te scannen. Mensen
    // zijn (terecht) voorzichtig met QR-codes op post; een leesbaar adres op
    // ons eigen domein, plus "geen inlog of betaalgegevens", neemt dat weg.
    uy = qrY - 13;
    for (const regel of wrap("Liever niet scannen? Typ dan:", font, 7.5, zijTekstB)) {
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
    // "Gratis, zonder inloggen" staat vet in de hoofdtekst; hier niet herhaald.

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
    // Ruimte voor de onderbalk (alleen in de prijsvariant)
    return metPrijs ? zijTop - (uy - 8 - BALK_H) : zijTop - (uy - 6);
  }

  const ZIJ_H = zijkolom(false);
  vlak(ZIJ_L, zijTop - ZIJ_H, zijB, ZIJ_H, VLAK);
  vlak(ZIJ_L, zijTop - ZIJ_H, zijB, 3, GOUD);
  zijkolom(true);
  // Deadlinebalk onderaan het blok (alleen in de prijsvariant).
  if (metPrijs) {
    const balkY = zijTop - ZIJ_H + 3;
    vlak(ZIJ_L, balkY, zijB, BALK_H, INKT);
    midden(`Reageer t/m ${datumLang(einde)}`, ZIJ_L, R, balkY + 11, { size: 8.5, vet: true, kleur: WIT });
  }

  // ── Notitievlak: lege lijnen voor een handgeschreven persoonlijke noot ────
  // Bewust zonder kop of label, zodat het als een gewone marge oogt als je er
  // niets op schrijft. Loopt van onder de zijkolom tot net boven de voet.
  if (notitieVlak) {
    for (let ly = zijTop - ZIJ_H - 28; ly >= 72; ly -= 22) {
      pagina.drawLine({ start: { x: ZIJ_L, y: ly }, end: { x: R, y: ly }, thickness: 0.5, color: LIJN });
    }
  }

  // ── Hoofdtekst ────────────────────────────────────────────────────────────
  // Kop: bedrijfsnaam-zin, en "Hij is al gemaakt." altijd op een eigen regel.
  const kop = `Een website voor ${bedrijf}.\nHij is al gemaakt.`;
  // Blokken: gewone alinea's ({ t }) en het app-blok ({ app: true }).
  const blokken = [
    { t: teksten.aanhef },
    { t: teksten.opening },
    // Eigen regel uit het bewerkvenster (bv. "We kwamen vandaag even langs").
    ...(teksten.eigen && teksten.eigen.trim() ? [{ t: teksten.eigen.trim() }] : []),
    { t: metKaartje
        ? v(
          "Je bent vakman, geen websitebouwer. Daarom hebben wij je website alvast gemaakt. Op het kaartje bij deze brief zie je hoe hij eruitziet op je telefoon. Scan de QR-code hiernaast en je bekijkt hem echt. **Gratis, zonder inloggen.**",
          "Jullie zijn vakmensen, geen websitebouwers. Daarom hebben wij jullie website alvast gemaakt. Op het kaartje bij deze brief zien jullie hoe hij eruitziet op de telefoon. Scan de QR-code hiernaast en jullie bekijken hem echt. **Gratis, zonder inloggen.**")
        : v(
          "Je bent vakman, geen websitebouwer. Daarom hebben wij je website alvast gemaakt. Scan de QR-code hiernaast en je ziet hem meteen. **Gratis, zonder inloggen.**",
          "Jullie zijn vakmensen, geen websitebouwers. Daarom hebben wij jullie website alvast gemaakt. Scan de QR-code hiernaast en jullie zien hem meteen. **Gratis, zonder inloggen.**") },
    { app: true },
    { t: teksten.app },
    ...(review ? [{ review: true }] : []),
    { t: v(
        `Bevalt het? Bel of app ons op **${TEL}**. Dan kun je volgende week al beginnen. Vind je het niks? Dan gooi je deze brief gewoon weg.`,
        `Bevalt het? Bel of app ons op **${TEL}**. Dan kunnen jullie volgende week al beginnen. Vinden jullie het niks? Dan gooien jullie deze brief gewoon weg.`) },
  ];
  // App-blok: titel, kernzin en drie stappen om de eigen demo-app te proberen.
  const APP = {
    titel: v("Probeer nu je eigen app", "Probeer nu jullie eigen app"),
    kern: v("Je zet je projecten online vanaf je telefoon. Wij doen de rest.", "Jullie zetten jullie projecten online vanaf de telefoon. Wij doen de rest."),
    stappen: [
      v("Tik onderaan je website op 'Open je app'. Inloggen hoeft niet.", "Tik onderaan jullie website op 'Open je app'. Inloggen hoeft niet."),
      v("Maak een foto van een klus en typ in een paar woorden wat je deed.", "Maak een foto van een klus en typ in een paar woorden wat er gedaan is."),
      v("Binnen enkele minuten staat het als project op je website.", "Binnen enkele minuten staat het als project op jullie website."),
    ],
    slot: v("Drie projecten mag je zelf proberen.", "Drie projecten mogen jullie zelf proberen."),
  };
  const APP_PAD = 11; // binnenmarge van het app-blok
  const ps = metPrijs
    ? v(
        `P.S. Omdat je deze brief van ons kreeg, betaal je € 399 in plaats van € 599 eenmalig. Dat geldt **tot en met ${eindeTekst}**.`,
        `P.S. Omdat jullie deze brief van ons kregen, betalen jullie € 399 in plaats van € 599 eenmalig. Dat geldt **tot en met ${eindeTekst}**.`)
    : v(
        "P.S. Je proefapp blijft **een maand actief** vanaf de eerste keer dat je hem opent.",
        "P.S. Jullie proefapp blijft **een maand actief** vanaf de eerste keer dat jullie hem openen.");

  // Opmaak van de hoofdtekst; de lettergrootte wordt verderop gemeten.
  const kolB = KOL_R - L;
  const appB = kolB - 2 * APP_PAD - 4; // tekstbreedte in het app-blok (4 = gouden rand)
  const HANDTEKENING = 42; // witruimte voor de handtekening
  // Portretfoto van de afzender: sleutel = voornaam in kleine letters.
  const FOTO = 36;
  const fotoSleutel = naamAfzender.split(/[\s&]+/)[0].toLowerCase();
  let fotoAfzender = null;
  if (AFZENDER_FOTOS[fotoSleutel]) {
    try { fotoAfzender = await pdf.embedPng(Buffer.from(AFZENDER_FOTOS[fotoSleutel], "base64")); } catch {}
  }
  function appOpmaak(size) {
    const lead = size * 1.34;
    const titel = wrap(APP.titel, vet, size + 2, appB);
    const kern = wrap(APP.kern, vet, size, appB);
    const stappen = APP.stappen.map((st) => wrap(st, font, size, appB - 14));
    const slot = wrap(APP.slot, italic, size - 0.5, appB);
    const hoogte = APP_PAD + titel.length * (size + 2) * 1.3 + 2 + kern.length * lead + 6 +
      stappen.reduce((h, r) => h + r.length * lead + 3, 0) + 2 + slot.length * lead + APP_PAD - 2;
    return { titel, kern, stappen, slot, hoogte };
  }
  // Review-blok: sterren, citaat (cursief) en naam, met een gouden streep links.
  const REV_IN = 12;
  const reviewRegels = (size) => wrap(`"${review.tekst}"`, italic, size - 0.5, kolB - REV_IN);
  const reviewWie = () => [review.naam, review.bedrijf].filter(Boolean).join(", ");
  // Hoofdtekst opmaken bij een gegeven lettergrootte. Met teken = false wordt
  // alleen gemeten (niets getekend); de functie geeft de basislijn van de
  // laatste regel (P.S.) terug. Zo meten we exact of alles op de pagina past.
  const LAAGSTE_REGEL = 62; // laatste regel blijft boven de voetlijn (44)
  function hoofdtekst(size, teken) {
    const T = teken ? tekst : () => {};
    const V = teken ? vlak : () => {};
    const RR = teken ? rijkeRegel : () => {};
    const lead = size * 1.34;
    const kopRegels = wrap(kop, vet, size + 5, kolB);
    const app = appOpmaak(size);
    let y = 658;
    for (const r of kopRegels) {
      T(r, L, y - (size + 5), { vet: true, size: size + 5 });
      y -= (size + 5) * 1.2;
    }
    y -= 14 + size;
    blokken.forEach((bl) => {
      if (bl.review) {
        const regels = reviewRegels(size);
        const hoogte = 12 + regels.length * lead + lead;
        const LUCHT = 8; // extra witruimte boven en onder de review
        y -= LUCHT;
        const top = y + size;
        V(L, top - hoogte + 2, 2, hoogte - 2, GOUD);
        const aantal = Math.max(0, Math.min(5, Number(review.sterren) || 0));
        const ster = (cx, cy, r) => {
          const pts = [];
          for (let k = 0; k < 10; k++) {
            const hoek = -Math.PI / 2 + (k * Math.PI) / 5;
            const rr = k % 2 === 0 ? r : r * 0.45;
            pts.push(`${(cx + rr * Math.cos(hoek)).toFixed(2)} ${(cy + rr * Math.sin(hoek)).toFixed(2)}`);
          }
          return "M " + pts.join(" L ") + " Z";
        };
        // Sterren als vectortekening (het lettertype kent geen sterteken).
        if (teken) for (let k = 0; k < aantal; k++) pagina.drawSvgPath(ster(4.5 + k * 11, 4.5, 4.5), { x: L + REV_IN, y: top, color: GOUD });
        let ry = top - 12 - size + 1;
        for (const r of regels) { T(r, L + REV_IN, ry, { italic: true, size: size - 0.5 }); ry -= lead; }
        T(`- ${reviewWie()}`, L + REV_IN, ry, { size: size - 1.5, kleur: GRIJS });
        y = ry - lead * 1.6 - LUCHT;
        return;
      }
      if (bl.app) {
        // Lichte achtergrond met een gouden rand links, net als de zijkolom.
        const top = y + size + 2;
        V(L, top - app.hoogte, kolB, app.hoogte, VLAK);
        V(L, top - app.hoogte, 3, app.hoogte, GOUD);
        const ax = L + 4 + APP_PAD;
        let ay = top - APP_PAD - (size + 2);
        for (const r of app.titel) { T(r, ax, ay, { vet: true, size: size + 2 }); ay -= (size + 2) * 1.3; }
        ay -= 2;
        for (const r of app.kern) { T(r, ax, ay, { vet: true, size }); ay -= lead; }
        ay -= 6;
        app.stappen.forEach((regels, k) => {
          T(`${k + 1}.`, ax, ay, { vet: true, size, kleur: GOUD });
          for (const r of regels) { T(r, ax + 14, ay, { size }); ay -= lead; }
          ay -= 3;
        });
        ay -= 2;
        for (const r of app.slot) { T(r, ax, ay, { italic: true, size: size - 0.5, kleur: GRIJS }); ay -= lead; }
        y = top - app.hoogte - lead * 0.8 - size;
        return;
      }
      for (const r of rijkeRegels(bl.t, size, kolB, font, vet)) {
        RR(r, L, y, size);
        y -= lead;
      }
      y -= lead * 0.55;
    });

    // ── Groet + handgeschreven handtekening ─────────────────────────────────
    T("Met vriendelijke groet,", L, y, { size });
    y -= HANDTEKENING; // bewust leeg: hier zet de afzender zijn handtekening
    if (teken) pagina.drawLine({ start: { x: L, y: y + 8 }, end: { x: L + 150, y: y + 8 }, thickness: 0.5, color: LIJN });
    y -= lead * 0.4;
    // Kleine ronde portretfoto van de afzender (als die is ingesteld), met
    // naam en "StudioBaris" ernaast.
    let nx = L;
    if (fotoAfzender) {
      const top = y + size + 2;
      if (teken) pagina.drawImage(fotoAfzender, { x: L, y: top - FOTO, width: FOTO, height: FOTO });
      nx = L + FOTO + 9;
      y = top - FOTO / 2 + 1;
    }
    T(naamAfzender, nx, y, { size, vet: true });
    y -= lead;
    T("StudioBaris", nx, y, { size, kleur: GRIJS });
    y -= lead + 10 + (fotoAfzender ? FOTO / 2 - lead : 0);

    let laatste = y;
    for (const r of rijkeRegels(ps, size, kolB, italic, vet)) {
      RR(r, L, y, size, italic);
      laatste = y;
      y -= lead;
    }
    return laatste;
  }

  // Grootste lettergrootte (10,5 → 8) waarbij alles op de pagina past.
  let size = 10.5;
  while (size > 8 && hoofdtekst(size, false) < LAAGSTE_REGEL) size -= 0.25;
  hoofdtekst(size, true);

  // ── Voet ─────────────────────────────────────────────────────────────────
  // Eén regel voor vragen én afmelden: bij direct marketing aan personen
  // (zzp'ers) moet bezwaar maken bij het eerste contact vermeld staan (AVG art. 21).
  // KvK staat rechtsboven bij het adres.
  pagina.drawLine({ start: { x: L, y: 44 }, end: { x: R, y: 44 }, thickness: 0.75, color: LIJN });
  midden(`Vragen, of liever geen post meer? Bel of app ${BEDRIJF.telefoon} of mail ${BEDRIJF.email}`, L, R, 30, { size: 7.5, kleur: GRIJS });

  return await pdf.save();
}
