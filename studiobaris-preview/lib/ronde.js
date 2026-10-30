// Feedbackrondes op de gebouwde WordPress-site (na akkoord, okt 2026).
// De klant loopt via /ronde/<slug>?r=1|2|3&site=<domein> zijn site stap voor
// stap door en zegt per pagina "goed" of "dit wil ik anders". Wij verwerken
// het met de hand. Twee rondes, plus ronde 3 = laatste controle: de klant
// loopt de site nog één keer door en geeft akkoord om live te gaan (okt 2026).
//
// Database (workflow): site_feedback. Functies (alleen service_role):
// sb_site_feedback_nieuw, sb_site_feedback_overzicht, sb_site_feedback_verwerkt.
//
// PAGINAS en ronde-link zijn ook client-side bruikbaar; de rpc-functies
// alleen op de server (service-role key).

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ipiqrsxbsgylxhgzlhsd.supabase.co";

// Pagina's van het Vakman Pro-thema, in de volgorde van het menu.
export const PAGINAS = [
  { id: "home", titel: "Home", pad: "/", uitleg: "De eerste pagina die mensen zien: de grote foto bovenaan, je diensten en de knop om contact op te nemen." },
  { id: "diensten", titel: "Diensten", pad: "/diensten/", uitleg: "Wat je doet. Kloppen de diensten en de teksten erbij?" },
  { id: "projecten", titel: "Projecten", pad: "/projecten/", uitleg: "Hier komen de klussen die je straks zelf plaatst met de app. Kijk vooral of de pagina er netjes uitziet." },
  { id: "over", titel: "Over ons", pad: "/over/", uitleg: "Het verhaal over jou en je bedrijf. Klopt het, en klinkt het als jij?" },
  { id: "contact", titel: "Contact", pad: "/contact/", uitleg: "Je telefoonnummer, e-mail, adres en het formulier voor offertes. Staat alles goed?" },
];

export function schoonSite(site) {
  return String(site || "")
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/.*$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, "");
}

export function rondeUrl(slug, ronde, site) {
  const s = schoonSite(site);
  return `https://preview.studiobaris.nl/ronde/${slug}?r=${ronde}${s ? "&site=" + s : ""}`;
}

async function rpc(naam, body) {
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
  try { return t ? JSON.parse(t) : true; } catch { return true; }
}

export async function nieuweRonde({ slug, ronde, site, antwoorden }) {
  return rpc("sb_site_feedback_nieuw", { p_slug: slug, p_ronde: ronde, p_site: site || "", p_antwoorden: antwoorden || {} });
}

export async function getRondes() {
  try {
    const d = await rpc("sb_site_feedback_overzicht", {});
    return Array.isArray(d) ? d : [];
  } catch {
    return [];
  }
}

export async function rondeVerwerkt(id, door) {
  return rpc("sb_site_feedback_verwerkt", { p_id: Number(id), p_door: door || "" });
}
