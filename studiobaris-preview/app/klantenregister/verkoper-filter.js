"use client";

import { useEffect, useState } from "react";
import { KLEUR } from "../werkplek-stijl";

// Portefeuille-filter voor de Klanten-tabel: knoppen per teamlid (uit
// getTeam()) die de al-gerenderde rijen (data-verzamelaar, zie klant-rij.js)
// direct tonen/verbergen — zelfde DOM-toggle-patroon als KlantenZoek, geen
// herlaad of her-fetch. Alleen de hoofdrij telt mee voor "geen resultaat";
// een opengeklapte detailrij hoort er automatisch bij via dezelfde attribuut-
// waarde, maar telt niet dubbel.
export default function VerkoperFilter({ team = [] }) {
  const [filter, setFilter] = useState("");
  const namen = team.map((t) => t.naam);

  useEffect(() => {
    let zichtbaar = 0;
    document.querySelectorAll("[data-verzamelaar]").forEach((el) => {
      const v = el.getAttribute("data-verzamelaar") || "";
      const match = !filter || v === filter;
      el.style.display = match ? "" : "none";
      if (match && el.hasAttribute("data-rij-hoofd")) zichtbaar++;
    });
    const leeg = document.getElementById("klanten-geen-portefeuille");
    if (leeg) leeg.style.display = zichtbaar === 0 ? "block" : "none";
  }, [filter]);

  if (namen.length === 0) return null;

  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <button type="button" onClick={() => setFilter("")} style={chip(filter === "")}>
          Alle verkopers
        </button>
        {namen.map((n) => (
          <button key={n} type="button" onClick={() => setFilter(n)} style={chip(filter === n)}>
            {n}
          </button>
        ))}
      </div>
      <div id="klanten-geen-portefeuille" style={{ display: "none", marginTop: 10, fontSize: 13.5, color: KLEUR.gedempt }}>
        Geen klanten bij deze verkoper.
      </div>
    </div>
  );
}

function chip(aan) {
  return {
    padding: "7px 12px", borderRadius: 999, fontSize: 13, fontWeight: aan ? 700 : 600,
    fontFamily: "inherit", cursor: "pointer", whiteSpace: "nowrap",
    border: `1px solid ${aan ? KLEUR.klei : KLEUR.lijn}`,
    background: aan ? KLEUR.klei : "#fff", color: aan ? "#fff" : "#7A7168",
  };
}
