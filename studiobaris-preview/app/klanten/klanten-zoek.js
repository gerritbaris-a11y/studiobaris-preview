"use client";

import { useEffect, useState } from "react";
import { KLEUR } from "../werkplek-stijl";

// Zoekbalk voor Mijn klanten. Filtert de al-gerenderde klantkaarten (die een
// data-klant-attribuut hebben) rechtstreeks in beeld, zodat we niets opnieuw
// hoeven te laden. Zoekt op naam, plaats, telefoon, e-mail en verzamelaar.
export default function KlantenZoek() {
  const [zoek, setZoek] = useState("");

  useEffect(() => {
    const q = zoek.trim().toLowerCase();
    let zichtbaar = 0;
    document.querySelectorAll("[data-klant]").forEach((el) => {
      const match = !q || (el.getAttribute("data-klant") || "").includes(q);
      el.style.display = match ? "" : "none";
      if (match) zichtbaar++;
    });
    const leeg = document.getElementById("klanten-geen-resultaat");
    if (leeg) leeg.style.display = q && zichtbaar === 0 ? "block" : "none";
  }, [zoek]);

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 15, color: KLEUR.gedempt }}>&#128269;</span>
        <input
          value={zoek}
          onChange={(e) => setZoek(e.target.value)}
          placeholder="Zoek op naam, plaats, telefoon of e-mail…"
          aria-label="Zoek in je klanten"
          style={{
            width: "100%", boxSizing: "border-box", fontFamily: "inherit", fontSize: 15,
            padding: "11px 14px 11px 38px", borderRadius: 10, border: `1px solid ${KLEUR.lijn}`,
            background: "#fff", color: KLEUR.inkt, outline: "none",
          }}
        />
        {zoek && (
          <button
            type="button"
            onClick={() => setZoek("")}
            aria-label="Wissen"
            style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", border: "none", background: "transparent", cursor: "pointer", fontSize: 18, color: KLEUR.gedempt, lineHeight: 1, padding: 4 }}
          >
            &times;
          </button>
        )}
      </div>
      <div id="klanten-geen-resultaat" style={{ display: "none", marginTop: 10, fontSize: 14, color: KLEUR.gedempt }}>
        Geen klant gevonden. Pas je zoekterm aan.
      </div>
    </div>
  );
}
