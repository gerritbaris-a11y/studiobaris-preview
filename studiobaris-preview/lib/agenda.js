// Online agenda voor salons (server-only). Eén boekingssysteem voor de
// previewsite (testmodus) en de echte klantsite (live, via de SB Embed-plugin).
// Database: supabase/agenda.sql. Mails via Resend, WhatsApp via de Meta Cloud
// API (alleen als WHATSAPP_TOKEN + WHATSAPP_PHONE_ID zijn ingesteld; anders e-mail).

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ipiqrsxbsgylxhgzlhsd.supabase.co";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://preview.studiobaris.nl";
const TZ = "Europe/Amsterdam";

async function rpc(name, body) {
  const k = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!k) throw new Error("SUPABASE_SERVICE_ROLE_KEY ontbreekt.");
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: { apikey: k, Authorization: `Bearer ${k}`, "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
    cache: "no-store",
  });
  const tekst = await res.text();
  if (!res.ok) throw new Error(`${name} mislukt (${res.status}): ${tekst.slice(0, 200)}`);
  if (!tekst) return null;
  try { return JSON.parse(tekst); } catch { return tekst; }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (v) => UUID.test(String(v || ""));
export const isDatum = (v) => /^\d{4}-\d{2}-\d{2}$/.test(String(v || ""));
export const isTijd = (v) => /^\d{2}:\d{2}$/.test(String(v || ""));

// ---- Gegevens ----

export async function agendaVoorSlug(slug) {
  return rpc("sb_agenda_publiek", { p_slug: slug, p_company: null });
}
export async function agendaVoorBedrijf(companyId) {
  return rpc("sb_agenda_publiek", { p_slug: null, p_company: companyId });
}
// Agenda voor een preview: haalt hem op via het demo-bedrijf van die preview en
// zet hem bij de eerste keer klaar met voorbeeldbehandelingen voor het vak en
// het e-mailadres uit de intake (de prospect kan dat in de testbalk wijzigen).
export async function agendaVoorPreview(slug, content) {
  let agenda = await agendaVoorSlug(slug);
  if (!agenda) return null;                       // nog geen demo-bedrijf
  if (!agenda.instellingen || !(agenda.behandelingen || []).length) {
    const b = (content && content.bedrijf) || {};
    await zetAgendaKlaar(agenda.company_id, b.branche || "", b.email || null);
    agenda = await agendaVoorSlug(slug);
  }
  return agenda;
}

