"use client";

import { useEffect, useState } from "react";
import { KLEUR } from "../werkplek-stijl";

// Zoekbalk + filterknoppen voor Mijn klanten. Filtert de al-gerenderde
// klantkaarten (met data-attributen) rechtstreeks in beeld, zonder herladen.
// Zoekt op naam, plaats, telefoon, e-mail en verzamelaar; filtert op de fase
// waar het geld zit (akkoord/betaald) en op klanten die reageerden.
const FILTERS = [
  { key: "", label: "Alle" },
  { key: "geen", label: "Nog geen akkoord" },
  { key: "akkoord", label: "Akkoord" },
  { key: "actief", label: "Betaald" },
  { key: "reactie", label: "Klant reageerde" },
];

function pastFilter(el, f) {
  if (!f) return true;
  if (f === "reactie") return el.getAttribute("data-reactie") === "ja";
  return (el.getAttribute("data-betaal") || "geen") === f;
}

export default function KlantenZoek() {
  const [zoek, setZoek] = useState("");
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const q = zoek.trim().toLowerCase();
    let zichtbaar = 0;
    document.querySelectorAll("[data-klant]").forEach((el) => {
      const match = (!q || (el.getAttribute("data-klant") || "").includes(q)) && pastFilter(el, filter);
      el.style.display = match ? "" : "none";
      if (match) zichtbaar++;
    });
    const leeg = document.getElementById("klanten-geen-resultaat");
    if (leeg) leeg.style.display = zichtbaar === 0 ? "block" : "none";
  }, [zoek, filter]);

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

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
        {FILTERS.map((f) => {
          const aan = filter === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              style={{
                padding: "7px 12px", borderRadius: 999, fontSize: 13, fontWeight: aan ? 700 : 600,
                fontFamily: "inherit", cursor: "pointer", whiteSpace: "nowrap",
                border: `1px solid ${aan ? KLEUR.klei : KLEUR.lijn}`,
                background: aan ? KLEUR.klei : "#fff", color: aan ? "#fff" : "#7A7168",
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      <div id="klanten-geen-resultaat" style={{ display: "none", marginTop: 10, fontSize: 14, color: KLEUR.gedempt }}>
        Geen klant gevonden. Pas je zoekterm of filter aan.
      </div>
    </div>
  );
}
