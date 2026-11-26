// Wekelijkse backup van het hele dashboard naar Google Drive, zodat Levi en
// Gerrit bij hun gegevens kunnen als Vercel, Supabase of het internet even
// plat ligt. Server-only, nooit client-side importeren.
//
// In de Drive (account van de bestaande factuur-backup) komt:
//
//   StudioBaris/Back-up/
//     2026-11-29/                      ← één map per week, max. BEWAAR_WEKEN
//       LEESMIJ.txt                    ← wat erin zit + hoe je het terugzet
//       database/<schema>.<tabel>.csv  ← opent in Excel (puntkomma, UTF-8)
//       database/<schema>.<tabel>.json ← exacte kopie, om terug te zetten
//       database-opbouw.json           ← kolommen, functies, policies, views
//       code-dashboard.zip             ← broncode van deze app (GitHub)
//       code-app.zip                   ← broncode StudioBaris-app (als GITHUB_BACKUP_TOKEN is ingesteld)
//       instellingen-overzicht.json    ← NAMEN van de omgevingsvariabelen (nooit de waardes)
//     Bestanden (doorlopend bijgewerkt)/<bucket>/...
//                                      ← foto's, bonnen, klantmedia: één spiegel
//                                        die dagelijks wordt aangevuld, geen
//                                        wekelijkse kopie (scheelt ruim 1 GB)
//
// public.ops_secrets gaat bewust NOOIT mee (zie supabase/backup.sql).
// De database-functies staan in supabase/backup.sql.

import { haalToegangstoken } from "./drive-backup";
import { getTaken, maakTaak } from "./taken-data";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ipiqrsxbsgylxhgzlhsd.supabase.co";
const DRIVE = "https://www.googleapis.com/drive/v3";
const UPLOAD = "https://www.googleapis.com/upload/drive/v3";
const MAP_MIME = "application/vnd.google-apps.folder";

export const HOOFDMAP = "StudioBaris/Back-up";
export const SPIEGELMAP = "Bestanden (doorlopend bijgewerkt)";
export const BEWAAR_WEKEN = 4;
// Alles komt in de vaste Drive-map StudioBaris > Back-up (eigendom van
// peacestarmedia@gmail.com, binnen de met Gerrit gedeelde map StudioBaris).
// Let op: de refresh token moet de volledige scope .../auth/drive hebben;
// met drive.file mag de app niet in een map die hij niet zelf heeft gemaakt.
const BACKUP_MAP_ID = process.env.GOOGLE_DRIVE_DASHBOARD_BACKUP_FOLDER_ID || "1JctPoHMPCCHkfEWuqjxj4EPecmTVsAoT";
const PAGINA = 5000;

// GitHub-repo's waarvan de code meegaat.
const REPO_DASHBOARD = "gerritbaris-a11y/studiobaris-preview"; // openbaar, geen token nodig
const REPO_APP = "gerritbaris-a11y/studiobaris"; // privé, alleen met GITHUB_BACKUP_TOKEN

// ---------- Supabase ----------

function sbKey() {
  const k = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!k) throw new Error("SUPABASE_SERVICE_ROLE_KEY ontbreekt in de serveromgeving.");
  return k;
}

