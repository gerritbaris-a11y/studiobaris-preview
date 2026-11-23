"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { KLEUR } from "../werkplek-stijl";

// Zoekbalk + filterknoppen voor Mijn previews. Zoeken en filteren gebeurt op de
// server (via ?zoek=&fase=); de pagina toont per keer 10 kaarten met "Meer laden".
// Eerder stonden alle kaarten tegelijk in beeld en werden ze hier verborgen;
// bij 200+ previews liep Chrome daarop vast.
// Filterregels (welke fase onder welke knop) staan in previews-pagina.js:
// Klaar alleen onder "Klaar", gearchiveerd alleen onder "Archief".
const FILTERS = [
  { key: "", label: "Alle" },
  { key: "geen", label: "Nog geen akkoord" },
  { key: "akkoord", label: "Akkoord" },
  { key: "klaar", label: "Klaar" },
  { key: "archief", label: "Archief" },
];

export default function KlantenZoek({ zoek: zoekStart = "", fase = "", aantallen = {}, sector = "portfolio" }) {
  const router = useRouter();
  const [zoek, setZoek] = useState(zoekStart);
  const eerste = useRef(true);

  const ga = (nieuwZoek, nieuweFase) => {
    const q = new URLSearchParams();
    if (sector !== "portfolio") q.set("sector", sector);
    if (nieuwZoek.trim()) q.set("zoek", nieuwZoek.trim());
    if (nieuweFase) q.set("fase", nieuweFase);
    const s = q.toString();
    router.replace("/klanten" + (s ? "?" + s : ""), { scroll: false });
  };

  // Zoeken: even wachten tot je klaar bent met typen.
  useEffect(() => {
    if (eerste.current) { eerste.current = false; return; }
    const t = setTimeout(() => ga(zoek, fase), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
        {FILTERS.map((f) => {
          const aan = fase === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => ga(zoek, f.key)}
              style={{
                padding: "7px 12px", borderRadius: 999, fontSize: 13, fontWeight: aan ? 700 : 600,
                fontFamily: "inherit", cursor: "pointer", whiteSpace: "nowrap",
                border: `1px solid ${aan ? KLEUR.klei : KLEUR.lijn}`,
                background: aan ? KLEUR.klei : "#fff", color: aan ? "#fff" : "#4A5560",
              }}
            >
              {f.label}{aantallen[f.key] !== undefined ? ` (${aantallen[f.key]})` : ""}
            </button>
          );
        })}
      </div>
    </div>
  );
}
