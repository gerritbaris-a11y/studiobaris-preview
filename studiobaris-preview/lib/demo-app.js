// Persoonlijke demo-app per preview.
// Bij elke preview maken we een demo-bedrijf in de klant-app, gevuld met de
// naam, de kleuren, de projecten en de reviews uit diezelfde preview. Zo ziet
// de prospect zijn eigen app, niet een demo van een ander bedrijf.
//
// Server-only: gebruikt de service-role key. Nooit client-side importeren.

import crypto from "crypto";
import { isEsthetiekBranche } from "./segment";
import { behandelingenUitContent, vakTekst } from "./behandelingen";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ipiqrsxbsgylxhgzlhsd.supabase.co";

function key() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY;
}

// Elk demo-account krijgt een eigen willekeurig wachtwoord. Dat bewaren we bij het
// demo-bedrijf in de database, zodat de klant-app de demo kan openen. Het gaat om
// wegwerpaccounts met voorbeeldgegevens; er staat niets van een klant in.
export function nieuwWachtwoord() {
  return "Demo-" + crypto.randomBytes(18).toString("base64url");
}

export function demoEmail(slug) {
  return `demo-${slug}@studiobaris.app`;
}

async function sb(path, opts = {}) {
  const k = key();
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    cache: "no-store",
    ...opts,
    headers: {
      apikey: k,
      Authorization: `Bearer ${k}`,
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
  });
  const txt = await res.text();
  let body = null;
  try { body = txt ? JSON.parse(txt) : null; } catch { body = txt; }
  return { ok: res.ok, status: res.status, body };
}

// Zorgt dat er een inlogaccount is voor deze demo en geeft het gebruikers-id terug.
async function zorgVoorAccount(slug, wachtwoord) {
  // Bestaat de demo al? Dan kennen we de eigenaar en zetten we alleen het wachtwoord goed.
  const bestaand = await sb(
    `/rest/v1/companies?demo_van_slug=eq.${encodeURIComponent(slug)}&select=id,owner_id&limit=1`
  );
  const rij = Array.isArray(bestaand.body) && bestaand.body[0] ? bestaand.body[0] : null;
  if (rij && rij.owner_id) {
    await sb(`/auth/v1/admin/users/${rij.owner_id}`, {
      method: "PUT",
      body: JSON.stringify({ password: wachtwoord }),
    });
    return rij.owner_id;
  }

  // Nieuw account aanmaken.
  let email = demoEmail(slug);
  let res = await sb("/auth/v1/admin/users", {
    method: "POST",
    body: JSON.stringify({ email, password: wachtwoord, email_confirm: true }),
  });

  // Adres al in gebruik (weesaccount van een eerdere poging): met achtervoegsel opnieuw.
  if (!res.ok) {
    email = `demo-${slug}-${Math.random().toString(36).slice(2, 7)}@studiobaris.app`;
    res = await sb("/auth/v1/admin/users", {
      method: "POST",
      body: JSON.stringify({ email, password: wachtwoord, email_confirm: true }),
    });
  }
  if (!res.ok || !res.body || !res.body.id) {
    throw new Error("Demo-account aanmaken mislukt: " + JSON.stringify(res.body));
  }
  return res.body.id;
}

// Maakt (of vernieuwt) de demo-app voor een preview. Gooit nooit de intake om:
// bel dit met await binnen een try/catch.
export async function maakDemoApp(slug, content) {
  if (!key()) return null;

  const c = content || {};
  const merk = c.merk || {};
  const bedrijf = c.bedrijf || {};
  const naam = bedrijf.naam || slug;

  const wachtwoord = nieuwWachtwoord();
  const owner = await zorgVoorAccount(slug, wachtwoord);

  const projecten = (Array.isArray(c.projecten) ? c.projecten : [])
    .filter((p) => p && (p.titel || p.beeld_url))
    .map((p) => ({
      titel: String(p.titel || "").slice(0, 80),
      plaats: String(p.plaats || "").slice(0, 80),
      beeld_url: String(p.beeld_url || ""),
    }));

  const reviews = (Array.isArray(c.reviews) ? c.reviews : [])
    .filter((r) => r && r.tekst)
    .map((r) => ({
      naam: String(r.naam || "Klant").slice(0, 60),
      score: Number(r.score) >= 1 && Number(r.score) <= 5 ? Number(r.score) : 5,
      tekst: String(r.tekst || "").slice(0, 600),
    }));

  const res = await sb("/rest/v1/rpc/sb_demo_maak", {
    method: "POST",
    body: JSON.stringify({
      p_van_slug: slug,
      p_owner: owner,
      p_naam: naam,
      p_primair: merk.primaire_kleur || "",
      p_accent: merk.secundaire_kleur || merk.primaire_kleur || "",
      p_telefoon: bedrijf.telefoon || "",
      p_wachtwoord: wachtwoord,
      p_projecten: projecten,
      p_reviews: reviews,
    }),
  });
  if (!res.ok) throw new Error("Demo-app aanmaken mislukt: " + JSON.stringify(res.body));

  // Salons: de gratis modules (Cadeaubonnen, Wachtlijst) staan in de demo
  // standaard aan, zodat de prospect ze in zijn eigen app ziet. Alleen als er
  // nog niets is ingesteld; in de werkplek per preview aan/uit te zetten.
  if (isEsthetiekBranche(bedrijf.branche || "")) {
    try {
      const d = await sb(`/rest/v1/companies?demo_van_slug=eq.${encodeURIComponent(slug)}&select=id&limit=1`);
      const id = Array.isArray(d.body) && d.body[0] ? d.body[0].id : null;
      if (id) {
        await sb("/rest/v1/company_modules?on_conflict=company_id", {
          method: "POST",
          headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
          body: JSON.stringify({ company_id: id, modules: DEMO_MODULES_STANDAARD, updated_at: new Date().toISOString(), updated_by: "standaard demo" }),
        });
      }
    } catch {}
  }

  return { slug, url: demoLink(slug), aantalProjecten: projecten.length, aantalReviews: reviews.length };
}

