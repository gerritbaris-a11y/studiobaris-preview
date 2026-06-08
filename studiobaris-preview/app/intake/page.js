"use client";

import { useState } from "react";

const veld = { display: "block", width: "100%", padding: "10px 12px", fontSize: 15, border: "1px solid #d8dde3", borderRadius: 8, marginTop: 6, fontFamily: "inherit" };
const label = { display: "block", marginTop: 16, fontSize: 14, fontWeight: 600, color: "#222" };

export default function IntakePage() {
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setStatus("bezig");
    setError("");
    setResult(null);
    try {
      const fd = new FormData(e.target);
      const res = await fetch("/api/intake", { method: "POST", body: fd });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || "Er ging iets mis.");
        setStatus("fout");
        return;
      }
      setResult(data);
      setStatus("klaar");
    } catch (err) {
      setError(String(err));
      setStatus("fout");
    }
  }

  return (
    <main style={{ maxWidth: 720, margin: "5vh auto", padding: "0 24px", fontFamily: "system-ui, sans-serif", color: "#222" }}>
      <p style={{ fontSize: 13, letterSpacing: 2, textTransform: "uppercase", color: "#888" }}>StudioBaris · Workflow 1</p>
      <h1 style={{ fontSize: 30, margin: "6px 0 4px" }}>Nieuwe prospect — previewsite genereren</h1>
      <p style={{ color: "#555", marginBottom: 8 }}>Vul in wat je hebt. Ontbrekende velden laat je leeg; Claude vult niets in wat er niet is.</p>

      {status !== "klaar" && (
        <form onSubmit={onSubmit}>
          <label style={label}>Bedrijfsnaam *<input style={veld} name="naam" required /></label>
          <label style={label}>Branche<input style={veld} name="branche" /></label>
          <label style={label}>Diensten<textarea style={{ ...veld, minHeight: 70 }} name="diensten" placeholder="Bijv. binnenschilderwerk, buitenschilderwerk, houtrot" /></label>
          <div style={{ display: "flex", gap: 14 }}>
            <label style={{ ...label, flex: 1 }}>E-mail<input style={veld} name="email" type="email" /></label>
            <label style={{ ...label, flex: 1 }}>Telefoonnummer<input style={veld} name="telefoon" /></label>
          </div>
          <div style={{ display: "flex", gap: 14 }}>
            <label style={{ ...label, flex: 1 }}>Regio actief<input style={veld} name="regio" /></label>
            <label style={{ ...label, flex: 1 }}>KVK<input style={veld} name="kvk" /></label>
          </div>
          <label style={label}>Adres<input style={veld} name="adres" /></label>
          <label style={label}>Sociale media (links)<input style={veld} name="socials" placeholder="Facebook / Instagram / LinkedIn" /></label>
          <label style={label}>Tone of voice<textarea style={{ ...veld, minHeight: 60 }} name="tone_of_voice" placeholder="Bijv. nuchter, persoonlijk, geen verkooppraat" /></label>
          <label style={label}>Kleurvoorkeur (optioneel)<input style={veld} name="kleurvoorkeur" placeholder="Anders afgeleid uit het logo" /></label>
          <label style={label}>Vrije onderzoeksnotities<textarea style={{ ...veld, minHeight: 110 }} name="notities" placeholder="Plak hier losse research, opmerkingen, reviews, enz." /></label>

          <label style={label}>Logo (optioneel)<input style={{ ...veld, padding: 8 }} name="logo" type="file" accept="image/*" /></label>
          <label style={label}>Foto's (optioneel, meerdere mogelijk)<input style={{ ...veld, padding: 8 }} name="fotos" type="file" accept="image/*" multiple /></label>

          <button type="submit" disabled={status === "bezig"} style={{ marginTop: 24, background: "#FF8300", color: "#fff", border: "none", padding: "13px 24px", borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
            {status === "bezig" ? "Bezig met genereren…" : "Genereer previewsite"}
          </button>
          {error && <p style={{ color: "#c0392b", marginTop: 14 }}>{error}</p>}
        </form>
      )}

      {status === "klaar" && result && (
        <div style={{ marginTop: 24 }}>
          <div style={{ background: "#eafaf1", border: "1px solid #b7e4c7", borderRadius: 12, padding: 20 }}>
            <h2 style={{ fontSize: 20, marginBottom: 8 }}>Previewsite staat klaar</h2>
            <a href={result.url} target="_blank" rel="noreferrer" style={{ color: "#1d7a46", fontWeight: 700, fontSize: 17 }}>{result.url} →</a>
          </div>
          <div style={{ marginTop: 18, background: "#fff7ed", border: "1px solid #fcd9a8", borderRadius: 12, padding: 20 }}>
            <h3 style={{ fontSize: 16, marginBottom: 10 }}>Controlepunten (check vóór je deelt)</h3>
            <ReviewList titel="Ontbrekende gegevens" items={result.review.ontbrekend} />
            <ReviewList titel="Door AI afgeleid" items={result.review.afgeleid} />
            <ReviewList titel="Let op" items={result.review.let_op} />
          </div>
          <button onClick={() => { setStatus("idle"); setResult(null); }} style={{ marginTop: 20, background: "#222", color: "#fff", border: "none", padding: "11px 20px", borderRadius: 10, fontWeight: 600, cursor: "pointer" }}>Nog een prospect</button>
        </div>
      )}
    </main>
  );
}

function ReviewList({ titel, items }) {
  if (!items || items.length === 0) return null;
  return (
    <div style={{ marginBottom: 10 }}>
      <strong style={{ fontSize: 14 }}>{titel}:</strong>
      <ul style={{ margin: "4px 0 0 18px", color: "#444", fontSize: 14 }}>
        {items.map((it, i) => <li key={i}>{it}</li>)}
      </ul>
    </div>
  );
}
