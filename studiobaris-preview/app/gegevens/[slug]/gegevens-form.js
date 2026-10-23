"use client";

import { useState } from "react";
import LocatieVeld from "../../locatie-veld";

const veld = { display: "block", width: "100%", padding: "10px 12px", fontSize: 15, border: "1px solid #d8dde3", borderRadius: 8, marginTop: 6, fontFamily: "inherit" };
const label = { display: "block", marginTop: 18, fontSize: 14, fontWeight: 600, color: "#222" };
const hint = { display: "block", fontSize: 12.5, color: "#777", fontWeight: 400, margin: "3px 0 0", lineHeight: 1.4 };
const A = "#FF8300";

export default function GegevensForm({ slug, bedrijf }) {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [logoToestemming, setLogoToestemming] = useState(false);
  const [socials, setSocials] = useState([""]);

  async function onSubmit(e) {
    e.preventDefault();
    setStatus("bezig");
    setError("");

    const f = e.currentTarget;
    try {
      const res = await fetch("/api/gegevens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          adres: f.adres.value,
          kvk: f.kvk.value,
          btw: f.btw.value,
          socials: socials.filter((x) => x.trim()),
          google_url: f.google_url.value,
          logo_toestemming: logoToestemming,
        }),
      });
      const d = await res.json();
      if (!d.ok) {
        setError(d.error || "Er ging iets mis.");
        setStatus("fout");
        return;
      }
      setStatus("klaar");
    } catch (err) {
      setError(err && err.message ? err.message : String(err));
      setStatus("fout");
    }
  }

  if (status === "klaar") {
    return (
      <main style={{ maxWidth: 600, margin: "14vh auto", padding: "0 24px", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", textAlign: "center", color: "#222" }}>
        <div style={{ fontSize: 44, marginBottom: 8 }}>✅</div>
        <h1 style={{ fontSize: 30 }}>Dank je wel</h1>
        <p style={{ color: "#555", marginTop: 14, fontSize: 18, lineHeight: 1.6 }}>
          We hebben alles binnen. Je hoeft verder niets te doen — wij zetten je website in orde.
        </p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 640, margin: "5vh auto", padding: "0 24px", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", color: "#222" }}>
      <p style={{ fontSize: 13, letterSpacing: 2, textTransform: "uppercase", color: "#888" }}>StudioBaris · Stap 2 van 2</p>
      <h1 style={{ fontSize: 28, margin: "6px 0 4px" }}>Nog even je zakelijke gegevens</h1>
      <p style={{ color: "#555", marginBottom: 8, lineHeight: 1.6 }}>
        Voor <strong>{bedrijf}</strong>. Adres, KvK en btw komen in de footer van je website en op je facturen.
        Weet je iets niet uit je hoofd? Laat het leeg en mail het later na.
      </p>

      <form onSubmit={onSubmit}>
        <label style={label}>
          Vestigingsadres
          <span style={hint}>Kies een suggestie, dan staan straat, postcode en plaats zeker goed — ze komen zo op de site en in Google.</span>
          <LocatieVeld naam="adres" soort="adres" stijl={veld} accent={A} placeholder="Straat, huisnummer, plaats" />
        </label>

        <div style={{ display: "flex", gap: 14 }}>
          <label style={{ ...label, flex: 1 }}>
            KVK-nummer
            <input style={veld} name="kvk" inputMode="numeric" autoComplete="off" />
          </label>
          <label style={{ ...label, flex: 1 }}>
            BTW-nummer
            <input style={veld} name="btw" autoComplete="off" />
          </label>
        </div>
        <span style={hint}>Allebei verplicht op je facturen en in de footer van je website.</span>

        <div style={label}>Sociale media (optioneel)</div>
        <span style={hint}>Sta je op Facebook, Instagram of LinkedIn? Plak de link; we zetten hem als icoon in de footer van je website.</span>
        {socials.map((s, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <input style={{ ...veld, marginTop: 0 }} value={s} inputMode="url" onChange={(e) => setSocials(socials.map((x, j) => (j === i ? e.target.value : x)))} placeholder={"Link " + (i + 1) + " (Facebook, Instagram, LinkedIn...)"} />
            {socials.length > 1 && (
              <button type="button" onClick={() => setSocials(socials.filter((_, j) => j !== i))} style={{ border: "1px solid #d8dde3", background: "#fff", borderRadius: 8, padding: "0 12px", cursor: "pointer", fontSize: 18 }}>-</button>
            )}
          </div>
        ))}
        <button type="button" onClick={() => setSocials([...socials, ""])} style={{ marginTop: 8, border: "1.5px solid " + A, background: "#fff", color: "#222", borderRadius: 999, padding: "8px 14px", cursor: "pointer", fontWeight: 600, fontSize: 14, fontFamily: "inherit" }}>+ Link toevoegen</button>

        <label style={label}>
          Google-bedrijfsprofiel (optioneel)
          <span style={hint}>Heb je een Google-profiel? Plak de link, dan komt er een knop naar je Google-reviews op je website.</span>
          <input style={veld} name="google_url" inputMode="url" placeholder="Link naar je Google-profiel" />
        </label>

        <label style={{ display: "flex", alignItems: "flex-start", gap: 10, marginTop: 22, padding: "12px 14px", border: "1px solid #E3DACB", background: "#FBF8F2", borderRadius: 10 }}>
          <input type="checkbox" checked={logoToestemming} onChange={(e) => setLogoToestemming(e.target.checked)} style={{ marginTop: 3, width: 18, height: 18, flex: "0 0 auto" }} />
          <span style={{ fontSize: 14, lineHeight: 1.45 }}>
            <strong>Mogen we jullie logo tonen op studiobaris.nl?</strong><br />
            We laten graag zien met wie we werken. Jullie krijgen er een link vanaf onze site bij — goed voor je
            vindbaarheid in Google. Je kunt dit altijd terugdraaien.
          </span>
        </label>

        <button type="submit" disabled={status === "bezig"}
          style={{ marginTop: 24, background: A, color: "#fff", border: "none", padding: "13px 24px", borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
          {status === "bezig" ? "Bezig…" : "Gegevens opslaan"}
        </button>
        {error && <p style={{ color: "#c0392b", marginTop: 14 }}>{error}</p>}
      </form>
    </main>
  );
}
