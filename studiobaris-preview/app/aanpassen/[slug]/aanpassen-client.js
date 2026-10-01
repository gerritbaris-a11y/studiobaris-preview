"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { verkleinFoto } from "../../../lib/verklein-foto";

// ---------------------------------------------------------------------------
// Aanpassen-scherm voor één preview.
// Links bewerk je (stijl & kleuren, foto's, teksten, AI-opdracht), rechts zie je
// direct het resultaat. Elke wijziging wordt na een seconde als *werkversie*
// bewaard (nog niet live). Pas bij "Live zetten" wordt het de echte preview,
// en de vorige versie gaat naar het archief, zodat je altijd terug kunt.
// ---------------------------------------------------------------------------

const K = {
  papier: "#FBF7F0", inkt: "#2B2724", gedempt: "#6B6258", label: "#9A9084",
  lijn: "#ECE4D7", lijn2: "#E3DACB", klei: "#C05A38", kleiDonker: "#9E3B2E", kleiZacht: "#F5E2D9",
  groen: "#1d7a46",
};
const HEAD = "'Bricolage Grotesque', system-ui, sans-serif";
const BODY = "'Hanken Grotesk', system-ui, sans-serif";

const STIJLEN = [
  { id: "stoer", naam: "Stoer", uitleg: "Donker, krachtig, grote koppen" },
  { id: "modern", naam: "Modern", uitleg: "Licht, strak en zakelijk" },
  { id: "persoonlijk", naam: "Persoonlijk", uitleg: "Warm, met portretfoto" },
];

const PALETTEN = [
  { naam: "Antraciet & oranje", p: "#1F2328", s: "#F07B1D", a: "#F6F4F1", t: "#2E3338" },
  { naam: "Marine & geel", p: "#13294B", s: "#F2B705", a: "#F4F6F9", t: "#1F2A37" },
  { naam: "Bosgroen & goud", p: "#1E3B2F", s: "#C9A227", a: "#F5F2EA", t: "#26332C" },
  { naam: "Bordeaux & goud", p: "#4A1220", s: "#C79A56", a: "#F8F4EF", t: "#3A2A2D" },
  { naam: "Leisteen & koper", p: "#2F3A45", s: "#B8733F", a: "#F3F4F5", t: "#2B333B" },
  { naam: "Zwart & limoen", p: "#111111", s: "#8DBB25", a: "#F5F5F2", t: "#222222" },
  { naam: "Petrol & koraal", p: "#0E3B43", s: "#F26B5B", a: "#F1F6F6", t: "#1F3337" },
  { naam: "Aarde & terracotta", p: "#3B2A20", s: "#C05A38", a: "#FBF7F0", t: "#3A2E27" },
];

const AI_VOORBEELDEN = [
  "Maak de intro korter en krachtiger",
  "Schrijf alle teksten in de je-vorm",
  "Haal de huisstijlkleuren uit het logo",
  "Maak de diensten concreter, zonder iets te verzinnen",
  "Geef de kop meer nadruk op snelheid en betrouwbaarheid",
];

// --- kleine hulpjes ---------------------------------------------------------

const kloon = (x) => JSON.parse(JSON.stringify(x || {}));

function luminantie(hex) {
  const m = /^#([0-9a-f]{6})$/i.exec(hex || "");
  if (!m) return null;
  const n = parseInt(m[1], 16);
  const kan = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * kan[0] + 0.7152 * kan[1] + 0.0722 * kan[2];
}
function contrast(a, b) {
  const la = luminantie(a), lb = luminantie(b);
  if (la == null || lb == null) return null;
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

function datumTijd(d) {
  if (!d) return "";
  const t = new Date(d);
  return isNaN(t) ? "" : t.toLocaleString("nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

// Bestanden verkleinen en rechtstreeks in de opslag zetten (zelfde weg als het
// intakeformulier). Geeft de publieke links terug.
async function uploadFotos(bestanden, rol = "foto") {
  const lijst = Array.from(bestanden || []);
  if (!lijst.length) return [];
  const klaar = [];
  for (const f of lijst) {
    const v = await verkleinFoto(f, rol);
    if (v.size > 45 * 1024 * 1024) throw new Error(`"${f.name}" is te groot om te uploaden.`);
    klaar.push(v);
  }
  const res = await fetch("/api/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bestanden: klaar.map((b) => ({ naam: b.name, grootte: b.size, rol })) }),
  });
  const plekken = await res.json().catch(() => ({}));
  if (!plekken.ok) throw new Error(plekken.error || "Kon de upload niet klaarzetten.");
  const urls = [];
  for (let i = 0; i < klaar.length; i++) {
    const plek = plekken.bestanden[i];
    const op = await fetch(plek.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": klaar[i].type || "application/octet-stream", "x-upsert": "true" },
      body: klaar[i],
    });
    if (!op.ok) throw new Error(`"${klaar[i].name}" kon niet worden verstuurd.`);
    urls.push(plek.publiekeUrl);
  }
  return urls;
}

// --- stijlen ------------------------------------------------------------------

const inp = {
  width: "100%", boxSizing: "border-box", padding: "9px 11px", fontSize: 14, border: `1px solid ${K.lijn2}`,
  borderRadius: 9, background: "#fff", fontFamily: "inherit", color: K.inkt,
};
const lbl = { display: "block", fontSize: 12, fontWeight: 700, color: K.gedempt, margin: "10px 0 4px" };
const knop = (soort = "secundair") => ({
  display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 13px", borderRadius: 9, fontSize: 13,
  fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
  border: soort === "primair" ? "none" : `1px solid ${soort === "gevaar" ? "#F5C6C0" : K.lijn2}`,
  background: soort === "primair" ? K.klei : soort === "donker" ? K.inkt : "#fff",
  color: soort === "primair" || soort === "donker" ? "#fff" : soort === "gevaar" ? K.kleiDonker : K.inkt,
});
const blok = { background: "#fff", border: `1px solid ${K.lijn}`, borderRadius: 14, padding: "14px 16px", marginBottom: 12 };
const blokKop = { fontFamily: HEAD, fontSize: 15, fontWeight: 800, margin: "0 0 6px" };
const hint = { fontSize: 12.5, color: K.label, margin: "2px 0 0", lineHeight: 1.45 };

function Veld({ label, value, onChange, lang, rijen = 3, placeholder }) {
  return (
    <label style={{ display: "block" }}>
      <span style={lbl}>{label}</span>
      {lang ? (
        <textarea value={value || ""} onChange={(e) => onChange(e.target.value)} rows={rijen} placeholder={placeholder}
          style={{ ...inp, resize: "vertical", lineHeight: 1.45 }} />
      ) : (
        <input value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={inp} />
      )}
    </label>
  );
}

function KleurVeld({ label, uitleg, value, onChange }) {
  const geldig = /^#[0-9a-f]{6}$/i.test(value || "");
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}>
      <input type="color" value={geldig ? value : "#000000"} onChange={(e) => onChange(e.target.value.toUpperCase())}
        style={{ width: 42, height: 34, border: `1px solid ${K.lijn2}`, borderRadius: 8, padding: 2, background: "#fff", cursor: "pointer" }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700 }}>{label}</div>
        <div style={{ fontSize: 12, color: K.label }}>{uitleg}</div>
      </div>
      <input value={value || ""} onChange={(e) => onChange(e.target.value.trim())} maxLength={7}
        style={{ ...inp, width: 92, fontFamily: "ui-monospace, monospace", fontSize: 13, borderColor: geldig || !value ? K.lijn2 : "#F5C6C0" }} />
    </div>
  );
}