async function rpc(naam, body) {
  const k = sbKey();
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${naam}`, {
    method: "POST",
    headers: { apikey: k, Authorization: `Bearer ${k}`, "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
    cache: "no-store",
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`${naam} mislukte (${res.status}): ${t.slice(0, 200)}`);
  }
  return res.json();
}

async function alleRijen(schema, tabel) {
  const rijen = [];
  for (let offset = 0; ; offset += PAGINA) {
    const pagina = await rpc("sb_backup_tabel", {
      p_schema: schema, p_tabel: tabel, p_offset: offset, p_limit: PAGINA,
    });
    const lijst = Array.isArray(pagina) ? pagina : [];
    rijen.push(...lijst);
    if (lijst.length < PAGINA) break;
  }
  return rijen;
}

async function haalStorageBestand(bucket, pad) {
  const k = sbKey();
  const url = `${SUPABASE_URL}/storage/v1/object/${encodeURIComponent(bucket)}/${pad
    .split("/").map(encodeURIComponent).join("/")}`;
  const res = await fetch(url, { headers: { apikey: k, Authorization: `Bearer ${k}` }, cache: "no-store" });
  if (!res.ok) throw new Error(`downloaden ${bucket}/${pad} mislukte (${res.status})`);
  return Buffer.from(await res.arrayBuffer());
}

// ---------- Google Drive ----------

async function token() {
  const t = await haalToegangstoken();
  if (!t) throw new Error("Geen Drive-toegang: GOOGLE_DRIVE_OAUTH_* of GOOGLE_DRIVE_REFRESH_TOKEN ontbreekt of is ongeldig.");
  return t;
}

function q(s) {
  return String(s).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

async function drive(pad, { method = "GET", body, headers = {} } = {}) {
  const res = await fetch(`${DRIVE}${pad}`, {
    method,
    headers: { Authorization: `Bearer ${await token()}`, ...headers },
    body,
    cache: "no-store",
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Drive ${method} ${pad.split("?")[0]} mislukte (${res.status}): ${t.slice(0, 200)}`);
  }
  return res.status === 204 ? null : res.json();
}

async function lijst(query) {
  const uit = [];
  let pageToken = "";
  do {
    const params = new URLSearchParams({
      q: query,
      fields: "nextPageToken,files(id,name,size,mimeType)",
      pageSize: "1000",
      supportsAllDrives: "true",
      includeItemsFromAllDrives: "true",
    });
    if (pageToken) params.set("pageToken", pageToken);
    const data = await drive(`/files?${params}`);
    uit.push(...(data.files || []));
    pageToken = data.nextPageToken || "";
  } while (pageToken);
  return uit;
}

async function zoekMap(naam, ouder) {
  const gevonden = await lijst(
    `name = '${q(naam)}' and '${q(ouder)}' in parents and mimeType = '${MAP_MIME}' and trashed = false`
  );
  return gevonden[0] || null;
}

async function maakMap(naam, ouder) {
  return drive("/files?supportsAllDrives=true&fields=id,name", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: naam, mimeType: MAP_MIME, parents: [ouder] }),
  });
}

async function hoofdmap() {
  return { id: BACKUP_MAP_ID };
}

export async function logRun(soort, uitkomst) {
  try {
    await rpc("sb_backup_log", { p_soort: soort, p_ok: !!(uitkomst && uitkomst.ok), p_uitkomst: uitkomst });
  } catch {}
}

async function zoekOfMaakMap(naam, ouder) {
  return (await zoekMap(naam, ouder)) || maakMap(naam, ouder);
}

async function naarPrullenbak(id) {
  return drive(`/files/${id}?supportsAllDrives=true`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ trashed: true }),
  });
}

