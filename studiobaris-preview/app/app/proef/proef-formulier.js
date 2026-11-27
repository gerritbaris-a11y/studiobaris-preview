"use client";

import { useState } from "react";

const veld = { width: "100%", padding: "12px 14px", fontSize: 16, border: "1px solid #D8D2C6", borderRadius: 12, boxSizing: "border-box", fontFamily: "inherit" };
const label = { display: "block", fontSize: 13.5, fontWeight: 700, margin: "14px 0 6px" };

export default function ProefFormulier({ test }) {
  const [v, setV] = useState({ naam: "", bedrijf: "", email: "", website: "", akkoord: false, website_url_extra: "" });
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState("");
  const [klaar, setKlaar] = useState(null);

  const zet = (k) => (e) => setV({ ...v, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  async function verstuur(e) {
    e.preventDefault();
    setFout("");
    if (!v.bedrijf.trim() || !v.email.trim() || !v.website.trim()) return setFout("Vul je bedrijfsnaam, e-mailadres en website in.");
    if (!v.akkoord) return setFout("Ga eerst akkoord met de voorwaarden.");
    setBezig(true);
    try {
      const res = await fetch("/api/app/proef", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...v, test }),
      });
      const d = await res.json().catch(() => ({}));
      if (!d.ok) setFout(d.error || "Er ging iets mis. Probeer het opnieuw.");
      else setKlaar(d);
    } catch {
      setFout("Geen verbinding. Probeer het opnieuw.");
    } finally {
      setBezig(false);
    }
  }

  if (klaar) {
    const tot = klaar.proef_eindigt_op
      ? new Date(klaar.proef_eindigt_op).toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" })
      : "over 7 dagen";
    return (
      <div style={{ background: "#EEF5EA", borderRadius: 16, padding: "18px 20px", marginTop: 18 }}>
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>Je proef staat klaar</div>
        <p style={{ margin: 0 }}>
          {klaar.mail ? "Check je mail: daar staan de plugin, je inloglink en drie korte stappen." : "We sturen je zo snel mogelijk je inloglink en de plugin."}{" "}
          Je proef loopt tot en met {tot}.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={verstuur} style={{ marginTop: 18 }}>
      <label style={label} htmlFor="bedrijf">Bedrijfsnaam</label>
      <input id="bedrijf" style={veld} value={v.bedrijf} onChange={zet("bedrijf")} placeholder="Schildersbedrijf De Kwast" autoComplete="organization" />
      <label style={label} htmlFor="naam">Je naam</label>
      <input id="naam" style={veld} value={v.naam} onChange={zet("naam")} placeholder="Jan de Vries" autoComplete="name" />
      <label style={label} htmlFor="email">E-mailadres</label>
      <input id="email" type="email" style={veld} value={v.email} onChange={zet("email")} placeholder="jan@dekwast.nl" autoComplete="email" />
      <label style={label} htmlFor="website">Je website</label>
      <input id="website" style={veld} value={v.website} onChange={zet("website")} placeholder="dekwast.nl" inputMode="url" />
      <input tabIndex={-1} aria-hidden="true" autoComplete="off" value={v.website_url_extra} onChange={zet("website_url_extra")}
        style={{ position: "absolute", left: "-9999px", width: 1, height: 1 }} />
      <label style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 14, margin: "16px 0 4px" }}>
        <input type="checkbox" checked={v.akkoord} onChange={zet("akkoord")} style={{ marginTop: 3 }} />
        <span>Ik ga akkoord met de <a href="/voorwaarden" target="_blank">voorwaarden</a> en de <a href="https://www.studiobaris.nl/privacy" target="_blank">privacyverklaring</a>.</span>
      </label>
      {fout && <div role="alert" style={{ color: "#B3261E", fontSize: 14, marginTop: 10 }}>{fout}</div>}
      <button type="submit" disabled={bezig} style={{ marginTop: 16, width: "100%", padding: "14px 18px", fontSize: 16, fontWeight: 800, color: "#fff", background: "#1E2A35", border: "none", borderRadius: 999, cursor: "pointer", opacity: bezig ? 0.7 : 1 }}>
        {bezig ? "Bezig…" : "Start mijn gratis proef"}
      </button>
    </form>
  );
}
