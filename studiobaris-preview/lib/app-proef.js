// App-proef (losse StudioBaris-app, alleen plugin) — server-only.
//
// Fase A (dashboard): proef starten, afrekenen, klant worden via de Mollie-
// webhook, dagelijkse controle, tabblad "App-proef" in het Klantenregister.
// Fase B (Gerrit, app + plugin): koppelknop, slot in de app, Abonnement-scherm.
// Zie bouwplan-fase-b-gerrit.md voor wat de app hiervan aanroept.
//
// Alle database-acties lopen via sb_app_* functies (service_role).

import crypto from "node:crypto";
import { BETAAL_BASIS } from "./betaallink";
import { KLANT_APP_BASE } from "./server-data";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ipiqrsxbsgylxhgzlhsd.supabase.co";

export const APP_PRO_MAAND_EXCL = 14.95;
export const PROEF_DAGEN = 7;

async function rpc(name, body) {
  const k = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!k) return null;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: { apikey: k, Authorization: `Bearer ${k}`, "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
    cache: "no-store",
  });
  if (!res.ok) return null;
  const t = await res.text();
  if (!t) return true;
  try { return JSON.parse(t); } catch { return true; }
}

// Eén app-account (alleen wat de afrekenpagina nodig heeft).
export async function getAccount(companyId) {
  const k = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!k || !/^[0-9a-f-]{36}$/i.test(String(companyId || ""))) return null;
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/companies?select=id,name,email,contact_naam,toegang,proef_eindigt_op,betaald_tot,allowed_domains&id=eq.${companyId}`,
    { headers: { apikey: k, Authorization: `Bearer ${k}` }, cache: "no-store" }
  );
  if (!res.ok) return null;
  const d = await res.json().catch(() => []);
  return Array.isArray(d) && d[0] ? d[0] : null;
}

// Webhook-adres voor Mollie. In productie het vaste adres; op een testversie
// (Vercel Preview) het adres van die testversie zelf, zodat testbetalingen
// nooit bij de echte webhook aankomen.
export function webhookUrl(req) {
  if (process.env.VERCEL_ENV === "production") {
    return `${process.env.NEXT_PUBLIC_SITE_URL || "https://preview.studiobaris.nl"}/api/mollie/webhook`;
  }
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  return `https://${host}/api/mollie/webhook${bypass ? `?x-vercel-protection-bypass=${encodeURIComponent(bypass)}` : ""}`;
}

// Basisadres voor terugkeer na betalen: productie = betalen.studiobaris.nl,
// testversie = het adres van die testversie.
export function paginaBasis(req) {
  if (process.env.VERCEL_ENV === "production") return BETAAL_BASIS;
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  return `https://${host}`;
}

// --- Invoer -----------------------------------------------------------------

export function normDomein(d) {
  return String(d || "").toLowerCase().trim()
    .replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/[/?#].*$/, "").replace(/:\d+$/, "");
}

export function geldigDomein(d) {
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(d) && d.length <= 120;
}

export function geldigEmail(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e || "").trim()) && String(e).length <= 160;
}

// --- Schakelaar -------------------------------------------------------------

export async function getInstelling() {
  const d = await rpc("sb_app_proef_instelling");
  return d && typeof d === "object" ? d : { open: false };
}

export async function zetSchakelaar(open, door) {
  return await rpc("sb_app_proef_schakelaar", { p_open: !!open, p_door: door || null });
}

// Testen kan vóór de lancering via een geheime link: /app/proef?test=<APP_PROEF_TESTCODE>
export function testcodeKlopt(code) {
  const geheim = process.env.APP_PROEF_TESTCODE;
  return !!geheim && !!code && code.length === geheim.length &&
    crypto.timingSafeEqual(Buffer.from(code), Buffer.from(geheim));
}

