"use client";

import { useState } from "react";

// Mijn previews: website van de prospect. Oude link wissen (✕), nieuwe plakken,
// "Opnieuw maken". Leeg = zonder website. De preview-link blijft hetzelfde.
export default function OpnieuwKnop({ slug, bedrijf, website }) {
  const begin = website || "";
  const [site, setSite] = useState(begin);
  const [st, setSt] = useState({ bezig: false, tekst: "", fout: false });

  async function maak() {
    const w = site.trim();
    const uitleg = w ? `met ${w}` : "zonder website";
    if (!window.confirm(`Preview van ${bedrijf || slug} opnieuw maken ${uitleg}?\n\nWat er nu op de preview staat wordt overschreven. De link blijft hetzelfde. Duurt ongeveer een minuut.`)) return;
    setSt({ bezig: true, tekst: "", fout: false });
    try {
      const body = w === begin.trim() ? { slug } : { slug, website: w };
      const res = await fetch("/api/leads/opnieuw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json().catch(() => ({}));
      if (j.ok) setSt({ bezig: false, tekst: "Opnieuw gemaakt. Open de preview om te kijken.", fout: false });
      else setSt({ bezig: false, tekst: j.error || "Opnieuw maken mislukt.", fout: true });
    } catch {
      setSt({ bezig: false, tekst: "Geen verbinding.", fout: true });
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: "#4A5560" }}>Website van de prospect</div>
      <div style={{ display: "flex", gap: 6, alignItems: "stretch", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1 1 220px", minWidth: 0 }}>
          <input type="url" inputMode="url" value={site} onChange={(e) => setSite(e.target.value)}
            placeholder="Plak de website (leeg = zonder website)"
            style={{ padding: "10px 40px 10px 10px", fontSize: 16, border: "1px solid #d1d5db", borderRadius: 9, fontFamily: "inherit", width: "100%", boxSizing: "border-box" }} />
          {site && (
            <button type="button" onClick={() => setSite("")} aria-label="Website wissen" title="Wissen"
              style={{ position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)", width: 32, height: 32, border: "none", borderRadius: 8, background: "#F1EEE8", color: "#4A5560", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
              ✕
            </button>
          )}
        </div>
        <button type="button" onClick={maak} disabled={st.bezig}
          style={{ border: "none", background: st.bezig ? "#8A96A3" : "#1A2B3D", color: "#fff", borderRadius: 9, padding: "10px 14px", fontSize: 14, fontWeight: 700, cursor: st.bezig ? "wait" : "pointer", whiteSpace: "nowrap" }}>
          {st.bezig ? "Bezig… (±1 min)" : "↻ Opnieuw maken"}
        </button>
      </div>
      {st.tekst && (
        <div style={{ fontSize: 12.5, fontWeight: 600, color: st.fout ? "#9E3B2E" : "#1d7a46" }}>{st.tekst}</div>
      )}
    </div>
  );
}
