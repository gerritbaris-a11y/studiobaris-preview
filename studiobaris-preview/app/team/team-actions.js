"use client";

import { useState } from "react";

export function ResetKnop({ id, naam, gezet }) {
  const [s, setS] = useState("idle");
  async function go() {
    if (!confirm(`Wachtwoord van "${naam}" resetten?\n\n${naam} kiest bij de volgende login een nieuw wachtwoord.`)) return;
    setS("bezig");
    try {
      const res = await fetch("/api/team/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const d = await res.json();
      if (d.ok) location.reload();
      else { alert(d.error || "Resetten mislukt"); setS("idle"); }
    } catch (e) { alert(String(e)); setS("idle"); }
  }
  return (
    <button onClick={go} disabled={s === "bezig" || !gezet}
      title={gezet ? "Wachtwoord resetten" : "Nog geen wachtwoord ingesteld"}
      style={{ background: "#fff", color: gezet ? "#c0392b" : "#b8c0c9", border: "1px solid " + (gezet ? "#e3b9b4" : "#e5e7eb"), padding: "5px 10px", borderRadius: 6, fontSize: 12, cursor: gezet ? "pointer" : "default", whiteSpace: "nowrap" }}>
      {s === "bezig" ? "Bezig…" : "Wachtwoord resetten"}
    </button>
  );
}
