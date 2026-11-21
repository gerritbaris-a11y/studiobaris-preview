// Klantenregister op schaal (server-only).
//
// Eén plek die alle klantgegevens ophaalt, per klant de status en de
// "aandacht nodig"-signalen uitrekent, en filteren/sorteren/pagineren doet.
// De browser krijgt alleen de rijen van de huidige pagina — ook bij 1000+
// klanten blijft het scherm dus licht.
//
// Bronnen (alleen lezen): get_overview (workflow.previews), companies
// (app-account + plugin), site_monitor, facturen, projects/reviews.

import {
  getOverview, getKlantTechniek, getSiteMonitor, getAppGebruik,
  zoekAppAccount, appLinkInfo,
} from "./server-data";
import { getFacturenOverzicht } from "./abonnementen-data";

export const PER_PAGINA = 50;
export const INACTIEF_DAGEN = 30;
const NIEUWSTE_PLUGIN_TERUGVAL = "1.1.10";

// --- Hulpjes --------------------------------------------------------------

function vergelijkVersie(a, b) {
  const pa = String(a || "0").split(".").map((n) => parseInt(n, 10) || 0);
  const pb = String(b || "0").split(".").map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] || 0, y = pb[i] || 0;
    if (x !== y) return x < y ? -1 : 1;
  }
  return 0;
}

function normDomein(d) {
  return String(d || "").toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "").trim();
}

function dagenGeleden(iso) {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.floor((Date.now() - t) / 86400000);
}

async function haalNieuwstePluginVersie() {
  try {
    const res = await fetch("https://app.studiobaris.nl/api/plugin/sb-embed", { cache: "no-store" });
    if (!res.ok) return NIEUWSTE_PLUGIN_TERUGVAL;
    const data = await res.json();
    const v = data && typeof data.version === "string" ? data.version.trim() : "";
    return v || NIEUWSTE_PLUGIN_TERUGVAL;
  } catch {
    return NIEUWSTE_PLUGIN_TERUGVAL;
  }
}

export function klantStatus(r) {
  if (r.klantnummer && r.oud_klant) return "oud";
  if (r.klantnummer) return "klant";
  if (r.klant_kandidaat) return "toekomstig";
  return null; // gewone preview/lead: hoort niet in het register
}

export const STATUS_LABEL = { klant: "Actief", toekomstig: "Toekomstig", oud: "Oud-klant" };
export const SECTOR_LABEL = { portfolio: "Vakmannen", boeking: "Salons" };
export const PAKKET_LABEL = { vol: "Vol pakket", plugin: "Alleen plugin" };

// --- Signalen -------------------------------------------------------------
// ernst: "hoog" (nu oplossen), "midden" (deze week), "laag" (opruimen)

