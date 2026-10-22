// Financieel overzicht per verkoper (okt 2026). Server-only (service-role key).
// Rekenregels: zie supabase/verkoper_financieel.sql (gelijk aan Team & omzet).

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ipiqrsxbsgylxhgzlhsd.supabase.co";

// naam = null geeft iedereen (alleen voor beheer gebruiken).
export async function getVerdiensten(naam) {
  const k = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!k) return [];
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/sb_verkoper_financieel`, {
      method: "POST",
      headers: { apikey: k, Authorization: `Bearer ${k}`, "Content-Type": "application/json" },
      body: JSON.stringify({ p_naam: naam || null }),
      cache: "no-store",
    });
    if (!res.ok) return [];
    const d = await res.json();
    return Array.isArray(d) ? d : [];
  } catch {
    return [];
  }
}
