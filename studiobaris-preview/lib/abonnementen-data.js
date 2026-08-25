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
  if (!k) return null;
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
  if (!res.ok) return null;
  const tekst = await res.text();
  if (!tekst) return true;
  try {
    return JSON.parse(tekst);
  } catch {
    return true;
  }
}

// Alles wat met terugkerend geld te maken heeft, per klant.
export async function getAbonnementen() {
  const data = await rpc("sb_abonnementen", {});
  return Array.isArray(data) ? data : [];
}
