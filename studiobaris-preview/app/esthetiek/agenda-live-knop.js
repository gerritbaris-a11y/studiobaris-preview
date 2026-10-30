"use client";

import { useState } from "react";

// Beheer: agenda van de preview overzetten naar het app-account van de klant.
export default function AgendaLiveKnop({ slug, naar, accountNaam, email }) {
  const [stand, setStand] = useState("");
  async function zet() {
    if (!window.confirm(`De agenda van deze preview overzetten naar het app-account "${accountNaam}" en live zetten? Testboekingen gaan niet mee.`)) return;
    setStand("bezig");
    const r = await fetch("/api/agenda/overzetten", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug, naar, email }),
    }).then((x) => x.json()).catch(() => ({}));
    setStand(r.ok ? "klaar" : r.error || "Mislukt.");
  }
  if (stand === "klaar") return <span style={{ fontSize: 13, fontWeight: 700, color: "#0f6e56" }}>✓ Agenda staat live in de app van {accountNaam}</span>;
  return (
    <span style={{ display: "inline-flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
      <button onClick={zet} disabled={stand === "bezig"}
        style={{ fontSize: 13, fontWeight: 700, padding: "6px 12px", borderRadius: 999, border: "1px solid #1A2B3D", background: "#fff", color: "#1A2B3D", cursor: "pointer" }}>
        {stand === "bezig" ? "Bezig…" : "Agenda live zetten in de app"}
      </button>
      {stand && stand !== "bezig" && <span style={{ fontSize: 12.5, color: "#9E3B2E" }}>{stand}</span>}
    </span>
  );
}
