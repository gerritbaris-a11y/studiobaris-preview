// Overdrachtsdocument "Je website en je app" (okt 2026). Server-only.
//
// Zelfde inhoud en opbouw als het document dat Van Vliet en Kalee kreeg
// (september 2026), nu als PDF uit de werkplek in de StudioBaris-huisstijl:
// Plus Jakarta Sans, navy en goud. Wordt gemaakt vanuit het blok "Na akkoord"
// op Mijn previews (alleen beheer), na het akkoord van de klant in de laatste
// controle (/ronde/<slug>?r=3).
//
// Bevat de persoonlijke app-inloglink: nooit loggen of ergens anders opslaan.
// Database: workflow.overdracht (wanneer/door wie/naar wie verstuurd; géén
// link). Functies sb_overdracht_verstuurd, sb_overdracht_overzicht.

import { PDFDocument, rgb } from "pdf-lib";
import { jakartaFonts } from "./plus-jakarta-font";
import { schoonSite } from "./ronde";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ipiqrsxbsgylxhgzlhsd.supabase.co";

export const TEL_TOON = "+31 6 16 73 21 05";
export const MAIL_KEUZES = {
  "bij-ons": "Mail verhuisd naar StudioBaris",
  blijft: "Mail blijft waar hij was",
  geen: "Geen mail op het domein",
};

const MAANDEN = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];

function lijstZin(items) {
  const a = items.filter(Boolean);
  if (a.length <= 1) return a.join("");
  return a.slice(0, -1).join(", ") + " en " + a[a.length - 1];
}

/**
 * Maakt de PDF.
 * @param {object} d
 *   bedrijf, site (domein), wp (WordPress-gebruikersnaam), link (app-inloglink
 *   of null voor een voorbeeld), mail ("bij-ons" | "blijft" | "geen"),
 *   diensten (array met titels, mag leeg), datum (Date)
 */
