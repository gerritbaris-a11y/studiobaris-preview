"use client";

import { useState } from "react";

const veld = { display: "block", width: "100%", padding: "10px 12px", fontSize: 15, border: "1px solid #d8dde3", borderRadius: 8, marginTop: 6, fontFamily: "inherit" };
const label = { display: "block", marginTop: 18, fontSize: 14, fontWeight: 600, color: "#222" };
const chip = (actief) => ({ display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 14px", marginRight: 8, marginTop: 8, borderRadius: 999, border: "1.5px solid " + (actief ? "#FF8300" : "#d8dde3"), background: actief ? "#FFF4E8" : "#fff", color: actief ? "#9a4f00" : "#333", cursor: "pointer", fontSize: 14, fontWeight: 500 });

const BRANCHES = ["Schilder", "Timmerman", "Glazenzetter", "Loodgieter", "Installateur / sanitair", "Aannemer", "Tegelzetter", "Stukadoor", "Hovenier", "Elektricien", "Dakdekker", "Metselaar", "Schoonmaak"];
const KERNWAARDEN = ["Vakmanschap", "Betrouwbaar", "Eerlijk", "Transparant", "Verantwoordelijk", "Klantgericht", "Goed bereikbaar", "Netjes werken", "Persoonlijk", "Afspraak = afspraak", "Duurzaam", "Passie voor het vak"];

export default function IntakePage() {
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [branches, setBranches] = useState([]);
  const [waarden, setWaarden] = useState([]);
  const [regios, setRegios] = useState([""]);
  const [heeftGoogle, setHeeftGoogle] = useState(false);

  const toggle = (list, setList, val) => setList(list.includes(val) ? list.filter((x) => x !== val) : [...list, val]);
  const setRegio = (i, val) => setRegios(regios.map((r, j) => (j === i ? val : r)));

  async function onSubmit(e) {
    e.preventDefault();
    setStatus("bezig"); setError(""); setResult(null);
    const f = e.target;
    const fd = new FormData();
    fd.append("naam", f.naam.value);
    fd.append("branche", [...branches, f.branche_anders.value].filter(Boolean).join(", "));
    fd.append("diensten", f.diensten.value);
    fd.append("slogan", f.slogan.value);
    fd.append("kernwaarden", waarden.join(", "));
    fd.append("regio", regios.filter((r) => r.trim()).join(", "));
    fd.append("email", f.email.value);
    fd.append("telefoon", f.telefoon.value);
    fd.append("adres", f.adres.value);
    fd.append("kvk", f.kvk.value);
    fd.append("socials", f.socials.value);
    fd.append("google_business", heeftGoogle ? "ja" : "");
    fd.append("google_url", heeftGoogle && f.google_url ? f.google_url.value : "");
    fd.append("tone_of_voice", f.tone_of_voice.value);
    fd.append("kleurvoorkeur", f.kleurvoorkeur.value);
    fd.append("notities", f.notities.value);
    if (f.logo.files[0]) fd.append("logo", f.logo.files[0]);
    for (const file of f.fotos.files) fd.append("fotos", file);
    try {
      const res = await fetch("/api/intake", { method: "POST", body: fd });
      const data = await res.json();
      if (!data.ok) { setError(data.error || "Er ging iets mis."); setStatus("fout"); return; }
      setResult(data); setStatus("klaar");
    } catch (err) { setError(String(err)); setStatus("fout"); }
  }

  if (status === "klaar" && result) {
    return (
      <main style={{ maxWidth: 720, margin: "5vh auto", padding: "0 24px", fontFamily: "system-ui, sans-serif", color: "#222" }}>
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
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 720, margin: "5vh auto", padding: "0 24px", fontFamily: "system-ui, sans-serif", color: "#222" }}>
      <p style={{ fontSize: 13, letterSpacing: 2, textTransform: "uppercase", color: "#888" }}>StudioBaris · Workflow 1</p>
      <h1 style={{ fontSize: 30, margin: "6px 0 4px" }}>Nieuwe prospect — previewsite genereren</h1>
      <p style={{ color: "#555", marginBottom: 8 }}>Vul in wat je hebt. Ontbrekende velden laat je leeg; Claude vult niets in wat er niet is.</p>

      <form onSubmit={onSubmit}>
        <label style={label}>Bedrijfsnaam *<input style={veld} name="naam" required /></label>

        <div style={label}>Branche (meerdere mogelijk)</div>
        <div>
          {BRANCHES.map((b) => (
            <span key={b} style={chip(branches.includes(b))} onClick={() => toggle(branches, setBranches, b)}>
              <input type="checkbox" readOnly checked={branches.includes(b)} style={{ pointerEvents: "none" }} />{b}
            </span>
          ))}
        </div>
        <input style={{ ...veld, marginTop: 10 }} name="branche_anders" placeholder="Anders, namelijk… (optioneel)" />

        <label style={label}>Slogan (optioneel)<input style={veld} name="slogan" placeholder="Bijv. Vakwerk dat blijft" /></label>

        <label style={label}>Diensten<textarea style={{ ...veld, minHeight: 70 }} name="diensten" placeholder="Bijv. binnenschilderwerk, buitenschilderwerk, houtrot" /></label>

        <div style={label}>Kernwaarden (meerdere mogelijk)</div>
        <div>
          {KERNWAARDEN.map((w) => (
            <span key={w} style={chip(waarden.includes(w))} onClick={() => toggle(waarden, setWaarden, w)}>
              <input type="checkbox" readOnly checked={waarden.includes(w)} style={{ pointerEvents: "none" }} />{w}
            </span>
          ))}
        </div>

        <div style={label}>Regio('s) actief</div>
        {regios.map((r, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <input style={{ ...veld, marginTop: 0 }} value={r} onChange={(e) => setRegio(i, e.target.value)} placeholder={`Regio ${i + 1}`} />
            {regios.length > 1 && (
              <button type="button" onClick={() => setRegios(regios.filter((_, j) => j !== i))} style={{ border: "1px solid #d8dde3", background: "#fff", borderRadius: 8, padding: "0 12px", cursor: "pointer", fontSize: 18 }}>−</button>
            )}
          </div>
        ))}
        <button type="button" onClick={() => setRegios([...regios, ""])} style={{ marginTop: 8, border: "1.5px solid #FF8300", background: "#fff", color: "#9a4f00", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontWeight: 600, fontSize: 14 }}>+ Regio toevoegen</button>

        <div style={{ display: "flex", gap: 14 }}>
          <label style={{ ...label, flex: 1 }}>E-mail<input style={veld} name="email" type="email" /></label>
          <label style={{ ...label, flex: 1 }}>Telefoonnummer<input style={veld} name="telefoon" /></label>
        </div>
        <div style={{ display: "flex", gap: 14 }}>
          <label style={{ ...label, flex: 1 }}>Adres<input style={veld} name="adres" /></label>
          <label style={{ ...label, flex: 1 }}>KVK<input style={veld} name="kvk" /></label>
        </div>
        <label style={label}>Sociale media (links)<input style={veld} name="socials" placeholder="Facebook / Instagram / LinkedIn" /></label>

        <label style={{ ...label, display: "flex", alignItems: "center", gap: 8 }}>
          <input type="checkbox" checked={heeftGoogle} onChange={(e) => setHeeftGoogle(e.target.checked)} />
          Heeft een Google Bedrijfsprofiel
        </label>
        {heeftGoogle && <input style={veld} name="google_url" placeholder="Link naar Google-profiel (optioneel)" />}

        <label style={label}>Tone of voice<textarea style={{ ...veld, minHeight: 60 }} name="tone_of_voice" placeholder="Bijv. nuchter, persoonlijk, geen verkooppraat" /></label>
        <label style={label}>Kleurvoorkeur (optioneel)<input style={veld} name="kleurvoorkeur" placeholder="Anders afgeleid uit het logo" /></label>
        <label style={label}>Vrije onderzoeksnotities<textarea style={{ ...veld, minHeight: 100 }} name="notities" placeholder="Plak hier losse research, opmerkingen, reviews, enz." /></label>

        <label style={label}>Logo (optioneel)<input style={{ ...veld, padding: 8 }} name="logo" type="file" accept="image/*" /></label>
        <label style={label}>Foto's (optioneel, meerdere mogelijk)<input style={{ ...veld, padding: 8 }} name="fotos" type="file" accept="image/*" multiple /></label>

        <button type="submit" disabled={status === "bezig"} style={{ marginTop: 24, background: "#FF8300", color: "#fff", border: "none", padding: "13px 24px", borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
          {status === "bezig" ? "Bezig met genereren…" : "Genereer previewsite"}
        </button>
        {error && <p style={{ color: "#c0392b", marginTop: 14 }}>{error}</p>}
      </form>
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
