// Server-only: de actuele leadlijst uit de Google Sheet halen en naar Supabase
// synchroniseren. De Sheet is de bron voor de bedrijfsgegevens; wat het team op
// het dashboard doet (oppakken, status, notities) blijft altijd staan.

// De Sheet staat op "iedereen met de link mag bekijken", dus de CSV-export is
// zonder inloggen op te halen. Via LEADS_SHEET_CSV_URL is een andere Sheet of
// een ander tabblad in te stellen zonder codewijziging.
const STANDAARD_URL =
  "https://docs.google.com/spreadsheets/d/1XpYSMQ-UozimrlGN174DYVxfnyqb6W64mgmLNJ2iCjw/export?format=csv&gid=1005300558";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ipiqrsxbsgylxhgzlhsd.supabase.co";

const VERPLICHT = ["bedrijfsnaam", "website_status"];

// Kleine, volledige CSV-parser (aanhalingstekens, komma's en regeleinden binnen
// een veld, "" als escape). Geen extra dependency nodig.
export function parseCsv(tekst) {
  const rijen = [];
  let rij = [];
  let veld = "";
  let inQuotes = false;
  const s = String(tekst || "").replace(/^﻿/, "");
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') { veld += '"'; i++; }
        else inQuotes = false;
      } else veld += c;
      continue;
    }
    if (c === '"') inQuotes = true;
    else if (c === ",") { rij.push(veld); veld = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && s[i + 1] === "\n") i++;
      rij.push(veld); veld = "";
      if (rij.some((v) => v.trim() !== "")) rijen.push(rij);
      rij = [];
    } else veld += c;
  }
  rij.push(veld);
  if (rij.some((v) => v.trim() !== "")) rijen.push(rij);
  if (rijen.length === 0) return [];

  const kop = rijen[0].map((k) => k.trim().toLowerCase());
  return rijen.slice(1).map((r) => {
    const o = {};
    kop.forEach((k, i) => { if (k) o[k] = (r[i] || "").trim(); });
    return o;
  });
}

export async function haalSheet() {
  const url = process.env.LEADS_SHEET_CSV_URL || STANDAARD_URL;
  const res = await fetch(url, { cache: "no-store", redirect: "follow" });
  if (!res.ok) throw new Error(`Sheet niet op te halen (HTTP ${res.status}).`);
  const tekst = await res.text();
  // Staat de Sheet niet (meer) op "iedereen met de link", dan krijg je een
  // inlogpagina terug in plaats van CSV.
  if (/^\s*<(!doctype|html)/i.test(tekst)) {
    throw new Error("De Sheet is niet openbaar leesbaar (zet delen op 'iedereen met de link').");
  }
  const rijen = parseCsv(tekst);
  if (rijen.length === 0) throw new Error("De Sheet is leeg.");
  const ontbreekt = VERPLICHT.filter((k) => !(k in rijen[0]));
  if (ontbreekt.length) throw new Error("Kolom ontbreekt in de Sheet: " + ontbreekt.join(", "));
  return rijen.filter((r) => (r.bedrijfsnaam || "").trim() !== "");
}

// Haalt de Sheet op en zet hem in Supabase. Geeft de tellingen terug.
export async function syncLeadsUitSheet() {
  const rijen = await haalSheet();
  const k = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!k) throw new Error("SUPABASE_SERVICE_ROLE_KEY ontbreekt.");
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/sb_leads_sync`, {
    method: "POST",
    cache: "no-store",
    headers: { apikey: k, Authorization: `Bearer ${k}`, "Content-Type": "application/json" },
    body: JSON.stringify({ p_rijen: rijen }),
  });
  if (!res.ok) throw new Error(`Opslaan mislukt (HTTP ${res.status}).`);
  return await res.json();
}