function Duim({ url, breed = 72, hoog = 54, rond }) {
  return (
    <div style={{
      width: breed, height: hoog, flex: "0 0 auto", borderRadius: rond ? "50%" : 8, border: `1px solid ${K.lijn}`,
      background: url ? `#f4f1ec url(${JSON.stringify(url)}) center/cover no-repeat` : "repeating-linear-gradient(45deg,#f6f2ea,#f6f2ea 6px,#efe9de 6px,#efe9de 12px)",
      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: K.label,
    }}>{url ? "" : "geen"}</div>
  );
}

// Knop die een bestandskiezer opent en de geüploade link(s) teruggeeft.
function UploadKnop({ label = "Uploaden", meerdere, rol = "foto", onKlaar, onFout, klein }) {
  const ref = useRef(null);
  const [bezig, setBezig] = useState(false);
  return (
    <>
      <input ref={ref} type="file" accept="image/*" multiple={!!meerdere} style={{ display: "none" }}
        onChange={async (e) => {
          const files = e.target.files;
          e.target.value = "";
          if (!files || !files.length) return;
          setBezig(true);
          try { onKlaar(await uploadFotos(files, rol)); }
          catch (err) { onFout && onFout(String((err && err.message) || err)); }
          setBezig(false);
        }} />
      <button type="button" onClick={() => ref.current && ref.current.click()} disabled={bezig}
        style={{ ...knop(), padding: klein ? "6px 10px" : "8px 13px", fontSize: klein ? 12.5 : 13, cursor: bezig ? "wait" : "pointer" }}>
        {bezig ? "Uploaden…" : label}
      </button>
    </>
  );
}

