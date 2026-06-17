"use client";

import { useState } from "react";

const veld = { display: "block", width: "100%", padding: "10px 12px", fontSize: 15, border: "1px solid #d8dde3", borderRadius: 8, marginTop: 6, fontFamily: "inherit" };
const label = { display: "block", marginTop: 18, fontSize: 14, fontWeight: 600, color: "#222" };
const hint = { display: "block", fontSize: 12.5, color: "#777", fontWeight: 400, margin: "3px 0 0", lineHeight: 1.4 };
const chip = (actief) => ({ display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 14px", marginRight: 8, marginTop: 8, borderRadius: 999, border: "1.5px solid " + (actief ? "#FF8300" : "#d8dde3"), background: actief ? "#FFF4E8" : "#fff", color: actief ? "#9a4f00" : "#333", cursor: "pointer", fontSize: 14, fontWeight: 500 });

const BRANCHES = ["Schilder", "Timmerman", "Glazenzetter", "Loodgieter", "Installateur / sanitair", "Aannemer", "Tegelzetter", "Stukadoor", "Hovenier", "Elektricien", "Dakdekker", "Metselaar", "Schoonmaak"];
const KERNWAARDEN = ["Vakmanschap", "Betrouwbaar", "Eerlijk", "Transparant", "Verantwoordelijk", "Klantgericht", "Goed bereikbaar", "Netjes werken", "Persoonlijk", "Afspraak = afspraak", "Duurzaam", "Passie voor het vak"];
const INTERESSE = ["Website", "Plugins", "Hosting", "Domeinnaam"];

export default function IntakePage() {
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [branches, setBranches] = useState([]);
  const [waarden, setWaarden] = useState([]);
  const [regios, setRegios] = useState([""]);
  const [socials, setSocials] = useState([""]);
  const [interesse, setInteresse] = useState([]);
  const [heeftGoogle, setHeeftGoogle] = useState(false);

  const toggle = (list, setList, val) => setList(list.includes(val) ? list.filter((x) => x !== val) : [...list, val]);
  const setRegio = (i, val) => setRegios(regios.map((r, j) => (j === i ? val : r)));
  const setSocial = (i, val) => setSocials(socials.map((s, j) => (j === i ? val : s)));

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
    fd.append("btw", f.btw.value);
    fd.append("bron", f.bron.value);
    fd.append("interesse", interesse.join(", "));
    fd.append("socials", socials.filter((s) => s.trim()).join(", "));
    fd.append("google_business", heeftGoogle ? "ja" : "");
    fd.append("google_url", heeftGoogle && f.google_url ? f.google_url.value : "");
    fd.append("tone_of_voice", f.tone_of_voice.value);
    fd.append("kleurvoorkeur", f.kleurvoorkeur.value);
    fd.append("notities", f.notities.value);
    fd.append("oude_website", f.oude_website.value);
    if (f.logo.files[0]) fd.append("logo", f.logo.files[0]);
    for (const file of f.fotos.files) fd.append("fotos", file);
    try {
      const res = await fetch("/api/intake", { method: "POST", body: fd });
      const data = await res.json();
      if (!data.ok) { setError(data.error || "Er ging iets mis."); setStatus("fout"); return; }
      setResult(data); setStatus("klaar");
    } catch (err) { setError(String(err)); setStatus("fout"); }
  }

  if (status === "klaar") {
    return (
      <main style={{ maxWidth: 600, margin: "14vh auto", padding: "0 24px", fontFamily: "system-ui, sans-serif", textAlign: "center", color: "#222" }}>
        <div style={{ fontSize: 44, marginBottom: 8 }}>✅</div>
        <h1 style={{ fontSize: 30 }}>Bedankt!</h1>
        <p style={{ color: "#555", marginTop: 14, fontSize: 18, lineHeight: 1.6 }}>
          We hebben je gegevens goed ontvangen en gaan er meteen mee aan de slag.
          We nemen zo snel mogelijk contact met je op.
        </p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 720, margin: "5vh auto", padding: "0 24px", fontFamily: "system-ui, sans-serif", color: "#222" }}>
      <p style={{ fontSize: 13, letterSpacing: 2, textTransform: "uppercase", color: "#888" }}>StudioBaris · Workflow 1</p>
      <h1 style={{ fontSize: 30, margin: "6px 0 4px" }}>Nieuwe prospect — previewsite genereren</h1>
      <p style={{ color: "#555", marginBottom: 8 }}>Vul in wat je hebt. Ontbrekende velden laat je leeg; Claude vult niets in wat er niet is. <strong>Hoe specifieker en vollediger je invult, hoe beter en overtuigender de website wordt.</strong></p>

      <form onSubmit={onSubmit}>
        <label style={label}>Bedrijfsnaam *<span style={hint}>Zoals het bedrijf zich noemt — dit komt in de header, de hero en de footer.</span><input style={veld} name="naam" required /></label>

        <div style={label}>Branche (meerdere mogelijk)</div>
        <span style={hint}>Vink alles aan wat van toepassing is. Hoe preciezer, hoe gerichter de teksten en het vaklabel.</span>
        <div>
          {BRANCHES.map((b) => (
            <span key={b} style={chip(branches.includes(b))} onClick={() => toggle(branches, setBranches, b)}>
              <input type="checkbox" readOnly checked={branches.includes(b)} style={{ pointerEvents: "none" }} />{b}
            </span>
          ))}
        </div>
        <input style={{ ...veld, marginTop: 10 }} name="branche_anders" placeholder="Anders, namelijk… (optioneel)" />

        <label style={label}>Slogan (optioneel)<span style={hint}>Een korte, pakkende zin. Verschijnt onder de bedrijfsnaam en in de hero.</span><input style={veld} name="slogan" placeholder="Bijv. Vakwerk dat blijft" /></label>

        <label style={label}>Diensten<span style={hint}>Noem er liever meerdere en zo concreet mogelijk. Elke dienst wordt een apart blok op de site — meer en specifieker geeft een vollere, sterkere pagina.</span><textarea style={{ ...veld, minHeight: 70 }} name="diensten" placeholder="Bijv. binnenschilderwerk, buitenschilderwerk, houtrot, kozijnen" /></label>

        <div style={label}>Kernwaarden (meerdere mogelijk)</div>
        <span style={hint}>Kies de waarden die het bedrijf typeren. Hiervan maken we de drie "wat u krijgt"-blokken met uitleg.</span>
        <div>
          {KERNWAARDEN.map((w) => (
            <span key={w} style={chip(waarden.includes(w))} onClick={() => toggle(waarden, setWaarden, w)}>
              <input type="checkbox" readOnly checked={waarden.includes(w)} style={{ pointerEvents: "none" }} />{w}
            </span>
          ))}
        </div>

        <div style={label}>Regio('s) actief</div>
        <span style={hint}>Voeg elke plaats apart toe met "+". Alle plaatsen komen terug in de teksten, het werkgebied en de vindbaarheid.</span>
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
        <span style={hint}>Worden klikbaar getoond in het contactblok en de footer (e-mail, bel-knop, WhatsApp).</span>
        <div style={{ display: "flex", gap: 14 }}>
          <label style={{ ...label, flex: 1 }}>Adres<input style={veld} name="adres" /></label>
          <label style={{ ...label, flex: 1 }}>KVK<input style={veld} name="kvk" /></label>
        </div>
        <span style={hint}>Adres en KvK komen in de footer; een adres helpt ook de lokale vindbaarheid.</span>
        <div style={{ display: "flex", gap: 14 }}>
          <label style={{ ...label, flex: 1 }}>BTW-nummer<input style={veld} name="btw" /></label>
          <label style={{ ...label, flex: 1 }}>Hoe bij ons terechtgekomen?<input style={veld} name="bron" placeholder="Bijv. via Jan de Vries, Google, doorverwijzing" /></label>
        </div>
        <span style={hint}>BTW komt in de footer. "Hoe bij ons terechtgekomen" is alleen voor jou (op het dashboard), niet op de site.</span>
        <div style={label}>Interesse / pakket (meerdere mogelijk)</div>
        <span style={hint}>Alleen voor intern gebruik — wat de klant wil afnemen. Verschijnt op je dashboard, niet op de site.</span>
        <div>
          {INTERESSE.map((opt) => (
            <span key={opt} style={chip(interesse.includes(opt))} onClick={() => toggle(interesse, setInteresse, opt)}>
              <input type="checkbox" readOnly checked={interesse.includes(opt)} style={{ pointerEvents: "none" }} />{opt}
            </span>
          ))}
        </div>

        <div style={label}>Sociale media (links)</div>
        <span style={hint}>Voeg elke link apart toe met "+". Ze worden als icoon-links in de footer geplaatst.</span>
        {socials.map((s, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <input style={{ ...veld, marginTop: 0 }} value={s} onChange={(e) => setSocial(i, e.target.value)} placeholder={`Link ${i + 1} (Facebook, Instagram, LinkedIn…)`} />
            {socials.length > 1 && (
              <button type="button" onClick={() => setSocials(socials.filter((_, j) => j !== i))} style={{ border: "1px solid #d8dde3", background: "#fff", borderRadius: 8, padding: "0 12px", cursor: "pointer", fontSize: 18 }}>−</button>
            )}
          </div>
        ))}
        <button type="button" onClick={() => setSocials([...socials, ""])} style={{ marginTop: 8, border: "1.5px solid #FF8300", background: "#fff", color: "#9a4f00", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontWeight: 600, fontSize: 14 }}>+ Link toevoegen</button>

        <label style={{ ...label, display: "flex", alignItems: "center", gap: 8 }}>
          <input type="checkbox" checked={heeftGoogle} onChange={(e) => setHeeftGoogle(e.target.checked)} />
          Heeft een Google Bedrijfsprofiel
        </label>
        {heeftGoogle && <input style={veld} name="google_url" placeholder="Link naar Google-profiel (optioneel)" />}
        <span style={hint}>Met een Google-profiel tonen we een "Bekijk onze Google-reviews"-knop in plaats van een leeg reviewblok.</span>

        <label style={label}>Tone of voice<span style={hint}>Beschrijf de schrijfstijl in een paar woorden. Dit bepaalt de toon van álle teksten op de site.</span><textarea style={{ ...veld, minHeight: 60 }} name="tone_of_voice" placeholder="Bijv. nuchter, persoonlijk, geen verkooppraat" /></label>
        <label style={label}>Kleurvoorkeur (optioneel)<span style={hint}>Geef kleuren op, of laat leeg — dan leidt de AI het kleurenpalet af uit het logo.</span><input style={veld} name="kleurvoorkeur" placeholder="Anders afgeleid uit het logo" /></label>
        <label style={label}>Huidige / oude website (optioneel)<span style={hint}>Heeft de klant al een (oude) website? Plak de link — wij halen er automatisch bruikbare info uit (diensten, teksten, regio).</span><input style={veld} name="oude_website" placeholder="https://..." /></label>

        <label style={label}>Vrije onderzoeksnotities<span style={hint}>Plak hier alle losse research, reviews en opmerkingen. Hoe meer context, hoe beter de AI het bedrijf begrijpt.</span><textarea style={{ ...veld, minHeight: 100 }} name="notities" placeholder="Plak hier losse research, opmerkingen, reviews, enz." /></label>

        <label style={label}>Logo (optioneel)<span style={hint}>Bron voor het kleurenpalet en de header. Lever 'm aan als dat kan.</span><input style={{ ...veld, padding: 8 }} name="logo" type="file" accept="image/*" /></label>
        <label style={label}>Foto's (optioneel, meerdere mogelijk)<span style={hint}>Echte projectfoto's vullen het portfolio en de dienstblokken — dat maakt de site veel overtuigender.</span><input style={{ ...veld, padding: 8 }} name="fotos" type="file" accept="image/*" multiple /></label>

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
