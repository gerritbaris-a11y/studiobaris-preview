"use client";

import { useState } from "react";
import { KLEUR, HEAD } from "../werkplek-stijl";
import { betaallinkUrl, slottermijnUrl } from "../../lib/betaallink";

// Standaardmails per klant, met de juiste betaallink al verwerkt onder
// "Betaal hier". Welke mails je ziet volgt uit de vastgelegde afspraak
// (De afspraak hierboven) — dezelfde bedragen die de akkoordpagina gebruikt:
//
//  - aanbetaling > 0 en geen rest  → in één keer: website + eerste maand
//  - aanbetaling > 0 en wel rest   → eerste termijn + eerste maand, en een
//                                    tweede mail voor de slottermijn
//  - geen aanbetaling              → alleen maandelijks: eerste maand
//
// "Kopieer mail" zet de mail als opgemaakte tekst op het klembord, zodat
// "hier" in Gmail/Outlook een klikbare link blijft en de klant de lange
// link niet ziet.

const knop = {
  background: "#fff", color: KLEUR.klei, border: `1px solid ${KLEUR.lijn2}`,
  padding: "6px 11px", borderRadius: 8, fontSize: 12.5, fontWeight: 700,
  cursor: "pointer", whiteSpace: "nowrap", fontFamily: HEAD,
};

function getal(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function voornaamVan(r) {
  // "Pieter Jansen" → "Pieter"; met voorletters ("T.J. Baris") de hele naam.
  const c = String(r.contactpersoon || "").trim();
  if (!c) return "";
  const eerste = c.split(/\s+/)[0];
  return eerste.includes(".") ? c : eerste;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Een mail bestaat uit alinea's; één alinea bevat de link.
// { onderwerp, alineas: [string | { voor, linkTekst, na }], url }
function maakMails(r) {
  const aanb = getal(r.aanbetaling);
  const rest = getal(r.restbedrag);
  const groet = voornaamVan(r) ? `Beste ${voornaamVan(r)},` : "Beste,";
  const afsluiting = ["Met vriendelijke groet,", "StudioBaris"];
  const mails = [];

  const betaalAlinea = (url) => ({ voor: "Betaal ", linkTekst: "hier", na: ".", url });

  if (aanb > 0 && rest <= 0) {
    mails.push({
      key: "akkoord",
      titel: "Akkoord: website in één keer + maandelijks",
      onderwerp: "Je betaallink van StudioBaris",
      url: betaallinkUrl(r.slug),
      alineas: [
        groet,
        "Bedankt voor je vertrouwen in StudioBaris.",
        "Via de link hieronder betaal je je website en de eerste maand van je abonnement. Met dezelfde betaling geef je de machtiging voor de maandelijkse incasso.",
        betaalAlinea(betaallinkUrl(r.slug)),
        "Zodra de betaling binnen is, gaan we voor je aan de slag. Heb je vragen? Beantwoord dan gewoon deze mail.",
        afsluiting,
      ],
    });
  } else if (aanb > 0 && rest > 0) {
    mails.push({
      key: "akkoord",
      titel: "Mail 1 — Akkoord: eerste termijn + maandelijks",
      onderwerp: "Je betaallink van StudioBaris",
      url: betaallinkUrl(r.slug),
      alineas: [
        groet,
        "Bedankt voor je vertrouwen in StudioBaris.",
        "Via de link hieronder betaal je de eerste termijn van je website en de eerste maand van je abonnement. Met dezelfde betaling geef je de machtiging voor de maandelijkse incasso. De tweede termijn betaal je pas als je website live staat; daarvoor krijg je dan een aparte mail.",
        betaalAlinea(betaallinkUrl(r.slug)),
        "Zodra de betaling binnen is, gaan we voor je aan de slag. Heb je vragen? Beantwoord dan gewoon deze mail.",
        afsluiting,
      ],
    });
  } else {
    mails.push({
      key: "akkoord",
      titel: "Akkoord: maandelijks abonnement",
      onderwerp: "Je betaallink van StudioBaris",
      url: betaallinkUrl(r.slug),
      alineas: [
        groet,
        "Bedankt voor je vertrouwen in StudioBaris.",
        "Via de link hieronder betaal je de eerste maand van je abonnement. Met dezelfde betaling geef je de machtiging voor de maandelijkse incasso.",
        betaalAlinea(betaallinkUrl(r.slug)),
        "Zodra de betaling binnen is, gaan we voor je aan de slag. Heb je vragen? Beantwoord dan gewoon deze mail.",
        afsluiting,
      ],
    });
  }

  // Slottermijn alleen bij een termijnafspraak (eerste termijn al in de
  // akkoordlink). Bij "alleen maandelijks" kan het websitebedrag later nog als
  // slottermijn, maar dat is geen vaste mail.
  if (aanb > 0 && rest > 0) {
    mails.push({
      key: "slottermijn",
      titel: "Mail 2 — Slottermijn (sturen als de site live staat)",
      onderwerp: "Je website staat live – de laatste termijn",
      url: slottermijnUrl(r.slug),
      alineas: [
        groet,
        "Je website staat live. Via de link hieronder betaal je de tweede en laatste termijn van je website. Daarna loopt alleen nog je maandelijkse abonnement.",
        betaalAlinea(slottermijnUrl(r.slug)),
        "Heb je vragen? Beantwoord dan gewoon deze mail.",
        afsluiting,
      ],
    });
  }

  return mails;
}

function alsHtml(mail) {
  const stijl = "margin:0 0 14px 0;";
  return (
    `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#222;">` +
    mail.alineas
      .map((a) => {
        if (Array.isArray(a)) return `<p style="${stijl}">${a.map(escapeHtml).join("<br>")}</p>`;
        if (typeof a === "object") {
          return `<p style="${stijl}">${escapeHtml(a.voor)}<a href="${escapeHtml(a.url)}">${escapeHtml(a.linkTekst)}</a>${escapeHtml(a.na)}</p>`;
        }
        return `<p style="${stijl}">${escapeHtml(a)}</p>`;
      })
      .join("") +
    `</div>`
  );
}

// Platte-tekstversie voor programma's die geen opmaak plakken: daar staat de
// link er dan voluit achter, zodat hij nooit verdwijnt.
function alsTekst(mail) {
  return mail.alineas
    .map((a) => {
      if (Array.isArray(a)) return a.join("\n");
      if (typeof a === "object") return `${a.voor}${a.linkTekst}${a.na}\n${a.url}`;
      return a;
    })
    .join("\n\n");
}

async function kopieerMail(mail) {
  const html = alsHtml(mail);
  const tekst = alsTekst(mail);
  try {
    if (typeof ClipboardItem !== "undefined" && navigator.clipboard && navigator.clipboard.write) {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([tekst], { type: "text/plain" }),
        }),
      ]);
      return "opgemaakt";
    }
  } catch {}
  try {
    await navigator.clipboard.writeText(tekst);
    return "tekst";
  } catch {
    return null;
  }
}