// Controle voor de schakelaar: is Gerrits deel (fase B) al zichtbaar?
// De app meldt dat via GET <app>/api/app/status → { slot: true, koppelknop: true }.
// Bestaat die route nog niet, dan staan beide op "nee".
export async function controleFaseB() {
  try {
    const res = await fetch(`${KLANT_APP_BASE}/api/app/status`, { cache: "no-store" });
    if (!res.ok) return { slot: false, koppelknop: false };
    const d = await res.json();
    return { slot: d && d.slot === true, koppelknop: d && d.koppelknop === true };
  } catch {
    return { slot: false, koppelknop: false };
  }
}

// --- Proeven ---------------------------------------------------------------

export async function startProef({ naam, bedrijf, email, domein }) {
  return await rpc("sb_app_proef_start", {
    p_naam: naam || null, p_bedrijf: bedrijf, p_email: email, p_domein: domein, p_dagen: PROEF_DAGEN,
  });
}

export async function getProeven() {
  const d = await rpc("sb_app_proef_lijst");
  return Array.isArray(d) ? d : [];
}

export async function afrekenenVoorbereiden({ companyId, factuurEmail, contact, kvk, btw }) {
  return await rpc("sb_app_proef_afrekenen_voorbereiden", {
    p_company_id: companyId, p_factuur_email: factuurEmail || null,
    p_contact: contact || null, p_kvk: kvk || null, p_btw: btw || null,
  });
}

export async function zetToegang(companyId, toegang, betaaldTot = null) {
  return await rpc("sb_app_toegang_zet", { p_company_id: companyId, p_toegang: toegang, p_betaald_tot: betaaldTot });
}

export async function naarOpvolging(companyId, verkoper) {
  return await rpc("sb_app_proef_naar_opvolging", { p_company_id: companyId, p_verkoper: verkoper || null });
}

export async function dagelijks() {
  return await rpc("sb_app_proef_dagelijks");
}

export async function mailGestuurd(companyId, soort) {
  return await rpc("sb_app_proef_mail_gestuurd", { p_company_id: companyId, p_soort: soort });
}

// --- Status voor het tabblad -------------------------------------------------

export function proefStatus(p) {
  if (p.toegang === "pro" || p.toegang === "achterstallig" || p.klantnummer) return "pro";
  if (p.toegang === "proef") return "loopt";
  return "verlopen"; // verlopen of opgezegd zonder te betalen
}

export function dagenOver(iso) {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
}

export function conversie(proeven, vanaf = null) {
  const lijst = vanaf ? proeven.filter((p) => p.created_at >= vanaf) : proeven;
  const t = { gestart: lijst.length, loopt: 0, pro: 0, verlopen: 0 };
  for (const p of lijst) t[proefStatus(p)]++;
  const afgerond = t.pro + t.verlopen;
  t.procent = afgerond ? Math.round((t.pro / afgerond) * 100) : null;
  t.afgerond = afgerond;
  return t;
}

// --- Afreken-link (ook te gebruiken door de app in fase B) ----------------------
// Formaat: <company_id>.<handtekening>. De app maakt dezelfde link met
// hetzelfde geheim (APP_PROEF_SECRET, in beide Vercel-projecten gelijk).

function geheim() {
  return process.env.APP_PROEF_SECRET || process.env.SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
}

export function afrekenToken(companyId) {
  const sig = crypto.createHmac("sha256", geheim()).update(String(companyId)).digest("base64url").slice(0, 32);
  return `${companyId}.${sig}`;
}

export function leesAfrekenToken(token) {
  const [id, sig] = String(token || "").split(".");
  if (!id || !sig || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  const goed = afrekenToken(id).split(".")[1];
  if (sig.length !== goed.length) return null;
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(goed)) ? id : null;
}

export function afrekenUrl(companyId) {
  return `${BETAAL_BASIS}/app/pro?k=${encodeURIComponent(afrekenToken(companyId))}`;
}

// --- Mails ------------------------------------------------------------------

