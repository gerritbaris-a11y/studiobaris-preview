"use client";

// Proefperiode van de demo-app, per preview in "Mijn previews".
// - Nog niet gestart: start vanzelf bij het vinkje "Benaderd" of bij de eerste
//   keer dat de prospect de app opent. De knop "Start proefperiode" is sinds
//   22 okt 2026 weg.
// - Loopt: tot wanneer, hoeveel van de 3 projecten geplaatst, en of er
//   recent iets geplaatst is. Gerrit en Levi kunnen verlengen.

import { useState } from "react";

const MAX = 3;

function datum(iso, lang = false) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("nl-NL", { day: "numeric", month: lang ? "long" : "short", timeZone: "Europe/Amsterdam" });
}

export default function ProefStatus({ proef, magVerlengen }) {
  const [bezig, setBezig] = useState("");
  const [fout, setFout] = useState("");
  if (!proef || !proef.heeft_demo) return null;

  async function actie(pad) {
    setBezig(pad); setFout("");
    try {
      const res = await fetch(`/api/proef/${pad}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: proef.slug }),
      });
      const j = await res.json();
      if (j.ok) { window.location.reload(); return; }
      setFout(j.error || "Mislukt.");
    } catch {
      setFout("Mislukt.");
    }
    setBezig("");
  }

  const vak = {
    display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px 12px",
    background: "#F7F4EE", border: "1px solid #ECE8DF", borderRadius: 10, padding: "8px 12px", fontSize: 13,
  };
  const knop = {
    fontSize: 12.5, padding: "6px 11px", borderRadius: 8, border: "1px solid #1A2B3D",
    background: "#1A2B3D", color: "#fff", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
  };
  const knopLicht = { ...knop, background: "#fff", color: "#a35400" };

  // Nog niet gestart: de proef start vanzelf bij het vinkje "Benaderd" of
  // bij de eerste keer dat de prospect de app opent (sinds 22 okt geen knop meer).
  if (!proef.gestart_op) {
    return (
      <div style={vak}>
        <span style={{ fontWeight: 700, color: "#1A2B3D" }}>Proefperiode app</span>
        <span style={{ color: "#4A5560" }}>Nog niet gestart. Start vanzelf zodra je Benaderd aanvinkt, of als de prospect de app eerder opent.</span>
      </div>
    );
  }

  const verlopen = proef.tot && new Date(proef.tot).getTime() < Date.now();
  const recent = proef.laatst_geplaatst_op && Date.now() - new Date(proef.laatst_geplaatst_op).getTime() < 7 * 864e5;
  const geplaatst = Number(proef.geplaatst) || 0;

  return (
    <div style={vak}>
      <span style={{ fontWeight: 700, color: "#1A2B3D" }}>Proefperiode app</span>
      <span style={{ color: verlopen ? "#b91c1c" : "#4A5560", fontWeight: verlopen ? 700 : 400 }}>
        {verlopen ? `Verlopen op ${datum(proef.tot)}` : `Loopt tot ${datum(proef.tot)}`}
        {proef.verlengd > 0 ? ` (${proef.verlengd}× verlengd)` : ""}
      </span>
      <span style={{ color: geplaatst > 0 ? "#0f6e56" : "#4A5560", fontWeight: geplaatst > 0 ? 700 : 400 }}>
        {geplaatst} van {MAX} projecten geplaatst
      </span>
      {recent && (
        <span style={{ fontSize: 12, fontWeight: 700, color: "#fff", background: "#0f6e56", padding: "2px 9px", borderRadius: 999 }}>
          Proefproject geplaatst op {datum(proef.laatst_geplaatst_op)}
        </span>
      )}
      {magVerlengen && (
        <button onClick={() => actie("verleng")} disabled={!!bezig} style={knopLicht}>
          {bezig === "verleng" ? "Verlengen…" : "Verleng 30 dagen"}
        </button>
      )}
      {fout && <span style={{ color: "#b91c1c", fontWeight: 600 }}>{fout}</span>}
    </div>
  );
}
