"use client";

import { useState } from "react";
import { KLEUR, HEAD } from "../werkplek-stijl";

// Bovenaan Mijn previews: verkoper plakt de website van een prospect, ziet
// waar domein, website en mail zitten, en krijgt meteen een standaardmail
// (namens de prospect) om de verhuiscode op te vragen.

const card = { background: "#fff", border: `1px solid ${KLEUR.lijn}`, borderRadius: 16, padding: "16px 18px", marginBottom: 16 };
const invoer = {
  flex: "1 1 220px", minWidth: 0, padding: "10px 12px", borderRadius: 10,
  border: `1px solid ${KLEUR.lijn2}`, fontSize: 14.5, fontFamily: "inherit", background: KLEUR.papier,
};
const knop = {
  background: KLEUR.klei, color: "#fff", border: "none", padding: "10px 16px", borderRadius: 10,
  fontWeight: 700, fontSize: 14, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit",
};
const knopLicht = { ...knop, background: "#fff", color: KLEUR.klei, border: `1px solid ${KLEUR.lijn2}` };

function Label({ zeker }) {
  const k = zeker ? KLEUR.sage : KLEUR.amber;
  return (
    <span style={{ fontSize: 11.5, fontWeight: 700, color: k.tekst, background: k.bg, padding: "2px 8px", borderRadius: 999, whiteSpace: "nowrap" }}>
      {zeker ? "Zeker" : "Waarschijnlijk"}
    </span>
  );
}

function Regel({ titel, item, uitleg }) {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "9px 0", borderTop: `1px solid ${KLEUR.baan}` }}>
      <div style={{ width: 92, flex: "0 0 auto", fontSize: 12.5, fontWeight: 700, color: KLEUR.labelDonker, paddingTop: 2 }}>{titel}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontWeight: 700, fontSize: 15, wordBreak: "break-word" }}>{item.naam}</span>
          {"zeker" in item && <Label zeker={item.zeker} />}
        </div>
        {(uitleg || item.waarom) && <div style={{ fontSize: 12.5, color: "#6B6258", marginTop: 2 }}>{uitleg || item.waarom}</div>}
      </div>
    </div>
  );
}

export function maakMail(r, naam, bedrijf) {
  const partij = r.domeinBij.onbekend ? "[naam van uw provider]" : r.domeinBij.naam;
  const wie = naam.trim() || "[uw naam]";
  const regels = [
    `Beste klantenservice van ${partij},`,
    "",
    `Ik wil mijn domeinnaam ${r.domein} verhuizen naar een andere partij. Wilt u mij daarvoor de verhuiscode (ook wel autorisatiecode of token) toesturen?`,
  ];
  const extra = [];
  if (r.dnssec) extra.push("DNSSEC uitschakelen voor dit domein");
  if (r.slot) extra.push("de verhuisblokkering (transfer lock) opheffen");
  if (extra.length) {
    regels.push("", `Wilt u vooraf ook ${extra.join(" en ")}? Anders kan de verhuizing niet slagen.`);
  }
  regels.push(
    "",
    "Let op: dit is uitdrukkelijk géén opzegging. Mijn pakket en andere diensten, zoals e-mail, moeten voorlopig gewoon blijven werken.",
    "",
    "Mijn gegevens:",
    `Naam: ${wie}`,
    ...(bedrijf.trim() ? [`Bedrijf: ${bedrijf.trim()}`] : []),
    `Domeinnaam: ${r.domein}`,
    "Klantnummer: [uw klantnummer]",
    "",
    "Alvast bedankt.",
    "",
    "Met vriendelijke groet,",
    wie,
  );
  return { onderwerp: `Verzoek verhuiscode ${r.domein}`, tekst: regels.join("\n") };
}