export async function overdrachtPdf(d) {
  const site = schoonSite(d.site);
  const bedrijf = String(d.bedrijf || "").trim();
  const wp = String(d.wp || "").trim();
  const diensten = (d.diensten || []).map((x) => String(x || "").trim()).filter(Boolean).slice(0, 5);
  const datum = d.datum || new Date();

  const pdf = await PDFDocument.create();
  const { font, vet, merk } = await jakartaFonts(pdf);

  const NAVY = rgb(0.102, 0.169, 0.239);   // #1A2B3D
  const TEKST = rgb(0.16, 0.2, 0.25);
  const GRIJS = rgb(0.43, 0.48, 0.52);
  const LIJN = rgb(0.89, 0.87, 0.83);
  const GOUD = rgb(0.780, 0.604, 0.337);   // #C79A56 (alleen als vlak/lijn)
  const GOUDTEKST = rgb(0.494, 0.373, 0.157); // #7E5F28
  const CREME = rgb(0.969, 0.957, 0.933);  // #F7F4EE

  const W = 595.28, H = 841.89;
  const L = 62, R = W - 62, BR = R - L;
  const ONDER = 70;

  let pagina = pdf.addPage([W, H]);
  let y = H - 64;

  const nieuwePagina = () => { pagina = pdf.addPage([W, H]); y = H - 64; };
  const ruimte = (h) => { if (y - h < ONDER) nieuwePagina(); };

  // Woorden met **vet** ertussen, netjes over regels verdeeld.
  function alinea(tekstIn, o = {}) {
    const size = o.size || 10.5;
    const lh = o.lh || size * 1.55;
    const x0 = o.x || L;
    const maxB = o.breedte || BR;
    const kleur = o.kleur || TEKST;
    const stukken = String(tekstIn).split(/(\*\*[^*]+\*\*)/).filter(Boolean);
    const woorden = [];
    for (const st of stukken) {
      const isVet = st.startsWith("**");
      const t = isVet ? st.slice(2, -2) : st;
      const losVoor = /^\S/.test(t); // begint direct na het vorige stuk (bv. een komma na vet)
      t.split(/(\s+)/).filter((w) => w && !/^\s+$/.test(w)).forEach((w, i) => {
        woorden.push({ w, vet: isVet || o.vet, plak: i === 0 && losVoor && /^[,.;:!?)]/.test(w) });
      });
    }
    const spatie = font.widthOfTextAtSize(" ", size);
    const regels = [[]];
    let breedte = 0;
    for (const wd of woorden) {
      const b = (wd.vet ? vet : font).widthOfTextAtSize(wd.w, size);
      const tussen = breedte > 0 && !wd.plak ? spatie : 0;
      if (breedte > 0 && !wd.plak && breedte + tussen + b > maxB) { regels.push([]); breedte = 0; }
      regels[regels.length - 1].push(wd);
      breedte += (breedte > 0 && !wd.plak ? spatie : 0) + b;
    }
    for (const regel of regels) {
      ruimte(lh);
      let x = x0;
      regel.forEach((wd, i) => {
        const f = wd.vet ? vet : font;
        if (i > 0 && wd.plak) x -= spatie;
        pagina.drawText(wd.w, { x, y: y - size, size, font: f, color: kleur });
        x += f.widthOfTextAtSize(wd.w, size) + spatie;
      });
      y -= lh;
    }
    y -= o.na == null ? 6 : o.na;
  }

  function kop(t) {
    ruimte(60);
    y -= 14;
    pagina.drawText(t, { x: L, y: y - 13, size: 13, font: vet, color: NAVY });
    y -= 22;
    pagina.drawLine({ start: { x: L, y }, end: { x: R, y }, thickness: 1.2, color: GOUD });
    y -= 14;
  }

  function subkop(t) {
    ruimte(30);
    y -= 2;
    pagina.drawText(t, { x: L, y: y - 10.5, size: 10.5, font: vet, color: NAVY });
    y -= 18;
  }

  function tabel(rijen) {
    for (const [a, b] of rijen) {
      ruimte(28);
      pagina.drawText(a, { x: L, y: y - 15, size: 10.5, font, color: GRIJS });
      pagina.drawText(b, { x: L + 160, y: y - 15, size: 10.5, font, color: TEKST });
      y -= 26;
      pagina.drawLine({ start: { x: L, y }, end: { x: R, y }, thickness: 0.6, color: LIJN });
    }
    y -= 10;
  }

  function opsomming(items) {
    for (const it of items) {
      ruimte(17);
      pagina.drawText("•", { x: L + 6, y: y - 10.5, size: 10.5, font, color: GOUDTEKST });
      alinea(it, { x: L + 20, breedte: BR - 20, na: 0, lh: 16.5 });
    }
    y -= 6;
  }

  // ── Kop ────────────────────────────────────────────────────────────────────
  pagina.drawText("STUDIOBARIS", { x: L, y: y - 9, size: 9, font: vet, color: GOUDTEKST, characterSpacing: 2 });
  y -= 30;
  pagina.drawText("Je website en je app", { x: L, y: y - 26, size: 26, font: merk, color: NAVY });
  y -= 44;
  pagina.drawText(`${bedrijf}${site ? " — " + site : ""}`, { x: L, y: y - 11.5, size: 11.5, font, color: TEKST });
  y -= 22;
  pagina.drawText(`Overdracht · ${MAANDEN[datum.getMonth()]} ${datum.getFullYear()}`, { x: L, y: y - 9, size: 9, font, color: GRIJS });
  y -= 22;
  pagina.drawLine({ start: { x: L, y }, end: { x: R, y }, thickness: 2, color: NAVY });
  y -= 6;

  // ── Waar alles staat ───────────────────────────────────────────────────────
  kop("Waar alles staat");
  tabel([
    ["Je website", site || "[domein]"],
    ["Je eigen beheer", (site || "[domein]") + "/wp-admin"],
    ["De app", "je persoonlijke link — zie hieronder"],
  ]);
  alinea(
    "Je website heeft de pagina's home, diensten, projecten, over ons en contact, plus de privacyverklaring." +
      (diensten.length ? ` Je diensten — ${lijstZin(diensten.map((x) => `**${x}**`))} — staan er met foto's op.` : "") +
      " Je telefoonnummer en WhatsApp staan overal binnen handbereik."
  );

  // ── De app ─────────────────────────────────────────────────────────────────
  kop("De app — hier doe je het meeste mee");
  alinea("De app is er voor één ding: **je eigen werk op je site zetten, vanaf de klus.** Je maakt een project aan, zet er foto's bij, en binnen enkele minuten staat het op je website. Op de homepage én op je projectenpagina, met een eigen pagina per project. Je hoeft ons daar niet voor te bellen.");
  alinea("Hetzelfde geldt voor reviews van klanten: vraag ze via de app, dan verschijnen ze op je site.");
  subkop("Zet hem op je beginscherm");
  alinea("Er valt niets te downloaden — geen App Store, geen Play Store. Je opent de inloglink hieronder op je telefoon, en kiest dan in het menu van je browser **Zet op beginscherm**. Daarna staat er een icoon tussen je andere apps en opent hij als een gewone app. Op een iPhone moet dat via Safari.");

  // Kader met de inloglink
  {
    const link = d.link || "(de link komt erin zodra we het document versturen)";
    const linkSize = 8.2;
    const regelsTekst = [
      "Open hem op je telefoon. Die link is persoonlijk en werkt als een wachtwoord: wie hem heeft, kan bij je app. Stuur hem dus niet door en zet hem niet in een groepsapp.",
      "Open hem binnen twee weken. Eenmaal ingelogd blijf je ingelogd: je hoeft niet elke keer opnieuw in te loggen. Voortaan open je gewoon dat icoon. Krijg je een nieuwe telefoon of ben je er onverhoopt uit, bel of app ons dan even, dan zetten we een nieuwe link voor je klaar.",
    ];
    ruimte(190);
    const top = y;
    y -= 16;
    const xIn = L + 16, bIn = BR - 32;
    pagina.drawText("Dit is jouw persoonlijke inloglink:", { x: xIn, y: y - 10.5, size: 10.5, font: vet, color: NAVY });
    y -= 22;
    pagina.drawRectangle({ x: xIn, y: y - 24, width: bIn, height: 24, color: rgb(1, 1, 1), borderColor: LIJN, borderWidth: 0.8 });
    pagina.drawText(link, { x: xIn + 8, y: y - 15.5, size: linkSize, font, color: TEKST });
    y -= 34;
    for (const t of regelsTekst) alinea(t, { x: xIn, breedte: bIn, size: 10 });
    const hoogte = top - y + 4;
    // Vlak en goudlijn achter de inhoud tekenen kan niet meer; daarom alleen
    // een gouden balk links als markering (zelfde idee als in het voorbeeld).
    pagina.drawRectangle({ x: L, y: y - 4, width: 3, height: hoogte, color: GOUD });
    y -= 10;
  }
  alinea("Per dag kun je twee projecten en twee reviews plaatsen. Dat is geen zuinigheid maar een rem: het voorkomt dat er per ongeluk een hele fotomap op je site belandt.", { size: 8.5, kleur: GRIJS });

  // ── WordPress ──────────────────────────────────────────────────────────────
  kop("Je eigen beheer in WordPress");
  alinea(`Voor je teksten heb je een eigen inlog op ${site || "[domein]"}/wp-admin. Je gebruikersnaam is **${wp || "[gebruikersnaam]"}**. Je wachtwoord heb je per mail gekregen vanuit WordPress. Ben je die mail kwijt, dan stel je zelf een nieuw wachtwoord in via **Wachtwoord vergeten** op het inlogscherm.`);
  subkop("Waar je gerust zelf in mag");
  opsomming(["Teksten op de pagina's over ons, diensten en contact", "Je openingstijden en je werkgebied", "Losse foto's vervangen"]);
  subkop("Waar je ons beter even voor belt");
  opsomming(["De vormgeving, kleuren of de indeling van pagina's", "Plugins installeren of updaten", "Iets dat met de koppeling naar de app te maken heeft"]);
  alinea("Niet omdat het geheim is, maar omdat die dingen aan elkaar vastzitten. Eén verkeerde knop en de site ziet er anders uit dan je bedoelde. Bellen kost je minder tijd dan terugdraaien.");

  // ── Wat wij doen ───────────────────────────────────────────────────────────
  kop("Wat wij doen, zonder dat je er iets voor hoeft te regelen");
  alinea("Je website draait bij StudioBaris. Dat betekent: de server, het domein, het beveiligingscertificaat, de back-ups en de updates zijn van ons. Je krijgt daar geen aparte rekeningen voor en je hoeft er nooit ergens in te loggen. Gaat er iets mis, dan is dat ons probleem om op te lossen — bel of app ons gewoon.");
  alinea("Je website en je domeinnaam blijven van jou. Wij zorgen dat ze draaien.");
  alinea("**De app hoort daar net zo goed bij.** Wij bouwen hem, houden hem draaiend en zorgen dat de koppeling met je website blijft werken. Nieuwe versies komen er vanzelf in — je hoeft niets bij te werken en niets te installeren. Zit er ooit iets scheef tussen de app en je site, dan lossen wij dat op.");
  if (d.mail === "blijft") alinea("Ook je e-mail blijft draaien zoals je gewend bent. Daar hebben we niets aan veranderd.");

  // ── Je e-mail (alleen als de mail naar ons is verhuisd) ─────────────────────
  if (d.mail === "bij-ons" && site) {
    kop("Je e-mail");
    alinea(`Je e-mail draait nu ook bij ons. Lezen kan altijd via de webmail: **webmail.${site}**. Wil je je mail op je telefoon of in Outlook, gebruik dan deze instellingen:`);
    tabel([
      ["Soort account", "IMAP"],
      ["Gebruikersnaam", "je volledige e-mailadres"],
      ["Inkomend", `mail.${site} · poort 993 · SSL`],
      ["Uitgaand", `mail.${site} · poort 465 · SSL`],
    ]);
    alinea("Vul bij inkomend én uitgaand je wachtwoord in. Lukt het instellen niet, bel of app ons: dan doen we het samen.");
  }

  // ── Contact ────────────────────────────────────────────────────────────────
  kop("Contact");
  alinea("Vragen, een aanpassing, of iets dat niet doet wat je verwacht: bel of app. Liever één keer te vaak dan dat je ergens mee blijft zitten.");
  tabel([["Telefoon", TEL_TOON], ["WhatsApp", TEL_TOON], ["Online", "studiobaris.nl"]]);

  ruimte(40);
  pagina.drawLine({ start: { x: L, y }, end: { x: R, y }, thickness: 0.6, color: LIJN });
  y -= 14;
  pagina.drawText("StudioBaris · websites voor vakmannen, met de app om je eigen werk online te zetten", { x: L, y: y - 8, size: 8, font, color: GRIJS });
  y -= 13;
  pagina.drawText("Dit document bevat je persoonlijke inloglink. Bewaar het voor jezelf.", { x: L, y: y - 8, size: 8, font: vet, color: NAVY });

  // Achtergrond crème kan in pdf-lib niet achteraf; we laten het papier wit.
  void CREME;
  return await pdf.save();
}