// "Morgen 10:30" / "vandaag 16:15" / "do 6 nov 9:00": eerstvolgende vrije plek
// voor de kortste behandeling. Voor de regel "open vandaag" op de salonsite.
export async function eerstePlekLabel(agenda) {
  try {
    const beh = [...((agenda && agenda.behandelingen) || [])].sort((a, b) => a.duur_min - b.duur_min)[0];
    if (!beh) return null;
    const dagen = await vrijeDagen(agenda.company_id, beh.id, 14);
    if (!dagen.length) return null;
    const tijden = await vrijeTijden(agenda.company_id, beh.id, dagen[0]);
    if (!tijden.length) return null;
    const vandaag = new Date().toLocaleDateString("sv-SE", { timeZone: TZ });
    const morgen = new Date(Date.now() + 86400000).toLocaleDateString("sv-SE", { timeZone: TZ });
    const [j, m, d] = dagen[0].split("-").map(Number);
    const dagTekst = dagen[0] === vandaag ? "vandaag" : dagen[0] === morgen ? "morgen"
      : new Date(Date.UTC(j, m - 1, d, 12)).toLocaleDateString("nl-NL", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
    return `${dagTekst} ${tijden[0]}`;
  } catch {
    return null;
  }
}

export async function zetAgendaKlaar(companyId, vak, email) {
  return rpc("sb_agenda_standaard", { p_company: companyId, p_vak: vak || "", p_email: email || null });
}
export async function vrijeDagen(companyId, behandelingId, dagen = 21) {
  return (await rpc("sb_agenda_vrije_dagen", { p_company: companyId, p_behandeling: behandelingId, p_dagen: dagen })) || [];
}
export async function vrijeTijden(companyId, behandelingId, datum) {
  return (await rpc("sb_agenda_vrije_tijden", { p_company: companyId, p_behandeling: behandelingId, p_datum: datum })) || [];
}
export async function boek(v) {
  return rpc("sb_agenda_boek", {
    p_company: v.companyId, p_behandeling: v.behandelingId, p_datum: v.datum, p_tijd: v.tijd,
    p_naam: v.naam || "", p_telefoon: v.telefoon || "", p_email: v.email || "", p_opmerking: v.opmerking || "",
    p_bron: v.bron || "site",
  });
}
export async function afspraakOpToken(token) {
  return rpc("sb_agenda_afspraak_token", { p_token: token });
}
export async function annuleer(token, door = "klant") {
  return rpc("sb_agenda_annuleer", { p_token: token, p_door: door });
}
export async function zetTestEmail(companyId, email) {
  return rpc("sb_agenda_test_email", { p_company: companyId, p_email: email });
}
export async function berichtenOverzicht() {
  return (await rpc("sb_agenda_berichten_overzicht", {})) || [];
}
export async function herinneringenLijst() {
  return (await rpc("sb_agenda_herinneringen_lijst", {})) || [];
}
export async function herinneringGezet(id) {
  return rpc("sb_agenda_herinnering_gezet", { p_id: id });
}
export async function testOpruimen() {
  return rpc("sb_agenda_test_opruimen", {});
}
export async function berichtenMaand(companyId) {
  return (await rpc("sb_agenda_berichten_maand", { p_company: companyId })) || { email: 0, whatsapp: 0, bundel: 150 };
}
async function logBericht(companyId, afspraakId, kanaal, soort, naar, gelukt) {
  try {
    await rpc("sb_agenda_bericht_log", {
      p_company: companyId, p_afspraak: afspraakId || null, p_kanaal: kanaal, p_soort: soort, p_naar: naar || null, p_gelukt: !!gelukt,
    });
  } catch {}
}

// ---- Opmaak ----

export function datumLang(iso) {
  return new Date(iso).toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long", timeZone: TZ });
}
export function tijdKort(iso) {
  return new Date(iso).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit", timeZone: TZ });
}
export function euro(n) {
  if (n == null || n === "") return "";
  return "€ " + Number(n).toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// Agenda-bestand (.ics) zodat de klant de afspraak in zijn telefoon zet.
export function icsVoor(a, bedrijf) {
  const z = (iso) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const regel = (s) => String(s || "").replace(/[\\,;]/g, (m) => "\\" + m).replace(/\n/g, "\\n");
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//StudioBaris//Agenda//NL", "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${a.id}@studiobaris.nl`,
    `DTSTAMP:${z(new Date().toISOString())}`,
    `DTSTART:${z(a.start)}`,
    `DTEND:${z(a.eind)}`,
    `SUMMARY:${regel(`${a.behandeling_naam} bij ${bedrijf}`)}`,
    `DESCRIPTION:${regel(`Afspraak verzetten of annuleren: ${SITE_URL}/afspraak/${a.token}`)}`,
    a.status === "geannuleerd" ? "STATUS:CANCELLED" : "STATUS:CONFIRMED",
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
}

// ---- Versturen ----

async function mail({ to, subject, html, ics, reply }) {
  const key = process.env.RESEND_API_KEY;
  if (!key || !to) return false;
  const from = process.env.AGENDA_EMAIL_FROM || process.env.EMAIL_FROM || "StudioBaris <info@studiobaris.nl>";
  const body = { from, to, subject, html };
  if (reply) body.reply_to = reply;
  if (ics) body.attachments = [{ filename: "afspraak.ics", content: Buffer.from(ics).toString("base64") }];
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// WhatsApp-herinnering via een goedgekeurd Meta-sjabloon ("afspraak_herinnering",
// parameters: bedrijf, behandeling, dag, tijd). Werkt pas als de StudioBaris-
// WhatsApp-business-account is ingericht; tot die tijd valt alles terug op e-mail.
function whatsappKlaar() {
  return !!(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID);
}
function telefoonInternationaal(t) {
  let d = String(t || "").replace(/[^\d+]/g, "");
  if (d.startsWith("+")) return d.slice(1);
  if (d.startsWith("00")) return d.slice(2);
  if (d.startsWith("06") && d.length === 10) return "31" + d.slice(1);
  if (d.startsWith("0") && d.length === 10) return "31" + d.slice(1);
  return d.length >= 10 ? d : "";
}
async function whatsapp(naar, sjabloon, parameters) {
  const nummer = telefoonInternationaal(naar);
  if (!whatsappKlaar() || !nummer) return false;
  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_ID}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp", to: nummer, type: "template",
        template: { name: sjabloon, language: { code: "nl" },
          components: [{ type: "body", parameters: parameters.map((p) => ({ type: "text", text: String(p) })) }] },
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function kader(kop, inhoud, voet) {
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;color:#1A2B3D">
  <h2 style="font-size:20px;margin:0 0 14px">${kop}</h2>${inhoud}
  <p style="font-size:12px;color:#6F7A85;margin-top:24px">${voet || "Online agenda door StudioBaris"}</p></div>`;
}
function afspraakBlok(a) {
  return `<table style="border-collapse:collapse;font-size:15px;margin:8px 0 16px">
  <tr><td style="padding:3px 14px 3px 0;color:#6F7A85">Behandeling</td><td><strong>${esc(a.behandeling_naam)}</strong></td></tr>
  <tr><td style="padding:3px 14px 3px 0;color:#6F7A85">Wanneer</td><td><strong>${esc(datumLang(a.start))}, ${esc(tijdKort(a.start))}</strong></td></tr>
  ${a.prijs != null ? `<tr><td style="padding:3px 14px 3px 0;color:#6F7A85">Prijs</td><td>${esc(euro(a.prijs))}</td></tr>` : ""}
  </table>`;
}
function knop(href, tekst) {
  return `<p><a href="${href}" style="display:inline-block;background:#1A2B3D;color:#fff;padding:11px 18px;border-radius:999px;text-decoration:none;font-weight:bold">${tekst}</a></p>`;
}

// Na een boeking: bevestiging naar de klant + melding naar de salon.
export async function meldNieuweAfspraak(a, agenda) {
  const bedrijf = agenda.naam || "de salon";
  const test = !!a.test;
  const link = `${SITE_URL}/afspraak/${a.token}`;
  const ics = icsVoor(a, bedrijf);

  if (a.klant_email) {
    const ok = await mail({
      to: a.klant_email,
      subject: `${test ? "[Test] " : ""}Je afspraak bij ${bedrijf} is bevestigd`,
      html: kader(`Tot ${datumLang(a.start)}!`,
        `<p>Hoi ${esc(a.klant_naam)}, je afspraak bij <strong>${esc(bedrijf)}</strong> staat vast.</p>${afspraakBlok(a)}
         <p>In de bijlage zit een agenda-bestand: tik erop om de afspraak in je telefoon te zetten.</p>
         ${knop(link, "Afspraak bekijken of annuleren")}`,
        test ? "Dit is een testboeking op een voorbeeldsite van StudioBaris." : undefined),
      ics,
      reply: agenda.melding_email || undefined,
    });
    await logBericht(agenda.company_id, a.id, "email", "bevestiging", a.klant_email, ok);
  }

  if (agenda.melding_email) {
    const ok = await mail({
      to: agenda.melding_email,
      subject: `${test ? "[Test] " : ""}Nieuwe afspraak: ${a.behandeling_naam}, ${datumLang(a.start)} ${tijdKort(a.start)}`,
      html: kader("Er is een nieuwe afspraak geboekt",
        `${afspraakBlok(a)}
         <p><strong>${esc(a.klant_naam)}</strong><br>${esc(a.klant_telefoon || "")}${a.klant_telefoon && a.klant_email ? "<br>" : ""}${esc(a.klant_email || "")}</p>
         ${a.opmerking ? `<p style="background:#F7F4EE;padding:10px 12px;border-radius:8px">${esc(a.opmerking)}</p>` : ""}
         ${test ? `<p style="background:#F7EBD1;padding:10px 12px;border-radius:8px">Dit is een <strong>test</strong> vanaf je voorbeeldwebsite. Zo krijg je straks elke boeking binnen. In de StudioBaris-app zie je al je afspraken in een overzicht.</p>` : ""}`),
      ics,
    });
    await logBericht(agenda.company_id, a.id, "email", "melding_salon", agenda.melding_email, ok);
  }
}

export async function meldAnnulering(a, agenda, door) {
  const bedrijf = agenda.naam || "de salon";
  const test = !!a.test;
  const ics = icsVoor({ ...a, status: "geannuleerd" }, bedrijf);
  if (a.klant_email) {
    const ok = await mail({
      to: a.klant_email,
      subject: `${test ? "[Test] " : ""}Je afspraak bij ${bedrijf} is geannuleerd`,
      html: kader("Je afspraak is geannuleerd", `<p>Hoi ${esc(a.klant_naam)}, deze afspraak gaat niet door:</p>${afspraakBlok(a)}
        <p>Wil je een nieuwe afspraak maken? Kijk op de website van ${esc(bedrijf)}.</p>`),
      ics,
    });
    await logBericht(agenda.company_id, a.id, "email", "annulering", a.klant_email, ok);
  }
  if (agenda.melding_email && door === "klant") {
    const ok = await mail({
      to: agenda.melding_email,
      subject: `${test ? "[Test] " : ""}Geannuleerd: ${a.klant_naam}, ${datumLang(a.start)} ${tijdKort(a.start)}`,
      html: kader("Een klant heeft geannuleerd", `${afspraakBlok(a)}<p><strong>${esc(a.klant_naam)}</strong> ${esc(a.klant_telefoon || "")}</p>
        <p>Deze tijd is weer vrij in je agenda.</p>`),
    });
    await logBericht(agenda.company_id, a.id, "email", "annulering_salon", agenda.melding_email, ok);
  }
}

// Herinnering de dag ervoor. WhatsApp als de salon dat aan heeft, er een
// telefoonnummer is en de bundel van deze maand nog niet op is; anders e-mail.
export async function stuurHerinnering(a, agenda, teller) {
  const bedrijf = agenda.naam || "de salon";
  const ins = agenda.instellingen || {};
  const bundelOver = ins.whatsapp_aan && (teller.whatsapp || 0) < (ins.whatsapp_bundel || 150);
  if (bundelOver && a.klant_telefoon && whatsappKlaar()) {
    const ok = await whatsapp(a.klant_telefoon, "afspraak_herinnering",
      [bedrijf, a.behandeling_naam, datumLang(a.start), tijdKort(a.start)]);
    await logBericht(agenda.company_id, a.id, "whatsapp", "herinnering", a.klant_telefoon, ok);
    if (ok) { teller.whatsapp = (teller.whatsapp || 0) + 1; return "whatsapp"; }
  }
  if (a.klant_email) {
    const ok = await mail({
      to: a.klant_email,
      subject: `${a.test ? "[Test] " : ""}Herinnering: morgen om ${tijdKort(a.start)} bij ${bedrijf}`,
      html: kader("Tot morgen!", `<p>Hoi ${esc(a.klant_naam)}, een herinnering aan je afspraak:</p>${afspraakBlok(a)}
        ${knop(`${SITE_URL}/afspraak/${a.token}`, "Kun je niet? Annuleer hier")}`),
      ics: icsVoor(a, bedrijf),
    });
    await logBericht(agenda.company_id, a.id, "email", "herinnering", a.klant_email, ok);
    return ok ? "email" : null;
  }
  return null;
}

// CORS: de boekingswidget draait ook op klantsites (WordPress) op een ander domein.
export const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};
