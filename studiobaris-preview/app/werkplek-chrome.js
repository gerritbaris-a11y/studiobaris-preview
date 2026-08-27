"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

// Vaste balk rechtsonder op de interne teampagina's: een Terug-knop en een
// Feedback-knop. Verschijnt NIET op publieke pagina's (klantsites, intake,
// akkoord, login), zodat klanten dit nooit zien.
const INTERN = [
  "/dashboard",
  "/klanten",
  "/leads",
  "/overzicht",
  "/kosten",
  "/vandaag",
  "/team",
  "/storingen",
  "/restbetalingen",
  "/abonnementen",
  "/vragen",
  "/beheer",
  "/nieuw-akkoord",
  "/vergelijk",
  "/team-feedback",
];

const KLEI = "#C05A38";
const INKT = "#2B2724";

export default function WerkplekChrome() {
  const pad = usePathname() || "";
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("idee");
  const [bericht, setBericht] = useState("");
  const [status, setStatus] = useState("idle");

  const intern = INTERN.some((p) => pad === p || pad.startsWith(p + "/"));
  if (!intern) return null;

  async function verstuur() {
    if (!bericht.trim()) return;
    setStatus("bezig");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, bericht: bericht.trim(), pad }),
      });
      if (!res.ok) {
        setStatus("fout");
        return;
      }
      setStatus("klaar");
      setBericht("");
    } catch {
      setStatus("fout");
    }
  }

  const knop = {
    border: "none",
    borderRadius: 999,
    padding: "10px 16px",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 4px 14px rgba(0,0,0,.18)",
  };

  return (
    <div style={{ position: "fixed", right: 16, bottom: 16, zIndex: 60, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10, fontFamily: "system-ui, sans-serif" }}>
      {open && (
        <div style={{ width: 300, background: "#fff", border: "1px solid #E7DED2", borderRadius: 14, boxShadow: "0 12px 34px rgba(0,0,0,.22)", padding: 16 }}>
          {status === "klaar" ? (
            <div style={{ textAlign: "center", padding: "8px 0" }}>
              <div style={{ fontSize: 32 }}>✅</div>
              <p style={{ margin: "8px 0 0", color: INKT, fontWeight: 600 }}>Bedankt! Je feedback is bewaard.</p>
              <a href="/team-feedback" style={{ display: "inline-block", marginTop: 10, fontSize: 13, color: KLEI, fontWeight: 700 }}>Bekijk alle feedback →</a>
              <div>
                <button onClick={() => { setStatus("idle"); setOpen(false); }} style={{ ...knop, background: "#F1EBE1", color: INKT, marginTop: 12, boxShadow: "none" }}>Sluiten</button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ fontWeight: 800, color: INKT, marginBottom: 8 }}>Feedback delen</div>
              <select value={type} onChange={(e) => setType(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #E7DED2", marginBottom: 8, fontSize: 14 }}>
                <option value="idee">Idee</option>
                <option value="verbeterpunt">Verbeterpunt</option>
                <option value="bug">Bug / fout</option>
                <option value="anders">Anders</option>
              </select>
              <textarea value={bericht} onChange={(e) => setBericht(e.target.value)} rows={4} placeholder="Wat kan er beter?" style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #E7DED2", fontSize: 14, resize: "vertical", boxSizing: "border-box" }} />
              {status === "fout" && <p style={{ color: "#c0392b", fontSize: 13, margin: "6px 0 0" }}>Versturen mislukt. Probeer het zo nog eens.</p>}
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button onClick={verstuur} disabled={status === "bezig" || !bericht.trim()} style={{ ...knop, background: KLEI, color: "#fff", flex: 1, boxShadow: "none", opacity: status === "bezig" || !bericht.trim() ? 0.6 : 1 }}>{status === "bezig" ? "Bezig..." : "Versturen"}</button>
                <button onClick={() => setOpen(false)} style={{ ...knop, background: "#F1EBE1", color: INKT, boxShadow: "none" }}>Annuleren</button>
              </div>
              <a href="/team-feedback" style={{ display: "block", marginTop: 10, fontSize: 12.5, color: "#7A7168" }}>Alle feedback bekijken →</a>
            </>
          )}
        </div>
      )}
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={() => history.back()} style={{ ...knop, background: "#fff", color: INKT, border: "1px solid #E7DED2" }}>← Terug</button>
        <button onClick={() => { setStatus("idle"); setOpen((o) => !o); }} style={{ ...knop, background: KLEI, color: "#fff" }}>💬 Feedback</button>
      </div>
    </div>
  );
}
