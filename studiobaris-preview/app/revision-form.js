"use client";

import { useState } from "react";

const veld = { display: "block", width: "100%", padding: "10px 12px", fontSize: 15, border: "1px solid #d8dde3", borderRadius: 8, marginTop: 6, fontFamily: "inherit" };
const label = { display: "block", marginTop: 16, fontSize: 14, fontWeight: 600, color: "#222" };

export default function RevisionForm({ slug, type, titel, intro, velden }) {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setStatus("bezig");
    setError("");
    const fd = new FormData(e.target);
    const antwoorden = {};
    for (const [k, val] of fd.entries()) if (String(val).trim()) antwoorden[k] = val;
    try {
      const res = await fetch("/api/revise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, type, antwoorden }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error || "Er ging iets mis."); setStatus("fout"); return; }
      setStatus("klaar");
    } catch (err) {
      setError(String(err));
      setStatus("fout");
    }
  }

  if (status === "klaar") {
    return (
      <main style={{ maxWidth: 620, margin: "12vh auto", padding: "0 24px", fontFamily: "system-ui, sans-serif", textAlign: "center" }}>
        <h1 style={{ fontSize: 28 }}>Bedankt!</h1>
        <p style={{ color: "#555", marginTop: 12, fontSize: 17 }}>
          We hebben je input ontvangen en werken je website bij. Je krijgt binnenkort de
          vernieuwde versie van ons te zien.
        </p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 640, margin: "5vh auto", padding: "0 24px", fontFamily: "system-ui, sans-serif", color: "#222" }}>
      <p style={{ fontSize: 13, letterSpacing: 2, textTransform: "uppercase", color: "#888" }}>StudioBaris</p>
      <h1 style={{ fontSize: 28, margin: "6px 0 4px" }}>{titel}</h1>
      <p style={{ color: "#555", marginBottom: 8 }}>{intro}</p>
      <form onSubmit={onSubmit}>
        {velden.map((f) => (
          <label key={f.name} style={label}>
            {f.label}
            {f.type === "textarea"
              ? <textarea style={{ ...veld, minHeight: 90 }} name={f.name} placeholder={f.placeholder || ""} />
              : <input style={veld} name={f.name} placeholder={f.placeholder || ""} />}
          </label>
        ))}
        <button type="submit" disabled={status === "bezig"} style={{ marginTop: 24, background: "#FF8300", color: "#fff", border: "none", padding: "13px 24px", borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
          {status === "bezig" ? "Versturen…" : "Versturen"}
        </button>
        {error && <p style={{ color: "#c0392b", marginTop: 14 }}>{error}</p>}
      </form>
    </main>
  );
}
