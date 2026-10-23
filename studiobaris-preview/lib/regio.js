// Regio per verkoper (23 okt 2026).
//
// Een verkoper kan een vaste regio (provincie) hebben, ingesteld in
// app_users.regio: Benne = Noord-Holland, Kevin = Zuid-Holland.
//  - Leads: hij ziet alleen de leads uit zijn provincie.
//  - Mijn previews / Benaderd: hij ziet alle previews uit zijn provincie
//    (ook die van Gerrit/Levi) plus altijd zijn eigen.
// Beheer (Gerrit, Levi) ziet altijd alles. Een verkoper zonder regio werkt
// zoals voorheen: alleen eigen previews, alle leads.
//
// De provincie van een preview zet de database zelf (workflow.previews.provincie,
// zie supabase/regio_per_verkoper.sql); beheer kan hem op de klantkaart corrigeren.
// Server-only: gebruikt de service-role key.

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ipiqrsxbsgylxhgzlhsd.supabase.co";

export const PROVINCIES = [
  "Drenthe", "Flevoland", "Friesland", "Gelderland", "Groningen", "Limburg",
  "Noord-Brabant", "Noord-Holland", "Overijssel", "Utrecht", "Zeeland", "Zuid-Holland",
];

// "Klaar" (de afwikkeling) is voorbehouden aan Gerrit en Levi.
export const ALLEEN_BEHEER_FASES = ["Klaar"];

// De regio van een teamlid, of null. Faalt dit, dan null: een verkoper valt
// dan terug op "alleen eigen previews", nooit op "alles zien".
export async function getRegio(naam) {
  const k = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!k || !naam) return null;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/app_users?select=regio&naam=eq.${encodeURIComponent(naam)}&limit=1`,
      { cache: "no-store", headers: { apikey: k, Authorization: `Bearer ${k}` } }
    );
    if (!res.ok) return null;
    const d = await res.json();
    return Array.isArray(d) && d[0] && d[0].regio ? String(d[0].regio) : null;
  } catch {
    return null;
  }
}

// De "bron" uit de notities-JSON van een preview (wie hem aanbracht).
export function bronVan(rij) {
  if (!rij) return null;
  if (rij.bron !== undefined) return rij.bron || null;
  try {
    return rij.internal_notes ? JSON.parse(rij.internal_notes).bron || null : null;
  } catch {
    return null;
  }
}

// Mag deze persoon deze preview zien en bewerken (fase, benaderd, archiveren)?
export function magPreview(rij, naam, beheer, regio) {
  if (beheer) return true;
  if (!rij || !naam) return false;
  if (rij.verzamelaar === naam || bronVan(rij) === naam) return true;
  return !!regio && rij.provincie === regio;
}
