// Facturen: nummeren, opmaken als PDF en mailen. Server-only.
//
// De opmaak volgt het eigen sjabloon (StudioBaris_Facturen_Offertes.xlsx)
// zo dicht mogelijk: logo-blokje, donkere tabelbalk, omkaderd klantblok en
// een uitgelichte totaalregel. KvK/BTW/e-mail staan alleen in de voettekst
// (niet nog eens bovenaan) en het klantnummer staat bij de factuurgegevens,
// net als in het sjabloon.
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { periodeInWoorden, periodeKort, datumNL } from "./mollie";

export const BEDRIJF = {
  naam: "StudioBaris",
  adres: "Hooigracht 63",
  postcode: "2312 KP Leiden",
  kvk: "42128377",
  btw: "NL005517185B96",
  email: "info@studiobaris.nl",
  telefoon: "06 16 73 21 05",
  web: "www.studiobaris.nl",
  iban: "NL67 BUNQ 2209 2513 62",
  incassantId: "NL08ZZZ502057730000",
  ondertitel: "Website & app voor het online zetten van jouw projecten en reviews",
};

export const OMSCHRIJVING = {
  eenmalig: "Bouw — website + app instellen",
  aanbetaling: "Aanbetaling bouw — website + app instellen (1/2)",
  slottermijn: "Slottermijn bouw — website + app opgeleverd en live (2/2)",
  maandelijks:
    "Maandelijkse dienstverlening — hosting, domeinnaam, app, back-ups, beveiliging, updates en support",
};

function euro(v) {
  const n = Number(v) || 0;
  return "€ " + n.toFixed(2).replace(".", ",");
}