// Resumable upload: werkt voor kleine én grote bestanden (tot vele GB's).
async function upload(naam, ouder, mime, inhoud) {
  const bytes = Buffer.isBuffer(inhoud) ? inhoud : Buffer.from(inhoud, "utf8");
  const t = await token();
  const start = await fetch(`${UPLOAD}/files?uploadType=resumable&supportsAllDrives=true&fields=id`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${t}`,
      "Content-Type": "application/json; charset=UTF-8",
      "X-Upload-Content-Type": mime,
      "X-Upload-Content-Length": String(bytes.length),
    },
    body: JSON.stringify({ name: naam, parents: [ouder] }),
  });
  if (!start.ok) {
    const tekst = await start.text().catch(() => "");
    throw new Error(`upload starten "${naam}" mislukte (${start.status}): ${tekst.slice(0, 200)}`);
  }
  const plek = start.headers.get("location");
  const res = await fetch(plek, {
    method: "PUT",
    headers: { "Content-Type": mime, "Content-Length": String(bytes.length) },
    body: bytes,
  });
  if (!res.ok) {
    const tekst = await res.text().catch(() => "");
    throw new Error(`upload "${naam}" mislukte (${res.status}): ${tekst.slice(0, 200)}`);
  }
  return res.json();
}

// ---------- Hulpjes ----------

function amsterdamDatum(d = new Date()) {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Amsterdam" }).format(d); // YYYY-MM-DD
}

function naarCsv(rijen) {
  const kolommen = [];
  const gezien = new Set();
  for (const r of rijen) for (const k of Object.keys(r)) if (!gezien.has(k)) { gezien.add(k); kolommen.push(k); }
  const cel = (v) => {
    if (v === null || v === undefined) return "";
    const s = typeof v === "object" ? JSON.stringify(v) : String(v);
    return /[;"\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const regels = [kolommen.map(cel).join(";")];
  for (const r of rijen) regels.push(kolommen.map((k) => cel(r[k])).join(";"));
  return "﻿" + regels.join("\r\n"); // BOM zodat Excel de é's goed toont
}

async function metMaxTegelijk(items, max, fn) {
  let i = 0;
  const werkers = Array.from({ length: Math.min(max, items.length) }, async () => {
    while (i < items.length) {
      const item = items[i++];
      await fn(item);
    }
  });
  await Promise.all(werkers);
}

async function haalZip(repo, metToken) {
  const headers = { "User-Agent": "studiobaris-backup" };
  let url = `https://codeload.github.com/${repo}/zip/refs/heads/main`;
  if (metToken) {
    url = `https://api.github.com/repos/${repo}/zipball/main`;
    headers.Authorization = `Bearer ${metToken}`;
    headers.Accept = "application/vnd.github+json";
  }
  const res = await fetch(url, { headers, redirect: "follow", cache: "no-store" });
  if (!res.ok) throw new Error(`code van ${repo} ophalen mislukte (${res.status})`);
  return Buffer.from(await res.arrayBuffer());
}

function mb(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

async function meldOpBord(titel, omschrijving) {
  try {
    const taken = await getTaken();
    const bestaatAl = (Array.isArray(taken) ? taken : []).some((t) => t.kolom !== "klaar" && t.titel === titel);
    if (bestaatAl) return;
    await maakTaak({ titel, omschrijving, prioriteit: "hoog", kolom: "te_doen", aangemaaktDoor: "Cron (Back-up)" });
  } catch {
    // Melden is best effort; de backup-uitkomst staat ook in de response.
  }
}

// ---------- Wekelijkse backup ----------

export async function maakWekelijkseBackup() {
  const begin = Date.now();
  const fouten = [];
  const datum = amsterdamDatum();

  const hoofd = await hoofdmap();

  // Draait hij vandaag een tweede keer, dan vervangen we de map van vandaag.
  const bestaand = await zoekMap(datum, hoofd.id);
  if (bestaand) await naarPrullenbak(bestaand.id);
  const week = await maakMap(datum, hoofd.id);
  const dbMap = await maakMap("database", week.id);

  // 1. Alle tabellen.
  const tabellen = await rpc("sb_backup_tabellen");
  const telling = [];
  await metMaxTegelijk(tabellen, 3, async ({ schema, tabel }) => {
    try {
      const rijen = await alleRijen(schema, tabel);
      const naam = `${schema}.${tabel}`;
      await upload(`${naam}.json`, dbMap.id, "application/json", JSON.stringify(rijen, null, 1));
      await upload(`${naam}.csv`, dbMap.id, "text/csv", naarCsv(rijen));
      telling.push({ naam, rijen: rijen.length });
    } catch (e) {
      fouten.push(`tabel ${schema}.${tabel}: ${e.message}`);
    }
  });
  telling.sort((a, b) => a.naam.localeCompare(b.naam));

  // 2. De opbouw van de database.
  try {
    const opbouw = await rpc("sb_backup_schema");
    await upload("database-opbouw.json", week.id, "application/json", JSON.stringify(opbouw, null, 1));
  } catch (e) {
    fouten.push(`database-opbouw: ${e.message}`);
  }

  // 3. De code.
  const code = [];
  try {
    const zip = await haalZip(REPO_DASHBOARD);
    await upload("code-dashboard.zip", week.id, "application/zip", zip);
    code.push(`code-dashboard.zip (${REPO_DASHBOARD}, ${mb(zip.length)})`);
  } catch (e) {
    fouten.push(`code dashboard: ${e.message}`);
  }
  const ghToken = process.env.GITHUB_BACKUP_TOKEN;
  if (ghToken) {
    try {
      const zip = await haalZip(REPO_APP, ghToken);
      await upload("code-app.zip", week.id, "application/zip", zip);
      code.push(`code-app.zip (${REPO_APP}, ${mb(zip.length)})`);
    } catch (e) {
      fouten.push(`code app: ${e.message}`);
    }
  } else {
    code.push(`(code van ${REPO_APP} niet meegenomen: stel GITHUB_BACKUP_TOKEN in om die ook te bewaren)`);
  }

  // 4. Welke instellingen er zijn (alleen namen, NOOIT waardes).
  try {
    const systeem = /^(PATH|HOME|PWD|LANG|LC_|TZ|SHLVL|HOSTNAME|TERM|NODE_|npm_|AWS_|LAMBDA_|_|VERCEL|NOW_|NX_|TURBO|CI$)/;
    const namen = Object.keys(process.env).filter((k) => !systeem.test(k)).sort();
    await upload("instellingen-overzicht.json", week.id, "application/json", JSON.stringify({
      uitleg: "Namen van de omgevingsvariabelen in Vercel (Settings > Environment Variables). De waardes staan hier bewust NIET in; die staan in Vercel en bij Levi/Gerrit.",
      namen,
    }, null, 1));
  } catch (e) {
    fouten.push(`instellingen-overzicht: ${e.message}`);
  }

  // 5. Oude weken opruimen: alleen de nieuwste BEWAAR_WEKEN blijven staan.
  const opgeruimd = [];
  try {
    const mappen = (await lijst(`'${q(hoofd.id)}' in parents and mimeType = '${MAP_MIME}' and trashed = false`))
      .filter((m) => /^\d{4}-\d{2}-\d{2}$/.test(m.name))
      .sort((a, b) => b.name.localeCompare(a.name));
    for (const m of mappen.slice(BEWAAR_WEKEN)) {
      await naarPrullenbak(m.id);
      opgeruimd.push(m.name);
    }
  } catch (e) {
    fouten.push(`opruimen oude weken: ${e.message}`);
  }

  // 6. LEESMIJ.
  const totaalRijen = telling.reduce((s, t) => s + t.rijen, 0);
  const leesmij = [
    `BACK-UP STUDIOBARIS DASHBOARD — ${datum}`,
    ``,
    `Gemaakt: ${new Date().toLocaleString("nl-NL", { timeZone: "Europe/Amsterdam" })}`,
    `Duur: ${Math.round((Date.now() - begin) / 1000)} seconden`,
    `Status: ${fouten.length ? `KLAAR MET ${fouten.length} FOUT(EN), zie onderaan` : "volledig gelukt"}`,
    ``,
    `WAT ZIT ERIN`,
    `- database/: ${telling.length} tabellen, ${totaalRijen} rijen in totaal.`,
    `  .csv opent in Excel (puntkomma-gescheiden). .json is de exacte kopie om terug te zetten.`,
    `- database-opbouw.json: kolommen, sleutels, functies, policies, views en triggers.`,
    ...code.map((c) => `- ${c}`),
    `- instellingen-overzicht.json: namen van de instellingen in Vercel (zonder waardes).`,
    `- Foto's, bonnen en klantmedia staan in de map "${SPIEGELMAP}" naast deze weekmappen.`,
    ``,
    `NIET MEEGENOMEN (BEWUST)`,
    `- public.ops_secrets (wachtwoorden en sleutels).`,
    `- De inlogaccounts van Supabase zelf (auth). Teamlogins staan wél in public.app_users.`,
    ``,
    `BEWAARTERMIJN`,
    `Elke zondagnacht een nieuwe map; de nieuwste ${BEWAAR_WEKEN} blijven staan, oudere gaan naar de prullenbak.`,
    opgeruimd.length ? `Deze keer naar de prullenbak: ${opgeruimd.join(", ")}.` : ``,
    ``,
    `TERUGZETTEN`,
    `Vraag Claude: "zet de back-up van ${datum} terug" en geef deze map. De .json-bestanden`,
    `kunnen per tabel worden teruggeladen in Supabase; database-opbouw.json bevat alle functies.`,
    ``,
    `AANTAL RIJEN PER TABEL`,
    ...telling.map((t) => `  ${t.naam}: ${t.rijen}`),
    ...(fouten.length ? [``, `FOUTEN`, ...fouten.map((f) => `  - ${f}`)] : []),
  ].join("\n");
  await upload("LEESMIJ.txt", week.id, "text/plain", leesmij);

  if (fouten.length) {
    await meldOpBord(
      `Wekelijkse back-up ${datum} niet helemaal gelukt`,
      `De back-up in Google Drive (${HOOFDMAP}/${datum}) is gemaakt, maar ${fouten.length} onderdeel/onderdelen mislukten:\n\n${fouten.slice(0, 15).join("\n")}`
    );
  }

  return {
    ok: fouten.length === 0,
    datum,
    map: `https://drive.google.com/drive/folders/${week.id}`,
    tabellen: telling.length,
    rijen: totaalRijen,
    code,
    opgeruimd,
    fouten,
    seconden: Math.round((Date.now() - begin) / 1000),
  };
}

// ---------- Doorlopende bestandsspiegel ----------

// Zet nieuwe of gewijzigde bestanden uit Supabase Storage in de Drive.
// Stopt netjes zodra het tijdbudget op is; de volgende run gaat verder.
export async function spiegelBestanden({ tijdbudgetMs = 240000 } = {}) {
  const begin = Date.now();
  const fouten = [];
  const hoofd = await hoofdmap();
  const spiegel = await zoekOfMaakMap(SPIEGELMAP, hoofd.id);

  const objecten = await rpc("sb_backup_bestanden");
  const perBucket = new Map();
  for (const o of objecten) {
    if (!perBucket.has(o.bucket)) perBucket.set(o.bucket, []);
    perBucket.get(o.bucket).push(o);
  }

  let nieuw = 0, bijgewerkt = 0, bytes = 0, overgeslagen = 0;
  let tijdOp = false;

  for (const [bucket, lijstObjecten] of perBucket) {
    if (tijdOp) break;
    const map = await zoekOfMaakMap(bucket, spiegel.id);
    const inDrive = new Map();
    for (const f of await lijst(`'${q(map.id)}' in parents and trashed = false`)) inDrive.set(f.name, f);

    const teDoen = lijstObjecten.filter((o) => {
      const d = inDrive.get(o.pad);
      return !d || Number(d.size || 0) !== Number(o.grootte || 0);
    });
    overgeslagen += lijstObjecten.length - teDoen.length;

    await metMaxTegelijk(teDoen, 4, async (o) => {
      if (Date.now() - begin > tijdbudgetMs) { tijdOp = true; return; }
      try {
        const inhoud = await haalStorageBestand(bucket, o.pad);
        const oud = inDrive.get(o.pad);
        await upload(o.pad, map.id, o.type || "application/octet-stream", inhoud);
        if (oud) { await naarPrullenbak(oud.id); bijgewerkt++; } else { nieuw++; }
        bytes += inhoud.length;
      } catch (e) {
        if (fouten.length < 20) fouten.push(`${bucket}/${o.pad}: ${e.message}`);
      }
    });
  }

  if (fouten.length >= 10) {
    await meldOpBord(
      "Bestandsspiegel back-up loopt vast",
      `Bij het bijwerken van "${HOOFDMAP}/${SPIEGELMAP}" in Google Drive mislukten ${fouten.length}+ bestanden, bijvoorbeeld:\n\n${fouten.slice(0, 10).join("\n")}`
    );
  }

  return {
    ok: fouten.length === 0,
    klaar: !tijdOp,
    nieuw, bijgewerkt, alAanwezig: overgeslagen,
    geupload: mb(bytes),
    totaalInStorage: objecten.length,
    fouten,
    seconden: Math.round((Date.now() - begin) / 1000),
  };
}
