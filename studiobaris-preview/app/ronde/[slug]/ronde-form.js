"use client";

import { useState } from "react";
import { PAGINAS } from "../../../lib/ronde";

// Stap voor stap door de website: één pagina per scherm, twee grote knoppen.
// Gemaakt voor mensen die niet graag met computers werken: weinig tekst,
// grote knoppen, en altijd de uitweg "bel of app ons".

const NAVY = "#1A2B3D";
const CREME = "#F7F4EE";
const GOUD = "#C79A56";
const TEL = "06 16 73 21 05";
const WA = "https://wa.me/31616732105";

const pagina = { minHeight: "100vh", background: CREME, fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", color: NAVY };
const binnen = { maxWidth: 560, margin: "0 auto", padding: "28px 20px 40px" };
const grootKnop = {
  display: "block", width: "100%", padding: "18px 20px", borderRadius: 999, border: "none",
  fontSize: 18, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", textAlign: "center", textDecoration: "none",
};
const navyKnop = { ...grootKnop, background: NAVY, color: "#fff" };
const goudKnop = { ...grootKnop, background: GOUD, color: NAVY };
const lichtKnop = { ...grootKnop, background: "#fff", color: NAVY, border: `2px solid ${NAVY}` };

function Hulp() {
  return (
    <p style={{ fontSize: 15, color: "#4A5560", lineHeight: 1.6, marginTop: 28, textAlign: "center" }}>
      Lukt het niet? Bel of app ons:{" "}
      <a href="tel:+31616732105" style={{ color: NAVY, fontWeight: 700 }}>{TEL}</a>
    </p>
  );
}

export default function RondeForm({ slug, ronde, site, bedrijf }) {
  const [stap, setStap] = useState(-1); // -1 = uitleg, 0..n-1 = pagina's, n = slot
  const [keuze, setKeuze] = useState({}); // id -> "goed" | "anders"
  const [tekst, setTekst] = useState({}); // id -> tekst
  const [overig, setOverig] = useState("");
  const [status, setStatus] = useState("idle");
  const [fout, setFout] = useState("");

  const n = PAGINAS.length;
  const basis = site ? "https://" + site : "";

  async function verstuur() {
    setStatus("bezig"); setFout("");
    const antwoorden = {};
    for (const p of PAGINAS) {
      antwoorden[p.titel] = keuze[p.id] === "anders" ? (tekst[p.id] || "").trim() || "Wil iets anders (niets ingevuld)" : "Goed";
    }
    if (overig.trim()) antwoorden["Nog iets anders"] = overig.trim();
    try {
      const res = await fetch("/api/ronde", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, ronde, site, antwoorden }),
      });
      const d = await res.json();
      if (!d.ok) { setFout(d.error || "Versturen lukte niet."); setStatus("fout"); return; }
      setStatus("klaar");
    } catch {
      setFout("Versturen lukte niet."); setStatus("fout");
    }
  }

  // --- Klaar -------------------------------------------------------------------
  if (status === "klaar") {
    const allesGoed = PAGINAS.every((p) => keuze[p.id] === "goed") && !overig.trim();
    return (
      <main style={pagina}>
        <div style={{ ...binnen, textAlign: "center", paddingTop: "14vh" }}>
          <div style={{ fontSize: 52 }}>{allesGoed ? "🎉" : "👍"}</div>
          <h1 style={{ fontSize: 28, margin: "10px 0" }}>Bedankt!</h1>
          <p style={{ fontSize: 18, lineHeight: 1.6, color: "#4A5560" }}>
            {allesGoed
              ? "Fijn dat alles goed is. We nemen contact met je op om je website live te zetten."
              : "We gaan ermee aan de slag. Zodra het klaar is, sturen we je een appje."}
          </p>
          <p style={{ fontSize: 16, lineHeight: 1.6, color: "#4A5560", marginTop: 18 }}>
            Iets vergeten, of wil je een foto sturen? App het ons gewoon.
          </p>
          <a href={WA} style={{ ...goudKnop, marginTop: 18 }}>App ons</a>
        </div>
      </main>
    );
  }

  // --- Uitleg ------------------------------------------------------------------
  if (stap === -1) {
    return (
      <main style={pagina}>
        <div style={binnen}>
          <p style={{ fontSize: 13, letterSpacing: 2, textTransform: "uppercase", color: "#7E5F28", fontWeight: 700 }}>
            StudioBaris · Ronde {ronde} van 2
          </p>
          <h1 style={{ fontSize: 30, margin: "8px 0 14px", lineHeight: 1.2 }}>Je website bekijken{bedrijf ? ` – ${bedrijf}` : ""}</h1>
          <p style={{ fontSize: 18, lineHeight: 1.6 }}>
            We lopen samen je website door, pagina voor pagina. Je bekijkt een pagina en tikt daarna op:
          </p>
          <ul style={{ fontSize: 18, lineHeight: 1.8, paddingLeft: 22 }}>
            <li><strong>Ziet er goed uit</strong>, of</li>
            <li><strong>Dit wil ik anders</strong>, en dan schrijf je kort wat.</li>
          </ul>
          <p style={{ fontSize: 17, lineHeight: 1.6, color: "#4A5560" }}>
            {ronde === 1
              ? "Je hebt twee rondes. Zet daarom alles wat je wilt veranderen nu bij elkaar."
              : "Dit is je tweede en laatste ronde."}{" "}
            Het duurt een paar minuten.
          </p>
          <button type="button" onClick={() => setStap(0)} style={{ ...goudKnop, marginTop: 24 }}>Beginnen</button>
          <Hulp />
        </div>
      </main>
    );
  }

  // --- Slot --------------------------------------------------------------------
  if (stap === n) {
    return (
      <main style={pagina}>
        <div style={binnen}>
          <p style={{ fontSize: 14, fontWeight: 700, color: "#7E5F28" }}>Laatste stap</p>
          <h1 style={{ fontSize: 26, margin: "6px 0 14px" }}>Nog iets anders?</h1>
          <p style={{ fontSize: 17, lineHeight: 1.6, color: "#4A5560" }}>Iets wat nergens anders bij paste? Schrijf het hier. Niets? Dan tik je gewoon op Versturen.</p>
          <textarea value={overig} onChange={(e) => setOverig(e.target.value)} rows={5}
            placeholder="Bijvoorbeeld: de kleur van de knoppen mag wat donkerder"
            style={{ width: "100%", boxSizing: "border-box", padding: 14, fontSize: 17, borderRadius: 14, border: "1px solid #D8D2C4", fontFamily: "inherit", marginTop: 8 }} />
          <button type="button" onClick={verstuur} disabled={status === "bezig"} style={{ ...goudKnop, marginTop: 20, opacity: status === "bezig" ? 0.6 : 1 }}>
            {status === "bezig" ? "Bezig met versturen…" : "Versturen"}
          </button>
          {fout && <p style={{ color: "#9E3B2E", fontSize: 16, marginTop: 12 }}>{fout} Bel of app ons op {TEL}.</p>}
          <button type="button" onClick={() => setStap(n - 1)} style={{ ...lichtKnop, marginTop: 12 }}>Terug</button>
          <Hulp />
        </div>
      </main>
    );
  }

  // --- Een pagina van de site ---------------------------------------------------
  const p = PAGINAS[stap];
  const k = keuze[p.id];
  const verder = k === "goed" || (k === "anders" && (tekst[p.id] || "").trim());

  return (
    <main style={pagina}>
      <div style={binnen}>
        <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
          {PAGINAS.map((x, i) => (
            <div key={x.id} style={{ flex: 1, height: 6, borderRadius: 3, background: i <= stap ? GOUD : "#E3DED3" }} />
          ))}
        </div>
        <p style={{ fontSize: 14, fontWeight: 700, color: "#7E5F28" }}>Pagina {stap + 1} van {n}</p>
        <h1 style={{ fontSize: 30, margin: "4px 0 10px" }}>{p.titel}</h1>
        <p style={{ fontSize: 17, lineHeight: 1.6, color: "#4A5560" }}>{p.uitleg}</p>

        {basis ? (
          <a href={basis + p.pad} target="_blank" rel="noreferrer" style={{ ...navyKnop, marginTop: 16 }}>
            Bekijk de pagina {p.titel} ↗
          </a>
        ) : (
          <p style={{ fontSize: 16, color: "#4A5560" }}>Open je website en ga naar de pagina &quot;{p.titel}&quot;.</p>
        )}
        <p style={{ fontSize: 14, color: "#6F7A85", textAlign: "center", margin: "8px 0 0" }}>Daarna kom je hier terug.</p>

        <div style={{ display: "grid", gap: 12, marginTop: 24 }}>
          <button type="button" onClick={() => setKeuze({ ...keuze, [p.id]: "goed" })}
            style={k === "goed" ? { ...navyKnop } : { ...lichtKnop }}>
            👍 Ziet er goed uit
          </button>
          <button type="button" onClick={() => setKeuze({ ...keuze, [p.id]: "anders" })}
            style={k === "anders" ? { ...navyKnop } : { ...lichtKnop }}>
            ✏️ Dit wil ik anders
          </button>
        </div>

        {k === "anders" && (
          <div style={{ marginTop: 16 }}>
            <label style={{ fontSize: 17, fontWeight: 700 }}>Wat moet er anders?</label>
            <p style={{ fontSize: 15, color: "#4A5560", margin: "4px 0 8px" }}>Schrijf het zoals je het zou zeggen. Een foto? Die kun je ons appen.</p>
            <textarea value={tekst[p.id] || ""} onChange={(e) => setTekst({ ...tekst, [p.id]: e.target.value })} rows={5} autoFocus
              placeholder="Bijvoorbeeld: mijn telefoonnummer klopt niet, het is 06…"
              style={{ width: "100%", boxSizing: "border-box", padding: 14, fontSize: 17, borderRadius: 14, border: "1px solid #D8D2C4", fontFamily: "inherit" }} />
          </div>
        )}

        <button type="button" disabled={!verder} onClick={() => setStap(stap + 1)}
          style={{ ...goudKnop, marginTop: 24, opacity: verder ? 1 : 0.45, cursor: verder ? "pointer" : "default" }}>
          Volgende
        </button>
        <button type="button" onClick={() => setStap(stap - 1)} style={{ ...lichtKnop, marginTop: 12 }}>Terug</button>
        <Hulp />
      </div>
    </main>
  );
}
