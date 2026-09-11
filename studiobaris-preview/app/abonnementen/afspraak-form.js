"use client";

import { useState } from "react";
import { KLEUR, HEAD } from "../werkplek-stijl";

// De afspraak per klant: wat de website kost, wat er maandelijks loopt, en
// welke van de vier betaalwijzes hij krijgt (optie 5, de slottermijn, is een
// aparte actie — zie SlottermijnKnop in klantenregister/klant-rij.js).
//
// De aanbetaling vul je hier bewust NIET zelf in: die volgt uit de betaalwijze
// en wordt in de database afgeleid. Uitzondering: "Handmatig" (optie 4) —
// daar bepaal jij zelf het bedrag, dus vraagt het formulier het bedrag twee
// keer op en moeten beide overeenkomen voordat er iets wordt opgeslagen. Zo
// kan een tikfout er nooit ongemerkt in sluipen.

const BTW = 1.21;

function euro(v) {
  const n = Number(v) || 0;
  return "€ " + n.toFixed(2).replace(".", ",");
}
function getal(v) {
  if (v === "" || v === null || v === undefined) return 0;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

const veld = {
  width: 110, padding: "7px 9px", fontSize: 14, borderRadius: 8,
  border: `1px solid ${KLEUR.lijn2}`, background: "#fff", color: KLEUR.inkt,
  fontVariantNumeric: "tabular-nums",
};
const label = {
  fontSize: 11, letterSpacing: 0.5, textTransform: "uppercase",
  color: KLEUR.label, fontWeight: 700, display: "block", marginBottom: 4,
};

function websitedeelVoor(betaalwijze, web, handmatigBedrag) {
  if (betaalwijze === "twee_termijnen") return Math.round((web / 2) * 100) / 100;
  if (betaalwijze === "alleen_maandelijks") return 0;
  if (betaalwijze === "handmatig") return handmatigBedrag;
  return web; // ineens
}

export default function AfspraakForm({ rij, onKlaar }) {
  const [websiteprijs, setWebsiteprijs] = useState(
    rij.websiteprijs === null || rij.websiteprijs === undefined ? "" : String(rij.websiteprijs)
  );
  const [maandbedrag, setMaandbedrag] = useState(
    rij.maandbedrag === null || rij.maandbedrag === undefined ? "" : String(rij.maandbedrag)
  );
  const [betaalwijze, setBetaalwijze] = useState(
    rij.betaalwijze && rij.betaalwijze !== "slottermijn" ? rij.betaalwijze : "ineens"
  );
  const [aanbetalingHandmatig, setAanbetalingHandmatig] = useState(
    rij.betaalwijze === "handmatig" && rij.aanbetaling !== null && rij.aanbetaling !== undefined
      ? String(rij.aanbetaling)
      : ""
  );
  const [aanbetalingBevestig, setAanbetalingBevestig] = useState("");
  const [status, setStatus] = useState("idle");
  const [fout, setFout] = useState("");

  const web = getal(websiteprijs);
  const maand = getal(maandbedrag);
  const handmatigBedrag = getal(aanbetalingHandmatig);
  const handmatigOnbevestigd =
    betaalwijze === "handmatig" && aanbetalingBevestig !== "" && getal(aanbetalingBevestig) !== handmatigBedrag;
  const handmatigOntbreekt = betaalwijze === "handmatig" && aanbetalingHandmatig === "";

  const websitedeel = websitedeelVoor(betaalwijze, web, handmatigBedrag);
  const rest = Math.round((web - websitedeel) * 100) / 100;
  const nu = Math.round((websitedeel + maand) * 100) / 100;

  async function bewaar() {
    if (handmatigOntbreekt) {
      setFout("Bij 'Handmatig' is een bedrag verplicht.");
      return;
    }
    if (betaalwijze === "handmatig" && getal(aanbetalingBevestig) !== handmatigBedrag) {
      setFout("De twee bedragen komen niet overeen — controleer en typ ze allebei opnieuw.");
      return;
    }
    setStatus("bezig");
    setFout("");
    try {
      const res = await fetch("/api/abonnement/instellen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: rij.slug,
          websiteprijs: websiteprijs === "" ? null : web,
          maandbedrag: maandbedrag === "" ? null : maand,
          betaalwijze,
          aanbetalingHandmatig: betaalwijze === "handmatig" ? handmatigBedrag : null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Opslaan mislukte.");
      setStatus("klaar");
      if (onKlaar) onKlaar();
    } catch (e) {
      setStatus("idle");
      setFout(String(e.message || e));
    }
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div>
          <span style={label}>Website, excl. btw</span>
          <input
            style={veld}
            inputMode="decimal"
            value={websiteprijs}
            placeholder="599"
            onChange={(e) => setWebsiteprijs(e.target.value)}
          />
        </div>
        <div>
          <span style={label}>Per maand, excl. btw</span>
          <input
            style={veld}
            inputMode="decimal"
            value={maandbedrag}
            placeholder="29,95"
            onChange={(e) => setMaandbedrag(e.target.value)}
          />
        </div>
        <div>
          <span style={label}>Betaalwijze</span>
          <select
            style={{ ...veld, width: 168 }}
            value={betaalwijze}
            onChange={(e) => setBetaalwijze(e.target.value)}
          >
            <option value="ineens">In één keer</option>
            <option value="twee_termijnen">In twee termijnen</option>
            <option value="alleen_maandelijks">Alleen maandelijks</option>
            <option value="handmatig">Handmatig</option>
          </select>
        </div>
        {betaalwijze === "handmatig" && (
          <>
            <div>
              <span style={label}>Aanbetaling, excl. btw</span>
              <input
                style={veld}
                inputMode="decimal"
                value={aanbetalingHandmatig}
                placeholder="bedrag"
                onChange={(e) => setAanbetalingHandmatig(e.target.value)}
              />
            </div>
            <div>
              <span style={label}>Bevestig bedrag</span>
              <input
                style={{ ...veld, borderColor: handmatigOnbevestigd ? "#E8A85C" : KLEUR.lijn2 }}
                inputMode="decimal"
                value={aanbetalingBevestig}
                placeholder="nogmaals"
                onChange={(e) => setAanbetalingBevestig(e.target.value)}
              />
            </div>
          </>
        )}
        <button
          onClick={bewaar}
          disabled={status === "bezig" || handmatigOntbreekt || handmatigOnbevestigd}
          style={{
            padding: "9px 16px", borderRadius: 9, border: "none", cursor: "pointer",
            background: KLEUR.klei, color: "#fff", fontWeight: 700, fontSize: 14,
            fontFamily: HEAD, opacity: (status === "bezig" || handmatigOntbreekt || handmatigOnbevestigd) ? 0.6 : 1,
          }}
        >
          {status === "bezig" ? "Bezig…" : status === "klaar" ? "Opgeslagen ✓" : "Vastleggen"}
        </button>
      </div>

      {betaalwijze === "handmatig" && (
        <div style={{ fontSize: 12.5, color: KLEUR.label }}>
          Bij "Handmatig" wordt de aanbetaling niet automatisch berekend — het bedrag hierboven is
          precies wat er als eerste betaling (samen met de eerste maand) gevraagd wordt.
        </div>
      )}
      {betaalwijze === "alleen_maandelijks" && (
        <div style={{ fontSize: 12.5, color: KLEUR.label }}>
          Geen aanbetaling voor de website vooraf — de eerste betaling is alleen de eerste maand.
          Het websitebedrag kan later alsnog als slottermijn verstuurd worden (Klantenregister).
        </div>
      )}

      {/* Meteen zien wat de klant straks op zijn akkoordpagina te zien krijgt. */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Blokje
          titel="Betaalt nu"
          bedrag={nu}
          onder={websitedeel > 0 ? `${euro(websitedeel)} website + ${euro(maand)} eerste maand` : "eerste maand"}
          nadruk
        />
        {rest > 0 && (
          <Blokje
            titel="Later (slottermijn)"
            bedrag={rest}
            onder={betaalwijze === "alleen_maandelijks" ? "nog te versturen" : "restant website"}
          />
        )}
        <Blokje titel="Elke maand daarna" bedrag={maand} onder="doorlopende incasso" />
      </div>

      {rij.betaal_abonnement_id && (
        <div style={{ fontSize: 12.5, color: KLEUR.labelDonker }}>
          Let op: het abonnement loopt al. Een nieuw maandbedrag verandert de lopende incasso bij
          Mollie niet — zeg hem op en stuur een nieuwe akkoordlink als het bedrag echt moet wijzigen.
        </div>
      )}

      {fout && <div style={{ fontSize: 13, color: KLEUR.kleiDonker, fontWeight: 600 }}>{fout}</div>}
    </div>
  );
}

function Blokje({ titel, bedrag, onder, nadruk }) {
  return (
    <div
      style={{
        border: `1px solid ${nadruk ? "#fcd9a8" : KLEUR.lijn}`,
        background: nadruk ? "#FFF8EE" : KLEUR.baan,
        borderRadius: 10, padding: "8px 12px", minWidth: 152,
      }}
    >
      <div style={{ fontSize: 10.5, letterSpacing: 0.5, textTransform: "uppercase", color: KLEUR.label, fontWeight: 700 }}>
        {titel}
      </div>
      <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 18, fontVariantNumeric: "tabular-nums" }}>
        {euro(bedrag * BTW)}
      </div>
      <div style={{ fontSize: 11.5, color: KLEUR.label }}>
        {euro(bedrag)} excl. · {onder}
      </div>
    </div>
  );
}
