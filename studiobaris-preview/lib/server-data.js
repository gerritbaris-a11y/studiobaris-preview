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

// Directe tabel-toegang via PostgREST (service-role, server-only).
async function rest(path, opts = {}) {
  const k = key();
  if (!k) return null;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    cache: "no-store",
    ...opts,
    headers: {
      apikey: k,
      Authorization: `Bearer ${k}`,
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) return null;
  const txt = await res.text();
  return txt ? JSON.parse(txt) : [];
}

// --- Leadlijst (de trechter) ---

export async function getLeads() {
  const data = await rest("leads?select=*&order=score.desc.nullslast,bedrijfsnaam.asc&limit=5000");
  return Array.isArray(data) ? data : [];
}

export async function getTeam() {
  const data = await rest("app_users?select=naam,rol&order=rol.asc,naam.asc");
  return Array.isArray(data) ? data : [];
}

// --- Login / accounts ---

// Namen + rol + of er al een wachtwoord is ingesteld (voor de inlogpagina).
export async function getTeamLogin() {
  const data = await rest("app_users?select=id,naam,rol,password_hash&order=rol.asc,naam.asc");
  return (Array.isArray(data) ? data : []).map((u) => ({
    id: u.id, naam: u.naam, rol: u.rol, gezet: !!u.password_hash,
  }));
}

export async function getUserByNaam(naam) {
  const data = await rest(
    `app_users?select=id,naam,rol,password_hash&naam=eq.${encodeURIComponent(naam)}&limit=1`
  );
  return Array.isArray(data) && data[0] ? data[0] : null;
}

export async function setUserWachtwoord(id, hash) {
  return await rest(`app_users?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ password_hash: hash }),
  });
}

export async function updateLead(id, fields) {
  const body = { ...fields, updated_at: new Date().toISOString() };
  if (fields.owner !== undefined && fields.owner) body.claimed_at = new Date().toISOString();
  return await rest(`leads?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(body),
  });
}

// Verkoopbedrag (eenmalige websiteprijs) opslaan bij een klant.
export async function setVerkoopbedrag(slug, bedrag) {
  return await rpc("sb_set_verkoopbedrag", { p_slug: slug, p_bedrag: bedrag });
}

// Omzet + 50%-commissie per persoon (verzamelaar).
export async function getOmzet() {
  const data = await rpc("sb_omzet_overzicht", {});
  return Array.isArray(data) ? data : [];
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
