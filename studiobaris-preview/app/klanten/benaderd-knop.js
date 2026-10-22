"use client";

import { useState } from "react";

// Vinkje "Benaderd" per preview. Aan = deze preview komt op de pagina Benaderd,
// met de datum van nu. Nog een keer klikken zet hem weer uit.
export default function BenaderdKnop({ slug, benaderdOp }) {
  const [op, setOp] = useState(benaderdOp || null);
  const [bezig, setBezig] = useState(false);

  async function wissel() {
    const aan = !op;
    if (!aan && !confirm("Vinkje 'Benaderd' weghalen? De preview verdwijnt dan van de pagina Benaderd.")) return;
    setBezig(true);
    try {
      const res = await fetch("/api/benaderd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, aan }),
      });
      const d = await res.json().catch(() => null);
      if (d && d.ok) setOp(d.benaderd_op || null);
      else alert((d && d.error) || "Mislukt, probeer opnieuw.");
    } finally {
      setBezig(false);
    }
  }

  const datum = op
    ? new Date(op).toLocaleDateString("nl-NL", { day: "numeric", month: "short", timeZone: "Europe/Amsterdam" })
    : "";

  return (
    <button
      type="button"
      onClick={wissel}
      disabled={bezig}
      title={op ? "Benaderd. Klik om het vinkje weg te halen." : "Markeer als benaderd: hij komt dan op de pagina Benaderd."}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        background: op ? "#e7f3ea" : "#fff",
        color: op ? "#0f6e56" : "#524A40",
        border: `1.5px solid ${op ? "#9fd0b3" : "#E3DACB"}`,
        padding: "7px 13px", borderRadius: 9, fontSize: 13, fontWeight: 700,
        cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit",
      }}
    >
      <span aria-hidden="true">{op ? "✓" : "○"}</span>
      {bezig ? "Bezig…" : op ? `Benaderd ${datum}` : "Benaderd"}
    </button>
  );
}
