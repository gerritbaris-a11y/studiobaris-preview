"use client";

import { useState } from "react";

export default function AnnuleerKnop({ token }) {
  const [stand, setStand] = useState("");
  const [fout, setFout] = useState("");
  async function annuleer() {
    if (!window.confirm("Weet je zeker dat je deze afspraak wilt annuleren?")) return;
    setStand("bezig"); setFout("");
    const r = await fetch("/api/agenda/annuleer", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }),
    }).then((x) => x.json()).catch(() => ({}));
    if (r.ok) setStand("klaar"); else { setStand(""); setFout(r.error || "Annuleren mislukt."); }
  }
  if (stand === "klaar") return <p style={{ fontWeight: 700, color: "#4A7A4D" }}>Geannuleerd. Je krijgt een bevestiging per e-mail.</p>;
  return (
    <div style={{ marginTop: 16 }}>
      {fout && <p style={{ color: "#9E3B2E" }}>{fout}</p>}
      <button onClick={annuleer} disabled={stand === "bezig"}
        style={{ border: "1.5px solid #9E3B2E", color: "#9E3B2E", background: "#fff", borderRadius: 999, padding: "11px 18px", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
        {stand === "bezig" ? "Bezig…" : "Afspraak annuleren"}
      </button>
    </div>
  );
}
