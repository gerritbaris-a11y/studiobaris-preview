"use client";

import { useState } from "react";

export default function PublishButton({ slug }) {
  const [s, setS] = useState("idle");
  async function go() {
    if (!confirm("Conceptversie publiceren? De live site wordt hiermee bijgewerkt.")) return;
    setS("bezig");
    try {
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const d = await res.json();
      if (d.ok) location.reload();
      else { alert(d.error || "Publiceren mislukt"); setS("idle"); }
    } catch (e) {
      alert(String(e)); setS("idle");
    }
  }
  return (
    <button onClick={go} disabled={s === "bezig"}
      style={{ background: "#1d7a46", color: "#fff", border: "none", padding: "6px 12px", borderRadius: 7, fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
      {s === "bezig" ? "Bezig…" : "Publiceer concept"}
    </button>
  );
}

export function PublishToggle({ slug, gepubliceerd }) {
  const [s, setS] = useState("idle");
  async function go() {
    const msg = gepubliceerd
      ? "Site offline halen? De publieke link werkt daarna niet meer."
      : "Site online zetten? De publieke link wordt dan zichtbaar voor iedereen.";
    if (!confirm(msg)) return;
    setS("bezig");
    try {
      const res = await fetch("/api/publish-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, value: !gepubliceerd }),
      });
      const d = await res.json();
      if (d.ok) location.reload();
      else { alert(d.error || "Mislukt"); setS("idle"); }
    } catch (e) { alert(String(e)); setS("idle"); }
  }
  return (
    <button onClick={go} disabled={s === "bezig"}
      style={{ background: gepubliceerd ? "#fff" : "#1d7a46", color: gepubliceerd ? "#b45309" : "#fff", border: gepubliceerd ? "1px solid #d8dde3" : "none", padding: "6px 12px", borderRadius: 7, fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
      {s === "bezig" ? "Bezig…" : gepubliceerd ? "Offline halen" : "Online zetten"}
    </button>
  );
}

export const STATUS_OPTIES = ["Nieuw", "Gebeld", "Wachten op feedback 1", "Wachten op feedback 2", "Wachten op feedback 3", "Klaar"];

async function bewaarKlant(slug, payload) {
  const res = await fetch("/api/klant/update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug, ...payload }),
  });
  return res.json();
}

// De klantreis als klikbare fasebalk. Klik een fase om die te zetten.
export const FASES = ["Nieuw", "Preview", "Akkoord", "Klant-intake", "Feedback 1", "Feedback 2", "Klaar"];
const OUD_NAAR_NIEUW = {
  "Gebeld": "Preview",
  "Preview klaar": "Preview",
  "Wachten op feedback 1": "Feedback 1",
  "Wachten op feedback 2": "Feedback 2",
  "Wachten op feedback 3": "Feedback 2",
};

export function FaseStepper({ slug, huidige, bedrijf }) {
  const [bezig, setBezig] = useState(false);
  const norm = OUD_NAAR_NIEUW[huidige] || huidige || "Nieuw";
  const idx = Math.max(0, FASES.indexOf(norm));
  async function zet(f) {
    if (f === norm || bezig) return;
    setBezig(true);
    // van + bedrijf meesturen, zodat het logboek weet wat er precies veranderde.
    const d = await bewaarKlant(slug, { pipeline_status: f, van: norm, bedrijf: bedrijf || slug });
    if (d && d.ok) location.reload();
    else setBezig(false);
  }
  return (
    <div style={{ display: "flex", gap: 4, overflowX: "auto", paddingBottom: 2 }}>
      {FASES.map((f, i) => {
        const done = i < idx;
        const cur = i === idx;
        const bg = cur ? "#1A2E40" : done ? "#e1f5ee" : "#f1f5f9";
        const col = cur ? "#fff" : done ? "#0f6e56" : "#94a3b8";
        return (
          <button key={f} onClick={() => zet(f)} disabled={bezig} title={"Zet fase op " + f}
            style={{ flex: "0 0 auto", fontSize: 11.5, fontWeight: cur ? 700 : 600, padding: "6px 10px", borderRadius: 8, border: "none", cursor: "pointer", background: bg, color: col, whiteSpace: "nowrap" }}>
            {f}
          </button>
        );
      })}
    </div>
  );
}

const INZENDING_LABEL = { intake: "Klant-intake", feedback: "Feedback" };

export function InzendingenKnop({ slug }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(null);
  const [laden, setLaden] = useState(false);
  async function toggle() {
    if (open) { setOpen(false); return; }
    setOpen(true);
    if (data === null) {
      setLaden(true);
      try {
        const res = await fetch("/api/klant/inzendingen", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug }),
        });
        const d = await res.json();
        setData(d.ok ? d.inzendingen || [] : []);
      } catch { setData([]); }
      setLaden(false);
    }
  }
  return (
    <div style={{ width: "100%" }}>
      <button onClick={toggle}
        style={{ background: "#fff", border: "1px solid #d8dde3", color: "#1A2E40", padding: "6px 11px", borderRadius: 7, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
        {open ? "Verberg inzendingen" : "Bekijk wat de klant invulde"}
      </button>
      {open && (
        <div style={{ marginTop: 8, background: "#fafbfc", border: "1px solid #e5e7eb", borderRadius: 10, padding: "10px 12px" }}>
          {laden && <div style={{ color: "#888", fontSize: 13 }}>Laden...</div>}
          {!laden && data && data.length === 0 && (
            <div style={{ color: "#888", fontSize: 13 }}>De klant heeft nog niets ingevuld.</div>
          )}
          {!laden && data && data.map((s, i) => (
            <div key={i} style={{ borderTop: i === 0 ? "none" : "1px solid #eef1f4", paddingTop: i === 0 ? 0 : 9, marginTop: i === 0 ? 0 : 9 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: "#1A2E40" }}>
                {INZENDING_LABEL[s.type] || s.type}
                <span style={{ color: "#94a3b8", fontWeight: 500 }}> - {new Date(s.created_at).toLocaleString("nl-NL", { dateStyle: "medium", timeStyle: "short" })}</span>
              </div>
              {Object.entries(s.antwoorden || {}).map(([k, v]) => (
                <div key={k} style={{ fontSize: 13, marginTop: 3, lineHeight: 1.35 }}>
                  <span style={{ color: "#888" }}>{k}:</span> {typeof v === "object" ? JSON.stringify(v) : String(v)}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Contactpersoon bij de klant - wordt de aanhef in het verkoop-appje.
export function Contactpersoon({ slug, value }) {
  const [v, setV] = useState(value || "");
  const [saved, setSaved] = useState(false);
  async function blur() {
    if (v === (value || "")) return;
    const res = await fetch("/api/klant/contactpersoon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, naam: v }),
    });
    const d = await res.json();
    if (d.ok) { setSaved(true); setTimeout(() => setSaved(false), 1200); }
  }
  return (
    <span style={{ whiteSpace: "nowrap" }} title="Voornaam van de klant - wordt de aanhef in het appje">
      <span style={{ color: "#888", fontSize: 12 }}>Contact&nbsp;</span>
      <input value={v} onChange={(e) => setV(e.target.value)} onBlur={blur} placeholder="voornaam"
        style={{ width: 90, padding: "4px 7px", border: "1px solid " + (saved ? "#1d7a46" : "#d8dde3"), borderRadius: 6, fontSize: 13 }} />
    </span>
  );
}

// Het verkoop-appje, kant-en-klaar met naam en de juiste links erin.
function bouwAppje({ contact, bedrijf, slug, afzender, origin, demoGevuld }) {
  const naam = (contact && contact.trim()) || bedrijf || "";
  const previewLink = "https://preview.studiobaris.nl/" + slug + "?review=1";
  // Persoonlijke demo-app: de app in het jasje van deze klant (eigen naam, kleuren,
  // projecten en reviews). Staat die er onverhoopt niet, dan de algemene demo.
  const demoLink = demoGevuld ? "https://demo.studiobaris.nl/" + slug : "https://demo.studiobaris.nl";
  const groet = afzender || "Gerrit";

  return [
    "Hoi " + naam + ",",
    "",
    "Ik kwam je bedrijf tegen en heb direct een cadeautje voor je klaargezet. De meeste goede vakmannen hebben via mond-tot-mondreclame gelukkig werk zat, dus een website om meer klanten te krijgen is vaak helemaal niet nodig.",
    "",
    "Maar je wilt natuurlijk wel dat je online reputatie klopt als mensen je opzoeken, zeker met alle beunhazen van tegenwoordig. Daarom heb ik het werk alvast voor je gedaan: ik heb een gloednieuwe website-opzet voor jouw bedrijf ontworpen.",
    "",
    "Geen gedoe met 's avonds achter een laptop kruipen, want ik lever er een handige app bij: hiermee zet je op de klus in 10 seconden een foto en review live op je nieuwe site. Gewoon vanaf je telefoon. Je site blijft zo moeiteloos actief, waardoor je stijgt in Google en voortaan de mooiste klussen eruit pikt.",
    "",
    "Kijk zelf maar of het ontwerp bij je past, ik heb twee links voor je:",
    "",
    "1. Jouw kant-en-klare website: " + previewLink,
    "(volledig ontworpen voor jouw bedrijf, binnen 1 week live en jouw eigendom)",
    "",
    "2. Jouw eigen app, alvast ingericht: " + demoLink,
    "(wij regelen de hosting, beveiliging en alle updates voor de site en de app)",
    "",
    "Al ergens hosting lopen? Geen probleem, wij helpen je helemaal mee met het gratis omzetten.",
    "",
    "Tot eind augustus loopt er een actie waarbij de inrichting en app-koppeling helemaal gratis zijn (volledig fiscaal aftrekbaar). Binnenkort komt er een update waarmee je ook direct naar social media pusht, vanaf dan wordt het een stuk duurder.",
    "",
    "P.S. Je bent trouwens niet het proefkonijn: al meer dan 50 zzp'ers hebben hun laptop definitief dichtgeklapt en swipen hun projecten nu live vanaf de bouwplaats.",
    "",
    "Lijkt het je wat om jouw nieuwe site te bekijken? Stuur gerust een appje terug. Zo niet, ook even goede vrienden!",
    "",
    "Enfin, een lang verhaal maar met een goed doel.",
    "",
    "Groet, " + groet + " (www.studiobaris.nl)",
  ].join("\n");
}

export function AppjeKnop({ slug, bedrijf, contact, afzender, telefoon, demoGevuld }) {
  const [status, setStatus] = useState("idle");

  function tekst() {
    return bouwAppje({ contact, bedrijf, slug, afzender,
      origin: typeof window !== "undefined" ? window.location.origin : "", demoGevuld });
  }

  async function kopieer() {
    try {
      await navigator.clipboard.writeText(tekst());
      setStatus("gekopieerd");
      setTimeout(() => setStatus("idle"), 1800);
    } catch {
      setStatus("fout");
      setTimeout(() => setStatus("idle"), 1800);
    }
  }

  function openWhatsapp() {
    const nr = String(telefoon || "").replace(/[^0-9]/g, "").replace(/^06/, "316");
    const url = "https://wa.me/" + (nr ? nr : "") + "?text=" + encodeURIComponent(tekst());
    window.open(url, "_blank", "noopener");
  }

  const knop = {
    display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5, padding: "7px 11px",
    borderRadius: 8, border: "1px solid #25D366", background: "#25D366", color: "#fff",
    cursor: "pointer", fontWeight: 700, fontFamily: "inherit", whiteSpace: "nowrap",
  };
  const knop2 = { ...knop, background: "#fff", color: "#0f6e56" };

  return (
    <span style={{ display: "inline-flex", gap: 6 }}>
      <button onClick={openWhatsapp} style={knop} title="Opent WhatsApp met de tekst er al in">
        Appje versturen
      </button>
      <button onClick={kopieer} style={knop2}>
        {status === "gekopieerd" ? "Gekopieerd!" : status === "fout" ? "Kopieren mislukt" : "Tekst kopieren"}
      </button>
    </span>
  );
}

export function KlantNaam({ slug, value }) {
  const [v, setV] = useState(value || "");
  const [saved, setSaved] = useState(false);
  async function blur() {
    if (v === (value || "")) return;
    const d = await bewaarKlant(slug, { verzamelaar: v });
    if (d.ok) { setSaved(true); setTimeout(() => setSaved(false), 1200); }
  }
  return (
    <input value={v} onChange={(e) => setV(e.target.value)} onBlur={blur} placeholder="Naam"
      style={{ width: 120, padding: "4px 7px", border: "1px solid " + (saved ? "#1d7a46" : "#d8dde3"), borderRadius: 6, fontSize: 13 }} />
  );
}

export function KlantStatus({ slug, value }) {
  const [v, setV] = useState(value || "Nieuw");
  async function change(e) {
    const nv = e.target.value; setV(nv);
    await bewaarKlant(slug, { pipeline_status: nv });
  }
  return (
    <select value={v} onChange={change}
      style={{ padding: "5px 7px", border: "1px solid #d8dde3", borderRadius: 6, fontSize: 13, background: "#fff", maxWidth: 150 }}>
      {STATUS_OPTIES.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

export function KlantBedrag({ slug, value }) {
  const [v, setV] = useState(value != null ? String(value) : "");
  const [saved, setSaved] = useState(false);
  async function blur() {
    const d = await bewaarKlant(slug, { maandbedrag: v });
    if (d.ok) { setSaved(true); setTimeout(() => setSaved(false), 1200); }
  }
  return (
    <span style={{ whiteSpace: "nowrap" }}>€&nbsp;
      <input value={v} onChange={(e) => setV(e.target.value)} onBlur={blur} placeholder="0" inputMode="decimal"
        style={{ width: 54, padding: "4px 6px", border: "1px solid " + (saved ? "#1d7a46" : "#d8dde3"), borderRadius: 6, fontSize: 13 }} />
      <span style={{ color: "#888", fontSize: 12 }}> /mnd</span>
    </span>
  );
}

// Eenmalig verkoopbedrag (websiteprijs). Verkoper krijgt hiervan 50%.
export function VerkoopBedrag({ slug, value }) {
  const [v, setV] = useState(value != null ? String(value) : "");
  const [saved, setSaved] = useState(false);
  async function blur() {
    const res = await fetch("/api/klant/verkoopbedrag", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, bedrag: v }),
    });
    const d = await res.json();
    if (d.ok) { setSaved(true); setTimeout(() => setSaved(false), 1200); }
  }
  return (
    <span style={{ whiteSpace: "nowrap" }} title="Eenmalig verkoopbedrag — verkoper krijgt 50%">
      <span style={{ color: "#888", fontSize: 12 }}>Verkoop&nbsp;€</span>
      <input value={v} onChange={(e) => setV(e.target.value)} onBlur={blur} placeholder="0" inputMode="decimal"
        style={{ width: 64, padding: "4px 6px", border: "1px solid " + (saved ? "#1d7a46" : "#d8dde3"), borderRadius: 6, fontSize: 13, marginLeft: 3 }} />
    </span>
  );
}

export function AkkoordLink({ slug }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.origin + "/akkoord/" + slug);
      setCopied(true); setTimeout(() => setCopied(false), 1400);
    } catch {}
  }
  return (
    <button onClick={copy}
      style={{ background: "#fff", border: "1px solid #d8dde3", color: "#1d6fd1", padding: "5px 9px", borderRadius: 6, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}>
      {copied ? "Gekopieerd!" : "Akkoord-link"}
    </button>
  );
}

// Alle deelbare links van een klant op één plek, met kopieer-knoppen.
export function LinkChips({ slug, gepubliceerd, heeftDemo, demoGevuld, magMaken, volledig, heeftRest, restBetaald, stijl }) {
  const [copied, setCopied] = useState("");
  const [demoBezig, setDemoBezig] = useState(false);
  const [open, setOpen] = useState(false);

  const PREVIEW = "https://preview.studiobaris.nl";
  const DEMO = "https://demo.studiobaris.nl";

  // Alle links van deze klant, op één plek. Elke link is te kopiëren én te openen.
  const links = [
    { key: "w", naam: "Website", url: PREVIEW + "/" + slug, uit: !gepubliceerd, hint: gepubliceerd ? "De live website" : "Nog offline - eerst publiceren" },
    { key: "p", naam: "Preview", url: PREVIEW + "/" + slug + "?review=1", hint: "Stuur dit naar de klant" },
    { key: "d", naam: "Demo-app", url: DEMO + "/" + slug, uit: !heeftDemo, leeg: heeftDemo && !demoGevuld, hint: !heeftDemo ? "Nog niet gemaakt" : demoGevuld ? "De app in zijn eigen jasje" : "Let op: leeg (geen foto's in de preview)" },
    { key: "i", naam: "Klant-intake", url: PREVIEW + "/intake/" + slug, verborgen: !volledig, hint: "Stuur dit na akkoord" },
    { key: "f", naam: "Feedback", url: PREVIEW + "/feedback/" + slug, verborgen: !volledig, hint: "Voor feedbackronde 1 en 2" },
    { key: "b", naam: "Betaallink", url: PREVIEW + "/akkoord/" + slug, hint: "Helft vooraf + maandelijkse incasso" },
    {
      key: "r",
      naam: restBetaald ? "Restbedrag (voldaan)" : "Restbetaling",
      url: PREVIEW + "/restbetaling/" + slug,
      uit: !heeftRest,
      hint: !heeftRest
        ? "Vul eerst een verkoopbedrag in"
        : restBetaald
          ? "Het restbedrag is al betaald"
          : "De tweede helft, te sturen bij oplevering",
    },
  ].filter((l) => !l.verborgen);

  function copy(url, key) {
    try {
      navigator.clipboard.writeText(url);
      setCopied(key);
      setTimeout(() => setCopied(""), 1600);
    } catch {}
  }

  async function maakDemo() {
    setDemoBezig(true);
    try {
      const res = await fetch("/api/klant/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const j = await res.json();
      if (j.ok) { window.location.reload(); return; }
      alert(j.error || "Demo-app maken mislukt.");
    } catch (e) {
      alert("Demo-app maken mislukt.");
    }
    setDemoBezig(false);
  }

  const chip = {
    display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5, padding: "7px 11px",
    borderRadius: 8, border: "1px solid #d8dde3", background: "#fff", color: "#334155",
    cursor: "pointer", textDecoration: "none", whiteSpace: "nowrap", fontFamily: "inherit",
  };

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
        <button onClick={() => setOpen(!open)} style={{ ...chip, borderColor: "#1A2E40", color: "#1A2E40", fontWeight: 700 }}>
          {open ? "Links verbergen" : "Alle links"}
        </button>
        <a href={`/vergelijk/${slug}`} style={{ ...chip, borderColor: "#7c3aed", color: "#6d28d9", background: "#faf5ff" }}>
          Stijl kiezen{stijl ? ` (${stijl})` : ""}
        </a>

        {links.map((l) => (
          <button
            key={l.key}
            onClick={() => !l.uit && copy(l.url, l.key)}
            disabled={l.uit}
            title={l.hint + (l.uit ? "" : "\n" + l.url)}
            style={{
              ...chip,
              borderColor: l.uit ? "#e5e7eb" : l.key === "r" && restBetaald ? "#a7f3d0" : l.key === "d" ? (l.leeg ? "#d8dde3" : "#FF8300") : "#d8dde3",
              color: l.uit ? "#cbd5e1" : l.key === "r" && restBetaald ? "#065f46" : l.key === "d" && !l.leeg ? "#a35400" : "#334155",
              background: copied === l.key ? "#ecfdf5" : l.key === "r" && restBetaald ? "#ecfdf5" : l.key === "d" && !l.leeg && !l.uit ? "#fff7ed" : "#fff",
              cursor: l.uit ? "not-allowed" : "pointer",
            }}
          >
            {copied === l.key ? "Gekopieerd ✓" : l.naam + (l.uit ? " (nvt)" : l.leeg ? " (leeg)" : "")}
          </button>
        ))}

        {!heeftDemo && magMaken && (
          <button onClick={maakDemo} disabled={demoBezig} style={{ ...chip, borderColor: "#FF8300", color: "#a35400" }}>
            {demoBezig ? "Demo-app maken…" : "+ Demo-app maken"}
          </button>
        )}
      </div>

      {/* Uitgeklapt: de volledige links, zichtbaar en los te kopiëren. */}
      {open && (
        <div style={{ marginTop: 10, background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 10, padding: "10px 12px", display: "grid", gap: 8 }}>
          {links.map((l) => (
            <div key={l.key} style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#1A2E40", minWidth: 92 }}>{l.naam}</span>
              <input
                readOnly
                value={l.uit ? "—" : l.url}
                onFocus={(e) => e.target.select()}
                style={{ flex: "1 1 260px", minWidth: 0, fontSize: 12.5, padding: "6px 8px", border: "1px solid #d8dde3", borderRadius: 7, background: "#fff", color: l.uit ? "#cbd5e1" : "#334155", fontFamily: "inherit" }}
              />
              <button onClick={() => !l.uit && copy(l.url, "x" + l.key)} disabled={l.uit} style={{ ...chip, padding: "6px 10px", cursor: l.uit ? "not-allowed" : "pointer" }}>
                {copied === "x" + l.key ? "✓" : "Kopieer"}
              </button>
              {!l.uit && (
                <a href={l.url} target="_blank" rel="noreferrer" style={{ ...chip, padding: "6px 10px" }}>Open ↗</a>
              )}
            </div>
          ))}
          <p style={{ fontSize: 11.5, color: "#94a3b8", margin: 0 }}>
            Tip: de knop &quot;Appje versturen&quot; zet de preview- en demo-link al kant-en-klaar in een WhatsApp-bericht.
          </p>
        </div>
      )}
    </div>
  );
}

export function VerwijderKnop({ slug, naam }) {
  const [s, setS] = useState("idle");
  async function go() {
    if (!confirm(`Klant "${naam || slug}" definitief verwijderen?\n\nDit verwijdert de preview én alle inzendingen. Dit kan niet ongedaan gemaakt worden.`)) return;
    setS("bezig");
    try {
      const res = await fetch("/api/klant/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const d = await res.json();
      if (d.ok) location.reload();
      else { alert(d.error || "Verwijderen mislukt"); setS("idle"); }
    } catch (e) { alert(String(e)); setS("idle"); }
  }
  return (
    <button onClick={go} disabled={s === "bezig"}
      style={{ background: "#fff", color: "#c0392b", border: "1px solid #e3b9b4", padding: "5px 10px", borderRadius: 6, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}>
      {s === "bezig" ? "Bezig…" : "Verwijderen"}
    </button>
  );
}

export function GegevensEditor({ slug, data = {} }) {
  const [open, setOpen] = useState(false);
  const [s, setS] = useState("idle");
  const [v, setV] = useState({
    slogan: data.b_slogan || "",
    telefoon: data.b_telefoon || "",
    whatsapp: data.b_whatsapp || "",
    email: data.b_email || "",
    adres: data.b_adres || "",
    kvk: data.b_kvk || "",
    btw: data.b_btw || "",
  });
  const set = (k, val) => setV({ ...v, [k]: val });

  async function save() {
    setS("bezig");
    try {
      const res = await fetch("/api/klant/gegevens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, ...v }),
      });
      const d = await res.json();
      if (d.ok) location.reload();
      else { alert(d.error || "Opslaan mislukt"); setS("idle"); }
    } catch (e) { alert(String(e)); setS("idle"); }
  }

  const inp = { width: "100%", padding: "5px 7px", border: "1px solid #d8dde3", borderRadius: 6, fontSize: 13, marginTop: 2 };
  const lab = { fontSize: 11, color: "#666", fontWeight: 600, display: "block", marginTop: 7 };
  const velden = [["slogan", "Slogan"], ["telefoon", "Telefoon"], ["whatsapp", "WhatsApp (intl. nr.)"], ["email", "E-mail"], ["adres", "Adres"], ["kvk", "KvK"], ["btw", "BTW"]];

  return (
    <div style={{ marginTop: 8 }}>
      <button onClick={() => setOpen(!open)}
        style={{ background: "#fff", border: "1px solid #d8dde3", color: "#1d6fd1", padding: "5px 9px", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>
        {open ? "Sluiten" : "Gegevens bewerken"}
      </button>
      {open && (
        <div style={{ marginTop: 8, background: "#fafbfc", border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 12px", width: 230 }}>
          {velden.map(([k, label]) => (
            <label key={k} style={lab}>{label}
              <input style={inp} value={v[k]} onChange={(e) => set(k, e.target.value)} />
            </label>
          ))}
          <button onClick={save} disabled={s === "bezig"}
            style={{ marginTop: 10, background: "#1d7a46", color: "#fff", border: "none", padding: "7px 14px", borderRadius: 7, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
            {s === "bezig" ? "Opslaan…" : "Opslaan"}
          </button>
        </div>
      )}
    </div>
  );
}

// De inloglink naar de app van deze klant. Handig als hij 'm kwijt is.
export function AppLinkKnop({ bedrijf }) {
  const [bezig, setBezig] = useState(false);
  const [url, setUrl] = useState("");
  const [fout, setFout] = useState("");
  const [copied, setCopied] = useState(false);

  async function haal() {
    setBezig(true); setFout(""); setUrl("");
    try {
      const res = await fetch("/api/klant/applink", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bedrijf }),
      });
      const j = await res.json();
      if (j.ok) setUrl(j.url);
      else setFout(j.error || "Lukt niet.");
    } catch {
      setFout("Lukt niet.");
    }
    setBezig(false);
  }

  const chip = {
    display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5, padding: "7px 11px",
    borderRadius: 8, border: "1px solid #d8dde3", background: "#fff", color: "#334155",
    cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit",
  };

  if (url) {
    return (
      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", width: "100%" }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#1A2E40" }}>App-inlog</span>
        <input readOnly value={url} onFocus={(e) => e.target.select()}
          style={{ flex: "1 1 240px", minWidth: 0, fontSize: 12.5, padding: "6px 8px", border: "1px solid #d8dde3", borderRadius: 7, fontFamily: "inherit", color: "#334155" }} />
        <button onClick={() => { try { navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch {} }}
          style={{ ...chip, background: copied ? "#ecfdf5" : "#fff" }}>
          {copied ? "Gekopieerd ✓" : "Kopieer"}
        </button>
        <span style={{ fontSize: 11.5, color: "#94a3b8" }}>14 dagen geldig</span>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <button onClick={haal} disabled={bezig} style={chip}>
        {bezig ? "Bezig…" : "App-inloglink maken"}
      </button>
      {fout && <span style={{ fontSize: 12, color: "#b45309" }}>{fout}</span>}
    </div>
  );
}