// ── Mail ─────────────────────────────────────────────────────────────────────
function html(s) {
  return String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

export async function mailOverdracht({ naar, contact, bedrijf, site, pdfBytes }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { sent: false, reason: "geen RESEND_API_KEY" };
  const from = process.env.EMAIL_FROM || "StudioBaris <info@studiobaris.nl>";
  const s = schoonSite(site);
  const body = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;color:#1A2B3D;max-width:560px;line-height:1.55">
      <p>${contact ? "Hoi " + html(contact) + "," : "Hoi,"}</p>
      <p>Je website staat live${s ? `: <a href="https://${html(s)}">${html(s)}</a>` : ""}.</p>
      <p>In de bijlage staat alles op een rij: waar alles staat, je eigen beheer en <strong>je persoonlijke link naar de app</strong>. Open die link op je telefoon en zet de app op je beginscherm. Stuur de link aan niemand door: hij werkt als je wachtwoord.</p>
      <p>Zullen we even bellen? Dan zetten we de app samen op je telefoon en plaats je je eerste project.</p>
      <p>Bellen of appen: 06 16 73 21 05.</p>
      <p style="margin-top:24px">Groet,<br><strong>StudioBaris</strong></p>
    </div>`;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: naar,
        bcc: process.env.NOTIFY_EMAIL || "gerritbaris@gmail.com",
        subject: `Je website en je app${bedrijf ? " – " + bedrijf : ""}`,
        html: body,
        attachments: [{ filename: `${(s || "website").replace(/\./g, "-")}-website-en-app.pdf`, content: Buffer.from(pdfBytes).toString("base64") }],
      }),
    });
    if (!res.ok) return { sent: false, reason: `Resend ${res.status}` };
    return { sent: true };
  } catch (e) {
    return { sent: false, reason: String(e.message || e) };
  }
}

// ── Database ─────────────────────────────────────────────────────────────────
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

export async function overdrachtVerstuurd({ slug, site, naar, door }) {
  return rpc("sb_overdracht_verstuurd", { p_slug: slug, p_site: schoonSite(site), p_naar: naar || "", p_door: door || "" });
}

export async function getOverdrachten() {
  try {
    const d = await rpc("sb_overdracht_overzicht", {});
    return Array.isArray(d) ? d : [];
  } catch {
    return [];
  }
}
