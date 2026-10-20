"use client";

import { useState } from "react";
import { KLEUR, HEAD } from "../werkplek-stijl";

// Bovenaan Mijn previews, boven de hostingcheck: heeft een prospect nog geen
// domein, dan kijkt de verkoper hier of de gewenste naam nog vrij is.

const card = { background: "#fff", border: `1px solid ${KLEUR.lijn}`, borderRadius: 16, padding: "16px 18px", marginBottom: 16 };
const invoer = {
  flex: "1 1 220px", minWidth: 0, padding: "10px 12px", borderRadius: 10,
  border: `1px solid ${KLEUR.lijn2}`, fontSize: 14.5, fontFamily: "inherit", background: KLEUR.papier,
};
const knop = {
  background: KLEUR.klei, color: "#fff", border: "none", padding: "10px 16px", borderRadius: 10,
  fontWeight: 700, fontSize: 14, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit",
};

export default function DomeinCheck() {
  const [domein, setDomein] = useState("");
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState("");
  const [r, setR] = useState(null);

  async function check(e) {
    e.preventDefault();
    if (!domein.trim()) return;
    setBezig(true); setFout(""); setR(null);
    try {
      const res = await fetch("/api/domein-check", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ domein }),
      });
      const d = await res.json();
      if (!d.ok) setFout(d.error || "Opzoeken mislukt.");
      else setR(d);
    } catch {
      setFout("Opzoeken mislukt. Probeer het zo nog eens.");
    }
    setBezig(false);
  }

  const k = r ? (r.vrij ? KLEUR.sage : KLEUR.rust) : null;

  return (
    <div style={card}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
        <h2 style={{ fontFamily: HEAD, fontSize: 16, margin: 0, fontWeight: 800 }}>Nog geen domein?</h2>
        <span style={{ fontSize: 13, color: "#9A9084" }}>kijk of de gewenste naam nog vrij is</span>
      </div>

      <form onSubmit={check} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          value={domein} onChange={(e) => setDomein(e.target.value)}
          placeholder="schildersbedrijfjansen.nl" inputMode="url" autoCapitalize="off" autoCorrect="off" spellCheck={false}
          style={invoer}
        />
        <button type="submit" disabled={bezig} style={{ ...knop, opacity: bezig ? 0.6 : 1 }}>
          {bezig ? "Bezig met zoeken…" : "Check"}
        </button>
      </form>
      <div style={{ fontSize: 12, color: "#9A9084", marginTop: 6 }}>Zonder extensie kijken we naar .nl.</div>

      {fout && <div style={{ marginTop: 10, fontSize: 13.5, color: KLEUR.rust.tekst }}>{fout}</div>}

      {r && (
        <div style={{ marginTop: 12, background: k.bg, color: k.tekst, borderRadius: 10, padding: "10px 12px", fontSize: 13.5, fontWeight: 600 }}>
          {r.vrij
            ? <><strong>{r.domein}</strong> is vrij. Dit domein kunnen we voor de klant vastleggen.</>
            : <><strong>{r.domein}</strong> is al bezet. Probeer een andere naam, of: is dit domein van de prospect zelf, gebruik dan de hostingcheck hieronder.</>}
        </div>
      )}
    </div>
  );
}
