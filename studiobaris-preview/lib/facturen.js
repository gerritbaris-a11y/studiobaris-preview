// Facturen: nummeren, opmaken als PDF en mailen. Server-only.
//
// De gegevens hieronder komen letterlijk uit het eigen factuursjabloon
// (StudioBaris_Facturen_Offertes.xlsx). Niets is verzonnen; wijzig het hier
// als het bedrijf verhuist of van rekening wisselt, dan volgt elke factuur.
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

  const INKT = rgb(0.168, 0.153, 0.141);   // #2B2724
  const GRIJS = rgb(0.42, 0.38, 0.33);
  const LIJN = rgb(0.9, 0.89, 0.86);
  const KLEI = rgb(0.753, 0.353, 0.22);    // #C05A38

  const L = 50;            // linkermarge
  const R = 545;           // rechterkant
  let y = 792;

  const tekst = (s, x, yy, opt = {}) =>
    pagina.drawText(String(s == null ? "" : s), {
      x, y: yy,
      size: opt.size || 9.5,
      font: opt.vet ? vet : font,
      color: opt.kleur || INKT,
    });
  const rechts = (s, xEind, yy, opt = {}) => {
    const s2 = String(s == null ? "" : s);
    const f2 = opt.vet ? vet : font;
    const w = f2.widthOfTextAtSize(s2, opt.size || 9.5);
    tekst(s2, xEind - w, yy, opt);
  };
  const lijn = (yy, kleur) =>
    pagina.drawLine({ start: { x: L, y: yy }, end: { x: R, y: yy }, thickness: 0.75, color: kleur || LIJN });

  // Kop: afzender rechts, titel links.
  tekst(BEDRIJF.naam, L, y, { size: 20, vet: true, kleur: KLEI });
  rechts(BEDRIJF.naam, R, y + 4, { size: 9.5, vet: true });
  rechts(BEDRIJF.adres, R, y - 8);
  rechts(BEDRIJF.postcode, R, y - 20);
  rechts(`KvK: ${BEDRIJF.kvk} · BTW: ${BEDRIJF.btw}`, R, y - 32, { size: 8.5, kleur: GRIJS });
  rechts(`${BEDRIJF.email} · ${BEDRIJF.telefoon}`, R, y - 44, { size: 8.5, kleur: GRIJS });

  y -= 18;
  tekst(BEDRIJF.ondertitel, L, y, { size: 9, kleur: GRIJS });

  y -= 34;
  tekst("FACTUUR", L, y, { size: 13, vet: true });

  // Kerngegevens, rechts uitgelijnd onder elkaar.
  const gegevens = [
    ["Factuurnummer:", f.nummer],
    ["Factuurdatum:", datumNL(f.factuurdatum)],
    maandelijks
      ? ["Incassodatum:", datumNL(f.incassodatum || f.vervaldatum)]
      : ["Vervaldatum:", datumNL(f.vervaldatum)],
  ];
  let gy = y;
  for (const [label, waarde] of gegevens) {
    rechts(label, R - 110, gy, { kleur: GRIJS });
    rechts(waarde, R, gy, { vet: true });
    gy -= 13;
  }

  y -= 34;
  tekst("FACTUUR AAN", L, y, { size: 8.5, vet: true, kleur: GRIJS });
  y -= 14;
  const adresregels = [
    klant.naam,
    klant.adres,
    klant.email,
    klant.kvk ? `KvK: ${klant.kvk}` : null,
    klant.btw ? `BTW: ${klant.btw}` : null,
  ].filter(Boolean);
  for (const r of adresregels) { tekst(r, L, y); y -= 12; }

  // Tabelkop.
  y -= 18;
  // Vaste kolomranden. Ze staan hier bij elkaar zodat kop en regels nooit
  // uit elkaar kunnen lopen — dat gaf eerder overlappende kopteksten.
  const xPeriode = 300, xAantal = 385, xPrijs = 462;
  tekst("Omschrijving", L, y, { size: 8.5, vet: true, kleur: GRIJS });
  if (maandelijks) tekst("Periode", xPeriode, y, { size: 8.5, vet: true, kleur: GRIJS });
  rechts("Aantal", xAantal, y, { size: 8.5, vet: true, kleur: GRIJS });
  rechts("Prijs excl. btw", xPrijs, y, { size: 8.5, vet: true, kleur: GRIJS });
  rechts("Totaal excl. btw", R, y, { size: 8.5, vet: true, kleur: GRIJS });
  y -= 6;
  lijn(y);

  // Regels. Lange omschrijvingen worden afgebroken op de kolombreedte.
  const breedte = maandelijks ? xPeriode - L - 12 : xAantal - L - 60;
  for (const r of regels) {
    y -= 15;
    const woorden = String(r.omschrijving || "").split(" ");
    let regel = "";
    const stukken = [];
    for (const w of woorden) {
      const test = regel ? regel + " " + w : w;
      if (font.widthOfTextAtSize(test, 9.5) > breedte && regel) { stukken.push(regel); regel = w; }
      else regel = test;
    }
    if (regel) stukken.push(regel);

    tekst(stukken[0] || "", L, y);
    if (maandelijks) tekst(periodeKort(r.periode || f.periode), xPeriode, y, { kleur: GRIJS });
    rechts("1", xAantal, y);
    rechts(euro(r.bedrag_excl), xPrijs, y);
    rechts(euro(r.bedrag_excl), R, y);
    for (let i = 1; i < stukken.length; i++) { y -= 11; tekst(stukken[i], L, y, { kleur: GRIJS }); }
  }

  y -= 12;
  lijn(y);
  const totalen = [
    ["Subtotaal excl. btw", euro(f.bedrag_excl), false],
    ["Btw 21%", euro(f.btw_bedrag), false],
    ["Totaal incl. btw", euro(f.bedrag_incl), true],
  ];
  for (const [label, waarde, dik] of totalen) {
    y -= 15;
    rechts(label, xPrijs, y, { vet: dik, size: dik ? 11 : 9.5 });
    rechts(waarde, R, y, { vet: dik, size: dik ? 11 : 9.5 });
  }

  // Betaal- of incassogegevens.
  y -= 30;
  tekst(maandelijks ? "Incassogegevens" : "Betaalgegevens", L, y, { size: 8.5, vet: true, kleur: GRIJS });
  y -= 6;
  lijn(y);

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
    tekst("•", L, y, { kleur: GRIJS });
    // Ook hier afbreken, anders loopt een lange zin buiten de bladspiegel.
    const woorden = p.split(" ");
    let regel = "", eerste = true;
    for (const w of woorden) {
      const test = regel ? regel + " " + w : w;
      if (font.widthOfTextAtSize(test, 9) > R - L - 14 && regel) {
        tekst(regel, L + 12, y, { size: 9, kleur: GRIJS });
        y -= 11; regel = w; eerste = false;
      } else regel = test;
    }
    if (regel) tekst(regel, L + 12, y, { size: 9, kleur: GRIJS });
  }

  // Voettekst onderaan de pagina.
  lijn(58);
  tekst(
    `${BEDRIJF.naam} · ${BEDRIJF.web} · ${BEDRIJF.email} · ${BEDRIJF.telefoon} · KvK ${BEDRIJF.kvk} · BTW ${BEDRIJF.btw}`,
    L, 44, { size: 7.5, kleur: GRIJS }
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
