// Server-only: de cijfers voor het tabblad Overzicht (de "cockpit").
// Alleen lezen. Klanten komen uit sb_abonnementen (de echte betalende
// klanten), outreach en activiteit uit het logboek (public.activiteit).

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ipiqrsxbsgylxhgzlhsd.supabase.co";

// --- Doelen. Hier aanpassen als het plan verandert. ---
// Groeipad uit het financieel stappenplan (6 sep 2026): 4 betalende klanten,
// daarna gemiddeld 4 nieuwe per maand (doel 3,5–4,5).
export const GROEIPAD = { startDatum: "2026-09-06", startKlanten: 4, perMaand: 4, bandLaag: 3.5, bandHoog: 4.5 };
// Hoeveel leads we per week willen benaderen (preview gemaakt of 'benaderd').
export const OUTREACH_DOEL_PER_WEEK = 20;
const WEKEN_TERUG = 8;
const TZ = "Europe/Amsterdam";

async function haal(pad, opts = {}) {
  const k = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!k) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${pad}`, {
      cache: "no-store",
      ...opts,
      headers: { apikey: k, Authorization: `Bearer ${k}`, "Content-Type": "application/json" },
    });
    if (!res.ok) return null;
    const t = await res.text();
    return t ? JSON.parse(t) : null;
  } catch {
    return null;
  }
}

// "2026-10-10" in Amsterdamse tijd.
export function dagNL(d) {
  return new Date(d).toLocaleDateString("sv-SE", { timeZone: TZ });
}

// Maandag (YYYY-MM-DD) van de week waarin deze dag valt.
function maandagVan(dag) {
  const d = new Date(dag + "T12:00:00Z");
  const wd = (d.getUTCDay() + 6) % 7; // ma = 0
  d.setUTCDate(d.getUTCDate() - wd);
  return d.toISOString().slice(0, 10);
}

function plusDagen(dag, n) {
  const d = new Date(dag + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function maandenTussen(vanDag, totDag) {
  const a = new Date(vanDag + "T12:00:00Z");
  const b = new Date(totDag + "T12:00:00Z");
  return (b - a) / (1000 * 60 * 60 * 24 * 30.44);
}

export async function getCockpit() {
  const vandaag = dagNL(new Date());
  const dezeMaandag = maandagVan(vandaag);
  const eersteMaandag = plusDagen(dezeMaandag, -7 * (WEKEN_TERUG - 1));
  // Ruim terug ophalen (UTC-grens), daarna in NL-tijd indelen.
  const vanaf = new Date(eersteMaandag + "T00:00:00Z");
  vanaf.setUTCDate(vanaf.getUTCDate() - 1);

  const [abo, acts] = await Promise.all([
    haal("rpc/sb_abonnementen", { method: "POST", body: "{}" }),
    haal(
      "activiteit?select=moment,persoon,soort,lead_id,slug,bedrijf,van,naar,details" +
        `&moment=gte.${encodeURIComponent(vanaf.toISOString())}&order=moment.desc&limit=5000`
    ),
  ]);
  const fout = abo === null || acts === null;
  const klanten = (Array.isArray(abo) ? abo : []).filter((k) => k.betaal_status === "actief");
  const log = Array.isArray(acts) ? acts : [];

  // --- 1. Op koers? ---
  const maand = vandaag.slice(0, 7);
  const klantDag = (k) => (k.akkoord_voorwaarden_op ? dagNL(k.akkoord_voorwaarden_op) : null);
  const nieuwDezeMaand = klanten.filter((k) => (klantDag(k) || "").startsWith(maand)).length;
  const vorigeMaandKey = (() => {
    const d = new Date(maand + "-15T12:00:00Z");
    d.setUTCMonth(d.getUTCMonth() - 1);
    return d.toISOString().slice(0, 7);
  })();
  const nieuwVorigeMaand = klanten.filter((k) => (klantDag(k) || "").startsWith(vorigeMaandKey)).length;
  const mrr = klanten.reduce((s, k) => s + Number(k.maandbedrag || 0), 0);
  const gemMaandbedrag = klanten.length ? mrr / klanten.length : 29.95;
  const doelKlanten = Math.round(
    GROEIPAD.startKlanten + GROEIPAD.perMaand * Math.max(0, maandenTussen(GROEIPAD.startDatum, vandaag))
  );
  const dagInMaand = Number(vandaag.slice(8, 10));
  const dagenInMaand = new Date(Date.UTC(Number(maand.slice(0, 4)), Number(maand.slice(5, 7)), 0)).getUTCDate();

  // --- 3. Outreach per week ---
  // Een preview maken = de lead benaderen (brief/mail met QR naar de preview).
  // Daarnaast telt een handmatige status 'benaderd'. Per week elk bedrijf één keer.
  const weken = [];
  for (let i = 0; i < WEKEN_TERUG; i++) weken.push({ week: plusDagen(eersteMaandag, 7 * i), sleutels: new Set(), perPersoon: {} });
  const weekIdx = Object.fromEntries(weken.map((w, i) => [w.week, i]));
  for (const a of log) {
    const isOutreach = a.soort === "preview" || (a.soort === "lead_status" && a.naar === "benaderd");
    if (!isOutreach) continue;
    const i = weekIdx[maandagVan(dagNL(a.moment))];
    if (i === undefined) continue;
    const sleutel = String(a.slug || a.lead_id || a.bedrijf || "").toLowerCase();
    if (!sleutel || weken[i].sleutels.has(sleutel)) continue;
    weken[i].sleutels.add(sleutel);
    const p = a.persoon || "Onbekend";
    weken[i].perPersoon[p] = (weken[i].perPersoon[p] || 0) + 1;
  }
  const outreach = weken.map((w) => ({ week: w.week, aantal: w.sleutels.size, perPersoon: w.perPersoon }));

  // --- 4. Activiteit, afgelopen 7 dagen ---
  const grens7 = plusDagen(vandaag, -6);
  const items = [];
  // Previews samenvatten per persoon per dag, anders wordt het een lange lijst.
  const previewGroepen = {};
  for (const a of log) {
    const dag = dagNL(a.moment);
    if (dag < grens7) continue;
    if (a.soort === "preview") {
      const k = dag + "|" + (a.persoon || "");
      const g = (previewGroepen[k] ||= { moment: a.moment, persoon: a.persoon, namen: [], soort: "previews" });
      const naam = a.bedrijf || a.slug;
      if (naam && !g.namen.includes(naam)) g.namen.push(naam);
      if (a.moment > g.moment) g.moment = a.moment;
    } else if (a.soort === "klant_fase" && a.naar !== "Akkoord") {
      items.push({ moment: a.moment, persoon: a.persoon, soort: "fase", wat: a.bedrijf || a.slug, naar: a.naar });
    } else if (a.soort === "lead_status" && ["benaderd", "klant", "afgewezen"].includes(a.naar)) {
      items.push({ moment: a.moment, persoon: a.persoon, soort: "lead_" + a.naar, wat: a.bedrijf });
    } else if (a.soort === "leads_sync") {
      const n = Number(a.details?.nieuw || 0);
      if (n > 0) items.push({ moment: a.moment, persoon: null, soort: "sync", aantal: n });
    } else if (a.soort === "gegevens-aangevuld") {
      items.push({ moment: a.moment, persoon: a.persoon, soort: "gegevens", wat: a.bedrijf || a.slug });
    }
  }
  items.push(...Object.values(previewGroepen));
  for (const k of klanten) {
    const d = klantDag(k);
    if (d && d >= grens7) {
      items.push({ moment: k.akkoord_voorwaarden_op, persoon: k.verzamelaar, soort: "klant", wat: k.company_name });
    }
  }
  items.sort((a, b) => String(b.moment).localeCompare(String(a.moment)));

  return {
    fout,
    vandaag,
    koers: {
      klanten: klanten.length,
      doelKlanten,
      nieuwDezeMaand,
      nieuwVorigeMaand,
      dagInMaand,
      dagenInMaand,
      mrr,
      doelMrr: doelKlanten * gemMaandbedrag,
    },
    outreach,
    activiteit: items.slice(0, 40),
  };
}
