// Supabase leesconfig. De publishable (anon) sleutel is ontworpen om publiek te zijn
// en geeft via de afgeschermde view alleen website-content terug (geen leadgegevens).
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ipiqrsxbsgylxhgzlhsd.supabase.co";
const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_78xPLiJ5OK4Bi8P8VUwvSA_IVLQYrlU";

export async function getPreview(slug) {
  const url =
    `${SUPABASE_URL}/rest/v1/preview_public` +
    `?slug=eq.${encodeURIComponent(slug)}&select=slug,content,status`;
  const res = await fetch(url, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const rows = await res.json();
  if (!Array.isArray(rows) || rows.length === 0) return null;
  return rows[0];
}

export function googleFontsHref(headFont, bodyFont) {
  const fams = [...new Set([headFont, bodyFont].filter(Boolean))]
    .map((f) => `family=${encodeURIComponent(f).replace(/%20/g, "+")}:wght@400;500;600;700;800`)
    .join("&");
  return `https://fonts.googleapis.com/css2?${fams}&display=swap`;
}