function MailKaart({ mail, geblokkeerd }) {
  const [melding, setMelding] = useState("");

  async function kopieer(wat) {
    let ok;
    if (wat === "onderwerp") {
      try { await navigator.clipboard.writeText(mail.onderwerp); ok = "onderwerp"; } catch { ok = null; }
    } else {
      ok = await kopieerMail(mail);
    }
    setMelding(
      ok === "opgemaakt" ? "Mail gekopieerd ✓"
        : ok === "tekst" ? "Gekopieerd als platte tekst (link staat er voluit bij)"
        : ok === "onderwerp" ? "Onderwerp gekopieerd ✓"
        : "Kopiëren lukte niet"
    );
    setTimeout(() => setMelding(""), 2400);
  }

  return (
    <div style={{ background: "#fff", border: `1px solid ${KLEUR.lijn}`, borderRadius: 10, padding: "12px 14px", display: "grid", gap: 10 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 13.5 }}>{mail.titel}</div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          {melding && <span style={{ fontSize: 12, color: "#1d7a46", fontWeight: 600 }}>{melding}</span>}
          <button onClick={() => kopieer("onderwerp")} style={knop} disabled={geblokkeerd}>Kopieer onderwerp</button>
          <button
            onClick={() => kopieer("mail")}
            disabled={geblokkeerd}
            style={{ ...knop, background: KLEUR.klei, color: "#fff", border: "none", opacity: geblokkeerd ? 0.5 : 1 }}
          >
            Kopieer mail
          </button>
        </div>
      </div>

      {geblokkeerd && (
        <div style={{ fontSize: 12.5, color: KLEUR.kleiDonker, fontWeight: 600 }}>{geblokkeerd}</div>
      )}

      <div style={{ fontSize: 12.5, color: KLEUR.labelDonker }}>
        <span style={{ fontWeight: 700 }}>Onderwerp:</span> {mail.onderwerp}
      </div>
      {/* Zo ziet de klant hem: "hier" is de link. */}
      <div
        style={{ border: `1px dashed ${KLEUR.lijn2}`, borderRadius: 8, padding: "10px 12px", background: "#fffdf9" }}
        dangerouslySetInnerHTML={{ __html: alsHtml(mail) }}
      />
      <div style={{ fontSize: 11.5, color: KLEUR.label, wordBreak: "break-all" }}>
        Link achter "hier": {mail.url}
      </div>
    </div>
  );
}

export default function StandaardMails({ r }) {
  if (!r.betaalwijze) {
    return (
      <div style={{ fontSize: 13, color: KLEUR.label }}>
        Leg eerst de afspraak vast (hierboven). Daarna staan hier de juiste mails met de betaallinks.
      </div>
    );
  }

  const mails = maakMails(r);

  // Slottermijn: niet nog eens laten betalen als hij al betaald is of als er
  // al een incasso voor is aangekondigd (knop "Slottermijn versturen").
  function blokkade(mail) {
    if (mail.key === "akkoord" && r.betaal_status === "actief") {
      return "Let op: deze klant heeft al betaald en het abonnement loopt al.";
    }
    if (mail.key !== "slottermijn") return null;
    if (r.rest_status === "betaald") return "Slottermijn is al betaald — niet meer versturen.";
    if (r.rest_status === "aangekondigd" || r.rest_status === "open") {
      return "Voor de slottermijn loopt al een automatische incasso — deze mail niet ook nog sturen.";
    }
    return null;
  }

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {mails.map((m) => (
        <MailKaart key={m.key} mail={m} geblokkeerd={blokkade(m)} />
      ))}
      <div style={{ fontSize: 11.5, color: KLEUR.label }}>
        Plak met Ctrl/Cmd + V in je mail; "hier" blijft dan een klikbare link. De aanhef gebruikt de voornaam van de contactpersoon.
      </div>
    </div>
  );
}
