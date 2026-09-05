// Server-only datatoegang voor het takenbord (Bord). Zelfde patroon als
// lib/abonnementen-data.js: de app praat via RPC met de database, nooit
// rechtstreeks met de tabel. Nooit client-side importeren.

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

async function stil(fn, terug) {
  try {
    return await fn();
  } catch {
    return terug;
  }
}

export async function getTaken() {
  const data = await stil(() => rpc("sb_taken_overzicht", {}), []);
  return Array.isArray(data) ? data : [];
}

export async function maakTaak({ titel, omschrijving = null, toegewezenAanIds = [], prioriteit = "normaal", deadline = null, aangemaaktDoor = null, kolom = "te_doen", klantSlug = null }) {
  return await rpc("sb_taak_aanmaken", {
    p_titel: titel,
    p_omschrijving: omschrijving,
    p_toegewezen_aan_ids: toegewezenAanIds && toegewezenAanIds.length ? toegewezenAanIds : null,
    p_prioriteit: prioriteit,
    p_deadline: deadline,
    p_aangemaakt_door: aangemaaktDoor,
    p_kolom: kolom,
    p_klant_slug: klantSlug,
  });
}

export async function bewerkTaak(id, { titel, omschrijving = null, toegewezenAanIds = [], prioriteit = "normaal", deadline = null }) {
  return await rpc("sb_taak_bijwerken", {
    p_id: id,
    p_titel: titel,
    p_omschrijving: omschrijving,
    p_toegewezen_aan_ids: toegewezenAanIds && toegewezenAanIds.length ? toegewezenAanIds : null,
    p_prioriteit: prioriteit,
    p_deadline: deadline,
  });
}

export async function herordenTaken(kolom, taakIds) {
  return await rpc("sb_taken_herordenen", { p_kolom: kolom, p_taak_ids: taakIds });
}

export async function verwijderTaak(id) {
  return await rpc("sb_taak_verwijderen", { p_id: id });
}

// --- Bijlagen (bestanden per taak) ---
// Privé Storage-bucket "taak-bijlagen": alleen bereikbaar met de service-role
// sleutel (server-side). Upload/download verlopen via kortlopende signed URLs
// zodat het bestand rechtstreeks tussen browser en Storage gaat (buiten de
// ~4,5MB-limiet van het platform om).
const BIJLAGEN_BUCKET = "taak-bijlagen";

async function storageFetch(pad, opties = {}) {
  const k = key();
  if (!k) throw new Error("SUPABASE_SERVICE_ROLE_KEY ontbreekt in de serveromgeving.");
  const res = await fetch(`${SUPABASE_URL}/storage/v1${pad}`, {
    ...opties,
    headers: { apikey: k, Authorization: `Bearer ${k}`, ...(opties.headers || {}) },
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Opslagfout (${res.status}): ${t.slice(0, 200)}`);
  }
  return res.json();
}

export async function maakUploadUrl(pad) {
  const data = await storageFetch(`/object/upload/sign/${BIJLAGEN_BUCKET}/${pad}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ expiresIn: 60 * 10 }),
  });
  return { url: `${SUPABASE_URL}/storage/v1${data.url}` };
}

export async function maakDownloadUrl(pad, verlooptNa = 60 * 10) {
  const data = await storageFetch(`/object/sign/${BIJLAGEN_BUCKET}/${pad}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ expiresIn: verlooptNa }),
  });
  return { url: `${SUPABASE_URL}/storage/v1${data.signedURL}` };
}

export async function verwijderUitStorage(pad) {
  const k = key();
  if (!k) throw new Error("SUPABASE_SERVICE_ROLE_KEY ontbreekt in de serveromgeving.");
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BIJLAGEN_BUCKET}`, {
    method: "DELETE",
    headers: { apikey: k, Authorization: `Bearer ${k}`, "Content-Type": "application/json" },
    body: JSON.stringify({ prefixes: [pad] }),
  });
  // Niet fataal als dit mislukt: de metadata-rij is al weg. Wel loggen.
  if (!res.ok) {
    console.error("Kon bestand niet verwijderen uit Storage:", pad, res.status);
  }
}

export async function bijlageToevoegen({ taakId, pad, bestandsnaam, grootte = null, contentType = null, geuploadDoor = null }) {
  return await rpc("sb_bijlage_toevoegen", {
    p_taak_id: taakId,
    p_pad: pad,
    p_bestandsnaam: bestandsnaam,
    p_grootte: grootte,
    p_content_type: contentType,
    p_geupload_door: geuploadDoor,
  });
}

export async function bijlageOphalen(id) {
  return await rpc("sb_bijlage_ophalen", { p_id: id });
}

export async function bijlageVerwijderen(id) {
  const resultaat = await rpc("sb_bijlage_verwijderen", { p_id: id });
  if (resultaat?.pad) await verwijderUitStorage(resultaat.pad);
  return resultaat;
}
