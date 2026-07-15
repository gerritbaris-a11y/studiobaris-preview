"use client";

import { useState } from "react";
import { KLEUR, HEAD, BODY } from "../werkplek-stijl";

function euro(n) {
  const v = Number(n || 0);
  return "€ " + v.toLocaleString("nl-NL");
}

export default function RestClient({ lijst }) {
  const [gekopieerd, setGekopieerd] = useState("");

  const basis = typeof window !== "undefined" ? window.location.origin : "https://team.studiobaris.nl";

  function herinnering(k) {
    const link = `${basis}/restbetaling/${k.slug}`;
    const naam = k.contact || k.klant;
    const bedrag = k.restbedrag > 0 ? ` van ${euro(k.restbedrag)}` : "";
    return [
      `Hoi ${naam},`,
      "",
      `Je website staat live, top! Er staat nog een restbedrag${bedrag} open (de tweede helft van de eenmalige websitekosten).`,
      "Je kunt 'm hier in één keer voldoen:",
      link,
      "",
      "Groet, Gerrit",
    ].join("\n");
  }

  async function kopieer(k) {
    try {
      await navigator.clipboard.writeText(herinnering(k));
      setGekopieerd(k.slug);
      setTimeout(() => setGekopieerd(""), 2000);
    } catch {}
  }

  function whatsapp(k) {
    const tel = (k.telefoon || "").replace(/[^0-9]/g, "").replace(/^0/, "31");
    const tekst = encodeURIComponent(herinnering(k));
    const url = tel ? `https://wa.me/${tel}?text=${tekst}` : `https://wa.me/?text=${tekst}`;
    window.open(url, "_blank");
  }

  if (lijst.length === 0) {
    return (
      <div style={{ background: KLEUR.kaart, border: `1px solid ${KLEUR.lijn}`, borderRadius: 16, padding: "40px 24px", textAlign: "center" }}>
        <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 20 }}>Geen openstaande restbedragen.</div>
        <div style={{ color: KLEUR.gedempt, fontSize: 14, marginTop: 6 }}>
          Zodra een klant de aanbetaling voldoet en de site is opgeleverd, verschijnt de restbetaling hier automatisch.
        </div>
      </div>
    );
  }

  const totaal = lijst.reduce((s, k) => s + Number(k.restbedrag || 0), 0);

  return (
    <>
      <div style={{ background: KLEUR.amber.bg, border: `1px solid ${KLEUR.baanRand}`, borderRadius: 14, padding: "14px 18px", marginBottom: 18, display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 22, color: KLEUR.amber.tekst }}>{euro(totaal)}</span>
        <span style={{ fontSize: 14, color: KLEUR.amber.tekst }}>staat in totaal nog open over {lijst.length} {lijst.length === 1 ? "klant" : "klanten"}.</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {lijst.map((k) => (
          <div key={k.slug} style={{ background: KLEUR.kaart, border: `1px solid ${KLEUR.lijn}`, borderLeft: `4px solid ${KLEUR.amber.dot}`, borderRadius: 16, padding: 18, display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ flex: "1 1 200px", minWidth: 0 }}>
              <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 18 }}>{k.klant}</div>
              <div style={{ fontSize: 13, color: KLEUR.labelDonker, marginTop: 2 }}>
                {k.verkoper ? `via ${k.verkoper} · ` : ""}{k.dagen} {k.dagen === 1 ? "dag" : "dagen"} open
                {k.contact ? ` · ${k.contact}` : ""}
              </div>
            </div>
            <div style={{ textAlign: "right", flex: "0 0 auto" }}>
              <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 20, color: KLEUR.inkt }}>
                {k.restbedrag > 0 ? euro(k.restbedrag) : "—"}
              </div>
              <div style={{ fontSize: 11, color: KLEUR.label }}>restbedrag</div>
            </div>
            <div style={{ display: "flex", gap: 8, flex: "0 0 auto" }}>
              <button
                onClick={() => whatsapp(k)}
                style={{ background: "#22C55E", color: "#fff", border: "none", borderRadius: 10, padding: "10px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: BODY }}
              >
                WhatsApp
              </button>
              <button
                onClick={() => kopieer(k)}
                style={{ background: "#fff", color: KLEUR.inkt, border: `1px solid ${KLEUR.lijn2}`, borderRadius: 10, padding: "10px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: BODY }}
              >
                {gekopieerd === k.slug ? "Gekopieerd ✓" : "Kopieer tekst"}
              </button>
              <a
                href={`${basis}/restbetaling/${k.slug}`}
                target="_blank"
                rel="noreferrer"
                style={{ background: KLEUR.klei, color: "#fff", borderRadius: 10, padding: "10px 14px", fontSize: 13, fontWeight: 700, fontFamily: BODY, display: "inline-flex", alignItems: "center" }}
              >
                Betaalpagina
              </a>
            </div>
          </div>
        ))}
      </div>

      <p style={{ color: KLEUR.label, fontSize: 12, marginTop: 18 }}>
        De herinnering is klaar om te versturen: WhatsApp opent met de tekst en de betaallink erin, of kopieer 'm en plak zelf.
        De klant betaalt in één keer via zijn eigen betaalpagina.
      </p>
    </>
  );
}
