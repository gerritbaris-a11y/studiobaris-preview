"use client";

import { useState } from "react";
import { ACCEPT_ATTRIBUUT, controleerBestanden } from "../lib/bestand-validatie";
import { verkleinFoto } from "../lib/verklein-foto";
import LocatieVeld from "./locatie-veld";

// Huisstijl-tokens, 1-op-1 overgenomen van studiobaris.nl. Gelden voor de
// vaste chrome (achtergrond, tekst, koppen, font) ongeacht de modus. Het
// accent (A, verderop) blijft wél per-klant instelbaar via de thema-prop in
// workflow 2 ("je website aanpassen") — dat is bewust ongewijzigd.
const HUISSTIJL = {
  achtergrond: "#F6F7F8",
  donker: "#16202E",
  body: "#4A5750",
  accent: "#E79B43",
  accentTekst: "#16202E",
  accentDonker: "#CF8531",
};
const FONT_HREF = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap";
const FONT = "'Plus Jakarta Sans', system-ui, sans-serif";

const veld = { display: "block", width: "100%", padding: "10px 12px", fontSize: 15, border: "1px solid #DADFE3", borderRadius: 12, marginTop: 6, fontFamily: "inherit" };
const label = { display: "block", marginTop: 18, fontSize: 14, fontWeight: 600, color: HUISSTIJL.donker };
const hint = { display: "block", fontSize: 12.5, color: HUISSTIJL.body, fontWeight: 400, margin: "3px 0 0", lineHeight: 1.4 };

function hexNaarRgba(hex, a) {
  const h = String(hex || "").replace("#", "");
  if (h.length !== 6) return "rgba(255,131,0," + a + ")";
  const n = parseInt(h, 16);
  return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")";
}

const BRANCHES = ["Schilder", "Timmerman", "Glazenzetter", "Loodgieter", "Installateur / sanitair", "Aannemer", "Tegelzetter", "Stukadoor", "Hovenier", "Elektricien", "Dakdekker", "Metselaar", "Schoonmaak"];
const KERNWAARDEN = ["Vakmanschap", "Betrouwbaar", "Eerlijk", "Transparant", "Verantwoordelijk", "Klantgericht", "Goed bereikbaar", "Netjes werken", "Persoonlijk", "Afspraak = afspraak", "Duurzaam", "Passie voor het vak"];
const INTERESSE = ["Website", "Plugins", "Hosting", "Domeinnaam"];
const STIJLEN = [
  { id: "stoer", naam: "Direct & Stoer", uitleg: "Donkere hero, krachtig, grote bel-knoppen. Voor wie snel gebeld wil worden." },
  { id: "modern", naam: "Strak & Modern", uitleg: "Licht, rustig en typografisch, met uitklapbare diensten." },
  { id: "persoonlijk", naam: "Warm & Persoonlijk", uitleg: "De vakman centraal, met een persoonlijk verhaal en stappen." },
];

