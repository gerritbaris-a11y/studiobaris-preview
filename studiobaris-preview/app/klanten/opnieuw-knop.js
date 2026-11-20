"use client";

import { useState } from "react";

// Mijn previews: website verbeteren en de preview opnieuw laten maken
// (teksten, logo en kleuren). De link blijft hetzelfde.
export default function OpnieuwKnop({ slug, bedrijf, website }) {
  const [open, setOpen] = useState(false);
  const [site, setSite] = useState(website || "");
  const [st, setSt] = useState({ bezig: false, tekst: "", fout: false });

  async function maak() {
    const w = site.trim();
    if (!window.confirm(`Preview van ${bedrijf || slug} opnieuw maken?\n\n${w ? `Teksten, logo en kleuren worden opnieuw opgehaald van ${w}.` : "De preview wordt opnieuw gemaakt zonder website (de oude link vervalt)."} De link blijft hetzelfde; wat er nu op de preview staat wordt overschreven. Duurt ongeveer een minuut.`)) return;
    setSt({ bezig: true, tekst: "", fout: false });
    try {
      const res = await fetch("/api/leads/opnieuw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Alleen meesturen als je het veld wijzigde; leeggemaakt = zonder website.
        body: JSON.stringify(w === (website || "").trim() ? { slug } : { slug, website: w }),
      });
      const j = await res.json().catch(() => ({}));
      if (j.ok) setSt({ bezig: false, tekst: "Opnieuw gemaakt. Open de preview om te kijken.", fout: false });
      else setSt({ bezig: false, tekst: j.error || "Opnieuw maken mislukt.", fout: true });
    } catch {
      setSt({ bezig: false, tekst: "Geen verbinding.", fout: true });
    }
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)}
        style={{ alignSelf: "flex-start", border: "1px solid #E3DED3", background: "#fff", color: "#1A2B3D", borderRadius: 9, padding: "7px 12px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
        ↻ Preview opnieuw maken
      </button>
    );
  }
  return (
    <div style={{ border: "1px solid #E3DED3", borderRadius: 12, padding: 12, display: "flex", flexDirection: "column", gap: 8, background: "#FBFAF7" }}>
      <div style={{ fontSize: 13, color: "#4A5560" }}>Klopt de website niet? Pas hem aan en maak de preview opnieuw. Leeg laten = zonder website.</div>
      <input value={site} onChange={(e) => setSite(e.target.value)} placeholder="Website van de prospect"
        style={{ padding: "9px 10px", fontSize: 14, border: "1px solid #d1d5db", borderRadius: 9, fontFamily: "inherit" }} />
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" onClick={maak} disabled={st.bezig}
          style={{ border: "none", background: st.bezig ? "#8A96A3" : "#1A2B3D", color: "#fff", borderRadius: 9, padding: "9px 14px", fontSize: 13.5, fontWeight: 700, cursor: st.bezig ? "wait" : "pointer" }}>
          {st.bezig ? "Bezig… (±1 min)" : "↻ Opnieuw maken"}
        </button>
        {!st.bezig && (
          <button type="button" onClick={() => setOpen(false)}
            style={{ border: "1px solid #E3DED3", background: "#fff", color: "#4A5560", borderRadius: 9, padding: "9px 14px", fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}>
            Sluiten
          </button>
        )}
      </div>
      {st.tekst && (
        <div style={{ fontSize: 12.5, fontWeight: 600, color: st.fout ? "#9E3B2E" : "#1d7a46" }}>{st.tekst}</div>
      )}
    </div>
  );
}