// Demo-app weer opruimen (bij verwijderen van de klant).
export async function verwijderDemoApp(slug) {
  if (!key()) return false;
  const res = await sb("/rest/v1/rpc/sb_demo_weg", {
    method: "POST",
    body: JSON.stringify({ p_van_slug: slug }),
  });
  const owner = res.ok ? res.body : null;
  if (owner && typeof owner === "string") {
    await sb(`/auth/v1/admin/users/${owner}`, { method: "DELETE" });
  }
  return true;
}

export const DEMO_MODULES_STANDAARD = ["cadeaubonnen", "wachtlijst"];
export const DEMO_MODULES = ["cadeaubonnen", "wachtlijst", "whatsapp_s"];

// Modules van de demo-app van een preview aan/uit zetten (werkplek).
export async function zetDemoModules(slug, modules, door) {
  if (!key()) throw new Error("Server-key ontbreekt.");
  const d = await sb(`/rest/v1/companies?demo_van_slug=eq.${encodeURIComponent(slug)}&select=id,soort&limit=1`);
  const rij = Array.isArray(d.body) && d.body[0] ? d.body[0] : null;
  if (!rij) throw new Error("Deze preview heeft (nog) geen demo-app.");
  const schoon = [...new Set((modules || []).filter((m) => DEMO_MODULES.includes(m)))];
  // Oudere demo's van salonpreviews staan nog als vakman-app (ze worden pas
  // salon zodra iemand de preview met agenda opent). Dan zie je de modules
  // niet; daarom hier meteen omzetten naar de salon-app met agenda.
  if (rij.soort !== "salon") {
    const full = await sb("/rest/v1/rpc/get_full", { method: "POST", body: JSON.stringify({ p_slug: slug }) });
    const inhoud = (full.ok && full.body) || {};
    const items = behandelingenUitContent(inhoud);
    if (items.length) {
      await sb("/rest/v1/rpc/sb_agenda_behandelingen_zet", { method: "POST", body: JSON.stringify({ p_company: rij.id, p_items: items }) });
    }
    await sb("/rest/v1/rpc/sb_agenda_standaard", { method: "POST", body: JSON.stringify({ p_company: rij.id, p_vak: vakTekst(inhoud), p_email: null }) });
  }
  const res = await sb("/rest/v1/company_modules?on_conflict=company_id", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify({ company_id: rij.id, modules: schoon, updated_at: new Date().toISOString(), updated_by: door || null }),
  });
  if (!res.ok) throw new Error("Opslaan mislukt.");
  return schoon;
}

// Modules van alle demo-apps, per previewslug (voor Mijn previews).
export async function demoModulesPerSlug() {
  if (!key()) return {};
  const [c, m] = await Promise.all([
    sb("/rest/v1/companies?demo_van_slug=not.is.null&select=id,demo_van_slug"),
    sb("/rest/v1/company_modules?select=company_id,modules"),
  ]);
  const perId = new Map((Array.isArray(m.body) ? m.body : []).map((r) => [r.company_id, r.modules || []]));
  const uit = {};
  for (const r of Array.isArray(c.body) ? c.body : []) uit[r.demo_van_slug] = perId.get(r.id) || [];
  return uit;
}

export function demoLink(slug) {
  return "https://demo.studiobaris.nl/" + slug;
}

// Demo-app maken voor een bestaande preview (haalt de inhoud zelf op).
export async function maakDemoAppVoorSlug(slug) {
  if (!key()) throw new Error("Server-key ontbreekt.");
  const res = await sb("/rest/v1/rpc/get_full", {
    method: "POST",
    body: JSON.stringify({ p_slug: slug }),
  });
  if (!res.ok || !res.body) throw new Error("Preview niet gevonden.");
  return maakDemoApp(slug, res.body);
}
