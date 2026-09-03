// Server-only datatoegang voor het kopje Abonnementen.
// Zelfde patroon als lib/server-data.js: de app praat via RPC met de database,
// nooit rechtstreeks met de tabel. Nooit client-side importeren.

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ipiqrsxbsgylxhgzlhsd.supabase.co";

function key() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY;
}

async function rpc(name, body) {
  const k = key();
  if (!k) throw new Error("SUPABASE_SERVICE_ROLE_KEY ontbreekt in de serveromgeving.");
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: {
      apikey: k,
      Authorization: `Bearer ${k}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body || {}),
    cache: "no-store",
  });
  if (!res.ok) {
    // De melding uit Postgres doorgeven, anders staat er straks alleen
    // "er ging iets mis" op het scherm en weet niemand wát.
    const t = await res.text().catch(() => "");
    let melding = t;
    try {
      const j = JSON.parse(t);
      melding = j.message || j.hint || j.details || t;
    } catch {}
    throw new Error(String(melding || `Databasefout (${res.status})`).slice(0, 300));
  }
  const tekst = await res.text();
  if (!tekst) return true;
  try {
    return JSON.parse(tekst);
  } catch {
    return true;
  }
}

// Een leeg overzicht is beter dan een witte pagina: leesacties mogen nooit
// een scherm slopen. Schrijfacties gooien wél door, die moeten zichtbaar zijn.
async function stil(fn, terug) {
  try {
    return await fn();
  } catch {
    return terug;
  }
}

// Alles wat met terugkerend geld te maken heeft, per klant.
export async function getAbonnementen() {
  const data = await stil(() => rpc("sb_abonnementen", {}), []);
  return Array.isArray(data) ? data : [];
}

// Klanten die nog geen afspraak hebben; om er hier eentje toe te voegen.
export async function getKandidaten() {
  const data = await stil(() => rpc("sb_abonnement_kandidaten", {}), []);
  return Array.isArray(data) ? data : [];
}

// De afspraak vastleggen: prijs, maandbedrag en betaalwijze op één plek.
// De aanbetaling wordt in de database afgeleid, nooit met de hand ingevuld.
export async function setAfspraak(slug, { websiteprijs, maandbedrag, betaalwijze, incassodag }) {
  return await rpc("sb_abonnement_instellen", {
    p_slug: slug,
    p_websiteprijs: websiteprijs ?? null,
    p_maandbedrag: maandbedrag ?? null,
    p_betaalwijze: betaalwijze ?? null,
    p_incassodag: incassodag ?? null,
  });
}

export async function setIncassodag(slug, dag) {
  return await stil(() => rpc("sb_set_incassodag", { p_slug: slug, p_dag: dag }), null);
}

export async function opzeggenInDb(slug) {
  return await rpc("sb_abonnement_opzeggen", { p_slug: slug });
}

// ── Facturen ────────────────────────────────────────────────────────────────
export async function maakFactuur({
  slug, soort, regels, periode = null, paymentId = null,
  incassodatum = null, vervaldagen = 14, status = "concept",
}) {
  return await rpc("sb_factuur_maak", {
    p_slug: slug,
    p_soort: soort,
    p_regels: regels,
    p_periode: periode,
    p_mollie_payment_id: paymentId,
    p_incassodatum: incassodatum,
    p_vervaldagen: vervaldagen,
    p_status: status,
  });
}

export async function getFactuur(nummer) {
  return await stil(() => rpc("sb_factuur", { p_nummer: nummer }), null);
}

export async function getFacturenKlant(slug) {
  const data = await stil(() => rpc("sb_facturen_klant", { p_slug: slug }), []);
  return Array.isArray(data) ? data : [];
}

export async function getFacturenTeMaken(incassodatum) {
  const data = await stil(() => rpc("sb_facturen_te_maken", { p_incassodatum: incassodatum }), []);
  return Array.isArray(data) ? data : [];
}

export async function setFactuurStatus(nummer, status) {
  return await stil(() => rpc("sb_factuur_status", { p_nummer: nummer, p_status: status }), null);
}

// Alle facturen van alle klanten samen, voor de facturen-overzichtpagina.
export async function getFacturenOverzicht() {
  const data = await stil(() => rpc("sb_facturen_overzicht", {}), []);
  return Array.isArray(data) ? data : [];
}

// Klantenlijst om een nieuwe (handmatige) factuur voor te maken.
export async function getKlantenVoorFactuur() {
  const data = await stil(() => rpc("sb_klanten_voor_factuur", {}), []);
  return Array.isArray(data) ? data : [];
}

// ── Offertes ────────────────────────────────────────────────────────────────
// Volledig los van de facturatie: eigen tabel, eigen nummering. Regels zijn
// hier [{omschrijving, aantal, bedrag_per_stuk}] — een offerte kent (anders
// dan een factuur) een echt aantal, bijv. "10 uur × € 65".
export async function maakOfferte({ slug, regels, geldigDagen = 30, intro = null, status = "concept", pdfPad = null }) {
  return await rpc("sb_offerte_maak", {
    p_slug: slug,
    p_regels: regels,
    p_geldig_dagen: geldigDagen,
    p_intro: intro,
    p_status: status,
    p_pdf_pad: pdfPad,
  });
}

export async function getVolgendOffertenummer() {
  return await stil(() => rpc("sb_volgend_offertenummer_preview", {}), null);
}

// ── Handmatig loggen ──────────────────────────────────────────────────────
// Voor het bijzondere geval: een factuur met een afwijkende datum of status
// vastleggen (een oude factuur alsnog registreren, een correctie) — verder
// dezelfde vrije regels als een gewone factuur. Loopt via dezelfde
// sb_factuur_backfill-functie als sb_factuur_maak intern gebruikt; het
// verschil is dat datum/status hier expliciet meegegeven worden in plaats
// van "vandaag, concept", en dat er optioneel een eigen PDF bij kan in
// plaats van de automatisch gegenereerde (pdfPad blijft dan null, en de
// factuur krijgt gewoon dezelfde opmaak als elke andere).
export async function logFactuur({
  slug, soort, regels, factuurdatum, status = "verstuurd", pdfPad = null,
}) {
  return await rpc("sb_factuur_backfill", {
    p_slug: slug,
    p_soort: soort,
    p_regels: regels,
    p_factuurdatum: factuurdatum,
    p_status: status,
    p_pdf_pad: pdfPad,
  });
}

export async function getVolgendFactuurnummer() {
  return await stil(() => rpc("sb_volgend_factuurnummer_preview", {}), null);
}

export async function getOfferte(nummer) {
  return await stil(() => rpc("sb_offerte", { p_nummer: nummer }), null);
}

export async function getOffertesOverzicht() {
  const data = await stil(() => rpc("sb_offertes_overzicht", {}), []);
  return Array.isArray(data) ? data : [];
}

export async function setOfferteStatus(nummer, status) {
  return await rpc("sb_offerte_status", { p_nummer: nummer, p_status: status });
}

// ── Omzet & btw ──────────────────────────────────────────────────────────────
// Per kwartaal, gebaseerd op factuurdatum — zelfde logica als het
// 'Overzicht & btw-aangifte'-tabblad in StudioBaris_Administratie.xlsx.
export async function getOmzetOverzicht(jaar) {
  return await stil(() => rpc("sb_omzet_overzicht", { p_jaar: jaar || null }), {
    jaar: jaar || new Date().getFullYear(),
    kwartalen: [1, 2, 3, 4].map((k) => ({ kwartaal: k, omzet_excl: 0, btw: 0, omzet_incl: 0 })),
    jaartotaal_excl: 0, jaartotaal_btw: 0, jaartotaal_incl: 0, nog_te_ontvangen: 0,
  });
}

// ── Marges (Financieel) ─────────────────────────────────────────────────────
// Instelbare tarieven: worden bewaard in de database, niet in de code, zodat
// een prijswijziging meteen overal doorrekent zonder nieuwe deploy.
const STANDAARD_INSTELLINGEN = {
  website_eenmalig: 599, maandbedrag_vol: 29.95, maandbedrag_plugin: 12.95,
  kostprijs_hosting: 3.0, kostprijs_domein: 0.92, kostprijs_plugin_vast: 0,
  updated_at: null, updated_door: null,
};

export async function getFinancieleInstellingen() {
  return await stil(() => rpc("sb_financiele_instellingen", {}), STANDAARD_INSTELLINGEN);
}

export async function setFinancieleInstellingen(velden, door) {
  return await rpc("sb_financiele_instellingen_bijwerken", {
    p_website_eenmalig: velden.websiteEenmalig,
    p_maandbedrag_vol: velden.maandbedragVol,
    p_maandbedrag_plugin: velden.maandbedragPlugin,
    p_kostprijs_hosting: velden.kostprijsHosting,
    p_kostprijs_domein: velden.kostprijsDomein,
    p_kostprijs_plugin_vast: velden.kostprijsPluginVast,
    p_door: door || null,
  });
}

// Live margeoverzicht: per daadwerkelijk betalende klant + geaggregeerd per pakketsoort.
export async function getMarges() {
  return await stil(() => rpc("sb_marges", {}), {
    instellingen: STANDAARD_INSTELLINGEN, klanten: [], per_pakket: [],
  });
}
