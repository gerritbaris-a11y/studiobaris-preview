"use client";

import { useState } from "react";

export default function VraagKnop({ id, status }) {
  const [bezig, setBezig] = useState(false);
  const open = status === "open";

  async function zet(nieuw) {
    setBezig(true);
    try {
      const res = await fetch("/api/vragen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: nieuw }),
      });
      const j = await res.json();
      if (j.ok) { location.reload(); return; }
      alert(j.error || "Lukt niet.");
    } catch {
      alert("Lukt niet.");
    }
    setBezig(false);
  }

  return (
    <button
      onClick={() => zet(open ? "afgehandeld" : "open")}
      disabled={bezig}
      style={{
        fontSize: 13, fontWeight: 700, padding: "7px 13px", borderRadius: 9, cursor: "pointer",
        border: "1px solid " + (open ? "#0f6e56" : "#E3DACB"),
        background: open ? "#0f6e56" : "#fff",
        color: open ? "#fff" : "#6B6258",
      }}
    >
      {bezig ? "Bezig…" : open ? "Markeer als afgehandeld" : "Weer openzetten"}
    </button>
  );
}
