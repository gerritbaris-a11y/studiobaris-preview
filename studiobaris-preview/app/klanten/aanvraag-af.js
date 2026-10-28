"use client";

// Knopje "Gebeld" bij een terugbelverzoek van de aanbodpagina.
import { useState } from "react";

export default function AanvraagAf({ id, klein }) {
  const [bezig, setBezig] = useState(false);
  async function af() {
    setBezig(true);
    try {
      const res = await fetch("/api/proef/aanvraag-af", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      const j = await res.json().catch(() => ({}));
      if (j.ok) { window.location.reload(); return; }
      alert(j.error || "Afvinken mislukt.");
    } catch { alert("Afvinken mislukt."); }
    setBezig(false);
  }
  return (
    <button type="button" onClick={af} disabled={bezig}
      style={{ fontSize: klein ? 12 : 12.5, padding: klein ? "3px 9px" : "6px 11px", borderRadius: 8, border: "1px solid #1A2B3D", background: "#fff", color: "#1A2B3D", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
      {bezig ? "…" : "Gebeld ✓"}
    </button>
  );
}
