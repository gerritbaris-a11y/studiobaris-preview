// Server-only datatoegang met de service-role key (nooit client-side importeren).
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ipiqrsxbsgylxhgzlhsd.supabase.co";

function key() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY;
}

async function rpc(name, body) {
  const k = key();
  if (!k) return null;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: { apikey: k, Authorization: `Bearer ${k}`, "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

export async function getConcept(slug) {
  const data = await rpc("get_concept", { p_slug: slug });
  return data || null;
}

export async function getFull(slug) {
  const data = await rpc("get_full", { p_slug: slug });
  return data || null;
}

export async function getOverview() {
  const data = await rpc("get_overview", {});
  return Array.isArray(data) ? data : [];
}

export async function getBetaalinfo(slug) {
  const data = await rpc("get_betaalinfo", { p_slug: slug });
  return data || null;
}

export async function updateKlant(slug, { verzamelaar = null, status = null, maandbedrag = null }) {
  return await rpc("update_klant", {
    p_slug: slug,
    p_verzamelaar: verzamelaar,
    p_status: status,
    p_maandbedrag: maandbedrag,
  });
}

export async function setBetaling(slug, fields = {}) {
  return await rpc("set_betaling", {
    p_slug: slug,
    p_status: fields.status ?? null,
    p_provider: fields.provider ?? null,
    p_klant_id: fields.klant_id ?? null,
    p_abonnement_id: fields.abonnement_id ?? null,
    p_mandaat_id: fields.mandaat_id ?? null,
    p_voorwaarden: fields.voorwaarden === true,
  });
}

export async function deleteKlant(slug) {
  return await rpc("delete_klant", { p_slug: slug });
}

export async function updateBedrijf(slug, velden) {
  return await rpc("update_bedrijf", { p_slug: slug, p_velden: velden });
}

// --- Beheerdashboard (monitoring van alle klant-apps) ---

export async function getKlantOverzicht() {
  const data = await rpc("sb_klant_overzicht", {});
  return Array.isArray(data) ? data : [];
}

export async function klantInstellen(id, { projectLimit = null, reviewLimit = null, abonnementsvorm = null }) {
  return await rpc("sb_klant_instellen", {
    p_id: id,
    p_project_limit: projectLimit,
    p_review_limit: reviewLimit,
    p_abonnementsvorm: abonnementsvorm,
  });
}

export async function nieuweLogin(id, dagen = 14) {
  return await rpc("sb_klant_nieuwe_login", { p_id: id, p_dagen: dagen });
}

// --- Akkoord-link aanmaken (werknemer-tool) ---

export async function maakAkkoord({
  companyName,
  email = null,
  phone = null,
  pakket = null,
  maandbedrag = null,
  aanbetaling = null,
  diensten = [],
  verzamelaar = null,
}) {
  return await rpc("sb_akkoord_aanmaken", {
    p_company_name: companyName,
    p_pakket: pakket,
    p_maandbedrag: maandbedrag,
    p_aanbetaling: aanbetaling,
    p_diensten: diensten,
    p_verzamelaar: verzamelaar,
    p_email: email,
    p_phone: phone,
  });
}