// Venster om een foto uit de eigen vakfotobank te kiezen.
function VakfotoKiezer({ vakfotos, eigenVak, onKies, onSluit }) {
  const start = vakfotos.find((v) => v.key === eigenVak) ? eigenVak : (vakfotos[0] && vakfotos[0].key) || "";
  const [vak, setVak] = useState(start);
  const huidig = vakfotos.find((v) => v.key === vak);
  return (
    <div onClick={onSluit} style={{ position: "fixed", inset: 0, background: "rgba(43,39,36,.45)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, padding: 18, width: "min(860px, 100%)", maxHeight: "85vh", overflow: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
          <strong style={{ fontFamily: HEAD, fontSize: 17 }}>Kies uit de vakfoto's</strong>
          <select value={vak} onChange={(e) => setVak(e.target.value)} style={{ ...inp, width: "auto" }}>
            {vakfotos.map((v) => <option key={v.key} value={v.key}>{v.label} ({v.fotos.length})</option>)}
          </select>
          <button onClick={onSluit} style={{ ...knop(), marginLeft: "auto" }}>Sluiten</button>
        </div>
        {!vakfotos.length && <p style={hint}>Er staan nog geen vakfoto's. Upload ze via Klanten › Vakfoto's.</p>}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
          {(huidig ? huidig.fotos : []).map((f) => (
            <button key={f.url} onClick={() => onKies(f.url)} title="Deze gebruiken"
              style={{ padding: 0, border: `1px solid ${K.lijn}`, borderRadius: 10, overflow: "hidden", cursor: "pointer", background: "#fff", aspectRatio: "4/3" }}>
              <img src={f.url} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

export default function AanpassenClient({ slug, naam, live: liveStart, werk, werkDoor, werkOp, versie: versieStart, conceptAanwezig, ik, fonts, vakfotos, eigenVak }) {
  const [live, setLive] = useState(liveStart);
  const [content, setContent] = useState(() => kloon(werk || liveStart));
  const [versie, setVersie] = useState(versieStart);
  const [tab, setTab] = useState("stijl");
  const [opslag, setOpslag] = useState(werk ? "bewaard" : "");
  const [frameKey, setFrameKey] = useState(0);
  const [apparaat, setApparaat] = useState("desktop");
  const [melding, setMelding] = useState(null); // { soort, tekst }
  const [kiezer, setKiezer] = useState(null); // callback voor de vakfotokiezer
  const [publiceren, setPubliceren] = useState(false);
  const [notitie, setNotitie] = useState("");
  const [versiesOpen, setVersiesOpen] = useState(false);
  const [versieLijst, setVersieLijst] = useState(null);
  const [ai, setAi] = useState({ opdracht: "", bezig: false, wijzigingen: null });
  const eerste = useRef(true);
  const [werkBanner, setWerkBanner] = useState(!!werk);

  const gewijzigd = useMemo(() => JSON.stringify(content) !== JSON.stringify(live), [content, live]);

  function wijzig(fn) {
    setContent((vorig) => { const c = kloon(vorig); fn(c); return c; });
  }
  const zet = (pad, waarde) => wijzig((c) => {
    const delen = pad.split(".");
    let o = c;
    for (let i = 0; i < delen.length - 1; i++) { o[delen[i]] = o[delen[i]] && typeof o[delen[i]] === "object" ? o[delen[i]] : {}; o = o[delen[i]]; }
    o[delen[delen.length - 1]] = waarde;
  });
  const fout = (tekst) => setMelding({ soort: "fout", tekst });

  // Elke wijziging na 1 seconde als werkversie bewaren en het voorbeeld verversen.
  useEffect(() => {
    if (eerste.current) { eerste.current = false; return; }
    setOpslag("bezig");
    const t = setTimeout(async () => {
      try {
        const res = await fetch("/api/aanpassen", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ actie: "werk", slug, content }),
        });
        const j = await res.json().catch(() => ({}));
        if (!j.ok) { setOpslag("fout"); fout(j.error || "Bewaren mislukt."); return; }
        setOpslag("bewaard");
        setFrameKey((k) => k + 1);
      } catch {
        setOpslag("fout");
      }
    }, 1000);
    return () => clearTimeout(t);
  }, [content]); // eslint-disable-line react-hooks/exhaustive-deps

  async function liveZetten() {
    try {
      const res = await fetch("/api/aanpassen", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actie: "publiceer", slug, content, notitie }),
      });
      const j = await res.json().catch(() => ({}));
      if (!j.ok) { fout(j.error || "Live zetten mislukt."); return; }
      eerste.current = true; // al opgeslagen, niet nog eens als werkversie bewaren
      setLive(j.content); setContent(kloon(j.content)); setVersie(j.versie); setPubliceren(false); setNotitie(""); setOpslag(""); setWerkBanner(false);
      setVersieLijst(null);
      setMelding({ soort: "ok", tekst: `Live gezet als versie ${j.versie}. De vorige versie staat in het archief.` });
      setFrameKey((k) => k + 1);
    } catch { fout("Geen verbinding."); }
  }

  async function laadVersies() {
    setVersiesOpen(true);
    const res = await fetch("/api/aanpassen", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actie: "versies", slug }),
    });
    const j = await res.json().catch(() => ({}));
    setVersieLijst(j.ok ? j.versies : []);
  }

  async function terugzetten(v) {
    if (!window.confirm(`Versie ${v.versie} terugzetten? De huidige live versie gaat eerst naar het archief.`)) return;
    const res = await fetch("/api/aanpassen", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actie: "terug", slug, versie_id: v.id }),
    });
    const j = await res.json().catch(() => ({}));
    if (!j.ok) { fout(j.error || "Terugzetten mislukt."); return; }
    eerste.current = true; // dit is al opgeslagen, niet nog eens als werkversie
    setLive(j.content); setContent(kloon(j.content)); setVersie(j.versie); setOpslag(""); setWerkBanner(false);
    setVersieLijst(null); setVersiesOpen(false);
    setMelding({ soort: "ok", tekst: `Versie ${v.versie} staat weer live (nu versie ${j.versie}).` });
    setFrameKey((k) => k + 1);
  }

  function weggooien() {
    if (!window.confirm("Alle wijzigingen die nog niet live staan weggooien?")) return;
    setContent(kloon(live)); setWerkBanner(false);
  }

  async function voerAiUit(opdracht) {
    const o = (opdracht || ai.opdracht || "").trim();
    if (!o) return;
    setAi((a) => ({ ...a, opdracht: o, bezig: true, wijzigingen: null }));
    try {
      const res = await fetch("/api/aanpassen/ai", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, content, opdracht: o }),
      });
      const j = await res.json().catch(() => ({}));
      if (!j.ok) { setAi((a) => ({ ...a, bezig: false })); fout(j.error || "De AI-opdracht is mislukt."); return; }
      setContent(j.content);
      setAi((a) => ({ ...a, bezig: false, wijzigingen: j.wijzigingen && j.wijzigingen.length ? j.wijzigingen : ["Aangepast."] }));
    } catch {
      setAi((a) => ({ ...a, bezig: false }));
      fout("Geen verbinding.");
    }
  }

  const m = content.merk || {};
  const b = content.bedrijf || {};
  const hero = content.hero || {};
  const diensten = Array.isArray(content.diensten) ? content.diensten : [];
  const projecten = Array.isArray(content.projecten) ? content.projecten : [];
  const voordelen = Array.isArray(content.voordelen) ? content.voordelen : [];
  const usps = Array.isArray(content.usps) ? content.usps : [];
  const reviews = Array.isArray(content.reviews) ? content.reviews : [];
  const cta = content.cta_blok || {};
  const knopContrast = contrast(m.secundaire_kleur, "#FFFFFF");

  const lijstActie = (veld, i, actie) => wijzig((c) => {
    const l = Array.isArray(c[veld]) ? c[veld] : [];
    if (actie === "weg") l.splice(i, 1);
    if (actie === "op" && i > 0) [l[i - 1], l[i]] = [l[i], l[i - 1]];
    if (actie === "neer" && i < l.length - 1) [l[i + 1], l[i]] = [l[i], l[i + 1]];
    c[veld] = l;
  });
  const lijstZet = (veld, i, sleutel, waarde) => wijzig((c) => {
    const l = Array.isArray(c[veld]) ? c[veld] : [];
    l[i] = sleutel == null ? waarde : { ...(l[i] || {}), [sleutel]: waarde };
    c[veld] = l;
  });
  const VolgordeKnoppen = ({ veld, i, n }) => (
    <span style={{ display: "inline-flex", gap: 4 }}>
      <button type="button" onClick={() => lijstActie(veld, i, "op")} disabled={i === 0} style={{ ...knop(), padding: "5px 8px" }} title="Omhoog">↑</button>
      <button type="button" onClick={() => lijstActie(veld, i, "neer")} disabled={i === n - 1} style={{ ...knop(), padding: "5px 8px" }} title="Omlaag">↓</button>
      <button type="button" onClick={() => lijstActie(veld, i, "weg")} style={{ ...knop("gevaar"), padding: "5px 9px" }} title="Verwijderen">✕</button>
    </span>
  );

  const fotoRegel = (titel, uitleg, url, zetUrl, opties = {}) => (
    <div style={{ display: "flex", gap: 12, alignItems: "center", padding: "8px 0", borderTop: `1px solid ${K.lijn}` }}>
      <Duim url={url} rond={opties.rond} breed={opties.rond ? 54 : 72} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700 }}>{titel}</div>
        {uitleg && <div style={{ fontSize: 12, color: K.label }}>{uitleg}</div>}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
          <UploadKnop klein label={url ? "Vervangen" : "Uploaden"} rol={opties.logo ? "logo" : "foto"} onKlaar={(u) => u[0] && zetUrl(u[0])} onFout={fout} />
          {!opties.logo && vakfotos.length > 0 && (
            <button type="button" onClick={() => setKiezer(() => (u) => zetUrl(u))} style={{ ...knop(), padding: "6px 10px", fontSize: 12.5 }}>Uit vakfoto's</button>
          )}
          {url && <button type="button" onClick={() => zetUrl("")} style={{ ...knop("gevaar"), padding: "6px 10px", fontSize: 12.5 }}>Verwijderen</button>}
        </div>
      </div>
    </div>
  );

  const tabKnop = (id, label) => (
    <button key={id} onClick={() => setTab(id)} style={{
      padding: "8px 13px", borderRadius: 999, fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
      border: "none", background: tab === id ? K.klei : "transparent", color: tab === id ? "#fff" : K.gedempt,
    }}>{label}</button>
  );

  const opslagTekst = {
    "": gewijzigd ? "Wijzigingen nog niet live" : "Gelijk aan de live versie",
    bezig: "Bewaren…",
    bewaard: gewijzigd ? "Werkversie bewaard · nog niet live" : "Gelijk aan de live versie",
    fout: "Bewaren mislukt",
  }[opslag];

  return (
    <div style={{ minHeight: "100vh", background: K.papier, color: K.inkt, fontFamily: BODY }}>
      <style>{`
        .ap-grid { display: grid; grid-template-columns: 1fr; gap: 16px; padding: 0 16px 40px; }
        .ap-voorbeeld { order: -1; }
        @media (min-width: 1100px) {
          .ap-grid { grid-template-columns: 470px 1fr; align-items: start; padding: 0 20px 40px; }
          .ap-voorbeeld { order: 0; position: sticky; top: 76px; }
          .ap-links { max-height: calc(100vh - 92px); overflow: auto; padding-right: 4px; }
        }
        .ap-grid button:disabled { opacity: .45; cursor: not-allowed; }
      `}</style>

      {/* Bovenbalk */}
      <div style={{ position: "sticky", top: 0, zIndex: 20, background: "rgba(251,247,240,.96)", backdropFilter: "blur(6px)", borderBottom: `1px solid ${K.lijn}`, padding: "10px 20px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
        <a href="/klanten" style={{ fontSize: 13, color: K.gedempt, textDecoration: "none" }}>← Mijn previews</a>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: HEAD, fontSize: 18, fontWeight: 800, lineHeight: 1.1 }}>{naam} aanpassen</div>
          <div style={{ fontSize: 12, color: opslag === "fout" ? K.kleiDonker : K.label }}>
            Live: versie {versie} · {opslagTekst}
          </div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => (versiesOpen ? setVersiesOpen(false) : laadVersies())} style={knop()}>Versies</button>
          {gewijzigd && <button onClick={weggooien} style={knop()}>Wijzigingen weggooien</button>}
          <button onClick={() => setPubliceren(true)} disabled={!gewijzigd || opslag === "bezig"} style={{ ...knop("primair"), opacity: gewijzigd ? 1 : 0.5 }}>
            Live zetten
          </button>
        </div>
      </div>

      <div className="ap-grid">
        {/* LINKS: bewerken */}
        <div className="ap-links">
          {melding && (
            <div style={{ ...blok, background: melding.soort === "fout" ? "#FDECEA" : "#E7F3EA", borderColor: melding.soort === "fout" ? "#F5C6C0" : "#BFDCC6", color: melding.soort === "fout" ? K.kleiDonker : K.groen, display: "flex", gap: 10, alignItems: "flex-start" }}>
              <div style={{ flex: 1, fontSize: 13.5, fontWeight: 600 }}>{melding.tekst}</div>
              <button onClick={() => setMelding(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontSize: 16 }}>×</button>
            </div>
          )}
          {werkBanner && (
            <div style={{ ...blok, background: "#FBF3E4", borderColor: "#EBD9B5" }}>
              <div style={{ fontSize: 13.5 }}>
                Je gaat verder met een werkversie die nog niet live staat{werkDoor ? ` (van ${werkDoor}${werkOp ? ", " + datumTijd(werkOp) : ""})` : ""}.
              </div>
              <button onClick={weggooien} style={{ ...knop(), marginTop: 8 }}>Opnieuw beginnen vanaf de live versie</button>
            </div>
          )}
          {conceptAanwezig && (
            <div style={{ ...blok, fontSize: 13, color: K.gedempt }}>
              Er staat ook nog een klant-concept klaar (via het feedbackformulier). Dat staat hier los van; je vindt het onder <a href={`/vergelijk/${slug}`} style={{ color: K.klei }}>Stijl kiezen</a>.
            </div>
          )}

          {versiesOpen && (
            <div style={blok}>
              <div style={{ display: "flex", alignItems: "center" }}>
                <h3 style={blokKop}>Eerdere versies</h3>
                <button onClick={() => setVersiesOpen(false)} style={{ ...knop(), marginLeft: "auto", padding: "5px 10px" }}>Sluiten</button>
              </div>
              {versieLijst === null && <p style={hint}>Laden…</p>}
              {versieLijst && versieLijst.length === 0 && <p style={hint}>Nog geen eerdere versies. Zodra je iets live zet, verschijnt de vorige versie hier.</p>}
              {(versieLijst || []).map((v) => (
                <div key={v.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderTop: `1px solid ${K.lijn}` }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700 }}>Versie {v.versie}</div>
                    <div style={{ fontSize: 12, color: K.label }}>{datumTijd(v.op)}{v.notitie ? " · " + v.notitie : ""}</div>
                  </div>
                  <button onClick={() => terugzetten(v)} style={{ ...knop(), padding: "6px 10px" }}>Terugzetten</button>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", background: "#fff", border: `1px solid ${K.lijn}`, borderRadius: 999, padding: 4, marginBottom: 12 }}>
            {tabKnop("stijl", "Stijl & kleuren")}
            {tabKnop("fotos", "Foto's")}
            {tabKnop("teksten", "Teksten")}
            {tabKnop("ai", "✦ AI-opdracht")}
          </div>

          {/* ---------- STIJL & KLEUREN ---------- */}
          {tab === "stijl" && (
            <>
              <div style={blok}>
                <h3 style={blokKop}>Stijl</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                  {STIJLEN.map((s) => {
                    const aan = (m.stijl || "stoer") === s.id;
                    return (
                      <button key={s.id} onClick={() => zet("merk.stijl", s.id)} style={{
                        textAlign: "left", padding: "10px 11px", borderRadius: 11, cursor: "pointer", fontFamily: "inherit",
                        border: `1.5px solid ${aan ? K.klei : K.lijn2}`, background: aan ? K.kleiZacht : "#fff",
                      }}>
                        <div style={{ fontWeight: 800, fontSize: 14 }}>{s.naam}</div>
                        <div style={{ fontSize: 11.5, color: K.gedempt, marginTop: 2 }}>{s.uitleg}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={blok}>
                <h3 style={blokKop}>Kleurenpaletten</h3>
                <p style={hint}>Eén klik zet alle vier de kleuren. Daarna kun je ze hieronder nog los bijstellen.</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, marginTop: 10 }}>
                  {PALETTEN.map((p) => (
                    <button key={p.naam} onClick={() => wijzig((c) => { c.merk = { ...(c.merk || {}), primaire_kleur: p.p, secundaire_kleur: p.s, accent_kleur: p.a, tekst_kleur: p.t }; })}
                      style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", border: `1px solid ${K.lijn2}`, borderRadius: 10, background: "#fff", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                      <span style={{ display: "inline-flex", borderRadius: 6, overflow: "hidden", border: "1px solid rgba(0,0,0,.08)", flex: "0 0 auto" }}>
                        {[p.p, p.s, p.a].map((k) => <span key={k} style={{ width: 16, height: 22, background: k }} />)}
                      </span>
                      <span style={{ fontSize: 12.5, fontWeight: 600 }}>{p.naam}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div style={blok}>
                <h3 style={blokKop}>Eigen kleuren</h3>
                <KleurVeld label="Hoofdkleur" uitleg="Kopbalk en bovenste blok" value={m.primaire_kleur} onChange={(v) => zet("merk.primaire_kleur", v)} />
                <KleurVeld label="Actiekleur" uitleg="Knoppen en accenten" value={m.secundaire_kleur} onChange={(v) => zet("merk.secundaire_kleur", v)} />
                <KleurVeld label="Achtergrond" uitleg="Lichte vlakken" value={m.accent_kleur} onChange={(v) => zet("merk.accent_kleur", v)} />
                <KleurVeld label="Tekstkleur" uitleg="Lopende tekst" value={m.tekst_kleur} onChange={(v) => zet("merk.tekst_kleur", v)} />
                {knopContrast != null && knopContrast < 2.6 && (
                  <p style={{ ...hint, color: K.kleiDonker }}>Let op: witte tekst op deze actiekleur is slecht leesbaar. Kies een donkerdere actiekleur.</p>
                )}
                {m.logo_url && (
                  <button onClick={() => { setTab("ai"); voerAiUit("Haal de huisstijlkleuren uit het logo"); }} style={{ ...knop(), marginTop: 8 }}>
                    ✦ Kleuren uit het logo halen
                  </button>
                )}
              </div>

              <div style={blok}>
                <h3 style={blokKop}>Lettertypes</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <label><span style={lbl}>Koppen</span>
                    <select value={m.koppen_font || ""} onChange={(e) => zet("merk.koppen_font", e.target.value)} style={inp}>
                      {!fonts.includes(m.koppen_font) && m.koppen_font && <option value={m.koppen_font}>{m.koppen_font}</option>}
                      {fonts.map((f) => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </label>
                  <label><span style={lbl}>Tekst</span>
                    <select value={m.tekst_font || ""} onChange={(e) => zet("merk.tekst_font", e.target.value)} style={inp}>
                      {!fonts.includes(m.tekst_font) && m.tekst_font && <option value={m.tekst_font}>{m.tekst_font}</option>}
                      {fonts.map((f) => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </label>
                </div>
              </div>
            </>
          )}

          {/* ---------- FOTO'S ---------- */}
          {tab === "fotos" && (
            <>
              <div style={blok}>
                <h3 style={blokKop}>Vaste beelden</h3>
                {fotoRegel("Logo", "Komt linksboven in de kopbalk", m.logo_url, (u) => zet("merk.logo_url", u), { logo: true })}
                {fotoRegel("Achtergrondfoto bovenaan", "Grote foto achter de kop, met een donkere waas", hero.achtergrond, (u) => zet("hero.achtergrond", u))}
                {fotoRegel("Portretfoto", "Alleen zichtbaar in de stijl Persoonlijk", m.persoon_foto, (u) => zet("merk.persoon_foto", u), { rond: true })}
              </div>

              <div style={blok}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <h3 style={{ ...blokKop, margin: 0 }}>Projecten</h3>
                  <span style={{ marginLeft: "auto", display: "inline-flex", gap: 6 }}>
                    <UploadKnop klein meerdere label="+ Foto's toevoegen" onFout={fout}
                      onKlaar={(urls) => wijzig((c) => { c.projecten = [...(Array.isArray(c.projecten) ? c.projecten : []), ...urls.map((u) => ({ titel: "Project", plaats: "", beeld_url: u }))]; })} />
                    {vakfotos.length > 0 && (
                      <button type="button" onClick={() => setKiezer(() => (u) => wijzig((c) => { c.projecten = [...(Array.isArray(c.projecten) ? c.projecten : []), { titel: "Project", plaats: "", beeld_url: u }]; }))}
                        style={{ ...knop(), padding: "6px 10px", fontSize: 12.5 }}>+ Uit vakfoto's</button>
                    )}
                  </span>
                </div>
                {!projecten.length && <p style={hint}>Nog geen projecten. Zonder eigen foto's toont de preview standaardbeelden.</p>}
                {projecten.map((p, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 0", borderTop: `1px solid ${K.lijn}` }}>
                    <Duim url={p.beeld_url} breed={84} hoog={64} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 6 }}>
                        <input value={p.titel || ""} onChange={(e) => lijstZet("projecten", i, "titel", e.target.value)} placeholder="Titel" style={{ ...inp, padding: "7px 9px", fontSize: 13 }} />
                        <input value={p.plaats || ""} onChange={(e) => lijstZet("projecten", i, "plaats", e.target.value)} placeholder="Plaats" style={{ ...inp, padding: "7px 9px", fontSize: 13 }} />
                      </div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6, alignItems: "center" }}>
                        <UploadKnop klein label="Foto vervangen" onFout={fout} onKlaar={(u) => u[0] && lijstZet("projecten", i, "beeld_url", u[0])} />
                        {vakfotos.length > 0 && (
                          <button type="button" onClick={() => setKiezer(() => (u) => lijstZet("projecten", i, "beeld_url", u))} style={{ ...knop(), padding: "6px 10px", fontSize: 12.5 }}>Uit vakfoto's</button>
                        )}
                        <span style={{ marginLeft: "auto" }}><VolgordeKnoppen veld="projecten" i={i} n={projecten.length} /></span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {diensten.length > 0 && (
                <div style={blok}>
                  <h3 style={blokKop}>Foto's bij de diensten</h3>
                  <p style={hint}>Zichtbaar in de stijl Stoer. Zonder eigen foto wordt een passend standaardbeeld gebruikt.</p>
                  {diensten.map((d, i) => (
                    <div key={i}>{fotoRegel(d.titel || `Dienst ${i + 1}`, "", d.beeld_url, (u) => lijstZet("diensten", i, "beeld_url", u))}</div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ---------- TEKSTEN ---------- */}
          {tab === "teksten" && (
            <>
              <div style={blok}>
                <h3 style={blokKop}>Bovenaan de pagina</h3>
                <Veld label="Kop" value={hero.kop} onChange={(v) => zet("hero.kop", v)} />
                <Veld label="Laatste woorden van de kop (in de actiekleur)" value={hero.kop_accent} onChange={(v) => zet("hero.kop_accent", v)} />
                <Veld label="Ondertitel" value={hero.subkop} onChange={(v) => zet("hero.subkop", v)} lang rijen={2} />
                <Veld label="Tekst op de knop" value={hero.cta_tekst} onChange={(v) => zet("hero.cta_tekst", v)} />
                <Veld label="Slogan" value={b.slogan} onChange={(v) => zet("bedrijf.slogan", v)} />
              </div>

              <div style={blok}>
                <h3 style={blokKop}>Over ons</h3>
                <Veld label="Tekst" value={content.over_ons} onChange={(v) => zet("over_ons", v)} lang rijen={5} />
              </div>

              <div style={blok}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <h3 style={{ ...blokKop, margin: 0 }}>Diensten</h3>
                  <button onClick={() => wijzig((c) => { c.diensten = [...(Array.isArray(c.diensten) ? c.diensten : []), { titel: "", omschrijving: "" }]; })} style={{ ...knop(), marginLeft: "auto", padding: "6px 10px", fontSize: 12.5 }}>+ Dienst</button>
                </div>
                {diensten.map((d, i) => (
                  <div key={i} style={{ borderTop: `1px solid ${K.lijn}`, marginTop: 10, paddingTop: 4 }}>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
                      <div style={{ flex: 1 }}><Veld label={`Dienst ${i + 1}`} value={d.titel} onChange={(v) => lijstZet("diensten", i, "titel", v)} /></div>
                      <VolgordeKnoppen veld="diensten" i={i} n={diensten.length} />
                    </div>
                    <Veld label="Omschrijving" value={d.omschrijving} onChange={(v) => lijstZet("diensten", i, "omschrijving", v)} lang rijen={2} />
                  </div>
                ))}
              </div>

              <div style={blok}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <h3 style={{ ...blokKop, margin: 0 }}>Waarom kiezen voor ons</h3>
                  <button onClick={() => wijzig((c) => { c.voordelen = [...(Array.isArray(c.voordelen) ? c.voordelen : []), { icoon: "✓", titel: "", tekst: "" }]; })} style={{ ...knop(), marginLeft: "auto", padding: "6px 10px", fontSize: 12.5 }}>+ Punt</button>
                </div>
                {voordelen.map((v, i) => (
                  <div key={i} style={{ borderTop: `1px solid ${K.lijn}`, marginTop: 10, paddingTop: 4 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "64px 1fr auto", gap: 8, alignItems: "end" }}>
                      <Veld label="Icoon" value={v.icoon} onChange={(x) => lijstZet("voordelen", i, "icoon", x)} />
                      <Veld label="Titel" value={v.titel} onChange={(x) => lijstZet("voordelen", i, "titel", x)} />
                      <VolgordeKnoppen veld="voordelen" i={i} n={voordelen.length} />
                    </div>
                    <Veld label="Tekst" value={v.tekst} onChange={(x) => lijstZet("voordelen", i, "tekst", x)} lang rijen={2} />
                  </div>
                ))}
              </div>

              <div style={blok}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <h3 style={{ ...blokKop, margin: 0 }}>Korte pluspunten</h3>
                  <button onClick={() => wijzig((c) => { c.usps = [...(Array.isArray(c.usps) ? c.usps : []), ""]; })} style={{ ...knop(), marginLeft: "auto", padding: "6px 10px", fontSize: 12.5 }}>+ Pluspunt</button>
                </div>
                {usps.map((u, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
                    <input value={u || ""} onChange={(e) => lijstZet("usps", i, null, e.target.value)} style={inp} />
                    <VolgordeKnoppen veld="usps" i={i} n={usps.length} />
                  </div>
                ))}
              </div>

              <div style={blok}>
                <h3 style={blokKop}>Blok onderaan</h3>
                <Veld label="Kop" value={cta.kop} onChange={(v) => zet("cta_blok.kop", v)} />
                <Veld label="Tekst" value={cta.tekst} onChange={(v) => zet("cta_blok.tekst", v)} lang rijen={2} />
                <Veld label="Knop" value={cta.knop} onChange={(v) => zet("cta_blok.knop", v)} />
              </div>

              <div style={blok}>
                <h3 style={blokKop}>Contactgegevens</h3>
                <p style={hint}>Lege velden toont de preview met duidelijk nepvoorbeelden (zoals 06 12345678).</p>
                <Veld label="Bedrijfsnaam" value={b.naam} onChange={(v) => zet("bedrijf.naam", v)} />
                <Veld label="Vakgebied (zoals het op de site staat)" value={b.branche} onChange={(v) => zet("bedrijf.branche", v)} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <Veld label="Telefoon" value={b.telefoon} onChange={(v) => zet("bedrijf.telefoon", v)} />
                  <Veld label="WhatsApp" value={b.whatsapp} onChange={(v) => zet("bedrijf.whatsapp", v)} />
                </div>
                <Veld label="E-mail" value={b.email} onChange={(v) => zet("bedrijf.email", v)} />
                <Veld label="Adres" value={b.adres} onChange={(v) => zet("bedrijf.adres", v)} />
                <Veld label="Werkgebied" value={b.regio} onChange={(v) => zet("bedrijf.regio", v)} />
                <Veld label="Openingstijden" value={b.openingstijden} onChange={(v) => zet("bedrijf.openingstijden", v)} />
              </div>

              {reviews.length > 0 && (
                <div style={blok}>
                  <h3 style={blokKop}>Reviews</h3>
                  <p style={hint}>Alleen echte reviews. Je kunt ze corrigeren of weghalen, niet toevoegen.</p>
                  {reviews.map((r, i) => (
                    <div key={i} style={{ borderTop: `1px solid ${K.lijn}`, marginTop: 10, paddingTop: 4 }}>
                      <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
                        <div style={{ flex: 1 }}><Veld label="Naam" value={r.naam} onChange={(v) => lijstZet("reviews", i, "naam", v)} /></div>
                        <VolgordeKnoppen veld="reviews" i={i} n={reviews.length} />
                      </div>
                      <Veld label="Tekst" value={r.tekst} onChange={(v) => lijstZet("reviews", i, "tekst", v)} lang rijen={2} />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ---------- AI ---------- */}
          {tab === "ai" && (
            <div style={blok}>
              <h3 style={blokKop}>Opdracht aan de AI</h3>
              <p style={hint}>Beschrijf in gewone taal wat er anders moet. De AI past alleen dat aan en verzint geen feiten. Je ziet het resultaat eerst rechts; pas bij "Live zetten" gaat het live.</p>
              <textarea value={ai.opdracht} onChange={(e) => setAi((a) => ({ ...a, opdracht: e.target.value }))} rows={4}
                placeholder="Bijv. maak de intro korter en noem dat ze ook in het weekend werken"
                style={{ ...inp, marginTop: 10, resize: "vertical", lineHeight: 1.45 }} />
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "8px 0 10px" }}>
                {AI_VOORBEELDEN.map((v) => (
                  <button key={v} onClick={() => setAi((a) => ({ ...a, opdracht: v }))} style={{ ...knop(), padding: "5px 10px", fontSize: 12, fontWeight: 600 }}>{v}</button>
                ))}
              </div>
              <button onClick={() => voerAiUit()} disabled={ai.bezig || !ai.opdracht.trim()} style={{ ...knop("donker"), cursor: ai.bezig ? "wait" : "pointer" }}>
                {ai.bezig ? "Bezig… (± 20 sec)" : "✦ Uitvoeren"}
              </button>
              {ai.wijzigingen && (
                <div style={{ marginTop: 12, background: "#E7F3EA", border: "1px solid #BFDCC6", borderRadius: 10, padding: "10px 12px", fontSize: 13 }}>
                  <strong style={{ color: K.groen }}>Aangepast:</strong>
                  <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
                    {ai.wijzigingen.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                  <div style={{ marginTop: 6, color: K.gedempt }}>Niet goed? Klik op "Wijzigingen weggooien" of pas het handmatig aan.</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RECHTS: live voorbeeld */}
        <div className="ap-voorbeeld">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
            <strong style={{ fontFamily: HEAD, fontSize: 15 }}>Voorbeeld</strong>
            <span style={{ fontSize: 12, color: K.label }}>{gewijzigd ? "met je wijzigingen (nog niet live)" : "zoals hij nu live staat"}</span>
            <span style={{ marginLeft: "auto", display: "inline-flex", background: "#fff", border: `1px solid ${K.lijn}`, borderRadius: 999, padding: 3 }}>
              {[["desktop", "Computer"], ["mobiel", "Telefoon"]].map(([id, l]) => (
                <button key={id} onClick={() => setApparaat(id)} style={{ border: "none", borderRadius: 999, padding: "5px 11px", fontSize: 12.5, fontWeight: 700, cursor: "pointer", background: apparaat === id ? K.inkt : "transparent", color: apparaat === id ? "#fff" : K.gedempt, fontFamily: "inherit" }}>{l}</button>
              ))}
            </span>
            <a href={`/${slug}?werk=1`} target="_blank" rel="noreferrer" style={{ fontSize: 12.5, color: K.klei, fontWeight: 700 }}>Open ↗</a>
          </div>
          <div style={{ background: "#e9e4da", borderRadius: 14, padding: apparaat === "mobiel" ? "14px 0" : 0, display: "flex", justifyContent: "center", overflow: "hidden", border: `1px solid ${K.lijn}` }}>
            <iframe
              key={frameKey}
              src={`/${slug}?werk=1&v=${frameKey}`}
              title="Voorbeeld van de preview"
              style={{
                width: apparaat === "mobiel" ? 390 : "100%", height: "calc(100vh - 150px)", minHeight: 560,
                border: "none", background: "#fff", borderRadius: apparaat === "mobiel" ? 18 : 0, display: "block",
              }}
            />
          </div>
        </div>
      </div>

      {/* Live zetten: korte notitie voor in de versiegeschiedenis */}
      {publiceren && (
        <div onClick={() => setPubliceren(false)} style={{ position: "fixed", inset: 0, background: "rgba(43,39,36,.45)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, padding: 20, width: "min(460px, 100%)" }}>
            <h3 style={{ ...blokKop, fontSize: 18 }}>Live zetten</h3>
            <p style={{ fontSize: 13.5, color: K.gedempt, lineHeight: 1.5 }}>
              De preview voor {naam} wordt direct bijgewerkt. De huidige versie ({versie}) gaat naar het archief; je kunt hem altijd terugzetten.
            </p>
            <Veld label="Wat heb je veranderd? (optioneel)" value={notitie} onChange={setNotitie} placeholder="Bijv. kleuren van het logo, nieuwe projectfoto's" />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 14 }}>
              <button onClick={() => setPubliceren(false)} style={knop()}>Annuleren</button>
              <button onClick={liveZetten} style={knop("primair")}>Live zetten</button>
            </div>
          </div>
        </div>
      )}

      {kiezer && (
        <VakfotoKiezer vakfotos={vakfotos} eigenVak={eigenVak}
          onSluit={() => setKiezer(null)}
          onKies={(u) => { kiezer(u); setKiezer(null); }} />
      )}
    </div>
  );
}
