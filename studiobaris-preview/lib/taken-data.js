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

export async function maakTaak({ titel, omschrijving = null, toegewezenAan = null, prioriteit = "normaal", deadline = null, aangemaaktDoor = null, kolom = "te_doen", klantSlug = null }) {
  return await rpc("sb_taak_aanmaken", {
    p_titel: titel,
    p_omschrijving: omschrijving,
    p_toegewezen_aan: toegewezenAan,
    p_prioriteit: prioriteit,
    p_deadline: deadline,
    p_aangemaakt_door: aangemaaktDoor,
    p_kolom: kolom,
    p_klant_slug: klantSlug,
  });
}

export async function bewerkTaak(id, { titel, omschrijving = null, toegewezenAan = null, prioriteit = "normaal", deadline = null }) {
  return await rpc("sb_taak_bijwerken", {
    p_id: id,
    p_titel: titel,
    p_omschrijving: omschrijving,
    p_toegewezen_aan: toegewezenAan,
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
