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

export function FaseStepper({ slug, huidige }) {
  const [bezig, setBezig] = useState(false);
  const norm = OUD_NAAR_NIEUW[huidige] || huidige || "Nieuw";
  const idx = Math.max(0, FASES.indexOf(norm));
  async function zet(f) {
    if (f === norm || bezig) return;
    setBezig(true);
    const d = await bewaarKlant(slug, { pipeline_status: f });
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
export function LinkChips({ slug, gepubliceerd, heeftDemo, demoGevuld, magMaken, volledig }) {
  const [copied, setCopied] = useState("");
  const [demoBezig, setDemoBezig] = useState(false);

  // Voor previews van voor deze functie, of om de demo bij te werken na een wijziging.
  async function maakDemo() {
    setDemoBezig(true);
    try {
      const res = await fetch("/api/klant/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const j = await res.json();
      if (j.ok) {
        window.location.reload();
        return;
      }
      alert(j.error || "Demo-app maken mislukt.");
    } catch (e) {
      alert("Demo-app maken mislukt.");
    }
    setDemoBezig(false);
  }

  function copy(path, key) {
    try {
      navigator.clipboard.writeText(window.location.origin + path);
      setCopied(key); setTimeout(() => setCopied(""), 1400);
    } catch {}
  }
  const chip = {
    display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5, padding: "7px 11px",
    borderRadius: 8, border: "1px solid #d8dde3", background: "#fff", color: "#334155",
    cursor: "pointer", textDecoration: "none", whiteSpace: "nowrap", fontFamily: "inherit",
  };
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      <a href={`/${slug}`} target="_blank" rel="noreferrer" style={chip}>
        {gepubliceerd ? "Website ↗" : "Website (offline)"}
      </a>
      <a href={`/${slug}?review=1`} target="_blank" rel="noreferrer" style={chip}>Preview ↗</a>
      {heeftDemo ? (
        <a
          href={`https://demo.studiobaris.nl/${slug}`}
          target="_blank"
          rel="noreferrer"
          title={demoGevuld ? "De app in het jasje van deze klant" : "Let op: deze preview heeft geen projecten of reviews, dus de demo is leeg"}
          style={{
            ...chip,
            borderColor: demoGevuld ? "#FF8300" : "#d8dde3",
            color: demoGevuld ? "#a35400" : "#94a3b8",
            background: demoGevuld ? "#fff7ed" : "#fff",
          }}
        >
          {demoGevuld ? "Demo-app ↗" : "Demo-app (leeg) ↗"}
        </a>
      ) : magMaken ? (
        <button
          onClick={maakDemo}
          disabled={demoBezig}
          style={{ ...chip, borderColor: "#FF8300", color: "#a35400" }}
        >
          {demoBezig ? "Demo-app maken…" : "Demo-app maken"}
        </button>
      ) : null}
      {volledig && (
        <>
          <button onClick={() => copy(`/intake/${slug}`, "i")} style={chip}>
            {copied === "i" ? "Intake gekopieerd ✓" : "Intake kopiëren"}
          </button>
          <button onClick={() => copy(`/feedback/${slug}`, "f")} style={chip}>
            {copied === "f" ? "Feedback gekopieerd ✓" : "Feedback kopiëren"}
          </button>
          <button onClick={() => copy(`/akkoord/${slug}`, "b")} style={chip}>
            {copied === "b" ? "Betaallink gekopieerd ✓" : "Betaallink kopiëren"}
          </button>
        </>
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
