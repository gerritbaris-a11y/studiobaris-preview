"use client";

import { useState } from "react";

export default function AkkoordKnop({ slug, voorwaardenUrl = "/voorwaarden" }) {
  const [akkoord, setAkkoord] = useState(false);
  const [s, setS] = useState("idle");
  const [error, setError] = useState("");

  async function go() {
    if (!akkoord) return;
    setS("bezig"); setError("");
    try {
      const res = await fetch("/api/mollie/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, voorwaarden: true }),
      });
      const d = await res.json();
      if (d.ok && d.checkoutUrl) {
        window.location.href = d.checkoutUrl;
      } else {
        setError(d.error || "Er ging iets mis."); setS("idle");
      }
    } catch (e) {
      setError(String(e)); setS("idle");
    }
  }

  return (
    <div>
      <label style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, color: "#333", marginBottom: 16, cursor: "pointer" }}>
        <input type="checkbox" checked={akkoord} onChange={(e) => setAkkoord(e.target.checked)} style={{ marginTop: 3 }} />
        <span>
          Ik heb de{" "}
          <a href={voorwaardenUrl} target="_blank" rel="noreferrer" style={{ color: "#1d6fd1" }}>algemene voorwaarden</a>{" "}
          gelezen en ga ermee akkoord, inclusief de maandelijkse automatische incasso.
        </span>
      </label>

      <button onClick={go} disabled={!akkoord || s === "bezig"}
        style={{ background: akkoord ? "#FF8300" : "#e3c4a0", color: "#fff", border: "none", padding: "14px 26px", borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: akkoord ? "pointer" : "not-allowed" }}>
        {s === "bezig" ? "Bezig…" : "Akkoord & betalen"}
      </button>
      {error && <p style={{ color: "#c0392b", marginTop: 12 }}>{error}</p>}
    </div>
  );
}