// ── PDF ─────────────────────────────────────────────────────────────────────
// Bewust met de ingebouwde Helvetica: geen lettertypebestanden nodig, dus
// niets dat op Vercel kan ontbreken. Eén A4, altijd dezelfde indeling.
export async function factuurPdf(f) {
  const snap = f.snapshot || {};
  const klant = snap.klant || {};
  const regels = Array.isArray(snap.regels) ? snap.regels : [];
  const maandelijks = f.soort === "maandelijks";

  const pdf = await PDFDocument.create();
  const pagina = pdf.addPage([595.28, 841.89]); // A4
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const vet = await pdf.embedFont(StandardFonts.HelveticaBold);
  const italic = await pdf.embedFont(StandardFonts.HelveticaOblique);

  const INKT = rgb(0.169, 0.153, 0.141);   // #2B2724 — logo, tabelbalk, koppen
  const GRIJS = rgb(0.42, 0.38, 0.33);
  const LIJN = rgb(0.88, 0.86, 0.82);
  const VLAK = rgb(0.972, 0.961, 0.943);   // lichte achtergrond voor het klantkaartje
  const ZEBRA = rgb(0.986, 0.981, 0.972);  // zeer lichte streeptint in de regeltabel
  const WIT = rgb(1, 1, 1);
  const GOUD = rgb(0.729, 0.549, 0.263);   // warme accentkleur — uniform over alle factuurtypen

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
  // Rechts uitgelijnd label + bedrag, waarbij het bedrag zijn eigen breedte
  // meekrijgt — zo kan een langer bedrag nooit tegen het label aan botsen,
  // wat er eerder scheef uitzag.
  const totaalregel = (label, waarde, xLabelEind, xWaardeEind, yy, opt = {}) => {
    const waardeBreedte = breedteVan(waarde, { vet: true, size: opt.size });
    tekst(waarde, xWaardeEind - waardeBreedte, yy, { vet: true, size: opt.size, kleur: opt.kleur });
    rechts(label, Math.min(xLabelEind, xWaardeEind - waardeBreedte - 10), yy, {
      size: opt.size, kleur: opt.kleur,
    });
  };

  // ── Gouden topbalk — dezelfde uitstraling op elk factuurtype ──────────────
  vlak(0, 838.89, 595.28, 3, GOUD);

  let y = 780;

  // ── Kop: beeldmerk + wordmark links, StudioBaris-gegevens rechts ──────────
  vlak(L, y - 28, 32, 32, INKT);
  vlak(L, y - 28, 32, 4, GOUD); // gouden voetje aan het beeldmerk
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

  // ── FACTUUR-titel + ondertitel links, kerngegevens rechts ─────────────────
  vlak(L, y - 22, 4, 24, GOUD);
  tekst("FACTUUR", L + 12, y, { size: 24, vet: true });
  tekst(BEDRIJF.ondertitel, L + 12, y - 16, { size: 9, italic: true, kleur: GRIJS });

  const gegevens = [
    ["Factuurnummer:", f.nummer],
    ["Factuurdatum:", datumNL(f.factuurdatum)],
    maandelijks
      ? ["Incassodatum:", datumNL(f.incassodatum || f.vervaldatum)]
      : ["Vervaldatum:", datumNL(f.vervaldatum)],
    ["Klantnummer:", klant.klantnummer || "—"],
  ];
  let gy = y;
  for (const [label, waarde] of gegevens) {
    rechts(label, R - 90, gy, { kleur: GRIJS });
    rechts(waarde, R, gy, { vet: true });
    gy -= 14;
  }

  // Ruimte na de gegevenslijst schaalt mee met het aantal regels (met
  // Klantnummer erbij zijn dat er 4 in plaats van 3) — anders schoof de
  // "FACTUUR AAN"-kaart over de laatste regel heen.
  y -= 14 * gegevens.length + 14;

  // ── Factuur aan: rustig kaartblok met gouden accentrand links ─────────────
  const adresdelen = String(klant.adres || "").split(",").map((s) => s.trim()).filter(Boolean);
  const klantregels = [klant.naam, ...adresdelen, klant.email].filter(Boolean);
  const regelhoogte = 15.5;
  const blokPad = 12;
  const blokhoogte = klantregels.length * regelhoogte + blokPad * 2 - 4;

  vlak(L, y - blokhoogte, BREEDTE, blokhoogte, VLAK);
  vlak(L, y - blokhoogte, 3, blokhoogte, GOUD);
  tekst("FACTUUR AAN", L + 16, y - 14, { size: 7.5, vet: true, kleur: GRIJS });
  let ky = y - 14 - 16;
  klantregels.forEach((r, i) => {
    tekst(r, L + 16, ky, { vet: i === 0, size: i === 0 ? 11 : 9.5 });
    ky -= regelhoogte;
  });
  y -= blokhoogte + 24;

  // ── Regeltabel ─────────────────────────────────────────────────────────────
  // Kolomposities met echte marge ertussen (minstens 14pt), berekend op de
  // breedte van de langste koptekst — dat "Prijs excl. btw" tegen "Totaal
  // excl. btw" aan plakte kwam doordat hier eerder te weinig ruimte tussen
  // de kolommen zat.
  const xAantalM = 373, xPrijs = 461, xTotaalKol = R - 8;
  const kopHoogte = 22;
  vlak(L, y - kopHoogte, BREEDTE, kopHoogte, INKT);
  tekst("Omschrijving", L + 10, y - 15, { size: 8.5, vet: true, kleur: WIT });
  midden("Aantal", xAantalM - 18, xAantalM + 18, y - 15, { size: 8.5, vet: true, kleur: WIT });
  rechts("Prijs excl. btw", xPrijs, y - 15, { size: 8.5, vet: true, kleur: WIT });
  rechts("Totaal excl. btw", xTotaalKol, y - 15, { size: 8.5, vet: true, kleur: WIT });
  y -= kopHoogte;
  vlak(L, y - 1.5, BREEDTE, 1.5, GOUD);

  const breedteOmschrijving = xAantalM - 18 - L - 12;
  regels.forEach((r, idx) => {
    const woorden = String(r.omschrijving || "").split(" ");
    let regel = "", stukken = [];
    for (const w of woorden) {
      const test = regel ? regel + " " + w : w;
      if (breedteVan(test, { size: 9.5 }) > breedteOmschrijving && regel) { stukken.push(regel); regel = w; }
      else regel = test;
    }
    if (regel) stukken.push(regel);
    // Telt ook de aparte periode-regel mee (bijv. "sep 2026" onder een
    // maandelijkse regel) — anders overlapte die met de rand/lijn eronder.
    const regelsTotaal = stukken.length + (maandelijks ? 1 : 0);
    const rijhoogte = 18 + (regelsTotaal - 1) * 11;

    if (idx % 2 === 1) vlak(L, y - rijhoogte, BREEDTE, rijhoogte, ZEBRA);
    tekst(stukken[0] || "", L + 10, y - 13);
    for (let i = 1; i < stukken.length; i++) tekst(stukken[i], L + 10, y - 13 - i * 11, { kleur: GRIJS });
    if (maandelijks) tekst(periodeKort(r.periode || f.periode), L + 10, y - 13 - stukken.length * 11, { size: 8.5, kleur: GRIJS });
    midden("1", xAantalM - 18, xAantalM + 18, y - 13);
    rechts(euro(r.bedrag_excl), xPrijs, y - 13);
    rechts(euro(r.bedrag_excl), xTotaalKol, y - 13);
    y -= rijhoogte;
    lijn(y, L, R);
  });

  y -= 10;
  const totalen = [
    ["Subtotaal excl. btw", euro(f.bedrag_excl)],
    ["Btw 21%", euro(f.btw_bedrag)],
  ];
  for (const [label, waarde] of totalen) {
    y -= 14;
    totaalregel(label, waarde, xPrijs, xTotaalKol, y, { kleur: GRIJS });
  }
  y -= 10;

  // ── Totaalbalk: een volle, donkere balk — het rustpunt van de pagina ──────
  const balkHoogte = 26;
  vlak(xPrijs - 90, y - balkHoogte + 6, R - (xPrijs - 90), balkHoogte, INKT);
  totaalregel("Totaal incl. btw", euro(f.bedrag_incl), xPrijs, xTotaalKol, y - 8, { size: 12, kleur: WIT });
  y -= balkHoogte + 18;

  // ── Betaal- of incassogegevens ─────────────────────────────────────────────
  y -= 14;
  vlak(L, y - 1, 16, 1.5, GOUD);
  tekst(maandelijks ? "Incassogegevens" : "Betaalgegevens", L + 22, y - 5, { size: 10, vet: true });
  y -= 8;

  const punten = maandelijks
    ? [
        `Dit bedrag wordt automatisch geïncasseerd op ${datumNL(f.incassodatum || f.vervaldatum)} van je rekening.`,
        `Incassant-ID: ${BEDRIJF.incassantId}${snap.mandaat ? ` · Kenmerk machtiging: ${snap.mandaat}` : ""}`,
        "Type incasso: doorlopend, SEPA basis. De afschrijving verschijnt als “StudioBaris via Mollie”.",
        "Klopt er iets niet? Meld dit binnen 8 weken na afschrijving, dan kun je het bedrag laten terugboeken via je eigen bank.",
        "Minimale looptijd 12 maanden vanaf akkoord; daarna maandelijks opzegbaar.",
        `Vragen over deze factuur? Neem contact op via ${BEDRIJF.email} of WhatsApp ${BEDRIJF.telefoon}.`,
      ]
    : [
        f.soort === "slottermijn"
          ? "Deze slottermijn is verschuldigd bij oplevering; gelieve binnen 7 dagen na factuurdatum te betalen."
          : "Gelieve het totaalbedrag binnen 14 dagen na factuurdatum over te maken, tenzij je al via de betaallink hebt betaald.",
        `Rekeningnummer (IBAN): ${BEDRIJF.iban} t.n.v. ${BEDRIJF.naam}`,
        `Vermeld bij betaling altijd het factuurnummer: ${f.nummer}`,
        "Minimale looptijd van de maandelijkse dienstverlening: 12 maanden vanaf akkoord; daarna maandelijks opzegbaar.",
        `Vragen over deze factuur? Neem contact op via ${BEDRIJF.email} of WhatsApp ${BEDRIJF.telefoon}.`,
      ];

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

// ── E-mail ──────────────────────────────────────────────────────────────────
export async function mailFactuur(f, pdfBytes) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { sent: false, reason: "geen RESEND_API_KEY" };

  const snap = f.snapshot || {};
  const klant = snap.klant || {};
  const naar = klant.email;
  if (!naar) return { sent: false, reason: "klant heeft geen e-mailadres" };

  const from = process.env.EMAIL_FROM || "StudioBaris <info@studiobaris.nl>";
  const maandelijks = f.soort === "maandelijks";
  const bedrag = euro(f.bedrag_incl);

  const onderwerp = maandelijks
    ? `Factuur ${f.nummer} — ${periodeInWoorden(f.periode)}`
    : `Factuur ${f.nummer} van StudioBaris`;

  const kern = maandelijks
    ? `<p>Hierbij de factuur voor <strong>${periodeInWoorden(f.periode)}</strong>.
         Het bedrag van <strong>${bedrag}</strong> incl. btw wordt op
         <strong>${datumNL(f.incassodatum || f.vervaldatum)}</strong> automatisch
         van je rekening afgeschreven. Je hoeft dus niets te doen.</p>
       <p style="color:#6B6258;font-size:14px">Incassant-ID ${BEDRIJF.incassantId}. De afschrijving
         verschijnt op je afschrift als &ldquo;StudioBaris via Mollie&rdquo;.</p>`
    : `<p>Hierbij de factuur voor je website en app, ten bedrage van
         <strong>${bedrag}</strong> incl. btw.</p>`;

  const html = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;color:#2B2724;max-width:560px">
      <p>Beste ${klant.contactpersoon || klant.naam || "klant"},</p>
      ${kern}
      <p>De factuur zit als PDF bij deze mail.</p>
      <p style="color:#6B6258;font-size:14px">Vragen? Mail ${BEDRIJF.email} of app ${BEDRIJF.telefoon}.</p>
      <p style="margin-top:24px">Met vriendelijke groet,<br><strong>${BEDRIJF.naam}</strong></p>
      <p style="color:#B0A697;font-size:12px;border-top:1px solid #ECE4D7;padding-top:10px">
        ${BEDRIJF.naam} · ${BEDRIJF.web} · KvK ${BEDRIJF.kvk} · BTW ${BEDRIJF.btw}
      </p>
    </div>`;

  const bijlage = Buffer.from(pdfBytes).toString("base64");

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: naar,
        bcc: process.env.NOTIFY_EMAIL || "info@studiobaris.nl",
        subject: onderwerp,
        html,
        attachments: [{ filename: `Factuur-${f.nummer}.pdf`, content: bijlage }],
      }),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      return { sent: false, reason: `Resend ${res.status}: ${t.slice(0, 200)}` };
    }
    return { sent: true };
  } catch (e) {
    return { sent: false, reason: String(e.message || e) };
  }
}

// ── Regels samenstellen ─────────────────────────────────────────────────────
// De eerste betaling dekt de website EN de eerste maand. In de oude opzet
// startte het abonnement pas een maand later en werd die maand nooit
// gefactureerd; die regel staat hier daarom altijd bij.
export function regelsEersteBetaling(info) {
  const regels = [];
  const aanbetaling = Number(info.aanbetaling) || 0;
  const maand = Number(info.maandbedrag) || 0;
  const inTermijnen = info.betaalwijze === "twee_termijnen";

  if (aanbetaling > 0) {
    regels.push({
      omschrijving: inTermijnen ? OMSCHRIJVING.aanbetaling : OMSCHRIJVING.eenmalig,
      bedrag_excl: aanbetaling,
    });
  }
  if (maand > 0) {
    regels.push({ omschrijving: OMSCHRIJVING.maandelijks + " (eerste maand)", bedrag_excl: maand });
  }
  return regels;
}

export function soortEersteBetaling(info) {
  const aanbetaling = Number(info.aanbetaling) || 0;
  if (aanbetaling <= 0) return "maandelijks";
  return info.betaalwijze === "twee_termijnen" ? "aanbetaling" : "eenmalig";
}
