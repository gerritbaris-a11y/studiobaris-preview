// Offertes: opmaken als PDF. Server-only.
//
// Zelfde visuele stijl als lib/facturen.js → factuurPdf() (logo-blokje,
// gouden accentkleur, omkaderd klantblok, donkere totaalbalk) — vandaar het
// hergebruik van BEDRIJF vanuit lib/facturen.js in plaats van een eigen kopie
// die kan gaan afwijken. Twee verschillen met een factuur:
//   1. Regels kennen een echt aantal (aantal × bedrag per stuk), niet alleen
//      één bedrag.
//   2. Regels kunnen "eenmalig" of "maandelijks" zijn. Als een offerte beide
//      soorten bevat, komen er twee aparte blokken (elk met eigen subtotaal/
//      btw/totaal) — bijvoorbeeld eenmalige bouw + maandelijkse hosting.
//      Bevat de offerte er maar één soort (bijv. alleen een plugin-afname,
//      volledig eenmalig), dan verschijnt er gewoon één blok, geen loze
//      kopjes.
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { BEDRIJF } from "./facturen";
import { datumNL } from "./mollie";

function euro(v) {
  const n = Number(v) || 0;
  return "€ " + n.toFixed(2).replace(".", ",");
}

export async function offertePdf(o) {
  const snap = o.snapshot || {};
  const klant = snap.klant || {};
  const alleRegels = Array.isArray(snap.regels) ? snap.regels : [];
  const eenmaligRegels = alleRegels.filter((r) => (r.soort || "eenmalig") !== "maandelijks");
  const maandRegels = alleRegels.filter((r) => r.soort === "maandelijks");
  const heeftBeide = eenmaligRegels.length > 0 && maandRegels.length > 0;

  const pdf = await PDFDocument.create();
  const pagina = pdf.addPage([595.28, 841.89]); // A4
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const vet = await pdf.embedFont(StandardFonts.HelveticaBold);
  const italic = await pdf.embedFont(StandardFonts.HelveticaOblique);

  const INKT = rgb(0.169, 0.153, 0.141);
  const GRIJS = rgb(0.42, 0.38, 0.33);
  const LIJN = rgb(0.88, 0.86, 0.82);
  const VLAK = rgb(0.972, 0.961, 0.943);
  const ZEBRA = rgb(0.986, 0.981, 0.972);
  const WIT = rgb(1, 1, 1);
  const GOUD = rgb(0.729, 0.549, 0.263);

  const L = 50;
  const R = 545;
  const BREEDTE = R - L;

  const tekst = (s, x, yy, opt = {}) =>
    pagina.drawText(String(s == null ? "" : s), {
      x, y: yy,
      size: opt.size || 9.5,
      font: opt.italic ? italic : opt.vet ? vet : font,
      color: opt.kleur || INKT,
    });
  const breedteVan = (s, opt = {}) =>
    (opt.vet ? vet : opt.italic ? italic : font).widthOfTextAtSize(String(s), opt.size || 9.5);
  const rechts = (s, xEind, yy, opt = {}) => tekst(s, xEind - breedteVan(s, opt), yy, opt);
  const midden = (s, x0, x1, yy, opt = {}) => tekst(s, x0 + (x1 - x0 - breedteVan(s, opt)) / 2, yy, opt);
  const lijn = (yy, x0 = L, x1 = R, kleur = LIJN, dikte = 0.75) =>
    pagina.drawLine({ start: { x: x0, y: yy }, end: { x: x1, y: yy }, thickness: dikte, color: kleur });
  const vlak = (x, yy, w, h, kleur) => pagina.drawRectangle({ x, y: yy, width: w, height: h, color: kleur });
  const totaalregel = (label, waarde, xLabelEind, xWaardeEind, yy, opt = {}) => {
    const waardeBreedte = breedteVan(waarde, { vet: true, size: opt.size });
    tekst(waarde, xWaardeEind - waardeBreedte, yy, { vet: true, size: opt.size, kleur: opt.kleur });
    rechts(label, Math.min(xLabelEind, xWaardeEind - waardeBreedte - 10), yy, {
      size: opt.size, kleur: opt.kleur,
    });
  };

  // ── Gouden topbalk ─────────────────────────────────────────────────────────
  vlak(0, 838.89, 595.28, 3, GOUD);

  let y = 780;

  // ── Kop: beeldmerk + wordmark links, StudioBaris-gegevens rechts ──────────
  vlak(L, y - 28, 32, 32, INKT);
  vlak(L, y - 28, 32, 4, GOUD);
  tekst("B", L + 10, y - 18, { size: 16, vet: true, kleur: WIT });
  tekst(BEDRIJF.naam, L + 42, y - 10, { size: 17, vet: true, kleur: INKT });
  pagina.drawLine({
    start: { x: L + 42, y: y - 14 },
    end: { x: L + 42 + breedteVan(BEDRIJF.naam, { vet: true, size: 17 }), y: y - 14 },
    thickness: 1.3, color: GOUD,
  });

  rechts(BEDRIJF.naam, R, y, { size: 9.5, vet: true });
  rechts(BEDRIJF.adres, R, y - 12);
  rechts(BEDRIJF.postcode, R, y - 24);
  rechts(BEDRIJF.telefoon, R, y - 36, { size: 8.5, kleur: GRIJS });

  y -= 62;

  // ── OFFERTE-titel + ondertitel links, kerngegevens rechts ─────────────────
  vlak(L, y - 22, 4, 24, GOUD);
  tekst("OFFERTE", L + 12, y, { size: 24, vet: true });
  tekst(BEDRIJF.ondertitel, L + 12, y - 16, { size: 9, italic: true, kleur: GRIJS });

  const gegevens = [
    ["Offertenummer:", o.nummer],
    ["Offertedatum:", datumNL(o.offertedatum)],
    ["Geldig tot:", datumNL(o.geldig_tot)],
  ];
  let gy = y;
  for (const [label, waarde] of gegevens) {
    rechts(label, R - 90, gy, { kleur: GRIJS });
    rechts(waarde, R, gy, { vet: true });
    gy -= 14;
  }
  y -= 14 * gegevens.length + 14;

  // ── Offerte aan: zelfde kaartblok als bij facturen ────────────────────────
  const adresdelen = String(klant.adres || "").split(",").map((s) => s.trim()).filter(Boolean);
  const klantregels = [klant.naam, ...adresdelen, klant.email].filter(Boolean);
  const regelhoogte = 15.5;
  const blokPad = 12;
  const blokhoogte = klantregels.length * regelhoogte + blokPad * 2 - 4;

  vlak(L, y - blokhoogte, BREEDTE, blokhoogte, VLAK);
  vlak(L, y - blokhoogte, 3, blokhoogte, GOUD);
  tekst("OFFERTE AAN", L + 16, y - 14, { size: 7.5, vet: true, kleur: GRIJS });
  let ky = y - 14 - 16;
  klantregels.forEach((r, i) => {
    tekst(r, L + 16, ky, { vet: i === 0, size: i === 0 ? 11 : 9.5 });
    ky -= regelhoogte;
  });
  y -= blokhoogte + 24;

  // ── Intro (optioneel) — een persoonlijke openingsregel bij het voorstel ───
  if (snap.intro) {
    const woorden = String(snap.intro).split(" ");
    let regel = "";
    for (const w of woorden) {
      const test = regel ? regel + " " + w : w;
      if (breedteVan(test, { size: 10, italic: true }) > BREEDTE && regel) {
        tekst(regel, L, y, { size: 10, italic: true, kleur: GRIJS });
        y -= 13; regel = w;
      } else regel = test;
    }
    if (regel) { tekst(regel, L, y, { size: 10, italic: true, kleur: GRIJS }); y -= 13; }
    y -= 12;
  }

  const xAantalM = 373, xPrijs = 461, xTotaalKol = R - 8;
  const breedteOmschrijving = xAantalM - 18 - L - 12;

  // Eén regelblok (kop + rijen + subtotalen), herbruikt voor het eenmalige
  // en/of het maandelijkse deel. `titel` is null als er maar één soort in
  // de offerte zit — dan is een los kopje boven de tabel overbodig.
  function regelblok(titel, regels, perMaand) {
    if (titel) {
      tekst(titel, L, y, { size: 11, vet: true });
      y -= 16;
    }

    const kopHoogte = 22;
    vlak(L, y - kopHoogte, BREEDTE, kopHoogte, INKT);
    tekst("Omschrijving", L + 10, y - 15, { size: 8.5, vet: true, kleur: WIT });
    midden("Aantal", xAantalM - 18, xAantalM + 18, y - 15, { size: 8.5, vet: true, kleur: WIT });
    rechts("Prijs per stuk", xPrijs, y - 15, { size: 8.5, vet: true, kleur: WIT });
    rechts("Totaal excl. btw", xTotaalKol, y - 15, { size: 8.5, vet: true, kleur: WIT });
    y -= kopHoogte;
    vlak(L, y - 1.5, BREEDTE, 1.5, GOUD);

    regels.forEach((r, idx) => {
      const woorden = String(r.omschrijving || "").split(" ");
      let regel = "", stukken = [];
      for (const w of woorden) {
        const test = regel ? regel + " " + w : w;
        if (breedteVan(test, { size: 9.5 }) > breedteOmschrijving && regel) { stukken.push(regel); regel = w; }
        else regel = test;
      }
      if (regel) stukken.push(regel);
      const rijhoogte = 18 + (stukken.length - 1) * 11;
      const aantal = Number(r.aantal) || 1;
      const totaalRegel = aantal * (Number(r.bedrag_per_stuk) || 0);

      if (idx % 2 === 1) vlak(L, y - rijhoogte, BREEDTE, rijhoogte, ZEBRA);
      tekst(stukken[0] || "", L + 10, y - 13);
      for (let i = 1; i < stukken.length; i++) tekst(stukken[i], L + 10, y - 13 - i * 11, { kleur: GRIJS });
      midden(String(aantal), xAantalM - 18, xAantalM + 18, y - 13);
      rechts(euro(r.bedrag_per_stuk), xPrijs, y - 13);
      rechts(euro(totaalRegel), xTotaalKol, y - 13);
      y -= rijhoogte;
      lijn(y, L, R);
    });

    y -= 10;
    const excl = regels.reduce((s, r) => s + (Number(r.aantal) || 1) * (Number(r.bedrag_per_stuk) || 0), 0);
    const btw = Math.round(excl * 0.21 * 100) / 100;
    const incl = Math.round((excl + btw) * 100) / 100;
    const subLabel = perMaand ? "per maand" : "";

    y -= 14;
    totaalregel(`Subtotaal excl. btw${subLabel ? " " + subLabel : ""}`, euro(excl), xPrijs, xTotaalKol, y, { kleur: GRIJS });
    y -= 14;
    totaalregel("Btw 21%", euro(btw), xPrijs, xTotaalKol, y, { kleur: GRIJS });
    y -= 10;

    const balkHoogte = 26;
    vlak(xPrijs - 90, y - balkHoogte + 6, R - (xPrijs - 90), balkHoogte, INKT);
    totaalregel(
      perMaand ? "Totaal incl. btw / maand" : "Totaal incl. btw",
      euro(incl),
      xPrijs, xTotaalKol, y - 8,
      { size: 12, kleur: WIT }
    );
    y -= balkHoogte + 22;
  }

  if (eenmaligRegels.length > 0) regelblok(heeftBeide ? "Eenmalig" : null, eenmaligRegels, false);
  if (maandRegels.length > 0) regelblok(heeftBeide ? "Maandelijks" : null, maandRegels, true);

  // ── Voorwaarden ────────────────────────────────────────────────────────────
  y -= 4;
  vlak(L, y - 1, 16, 1.5, GOUD);
  tekst("Voorwaarden", L + 22, y - 5, { size: 10, vet: true });
  y -= 8;

  const punten = [
    `Deze offerte is geldig tot ${datumNL(o.geldig_tot)}.`,
    "Ga je akkoord? Laat het weten via e-mail of WhatsApp, dan plannen we de vervolgstappen in.",
  ];
  if (maandRegels.length > 0) {
    punten.push("Het maandelijkse deel kent een minimale looptijd van 12 maanden na akkoord; daarna maandelijks opzegbaar.");
  }
  punten.push(`Vragen over deze offerte? Neem contact op via ${BEDRIJF.email} of WhatsApp ${BEDRIJF.telefoon}.`);

  for (const p of punten) {
    y -= 14;
    tekst("•", L + 22, y, { kleur: GOUD });
    const woorden = p.split(" ");
    let regel = "";
    for (const w of woorden) {
      const test = regel ? regel + " " + w : w;
      if (breedteVan(test, { size: 9 }) > BREEDTE - 36 && regel) {
        tekst(regel, L + 34, y, { size: 9, kleur: GRIJS });
        y -= 11; regel = w;
      } else regel = test;
    }
    if (regel) tekst(regel, L + 34, y, { size: 9, kleur: GRIJS });
  }

  // ── Voettekst ────────────────────────────────────────────────────────────
  vlak(L, 56, BREEDTE, 1, GOUD);
  midden(
    `${BEDRIJF.naam} · ${BEDRIJF.web} · ${BEDRIJF.email} · ${BEDRIJF.telefoon} · KvK ${BEDRIJF.kvk} · BTW ${BEDRIJF.btw}`,
    L, R, 44, { size: 7.5, kleur: GRIJS }
  );

  return await pdf.save();
}
