"use client";

import { useState } from "react";

const veld = { width: "100%", padding: "12px 14px", fontSize: 16, border: "1px solid #D8D2C6", borderRadius: 12, boxSizing: "border-box", fontFamily: "inherit" };
const label = { display: "block", fontSize: 13.5, fontWeight: 700, margin: "14px 0 6px" };

export default function ProFormulier({ k, email, contact }) {
  const [v, setV] = useState({ factuur_email: email, contact, kvk: "", btw: "", akkoord: false });
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState("");
  const zet = (n) => (e) => setV({ ...v, [n]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  async function betaal(e) {
    e.preventDefault();
    setFout("");
    if (!v.factuur_email.trim()) return setFout("Vul het e-mailadres voor de factuur in.");
    if (!v.akkoord) return setFout("Ga eerst akkoord met de voorwaarden.");
    setBezig(true);
    try {
      const res = await fetch("/api/app/afrekenen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ k, ...v }),
      });
      const d = await res.json().catch(() => ({}));
      if (d.ok && d.checkoutUrl) window.location.href = d.checkoutUrl;
      else { setFout(d.error || "Er ging iets mis. Probeer het opnieuw."); setBezig(false); }
    } catch {
      setFout("Geen verbinding. Probeer het opnieuw.");
      setBezig(false);
    }
  }

  return (
    <form onSubmit={betaal}>
      <label style={label} htmlFor="fe">E-mailadres voor de factuur</label>
      <input id="fe" type="email" style={veld} value={v.factuur_email} onChange={zet("factuur_email")} autoComplete="email" />
      <label style={label} htmlFor="cp">Contactpersoon</label>
      <input id="cp" style={veld} value={v.contact} onChange={zet("contact")} autoComplete="name" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label style={label} htmlFor="kvk">KvK-nummer <span style={{ fontWeight: 400, color: "#8A949E" }}>(optioneel)</span></label>
          <input id="kvk" style={veld} value={v.kvk} onChange={zet("kvk")} inputMode="numeric" />
        </div>
        <div>
          <label style={label} htmlFor="btw">Btw-nummer <span style={{ fontWeight: 400, color: "#8A949E" }}>(optioneel)</span></label>
          <input id="btw" style={veld} value={v.btw} onChange={zet("btw")} />
        </div>
      </div>
      <label style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 14, margin: "16px 0 4px" }}>
        <input type="checkbox" checked={v.akkoord} onChange={zet("akkoord")} style={{ marginTop: 3 }} />
        <span>Ik ga akkoord met de <a href="/voorwaarden" target="_blank">voorwaarden</a> en geef toestemming voor de maandelijkse automatische incasso.</span>
      </label>
      {fout && <div role="alert" style={{ color: "#B3261E", fontSize: 14, marginTop: 10 }}>{fout}</div>}
      <button type="submit" disabled={bezig} style={{ marginTop: 16, width: "100%", padding: "14px 18px", fontSize: 16, fontWeight: 800, color: "#fff", background: "#1E2A35", border: "none", borderRadius: 999, cursor: "pointer", opacity: bezig ? 0.7 : 1 }}>
        {bezig ? "Even geduld…" : "Betalen met iDEAL"}
      </button>
    </form>
  );
}