function signalenVoor(r, ctx) {
  const uit = [];
  const s = r.status;
  const t = r.techniek;

  if (s === "klant") {
    // Betaling
    if (r.betaal_status !== "actief" && Number(r.maandbedrag) > 0) {
      uit.push({ code: "betaling", ernst: "hoog", tekst: "Geen actief abonnement, wel een maandbedrag" });
    }
    const teLaat = r.facturen.filter((f) => f.status === "verstuurd" && f.vervaldatum && new Date(f.vervaldatum) < new Date());
    if (teLaat.length) {
      uit.push({ code: "factuur", ernst: "hoog", tekst: `${teLaat.length} factuur${teLaat.length > 1 ? "en" : ""} over de vervaldatum` });
    }

    // Website
    if (r.site && r.site.actief !== false && r.site.status && r.site.status !== "up") {
      uit.push({ code: "site", ernst: "hoog", tekst: `Website ${r.site.status}${r.site.laatste_fout ? ` (${String(r.site.laatste_fout).slice(0, 60)})` : ""}` });
    }
    if (t && (t.site_ververs_fout || t.plugin_bijwerk_fout)) {
      uit.push({ code: "sitefout", ernst: "midden", tekst: "Fout bij bijwerken van site of plugin" });
    }

    // Plugin
    if (t && t.plugin_versie && vergelijkVersie(t.plugin_versie, ctx.nieuwste) < 0) {
      uit.push({ code: "plugin", ernst: "midden", tekst: `Plugin ${t.plugin_versie}, nieuwste is ${ctx.nieuwste}` });
    }

    // App-gebruik
    if (!t) {
      uit.push({ code: "geenapp", ernst: "midden", tekst: "Geen app-account gekoppeld" });
    } else if (!t.login_token_used_at && !r.gebruik.laatst) {
      uit.push({ code: "appnooit", ernst: "midden", tekst: "App nog nooit gebruikt" });
    } else {
      const d = dagenGeleden(r.gebruik.laatst);
      if (d != null && d >= INACTIEF_DAGEN) {
        uit.push({ code: "inactief", ernst: "laag", tekst: `${d} dagen niets toegevoegd in de app` });
      }
    }

    // Administratie
    if (!r.verzamelaar) uit.push({ code: "verkoper", ernst: "laag", tekst: "Geen verkoper gekoppeld" });
    if (!r.b_kvk || !r.b_adres) uit.push({ code: "gegevens", ernst: "laag", tekst: "KvK of adres ontbreekt" });
    if (!(r.factuur_email || r.lead_email || r.b_email)) {
      uit.push({ code: "email", ernst: "midden", tekst: "Geen e-mailadres voor facturen" });
    }
  }

  if (s === "toekomstig") {
    const d = dagenGeleden(r.updated_at);
    if (d != null && d >= 14) uit.push({ code: "wacht", ernst: "laag", tekst: `Staat al ${d} dagen als toekomstig` });
  }

  return uit;
}

const ERNST_GEWICHT = { hoog: 3, midden: 2, laag: 1 };

// --- Laden ----------------------------------------------------------------

export async function laadRegister() {
  const [alles, techniek, monitor, facturen, gebruik, nieuwste] = await Promise.all([
    getOverview(),
    getKlantTechniek(),
    getSiteMonitor(),
    getFacturenOverzicht(),
    getAppGebruik(),
    haalNieuwstePluginVersie(),
  ]);

  const monitorOp = {};
  for (const m of monitor) monitorOp[normDomein(m.domain)] = m;

  const facturenOp = {};
  for (const f of Array.isArray(facturen) ? facturen : []) {
    (facturenOp[f.slug] ||= []).push(f);
  }

  const ctx = { nieuwste };
  const rijen = [];
  const kandidaten = [];

  for (const r of alles) {
    const status = klantStatus(r);
    if (!status) {
      if ((r.pipeline_status || "") !== "Afgewezen") kandidaten.push(r);
      continue;
    }
    const acc = zoekAppAccount(r, techniek);
    const domeinen = acc && Array.isArray(acc.allowed_domains) ? acc.allowed_domains.map(normDomein) : [];
    const site = domeinen.map((d) => monitorOp[d]).find(Boolean) || null;
    const rij = {
      ...r,
      status,
      techniek: acc || null,
      app: appLinkInfo(acc),
      domein: domeinen[0] || null,
      site,
      facturen: facturenOp[r.slug] || [],
      gebruik: (acc && gebruik[acc.id]) || { projecten: 0, reviews: 0, laatst: null },
    };
    rij.signalen = signalenVoor(rij, ctx);
    rij.ernst = rij.signalen.reduce((m, s) => Math.max(m, ERNST_GEWICHT[s.ernst] || 0), 0);
    rijen.push(rij);
  }

  return { rijen, kandidaten, nieuwste };
}

// --- Tellers, filteren, sorteren, pagineren --------------------------------

export function tellers(rijen) {
  const t = { klant: 0, toekomstig: 0, oud: 0, aandacht: 0, mrr: 0, betaalprobleem: 0, site: 0 };
  for (const r of rijen) {
    t[r.status]++;
    if (r.status === "klant") {
      t.mrr += Number(r.maandbedrag) || 0;
      if (r.ernst >= 2) t.aandacht++;
      if (r.signalen.some((s) => s.code === "betaling" || s.code === "factuur")) t.betaalprobleem++;
      if (r.signalen.some((s) => s.code === "site" || s.code === "sitefout")) t.site++;
    }
  }
  return t;
}

