"use client";

import { useState } from "react";
import { KLEUR } from "../werkplek-stijl";

// Modules in de demo-app van een salonpreview aan/uit. Zo laat je een prospect
// precies zien wat hij krijgt (bijv. Cadeaubonnen en Wachtlijst gratis,
// WhatsApp als extra). Raakt alleen de demo, nooit een echte klant.
const KEUZES = [
  { key: "cadeaubonnen", label: "Cadeaubonnen", hint: "gratis" },
  { key: "wachtlijst", label: "Wachtlijst", hint: "gratis" },
  { key: "whatsapp_s", label: "WhatsApp", hint: "extra" },
];

export default function DemoModules({ slug, modules: begin }) {
  const [mods, setMods] = useState(begin || []);
  const [bezig, setBezig] = useState("");
  const [fout, setFout] = useState("");

  async function wissel(key) {
    const nieuw = mods.includes(key) ? mods.filter((m) => m !== key) : [...mods, key];
    setBezig(key); setFout("");
    try {
      const r = await fetch("/api/klant/demo-modules", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, modules: nieuw }),
      });
      const j = await r.json();
      if (!j.ok) setFout(j.error || "Opslaan mislukt.");
      else setMods(j.modules || []);
    } catch {
      setFout("Geen verbinding.");
    }
    setBezig("");
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, marginTop: 8, fontSize: 12.5 }}>
      <span style={{ color: KLEUR.label, fontWeight: 700 }}>In de demo-app:</span>
      {KEUZES.map((k) => {
        const aan = mods.includes(k.key);
        return (
          <button key={k.key} type="button" onClick={() => wissel(k.key)} disabled={!!bezig}
            title={aan ? "Staat aan in de demo-app. Klik om uit te zetten." : "Staat uit. Klik om aan te zetten in de demo-app."}
            style={{
              padding: "3px 10px", borderRadius: 999, fontWeight: 700, cursor: "pointer", fontSize: 12.5,
              border: `1px solid ${aan ? "#1E6B3A" : KLEUR.lijn2}`, background: aan ? "#E9F7EF" : "#fff", color: aan ? "#1E6B3A" : KLEUR.label,
              opacity: bezig && bezig !== k.key ? 0.6 : 1,
            }}>
            {aan ? "✓ " : ""}{k.label} <span style={{ fontWeight: 500 }}>({k.hint})</span>{bezig === k.key ? " …" : ""}
          </button>
        );
      })}
      {fout && <span style={{ color: KLEUR.kleiDonker || "#b45309" }}>{fout}</span>}
    </div>
  );
}
