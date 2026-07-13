"use client";

import { useState } from "react";

export default function RestKnop({ slug }) {
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState("");

  async function betaal() {
    setBezig(true); setFout("");
    try {
      const res = await fetch("/api/mollie/rest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const j = await res.json();
      if (j.ok && j.checkoutUrl) { window.location.href = j.checkoutUrl; return; }
      setFout(j.error || "Betalen lukt even niet.");
    } catch (e) {
      setFout("Betalen lukt even niet.");
    }
    setBezig(false);
  }

  return (
    <div>
      <button
        onClick={betaal}
        disabled={bezig}
        style={{
          width: "100%", background: bezig ? "#cbd5e1" : "#FF8300", color: "#fff", border: "none",
          padding: "16px", borderRadius: 12, fontSize: 16, fontWeight: 700,
          cursor: bezig ? "default" : "pointer", fontFamily: "inherit",
        }}
      >
        {bezig ? "Bezig…" : "Betaal met iDEAL"}
      </button>
      {fout && <p style={{ color: "#b91c1c", fontSize: 14, marginTop: 10 }}>{fout}</p>}
    </div>
  );
}
