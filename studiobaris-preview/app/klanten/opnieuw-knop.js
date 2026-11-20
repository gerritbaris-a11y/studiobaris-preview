"use client";

import { useState } from "react";

// Mijn previews: website verbeteren en de preview opnieuw laten maken
// (teksten, logo en kleuren). De link blijft hetzelfde.
// Het veld start leeg (een lange oude link wissen is op een telefoon lastig);
// de huidige website staat erboven als tekst.
export default function OpnieuwKnop({ slug, bedrijf, website }) {
  const [open, setOpen] = useState(false);
  const [site, setSite] = useState("");
  const [zonder, setZonder] = useState(false);
  const [st, setSt] = useState({ bezig: false, tekst: "", fout: false });

  async function maak() {
    const w = site.trim();
    const uitleg = w
      ? `Teksten, logo en kleuren worden opnieuw opgehaald van ${w}.`
      : zonder
        ? "De preview wordt opnieuw gemaakt zonder website (de oude link vervalt)."
        : `De preview wordt opnieuw gemaakt met de huidige website${website ? ` (${website})` : ""}.`;
    if (!window.confirm(`Preview van ${bedrijf || slug} opnieuw maken?\n\n${uitleg} De link blijft hetzelfde; wat er nu op de preview staat wordt overschreven. Duurt ongeveer een minuut.`)) return;
    setSt({ bezig: true, tekst: "", fout: false });
    try {
      const body = w ? { slug, website: w } : zonder ? { slug, website: "" } : { slug };
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
      <div style={{ fontSize: 13, color: "#4A5560", overflowWrap: "anywhere" }}>
        <strong>Huidige website:</strong> {website || "geen"}
      </div>
      <input type="url" inputMode="url" value={site} disabled={zonder}
        onChange={(e) => setSite(e.target.value)} placeholder="Plak hier de juiste website"
        style={{ padding: "10px", fontSize: 16, border: "1px solid #d1d5db", borderRadius: 9, fontFamily: "inherit", width: "100%", boxSizing: "border-box", background: zonder ? "#F1EEE8" : "#fff" }} />
      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, color: "#4A5560", cursor: "pointer" }}>
        <input type="checkbox" checked={zonder} onChange={(e) => { setZonder(e.target.checked); if (e.target.checked) setSite(""); }}
          style={{ width: 18, height: 18, accentColor: "#1A2B3D" }} />
        Zonder website maken (oude link weghalen)
      </label>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" onClick={maak} disabled={st.bezig}
          style={{ border: "none", background: st.bezig ? "#8A96A3" : "#1A2B3D", color: "#fff", borderRadius: 9, padding: "10px 14px", fontSize: 14, fontWeight: 700, cursor: st.bezig ? "wait" : "pointer" }}>
          {st.bezig ? "Bezig… (±1 min)" : "↻ Opnieuw maken"}
        </button>
        {!st.bezig && (
          <button type="button" onClick={() => setOpen(false)}
            style={{ border: "1px solid #E3DED3", background: "#fff", color: "#4A5560", borderRadius: 9, padding: "10px 14px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
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
