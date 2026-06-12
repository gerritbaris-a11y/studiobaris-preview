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