function datumLang(iso) {
  return new Date(iso).toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Amsterdam" });
}

function omhulsel(binnen) {
  return `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#1E2A35;max-width:560px">
    ${binnen}
    <p style="margin-top:24px">Groet,<br><strong>StudioBaris</strong><br>
    <span style="color:#7A8590;font-size:13px">info@studiobaris.nl · 06 16 73 21 05</span></p></div>`;
}

const knop = (url, tekst) =>
  `<p><a href="${url}" style="display:inline-block;background:#1E2A35;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:bold">${tekst}</a></p>`;

export function mailInhoud(soort, p) {
  const aan = p.contact ? `Hoi ${String(p.contact).split(" ")[0]},` : "Hoi,";
  const pro = afrekenUrl(p.company_id);
  if (soort === "welkom") {
    const download = process.env.APP_PLUGIN_DOWNLOAD_URL || `${KLANT_APP_BASE}/plugin`;
    return {
      onderwerp: "Je proef van de StudioBaris-app staat klaar",
      html: omhulsel(`<p>${aan}</p>
        <p>Leuk dat je de StudioBaris-app uitprobeert. Je hebt 7 dagen alle functies, tot en met ${datumLang(p.proef_eindigt_op)}. Je hoeft niets te betalen en er loopt niets automatisch door.</p>
        <p><strong>Zo begin je:</strong></p>
        <ol>
          <li>Download de plugin en installeer hem in WordPress (Plugins → Nieuwe plugin → Plugin uploaden).</li>
          <li>Druk in de plugin op <strong>Koppel met StudioBaris</strong>.</li>
          <li>Open de app op je telefoon en plaats je eerste klus.</li>
        </ol>
        ${knop(download, "Plugin downloaden")}
        ${knop(`${KLANT_APP_BASE}/in/${p.login_token}`, "App openen")}
        <p style="color:#7A8590;font-size:13px">Liever direct doorgaan? Dat kan altijd: <a href="${pro}">Pro voor € 14,95 per maand excl. btw</a>, maandelijks opzegbaar.</p>`),
    };
  }
  if (soort === "dag5") {
    return {
      onderwerp: "Nog 2 dagen je StudioBaris-app op proef",
      html: omhulsel(`<p>${aan}</p>
        <p>Je proef loopt af op ${datumLang(p.proef_eindigt_op)}. Daarna kun je geen nieuwe klussen meer plaatsen. Wat al op je website staat, blijft gewoon staan.</p>
        <p>Wil je doorgaan? Pro kost € 14,95 per maand excl. btw en is maandelijks opzegbaar. Je eerste betaalde maand gaat pas in als je proef voorbij is.</p>
        ${knop(pro, "Doorgaan met Pro")}
        <p>Liep je ergens tegenaan? Antwoord op deze mail, dan helpen we je.</p>`),
    };
  }
  return {
    onderwerp: "Je proef van de StudioBaris-app is afgelopen",
    html: omhulsel(`<p>${aan}</p>
      <p>Je proefperiode is voorbij. Alles wat je hebt geplaatst, blijft op je website staan. Nieuwe klussen plaatsen kan weer zodra je Pro neemt.</p>
      ${knop(pro, "Doorgaan met Pro")}
      <p>€ 14,95 per maand excl. btw, maandelijks opzegbaar.</p>`),
  };
}

export async function stuurMail(soort, p) {
  const key = process.env.RESEND_API_KEY;
  if (!key || !p.email) return { sent: false, reason: "geen RESEND_API_KEY of e-mail" };
  const { onderwerp, html } = mailInhoud(soort, p);
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "StudioBaris <info@studiobaris.nl>",
        to: p.email,
        reply_to: "info@studiobaris.nl",
        subject: onderwerp,
        html,
      }),
    });
    return { sent: res.ok };
  } catch (e) {
    return { sent: false, reason: String(e.message || e) };
  }
}
