// Benaderd (okt 2026): welke previews zijn door een verkoper benaderd, en wat
// deed de prospect daarna (preview bekeken, app geopend, project geplaatst).
// Server-only: gebruikt de service-role key. Nooit client-side importeren.
// Database: supabase/benaderd.sql (sb_benaderd_zet, sb_benaderd_lijst).

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ipiqrsxbsgylxhgzlhsd.supabase.co";

async function rpcBenaderd(naam, body) {
  const k = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!k) return null;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${naam}`, {
    method: "POST",
    headers: { apikey: k, Authorization: `Bearer ${k}`, "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
    cache: "no-store",
  });
  if (!res.ok) return null;
  const t = await res.text();
  try { return t ? JSON.parse(t) : null; } catch { return null; }
}

// Alle benaderde previews. Faalt dit, dan een lege lijst: pagina's moeten altijd laden.
export async function getBenaderdLijst() {
  try {
    const d = await rpcBenaderd("sb_benaderd_lijst", {});
    return Array.isArray(d) ? d : [];
  } catch {
    return [];
  }
}

export async function zetBenaderd(slug, aan, door) {
  return rpcBenaderd("sb_benaderd_zet", { p_slug: slug, p_aan: !!aan, p_door: door || null });
}

// Zelfde regel als Mijn previews: een verkoper ziet een preview als hij de
// verzamelaar is, als hij in de notities als bron staat, of als de preview in
// zijn regio ligt (zie lib/regio.js). Beheer ziet alles.
export { magPreview as magZien } from "./regio";