function zoekTekst(r) {
  return [
    r.klantnummer, r.company_name, r.slug, r.contactpersoon, r.lead_phone, r.b_telefoon,
    r.lead_email, r.b_email, r.factuur_email, r.b_adres, r.provincie, r.domein,
  ].filter(Boolean).join(" ").toLowerCase();
}

export function leesFilters(sp = {}) {
  const een = (k) => (Array.isArray(sp[k]) ? sp[k][0] : sp[k]) || "";
  return {
    q: een("q").trim(),
    status: een("status") || "klant",
    sector: een("sector"),
    pakket: een("pakket"),
    provincie: een("provincie"),
    verkoper: een("verkoper"),
    signaal: een("signaal"),
    sort: een("sort") || "nummer",
    pagina: Math.max(1, parseInt(een("pagina"), 10) || 1),
  };
}

export function filterEnPagineer(rijen, f) {
  const q = f.q.toLowerCase();
  let lijst = rijen.filter((r) => {
    if (f.status !== "alle" && r.status !== f.status) return false;
    if (f.sector && (r.sector || "") !== f.sector) return false;
    if (f.pakket && (r.pakket_type || "") !== f.pakket) return false;
    if (f.provincie && (r.provincie || "") !== f.provincie) return false;
    if (f.verkoper && (f.verkoper === "-" ? r.verzamelaar : r.verzamelaar !== f.verkoper)) return false;
    if (f.signaal === "aandacht" && r.ernst < 2) return false;
    if (f.signaal && f.signaal !== "aandacht" && !r.signalen.some((s) => s.code === f.signaal || (f.signaal === "betaal" && (s.code === "betaling" || s.code === "factuur")) || (f.signaal === "website" && (s.code === "site" || s.code === "sitefout")))) return false;
    if (q && !zoekTekst(r).includes(q)) return false;
    return true;
  });

  const naam = (r) => String(r.company_name || r.slug || "").toLowerCase();
  const sorteer = {
    nummer: (a, b) => (Number(a.klantnummer) || 1e9) - (Number(b.klantnummer) || 1e9) || naam(a).localeCompare(naam(b)),
    naam: (a, b) => naam(a).localeCompare(naam(b)),
    nieuw: (a, b) => (Number(b.klantnummer) || 0) - (Number(a.klantnummer) || 0) || String(b.updated_at).localeCompare(String(a.updated_at)),
    bedrag: (a, b) => (Number(b.maandbedrag) || 0) - (Number(a.maandbedrag) || 0),
    aandacht: (a, b) => b.ernst - a.ernst || b.signalen.length - a.signalen.length || naam(a).localeCompare(naam(b)),
  }[f.sort] || ((a, b) => 0);
  lijst = lijst.sort(sorteer);

  const totaal = lijst.length;
  const paginas = Math.max(1, Math.ceil(totaal / PER_PAGINA));
  const pagina = Math.min(f.pagina, paginas);
  const start = (pagina - 1) * PER_PAGINA;
  return { totaal, paginas, pagina, rijen: lijst.slice(start, start + PER_PAGINA) };
}

// Alleen wat de tabel nodig heeft — geen interne notities, betaal-id's e.d.
// naar de browser.
export function tabelRij(r) {
  return {
    slug: r.slug,
    klantnummer: r.klantnummer || null,
    naam: r.company_name || r.slug,
    contactpersoon: r.contactpersoon || null,
    telefoon: String(r.lead_phone || r.b_telefoon || "").replace(/[^\d+]/g, "") || null,
    email: r.factuur_email || r.lead_email || r.b_email || null,
    status: r.status,
    sector: r.sector || null,
    pakket: r.pakket_type || null,
    provincie: r.provincie || null,
    verkoper: r.verzamelaar || null,
    maandbedrag: Number(r.maandbedrag) || 0,
    signalen: r.signalen,
    ernst: r.ernst,
  };
}

export function keuzes(rijen) {
  const uniek = (fn) => [...new Set(rijen.map(fn).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  return {
    provincies: uniek((r) => r.provincie),
    verkopers: uniek((r) => r.verzamelaar),
    sectoren: uniek((r) => r.sector),
  };
}