export default function HostingCheck() {
  const [adres, setAdres] = useState("");
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState("");
  const [r, setR] = useState(null);
  const [naam, setNaam] = useState("");
  const [bedrijf, setBedrijf] = useState("");
  const [gekopieerd, setGekopieerd] = useState(false);

  async function check(e) {
    e.preventDefault();
    if (!adres.trim()) return;
    setBezig(true); setFout(""); setR(null); setGekopieerd(false);
    try {
      const res = await fetch("/api/hosting-check", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ adres }),
      });
      const d = await res.json();
      if (!d.ok) setFout(d.error || "Opzoeken mislukt.");
      else setR(d);
    } catch {
      setFout("Opzoeken mislukt. Probeer het zo nog eens.");
    }
    setBezig(false);
  }

  const mail = r && !r.domeinBij.eigen ? maakMail(r, naam, bedrijf) : null;

  async function kopieer() {
    try {
      await navigator.clipboard.writeText(`Onderwerp: ${mail.onderwerp}\n\n${mail.tekst}`);
      setGekopieerd(true);
      setTimeout(() => setGekopieerd(false), 2500);
    } catch {}
  }

  return (
    <div style={card}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
        <h2 style={{ fontFamily: HEAD, fontSize: 16, margin: 0, fontWeight: 800 }}>Waar zit de hosting?</h2>
        <span style={{ fontSize: 13, color: "#9A9084" }}>plak de website van de prospect</span>
      </div>

      <form onSubmit={check} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          value={adres} onChange={(e) => setAdres(e.target.value)}
          placeholder="www.bedrijfsnaam.nl" inputMode="url" autoCapitalize="off" autoCorrect="off" spellCheck={false}
          style={invoer}
        />
        <button type="submit" disabled={bezig} style={{ ...knop, opacity: bezig ? 0.6 : 1 }}>
          {bezig ? "Bezig met zoeken…" : "Opzoeken"}
        </button>
      </form>

      {fout && <div style={{ marginTop: 10, fontSize: 13.5, color: KLEUR.rust.tekst }}>{fout}</div>}

      {r && (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 13, color: KLEUR.labelDonker, marginBottom: 4 }}>
            Resultaat voor <strong>{r.domein}</strong>
          </div>
          <Regel titel="Domein" item={r.domeinBij} />
          <Regel titel="Website" item={r.website} />
          <Regel titel="Mail" item={r.mail} />
          {r.dnssec !== null && (
            <Regel
              titel="DNSSEC"
              item={{ naam: r.dnssec ? "Staat aan" : "Staat uit", zeker: true }}
              uitleg={r.dnssec ? "Moet uit vóór de verhuizing. Staat in de mail hieronder." : "Geen actie nodig."}
            />
          )}
          {r.slot && (
            <Regel titel="Verhuisslot" item={{ naam: "Staat aan", zeker: true }} uitleg="Moet eraf vóór de verhuizing. Staat in de mail hieronder." />
          )}

          {r.domeinBij.eigen ? (
            <div style={{ marginTop: 12, background: KLEUR.sage.bg, color: KLEUR.sage.tekst, borderRadius: 10, padding: "10px 12px", fontSize: 13.5, fontWeight: 600 }}>
              Dit domein staat al bij StudioBaris. Een verhuiscode is niet nodig.
            </div>
          ) : (
            <div style={{ marginTop: 14, background: KLEUR.papier, border: `1px solid ${KLEUR.lijn}`, borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ fontWeight: 800, fontSize: 14.5, marginBottom: 4 }}>Mail voor de verhuiscode</div>
              <div style={{ fontSize: 12.5, color: "#6B6258", marginBottom: 10 }}>
                Deze mail stuurt de prospect zelf naar {r.domeinBij.onbekend ? "zijn provider" : r.domeinBij.naam}, vanaf het mailadres dat daar bekend is
                (of via het contactformulier in zijn klantenpaneel).
                {r.domeinBij.onbekend && " Vul de naam van de provider zelf in: die konden we niet met zekerheid vinden."}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                <input value={naam} onChange={(e) => setNaam(e.target.value)} placeholder="Naam prospect" style={{ ...invoer, background: "#fff" }} />
                <input value={bedrijf} onChange={(e) => setBedrijf(e.target.value)} placeholder="Bedrijfsnaam (optioneel)" style={{ ...invoer, background: "#fff" }} />
              </div>
              <div style={{ fontSize: 13, marginBottom: 6 }}><strong>Onderwerp:</strong> {mail.onderwerp}</div>
              <pre style={{
                whiteSpace: "pre-wrap", fontFamily: "inherit", fontSize: 13.5, lineHeight: 1.5, margin: 0,
                background: "#fff", border: `1px solid ${KLEUR.lijn}`, borderRadius: 10, padding: "10px 12px",
              }}>{mail.tekst}</pre>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                <button type="button" onClick={kopieer} style={knop}>{gekopieerd ? "✓ Gekopieerd" : "Kopieer mail"}</button>
                <a
                  href={`mailto:?subject=${encodeURIComponent(mail.onderwerp)}&body=${encodeURIComponent(mail.tekst)}`}
                  style={{ ...knopLicht, textDecoration: "none", display: "inline-block" }}
                >
                  Open in mailprogramma
                </a>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
