"use client";

import { useState } from "react";

const lbl = { fontSize: 11, color: "#666", display: "flex", flexDirection: "column", gap: 2 };
const num = { width: 46, padding: "4px 6px", border: "1px solid #d4d4d4", borderRadius: 6, fontSize: 13 };
const txt = { width: 110, padding: "4px 6px", border: "1px solid #d4d4d4", borderRadius: 6, fontSize: 13 };
const btn = { background: "#2B2724", color: "#fff", border: "none", padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" };
const btnGhost = { background: "#fff", color: "#2B2724", border: "1px solid #2B2724", padding: "5px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" };

export default function BeheerActies({ klant }) {
  const [pl, setPl] = useState(klant.daily_project_limit ?? 2);
  const [rl, setRl] = useState(klant.daily_review_limit ?? 2);
  const [abo, setAbo] = useState(klant.abonnementsvorm || "");
  const [saveState, setSaveState] = useState("idle");
  const [link, setLink] = useState("");
  const [linkState, setLinkState] = useState("idle");
  const [copied, setCopied] = useState(false);

  async function opslaan() {
    setSaveState("bezig");
    try {
      const res = await fetch("/api/beheer/instellen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: klant.id, projectLimit: pl, reviewLimit: rl, abonnementsvorm: abo }),
      });
      const d = await res.json();
      setSaveState(d.ok ? "ok" : "fout");
    } catch {
      setSaveState("fout");
    }
    setTimeout(() => setSaveState("idle"), 2500);
  }

  async function genereerLink() {
    setLinkState("bezig"); setLink(""); setCopied(false);
    try {
      const res = await fetch("/api/beheer/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: klant.id, dagen: 14 }),
      });
      const d = await res.json();
      if (d.ok && d.link) { setLink(d.link); setLinkState("ok"); }
      else setLinkState("fout");
    } catch {
      setLinkState("fout");
    }
  }

  async function kopieer() {
    try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
        <label style={lbl}>P/dag<input type="number" min="0" value={pl} onChange={(e) => setPl(e.target.value)} style={num} /></label>
        <label style={lbl}>R/dag<input type="number" min="0" value={rl} onChange={(e) => setRl(e.target.value)} style={num} /></label>
        <label style={lbl}>Abonnement<input value={abo} onChange={(e) => setAbo(e.target.value)} placeholder="Standaard…" style={txt} /></label>
        <button onClick={opslaan} style={btn}>
          {saveState === "bezig" ? "…" : saveState === "ok" ? "✓ Opgeslagen" : saveState === "fout" ? "Fout" : "Opslaan"}
        </button>
      </div>
      <div style={{ marginTop: 8 }}>
        <button onClick={genereerLink} style={btnGhost}>
          {linkState === "bezig" ? "Bezig…" : "Nieuwe inlog-link (14 dagen)"}
        </button>
        {linkState === "fout" && <span style={{ color: "#c0392b", fontSize: 11, marginLeft: 8 }}>Mislukt</span>}
        {link && (
          <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8 }}>
            <a href={link} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: "#C05A38", wordBreak: "break-all" }}>{link}</a>
            <button onClick={kopieer} style={{ ...btnGhost, padding: "3px 8px" }}>{copied ? "✓" : "Kopieer"}</button>
          </div>
        )}
      </div>
    </div>
  );
}
