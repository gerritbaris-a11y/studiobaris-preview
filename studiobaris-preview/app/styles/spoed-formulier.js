"use client";

import { useState } from "react";

// Storingsknop op de spoedsite: "Wat is er aan de hand?" → keuze → naam,
// telefoon, adres, korte omschrijving. Gaat per e-mail naar de vakman
// (app/api/spoed/aanvraag). Op de preview is het een werkende test.
export default function SpoedFormulier({ slug, storingen = [], test = false, basis = "" }) {
  const [keuze, setKeuze] = useState("");
  const [v, setV] = useState({ naam: "", telefoon: "", adres: "", omschrijving: "", website: "" });
  const [stand, setStand] = useState({ bezig: false, fout: "", klaar: false });

  async function verstuur(e) {
    e.preventDefault();
    if (!v.naam.trim() || !v.telefoon.trim()) return setStand({ ...stand, fout: "Vul je naam en telefoonnummer in." });
    setStand({ bezig: true, fout: "", klaar: false });
    try {
      const r = await fetch(`${basis}/api/spoed/aanvraag`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, storing: keuze, ...v }),
      }).then((x) => x.json());
      if (!r.ok) return setStand({ bezig: false, fout: r.error || "Versturen is niet gelukt. Bel ons gerust.", klaar: false });
      setStand({ bezig: false, fout: "", klaar: true });
    } catch {
      setStand({ bezig: false, fout: "Geen verbinding. Bel ons gerust.", klaar: false });
    }
  }

  if (stand.klaar) {
    return (
      <div className="sp-form sp-klaar" role="status">
        <div className="sp-vink" aria-hidden="true">✓</div>
        <strong>Je melding is binnen.</strong>
        <p>We bellen je zo snel mogelijk terug op {v.telefoon}.{test ? " (Dit was een test op de voorbeeldsite.)" : ""}</p>
      </div>
    );
  }

  return (
    <form className="sp-form" onSubmit={verstuur}>
      <div className="sp-keuzes" role="radiogroup" aria-label="Wat is er aan de hand?">
        {[...storingen.map((s) => s.titel).filter(Boolean), "Iets anders"].map((t) => (
          <button key={t} type="button" role="radio" aria-checked={keuze === t} className={"sp-keuze" + (keuze === t ? " aan" : "")} onClick={() => setKeuze(t)}>{t}</button>
        ))}
      </div>
      {keuze && (
        <div className="sp-velden">
          <input aria-label="Naam" placeholder="Je naam" autoComplete="name" value={v.naam} onChange={(e) => setV({ ...v, naam: e.target.value })} />
          <input aria-label="Telefoon" placeholder="Telefoonnummer" type="tel" autoComplete="tel" value={v.telefoon} onChange={(e) => setV({ ...v, telefoon: e.target.value })} />
          <input aria-label="Adres" placeholder="Straat + plaats" autoComplete="street-address" value={v.adres} onChange={(e) => setV({ ...v, adres: e.target.value })} />
          <textarea aria-label="Omschrijving" placeholder="Wat zie je? (optioneel)" value={v.omschrijving} onChange={(e) => setV({ ...v, omschrijving: e.target.value })} />
          <input tabIndex={-1} aria-hidden="true" autoComplete="off" value={v.website} onChange={(e) => setV({ ...v, website: e.target.value })}
            style={{ position: "absolute", left: -9999, width: 1, height: 1, opacity: 0 }} />
          {stand.fout && <p className="sp-fout">{stand.fout}</p>}
          <button type="submit" className="sp-knop" disabled={stand.bezig}>{stand.bezig ? "Bezig…" : "Bel mij terug"}</button>
          <p className="sp-klein">We gebruiken je gegevens alleen om je terug te bellen.</p>
        </div>
      )}
    </form>
  );
}