// Gedeeld formulier voor Workflow 1 (nieuwe prospect) en Workflow 2 (klant past aan).
// mode="create"  -> genereert een nieuwe previewsite via /api/intake
// mode="revise"  -> past een bestaande site aan via /api/revise (concept v2.0)
// thema (optioneel) -> { accent, bedrijf, stijl }: kleurt het klantformulier in de
//   stijl die in de preview is gekozen.
export default function ProspectForm({
  mode = "create",
  slug = "",
  titel,
  intro,
  submitLabel,
  busyLabel,
  thema = null,
  prefill = null,       // gegevens van de lead, om het formulier voor te vullen
  leadId = "",          // welke lead dit is (koppelt de preview aan de lead)
  afzender = "",        // wie het invult (verkoper) - bepaalt de omzettoekenning
}) {
  const revise = mode === "revise";
  const intern = Boolean(afzender);
  // Het volledige formulier is alleen nog het aanpasformulier (Workflow 2).
  // De intake is overal stap 1 van 2 - ook als wij hem zelf invullen vanuit de
  // leadlijst. Zelfde korte lijst, zodat we niet twee formulieren onderhouden.
  // Het interesseblok blijft wel intern; dat is geen invoer voor de preview.
  const uitgebreid = revise;
  const v = prefill || {};
  const A = (thema && thema.accent) || HUISSTIJL.accent;
  const Atint = hexNaarRgba(A, 0.12);
  const geThematiseerd = !!(thema && thema.accent);
  // Tekst op de accentknop: bij ons eigen accent (lichte oker) staat de
  // huisstijl-donkere tekst voorgeschreven; bij een client-eigen accentkleur
  // (workflow 2) blijft wit de veilige, kleur-onafhankelijke keuze.
  const ATekst = geThematiseerd ? "#fff" : HUISSTIJL.accentTekst;

  const chip = (actief) => ({ display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 14px", marginRight: 8, marginTop: 8, borderRadius: 999, border: "1.5px solid " + (actief ? A : "#DADFE3"), background: actief ? Atint : "#fff", color: HUISSTIJL.donker, cursor: "pointer", fontSize: 14, fontWeight: 500 });

  const foutTekst = { display: "block", color: "#c0392b", fontSize: 13, marginTop: 6, lineHeight: 1.45 };
  const avgTekst = { fontSize: 12.5, color: HUISSTIJL.body, lineHeight: 1.6, marginTop: 18, background: "#fff", border: "1px solid #E7EAED", borderRadius: 12, padding: "12px 14px" };

  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [branches, setBranches] = useState([]);
  const [waarden, setWaarden] = useState([]);
  const [regios, setRegios] = useState([(prefill && prefill.plaats) || ""]);
  const [resultaat, setResultaat] = useState(null);
  const [socials, setSocials] = useState([""]);
  const [interesse, setInteresse] = useState([]);
  const [stijl, setStijl] = useState(revise ? "" : "stoer");
  const [heeftGoogle, setHeeftGoogle] = useState(false);
  const [logoToestemming, setLogoToestemming] = useState(false);
  // Fouten per uploadveld, meteen bij het kiezen. Zo weet iemand het vóór
  // het versturen, in plaats van na een mislukte generatie.
  const [logoFout, setLogoFout] = useState("");
  const [fotoFout, setFotoFout] = useState("");
  // Toont "Foto 2 van 5 uploaden..." tijdens het rechtstreeks versturen.
  const [uploadStand, setUploadStand] = useState("");

  /**
   * Zet de gekozen bestanden rechtstreeks in onze opslag en geef de links terug.
   * Ze gaan dus NIET door het formulier heen: het platform weigert verzoeken
   * boven ~4,5 MB, en een paar telefoonfoto's halen dat plafond met gemak.
   */
  async function uploadBestanden(logoBestand, fotoBestanden) {
    const alles = [];
    if (logoBestand) alles.push({ bestand: logoBestand, rol: "logo" });
    for (const f of fotoBestanden) alles.push({ bestand: f, rol: "foto" });
    if (!alles.length) return { logoUrl: "", fotoUrls: [] };

    // Eerst verkleinen. Een foto rechtstreeks van een camera is zo 40 MB;
    // verkleind is dat meestal een halve MB, zonder zichtbaar verschil op een
    // website. Dat scheelt wachttijd bij het uploaden én maakt de site van de
    // klant snel voor zijn eigen bezoekers.
    for (let i = 0; i < alles.length; i++) {
      setUploadStand(`Foto ${i + 1} van ${alles.length} klaarmaken...`);
      alles[i].bestand = await verkleinFoto(alles[i].bestand, alles[i].rol);

      // Verkleinen lukt bijna altijd, maar een telefoon kan bij een enorme foto
      // het geheugen niet rond krijgen. Dan gaat het origineel de deur uit, en
      // dat weigert de opslag boven ~50 MB. Liever hier een leesbare melding
      // dan verderop een onbegrijpelijke fout.
      if (alles[i].bestand.size > 45 * 1024 * 1024) {
        const mb = (alles[i].bestand.size / 1024 / 1024).toFixed(0);
        throw new Error(`"${alles[i].bestand.name}" is ${mb} MB en kon op dit apparaat niet verkleind worden. Maak de foto kleiner of kies een andere.`);
      }
    }

    const res = await fetch("/api/upload-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bestanden: alles.map((a) => ({ naam: a.bestand.name, grootte: a.bestand.size, rol: a.rol })),
      }),
    });
    const plekken = await res.json();
    if (!plekken.ok) throw new Error(plekken.error || "Kon de foto's niet klaarzetten.");

    let logoUrl = "";
    const fotoUrls = [];
    for (let i = 0; i < alles.length; i++) {
      setUploadStand(`Bestand ${i + 1} van ${alles.length} versturen...`);
      const plek = plekken.bestanden[i];
      const op = await fetch(plek.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": alles[i].bestand.type || "application/octet-stream", "x-upsert": "true" },
        body: alles[i].bestand,
      });
      if (!op.ok) throw new Error(`"${alles[i].bestand.name}" kon niet worden verstuurd. Controleer je verbinding en probeer het opnieuw.`);
      if (alles[i].rol === "logo") logoUrl = plek.publiekeUrl;
      else fotoUrls.push(plek.publiekeUrl);
    }
    setUploadStand("");
    return { logoUrl, fotoUrls };
  }

  const toggle = (list, setList, val) => setList(list.includes(val) ? list.filter((x) => x !== val) : [...list, val]);
  const setRegio = (i, val) => setRegios(regios.map((r, j) => (j === i ? val : r)));
  const setSocial = (i, val) => setSocials(socials.map((s, j) => (j === i ? val : s)));

  async function onSubmit(e) {
    e.preventDefault();
    setStatus("bezig"); setError("");
    const f = e.target;
    const fd = new FormData();

    const put = (k, val) => {
      const s = val == null ? "" : String(val).trim();
      if (revise && !s) return;
      fd.append(k, s);
    };

    if (revise) {
      fd.append("slug", slug);
      fd.append("type", "intake");
      put("wijzigingen", f.wijzigingen.value);
    }

    put("naam", f.naam.value);
    put("branche", [...branches, f.branche_anders.value].filter(Boolean).join(", "));
    put("diensten", f.diensten.value);
    put("slogan", f.slogan.value);
    put("kernwaarden", waarden.join(", "));
    put("regio", regios.filter((r) => r.trim()).join(", "));
    // Velden die alleen in de uitgebreide versie van het formulier staan. In de
    // publieke intake bestaan ze niet, dus eerst kijken of ze er zijn.
    const val = (naam) => (f[naam] ? f[naam].value : "");
    put("email", val("email"));
    put("telefoon", val("telefoon"));
    put("adres", val("adres"));
    put("kvk", val("kvk"));
    put("btw", val("btw"));
    if (!revise) {
      // Intern ingevuld? Dan is de bron de verkoper zelf; dat bepaalt bij wie
      // de klant en de omzet terechtkomen.
      put("bron", intern ? afzender : (f.bron ? f.bron.value : ""));
      put("interesse", interesse.join(", "));
      if (intern) fd.append("verzamelaar", afzender);
      if (leadId) fd.append("lead_id", leadId);
    }
    if (stijl) fd.append("stijl", stijl);
    put("socials", socials.filter((s) => s.trim()).join(", "));
    fd.append("google_business", heeftGoogle ? "ja" : "");
    fd.append("logo_toestemming", logoToestemming ? "ja" : "");
    put("google_url", heeftGoogle && f.google_url ? f.google_url.value : "");
    put("tone_of_voice", val("tone_of_voice"));
    put("kleurvoorkeur", val("kleurvoorkeur"));
    put("notities", val("notities"));
    put("oude_website", val("oude_website"));
    // Laatste controle vlak voor verzenden: het formulier kan ook zonder
    // "wijzigen" van het veld worden ingediend (bijv. slepen of autofill).
    const foutLogo = controleerBestanden(f.logo ? f.logo.files : null, "logo");
    const foutFotos = controleerBestanden(f.fotos ? f.fotos.files : null, "foto");
    if (foutLogo || foutFotos) {
      setLogoFout(foutLogo || "");
      setFotoFout(foutFotos || "");
      setError(foutLogo || foutFotos);
      setStatus("fout");
      return;
    }

    try {
      // Eerst de beelden rechtstreeks naar de opslag, daarna pas het formulier.
      // Zo blijft het verzoek klein en kan het niet stuklopen op de grens die
      // het platform aan de omvang van een verzoek stelt.
      const { logoUrl, fotoUrls } = await uploadBestanden(
        f.logo && f.logo.files[0] ? f.logo.files[0] : null,
        f.fotos ? Array.from(f.fotos.files) : []
      );
      if (logoUrl) fd.append("logo_url", logoUrl);
      if (fotoUrls.length) fd.append("foto_urls", JSON.stringify(fotoUrls));

      const res = await fetch(revise ? "/api/revise" : "/api/intake", { method: "POST", body: fd });
      const data = await res.json();
      if (!data.ok) { setError(data.error || "Er ging iets mis."); setStatus("fout"); return; }
      setResultaat(data);
      setStatus("klaar");
    } catch (err) {
      setUploadStand("");
      setError((err && err.message) ? err.message : String(err));
      setStatus("fout");
    }
  }

  if (status === "klaar") {
    const s2 = resultaat && resultaat.slug;
    if (intern && s2) {
      return (
        <main style={{ maxWidth: 640, margin: "12vh auto", padding: "0 24px", fontFamily: "system-ui, sans-serif", color: "#222" }}>
          <div style={{ fontSize: 44, marginBottom: 8 }}>✅</div>
          <h1 style={{ fontSize: 30, margin: 0 }}>De preview staat klaar</h1>
          <p style={{ color: "#555", marginTop: 12, fontSize: 17, lineHeight: 1.6 }}>
            De website-opzet is gemaakt en er staat een demo-app klaar in het jasje van deze klant.
            Je vindt hem terug bij <strong>Mijn previews</strong>, met het verkoopbericht er kant-en-klaar naast.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 22 }}>
            <a href={"https://preview.studiobaris.nl/" + s2 + "?review=1"} target="_blank" rel="noreferrer"
              style={{ background: "#1A2E40", color: "#fff", padding: "12px 20px", borderRadius: 10, fontWeight: 700, textDecoration: "none" }}>
              Bekijk de preview
            </a>
            <a href="/klanten"
              style={{ background: "#FF8300", color: "#fff", padding: "12px 20px", borderRadius: 10, fontWeight: 700, textDecoration: "none" }}>
              Naar Mijn previews
            </a>
            <a href="/leads"
              style={{ background: "#fff", color: "#1A2E40", border: "1px solid #1A2E40", padding: "12px 20px", borderRadius: 10, fontWeight: 700, textDecoration: "none" }}>
              Volgende lead
            </a>
          </div>
        </main>
      );
    }
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: `@import url('${FONT_HREF}');` }} />
        <main style={{ minHeight: "100vh", background: HUISSTIJL.achtergrond, margin: 0 }}>
          <div style={{ maxWidth: 600, margin: "0 auto", padding: "14vh 24px 24px", fontFamily: FONT, textAlign: "center", color: HUISSTIJL.body }}>
            <div style={{ fontSize: 44, marginBottom: 8 }}>✅</div>
            <h1 style={{ fontSize: 30, fontWeight: 800, color: HUISSTIJL.donker }}>Bedankt!</h1>
            <p style={{ marginTop: 14, fontSize: 18, lineHeight: 1.6 }}>
              {revise
                ? "We hebben je aanpassingen ontvangen en werken je website bij. Je krijgt binnenkort de vernieuwde versie van ons te zien."
                : "We hebben je gegevens goed ontvangen en gaan er meteen mee aan de slag. We nemen zo snel mogelijk contact met je op."}
            </p>
          </div>
        </main>
      </>
    );
  }

  const labelTekst = (verplicht, basis, reviseTekst) => (revise ? reviseTekst : basis) + (verplicht && !revise ? " *" : "");

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `@import url('${FONT_HREF}');` }} />
      <main style={{ minHeight: "100vh", background: HUISSTIJL.achtergrond, fontFamily: FONT }}>
        {/* Header met logo, alleen buiten workflow 2 — daar staat de pagina
            bewust in de kleuren van de klant zelf, niet in StudioBaris-chrome. */}
        {!geThematiseerd && (
          <header style={{ background: "#fff", borderBottom: "1px solid #E7EAED" }}>
            <div style={{ maxWidth: 720, margin: "0 auto", padding: "16px 24px" }}>
              <a href="https://studiobaris.nl" style={{ display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: HUISSTIJL.accentDonker, display: "inline-block" }} />
                <span style={{ fontWeight: 800, fontSize: 19, color: HUISSTIJL.donker, letterSpacing: -0.3 }}>StudioBaris</span>
              </a>
            </div>
          </header>
        )}

        <div style={{ maxWidth: 720, margin: "0 auto", padding: "5vh 24px 60px", color: HUISSTIJL.body }}>
          {geThematiseerd ? (
            <div style={{ background: A, color: "#fff", borderRadius: 14, padding: "18px 20px", marginBottom: 18 }}>
              <div style={{ fontSize: 12, letterSpacing: 1.5, textTransform: "uppercase", opacity: 0.85 }}>Jouw nieuwe website</div>
              {thema.bedrijf && <div style={{ fontSize: 24, fontWeight: 800, marginTop: 2 }}>{thema.bedrijf}</div>}
              <div style={{ fontSize: 14, opacity: 0.92, marginTop: 4 }}>Vul hieronder aan - alles in de stijl die we voor je gekozen hebben.</div>
            </div>
          ) : (
            <>
              {/* Visuele stap-indicator, alleen bij de echte stap 1 (niet bij
                  workflow 2's "aanpassen"-tekst hieronder). */}
              {!uitgebreid && (
                <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
                  <span style={{ width: 32, height: 5, borderRadius: 999, background: HUISSTIJL.accent }} />
                  <span style={{ width: 32, height: 5, borderRadius: 999, background: "#DADFE3" }} />
                </div>
              )}
              <p style={{ fontSize: 13, letterSpacing: 2, textTransform: "uppercase", color: HUISSTIJL.body, fontWeight: 700, margin: 0 }}>
                StudioBaris{uitgebreid ? (revise ? " - Workflow 2 - aanpassen" : " - Workflow 1") : " - Stap 1 van 2"}
              </p>
            </>
          )}
          <h1 style={{ fontSize: 30, margin: "6px 0 4px", fontWeight: 800, color: HUISSTIJL.donker }}>{titel}</h1>
          <p style={{ color: HUISSTIJL.body, marginBottom: 8 }}>{intro}</p>

          <form onSubmit={onSubmit}>
        {revise && (
          <div style={{ background: Atint, border: "1.5px solid " + A, borderRadius: 12, padding: "14px 16px", marginTop: 10 }}>
            <label style={{ ...label, marginTop: 0 }}>
              Wat moet er anders? *
              <span style={hint}>Het belangrijkste veld. Schrijf in je eigen woorden wat er aangepast, weggehaald of toegevoegd moet worden. De rest van het formulier hoef je alleen in te vullen als je daar iets wilt corrigeren.</span>
              <textarea style={{ ...veld, minHeight: 110 }} name="wijzigingen" required placeholder="Bijv. De slogan moet anders, mijn telefoonnummer klopt niet, graag mijn echte projectfoto's gebruiken, en de teksten mogen persoonlijker." />
            </label>
          </div>
        )}

        <label style={label}>{labelTekst(true, "Bedrijfsnaam", "Bedrijfsnaam")}<span style={hint}>{revise ? "Alleen invullen als de naam op de site niet klopt." : "Zoals het bedrijf zich noemt - dit komt in de header, de hero en de footer."}</span><input style={veld} name="naam" required={!revise} defaultValue={v.bedrijfsnaam || ""} /></label>

        {/* Stijl vragen we niet aan de aanvrager: alle drie de stijlen staan in het
            dashboard en zijn daar met een klik te wisselen. Zonder keuze valt
            merk.stijl terug op "stoer". */}
        {revise && !geThematiseerd && (
          <>
            <div style={label}>{revise ? "Andere stijl? (optioneel)" : "Kies een stijl voor de website"}</div>
            <span style={hint}>{revise ? "Laat ongekozen om de huidige stijl te behouden. Kies een stijl als je de hele look wilt omgooien." : "Hoe wil je dat de site overkomt? Je keuze wordt meteen toegepast op de preview."}</span>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10, marginTop: 8 }}>
              {STIJLEN.map((s) => (
                <div key={s.id} onClick={() => setStijl(s.id)} style={{ cursor: "pointer", border: "1.5px solid " + (stijl === s.id ? A : "#DADFE3"), background: stijl === s.id ? Atint : "#fff", borderRadius: 12, padding: "12px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input type="radio" readOnly checked={stijl === s.id} style={{ pointerEvents: "none", accentColor: A }} />
                    <strong style={{ color: HUISSTIJL.donker }}>{s.naam}</strong>
                  </div>
                  <div style={{ fontSize: 12.5, color: HUISSTIJL.body, marginTop: 3 }}>{s.uitleg}</div>
                </div>
              ))}
            </div>
          </>
        )}

        <div style={label}>Branche (meerdere mogelijk)</div>
        <span style={hint}>{revise ? "Alleen aanvinken als de branche op de site niet klopt of aangevuld moet worden." : "Vink alles aan wat van toepassing is. Hoe preciezer, hoe gerichter de teksten en het vaklabel."}</span>
        <div>
          {BRANCHES.map((b) => (
            <span key={b} style={chip(branches.includes(b))} onClick={() => toggle(branches, setBranches, b)}>
              <input type="checkbox" readOnly checked={branches.includes(b)} style={{ pointerEvents: "none" }} />{b}
            </span>
          ))}
        </div>
        <input style={{ ...veld, marginTop: 10 }} name="branche_anders" placeholder="Anders, namelijk... (optioneel)" />

        {uitgebreid && (
          <>
        <label style={label}>Slogan (optioneel)<span style={hint}>{revise ? "Vul in als de slogan anders moet." : "Een korte, pakkende zin. Verschijnt onder de bedrijfsnaam en in de hero."}</span><input style={veld} name="slogan" placeholder="Bijv. Vakwerk dat blijft" /></label>
          </>
        )}

        {uitgebreid && (
          <>
        <label style={label}>Diensten<span style={hint}>{revise ? "Vul in als er diensten bij moeten, weg moeten of anders omschreven moeten worden." : "Noem er liever meerdere en zo concreet mogelijk. Elke dienst wordt een apart blok op de site - meer en specifieker geeft een vollere, sterkere pagina."}</span><textarea style={{ ...veld, minHeight: 70 }} name="diensten" placeholder="Bijv. binnenschilderwerk, buitenschilderwerk, houtrot, kozijnen" /></label>
          </>
        )}

        {revise && (
          <>
        <div style={label}>Kernwaarden (meerdere mogelijk)</div>
        <span style={hint}>{revise ? "Alleen aanvinken als de waarden op de site aangepast moeten worden." : "Kies de waarden die het bedrijf typeren. Hiervan maken we de drie \"wat u krijgt\"-blokken met uitleg."}</span>
        <div>
          {KERNWAARDEN.map((w) => (
            <span key={w} style={chip(waarden.includes(w))} onClick={() => toggle(waarden, setWaarden, w)}>
              <input type="checkbox" readOnly checked={waarden.includes(w)} style={{ pointerEvents: "none" }} />{w}
            </span>
          ))}
        </div>
          </>
        )}

        <div style={label}>Regio('s) actief</div>
        <span style={hint}>{revise ? "Vul in als het werkgebied op de site aangepast moet worden. Voeg elke plaats apart toe met \"+\"." : "Voeg elke plaats apart toe met \"+\". Alle plaatsen komen terug in de teksten, het werkgebied en de vindbaarheid."}</span>
        {regios.map((r, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <div style={{ flex: 1 }}>
              <LocatieVeld waarde={r} onChange={(val) => setRegio(i, val)} soort="plaats" stijl={{ ...veld, marginTop: 0, width: "100%" }} accent={A} placeholder={"Regio " + (i + 1)} />
            </div>
            {regios.length > 1 && (
              <button type="button" onClick={() => setRegios(regios.filter((_, j) => j !== i))} style={{ border: "1px solid #DADFE3", background: "#fff", color: HUISSTIJL.donker, borderRadius: 8, padding: "0 12px", cursor: "pointer", fontSize: 18, fontFamily: FONT }}>-</button>
            )}
          </div>
        ))}
        <button type="button" onClick={() => setRegios([...regios, ""])} style={{ marginTop: 8, border: "1.5px solid " + A, background: "#fff", color: HUISSTIJL.donker, borderRadius: 999, padding: "8px 14px", cursor: "pointer", fontWeight: 600, fontSize: 14, fontFamily: FONT }}>+ Regio toevoegen</button>

        {uitgebreid ? (
          <>
            <div style={{ display: "flex", gap: 14 }}>
              <label style={{ ...label, flex: 1 }}>E-mail<input style={veld} name="email" type="email" defaultValue={v.email || ""} /></label>
              <label style={{ ...label, flex: 1 }}>Telefoonnummer<input style={veld} name="telefoon" defaultValue={v.telefoon || ""} /></label>
            </div>
            <span style={hint}>{revise ? "Alleen invullen als je contactgegevens op de site niet kloppen." : "Worden klikbaar getoond in het contactblok en de footer (e-mail, bel-knop, WhatsApp)."}</span>
          </>
        ) : (
          /* In de publieke intake vragen we alleen een e-mailadres, en niet voor de
             site maar om contact op te kunnen nemen: de aanvrager krijgt de
             previewlink niet te zien. De contactgegevens die op de site komen te
             staan halen we pas na akkoord op. */
          <label style={label}>E-mail *
            <span style={hint}>Hier laten we weten dat je preview klaarstaat. Verder gebruiken we het nergens voor.</span>
            <input style={veld} name="email" type="email" required defaultValue={v.email || ""} />
          </label>
        )}
        {uitgebreid && (
          <>
        <div style={{ display: "flex", gap: 14 }}>
          <label style={{ ...label, flex: 1 }}>Adres
            <span style={hint}>Kies een suggestie, dan weet je zeker dat straat, postcode en plaats exact goed staan - ze komen zo op de site en in Google.</span>
            <LocatieVeld naam="adres" waarde={v.adres || ""} soort="adres" stijl={veld} accent={A} placeholder="Straat, huisnummer, plaats" />
          </label>
          <label style={{ ...label, flex: 1 }}>KVK<input style={veld} name="kvk" /></label>
        </div>
        <span style={hint}>{revise ? "Alleen invullen als adres of KvK aangepast moet worden." : "Adres en KvK komen in de footer; een adres helpt ook de lokale vindbaarheid."}</span>
        <label style={label}>BTW-nummer<span style={hint}>{revise ? "Alleen invullen als het BTW-nummer aangepast moet worden." : "Komt in de footer."}</span><input style={veld} name="btw" /></label>
          </>
        )}


        {uitgebreid && (
          <>
        <div style={label}>Sociale media (links)</div>
        <span style={hint}>{revise ? "Vul in als je social-links toegevoegd of aangepast moeten worden. Voeg elke link apart toe met \"+\"." : "Voeg elke link apart toe met \"+\". Ze worden als icoon-links in de footer geplaatst."}</span>
        {socials.map((s, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <input style={{ ...veld, marginTop: 0 }} value={s} onChange={(e) => setSocial(i, e.target.value)} placeholder={"Link " + (i + 1) + " (Facebook, Instagram, LinkedIn...)"} />
            {socials.length > 1 && (
              <button type="button" onClick={() => setSocials(socials.filter((_, j) => j !== i))} style={{ border: "1px solid #DADFE3", background: "#fff", color: HUISSTIJL.donker, borderRadius: 8, padding: "0 12px", cursor: "pointer", fontSize: 18, fontFamily: FONT }}>-</button>
            )}
          </div>
        ))}
        <button type="button" onClick={() => setSocials([...socials, ""])} style={{ marginTop: 8, border: "1.5px solid " + A, background: "#fff", color: HUISSTIJL.donker, borderRadius: 999, padding: "8px 14px", cursor: "pointer", fontWeight: 600, fontSize: 14, fontFamily: FONT }}>+ Link toevoegen</button>
          </>
        )}

        {uitgebreid && (
          <>
        <label style={{ ...label, display: "flex", alignItems: "center", gap: 8 }}>
          <input type="checkbox" checked={heeftGoogle} onChange={(e) => setHeeftGoogle(e.target.checked)} style={{ accentColor: A }} />
          Heeft een Google Bedrijfsprofiel
        </label>
        {heeftGoogle && <input style={veld} name="google_url" placeholder="Link naar Google-profiel (optioneel)" />}
        <span style={hint}>Met een Google-profiel tonen we een "Bekijk onze Google-reviews"-knop in plaats van een leeg reviewblok.</span>
          </>
        )}

        {revise && (
          <>
        <label style={label}>Tone of voice<span style={hint}>{revise ? "Vul in als de toon van de teksten anders moet." : "Beschrijf de schrijfstijl in een paar woorden. Dit bepaalt de toon van alle teksten op de site."}</span><textarea style={{ ...veld, minHeight: 60 }} name="tone_of_voice" placeholder="Bijv. nuchter, persoonlijk, geen verkooppraat" /></label>
          </>
        )}
        {revise && (
          <>
        <label style={label}>Kleurvoorkeur (optioneel)<span style={hint}>{revise ? "Vul in als de kleuren anders moeten." : "Geef kleuren op, of laat leeg - dan leiden we het kleurenpalet af uit het logo."}</span><input style={veld} name="kleurvoorkeur" placeholder="Anders afgeleid uit het logo" /></label>
          </>
        )}
        <label style={label}>Huidige / oude website (optioneel)<span style={hint}>Heb je al een (oude) website? Plak de link - wij halen er automatisch bruikbare info uit (diensten, teksten, regio).</span><input style={veld} name="oude_website" placeholder="https://..." defaultValue={v.website || ""} /></label>
        <label style={label}>Logo (optioneel)<span style={hint}>{revise ? "Upload alleen als het logo vervangen moet worden." : "Bron voor het kleurenpalet en de header. Lever 'm aan als dat kan. JPG of PNG, geen SVG."}</span><input style={{ ...veld, padding: 8 }} name="logo" type="file" accept={ACCEPT_ATTRIBUUT}
            onChange={(e) => setLogoFout(controleerBestanden(e.target.files, "logo") || "")} />
          {logoFout && <span style={foutTekst}>{logoFout}</span>}</label>
        {uitgebreid && (
          <label style={label}>Foto's (optioneel, meerdere mogelijk)<span style={hint}>{revise ? "Upload je echte projectfoto's - die vervangen de tijdelijke beelden en maken de site veel overtuigender. JPG of PNG, tot 12 stuks." : "Echte projectfoto's vullen het portfolio en de dienstblokken - dat maakt de site veel overtuigender. JPG of PNG, tot 12 stuks."}</span><input style={{ ...veld, padding: 8 }} name="fotos" type="file" accept={ACCEPT_ATTRIBUUT} multiple
            onChange={(e) => setFotoFout(controleerBestanden(e.target.files, "foto") || "")} />
          {fotoFout && <span style={foutTekst}>{fotoFout}</span>}</label>
        )}
        {/* De publieke intake is bewust kort. Wat hier niet staat wordt niet
            gevraagd: de preview vult het zelf. Kernwaarden worden afgeleid en in
            _review.afgeleid genoteerd, kleuren komen uit het logo, en ontbrekende
            beelden worden opgevangen door de branchefoto's uit preview-assets.js. */}
        {!uitgebreid && (
          <>
        <label style={label}>Slogan (optioneel)<span style={hint}>Een korte, pakkende zin. Verschijnt onder de bedrijfsnaam en in de hero.</span><input style={veld} name="slogan" placeholder="Bijv. Vakwerk dat blijft" /></label>
        <label style={label}>Diensten<span style={hint}>Noem er liever meerdere en zo concreet mogelijk. Elke dienst wordt een apart blok én een eigen pagina - meer en specifieker geeft een vollere site.</span><textarea style={{ ...veld, minHeight: 70 }} name="diensten" placeholder="Bijv. binnenschilderwerk, buitenschilderwerk, houtrot, kozijnen" /></label>
        <div style={label}>Sociale media (links)</div>
        <span style={hint}>{revise ? "Vul in als je social-links toegevoegd of aangepast moeten worden. Voeg elke link apart toe met \"+\"." : "Voeg elke link apart toe met \"+\". Ze worden als icoon-links in de footer geplaatst."}</span>
        {socials.map((s, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <input style={{ ...veld, marginTop: 0 }} value={s} onChange={(e) => setSocial(i, e.target.value)} placeholder={"Link " + (i + 1) + " (Facebook, Instagram, LinkedIn...)"} />
            {socials.length > 1 && (
              <button type="button" onClick={() => setSocials(socials.filter((_, j) => j !== i))} style={{ border: "1px solid #DADFE3", background: "#fff", color: HUISSTIJL.donker, borderRadius: 8, padding: "0 12px", cursor: "pointer", fontSize: 18, fontFamily: FONT }}>-</button>
            )}
          </div>
        ))}
        <button type="button" onClick={() => setSocials([...socials, ""])} style={{ marginTop: 8, border: "1.5px solid " + A, background: "#fff", color: HUISSTIJL.donker, borderRadius: 999, padding: "8px 14px", cursor: "pointer", fontWeight: 600, fontSize: 14, fontFamily: FONT }}>+ Link toevoegen</button>
        <label style={{ ...label, display: "flex", alignItems: "center", gap: 8 }}>
          <input type="checkbox" checked={heeftGoogle} onChange={(e) => setHeeftGoogle(e.target.checked)} style={{ accentColor: A }} />
          Heeft een Google Bedrijfsprofiel
        </label>
        {heeftGoogle && <input style={veld} name="google_url" placeholder="Link naar Google-profiel (optioneel)" />}
        <span style={hint}>Met een Google-profiel tonen we een "Bekijk onze Google-reviews"-knop in plaats van een leeg reviewblok.</span>
          </>
        )}

        {revise && (
          <label style={label}>Extra toelichting / research<span style={hint}>Alle losse opmerkingen die helpen bij het aanpassen.</span><textarea style={{ ...veld, minHeight: 100 }} name="notities" placeholder="Plak hier losse research, opmerkingen, reviews, enz." /></label>
        )}

        {!revise && (
          <>
            {intern && (
              <>
            <div style={label}>Interesse / pakket (meerdere mogelijk)</div>
            <span style={hint}>Alleen voor intern gebruik - wat de klant wil afnemen. Verschijnt op je dashboard, niet op de site.</span>
            <div>
              {INTERESSE.map((opt) => (
                <span key={opt} style={chip(interesse.includes(opt))} onClick={() => toggle(interesse, setInteresse, opt)}>
                  <input type="checkbox" readOnly checked={interesse.includes(opt)} style={{ pointerEvents: "none" }} />{opt}
                </span>
              ))}
            </div>
              </>
            )}
          </>
        )}
        <p style={avgTekst}>
          <strong>Wat we met deze gegevens doen.</strong> We gebruiken wat je hier invult alleen om de voorbeeldwebsite
          te maken en om contact op te nemen over dat voorstel. Het logo en de foto's worden op onze beveiligde opslag
          gezet en verwerkt door onze tekst- en beeldleverancier; ze worden niet gebruikt om modellen te trainen en niet
          aan anderen doorverkocht. Wordt het geen klant, dan halen we de previewsite en de aangeleverde bestanden
          binnen zes maanden weg. Wil je eerder dat we alles verwijderen, of wil je weten wat we van je hebben?
          Mail <a href="mailto:info@studiobaris.nl" style={{ color: A }}>info@studiobaris.nl</a> en we regelen het.
          Lever geen foto's aan waar herkenbare personen op staan zonder dat zij daarvan weten.
        </p>

        <button type="submit" disabled={status === "bezig"} style={{ marginTop: 24, background: A, color: ATekst, border: "none", padding: "13px 26px", borderRadius: 999, fontFamily: FONT, fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
          {status === "bezig" ? (uploadStand || busyLabel || "Bezig...") : (submitLabel || "Versturen")}
        </button>
        {error && <p style={{ color: "#c0392b", marginTop: 14 }}>{error}</p>}
          </form>
        </div>
      </main>
    </>
  );
}
