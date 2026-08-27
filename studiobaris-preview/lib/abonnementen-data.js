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
