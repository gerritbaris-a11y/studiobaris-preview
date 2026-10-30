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
  // Ronde 3 = laatste controle: geen wijzigingsronde meer, alleen nog
  // bekijken en akkoord geven om live te gaan.
  const eind = ronde === 3;

  async function verstuur() {
    setStatus("bezig"); setFout("");
    const antwoorden = {};
    if (eind) {
      antwoorden["Akkoord"] = "Ja, zet de website live";
    } else {
      for (const p of PAGINAS) {
        antwoorden[p.titel] = keuze[p.id] === "anders" ? (tekst[p.id] || "").trim() || "Wil iets anders (niets ingevuld)" : "Goed";
      }
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
    const allesGoed = eind || (PAGINAS.every((p) => keuze[p.id] === "goed") && !overig.trim());
    return (
      <main style={pagina}>
        <div style={{ ...binnen, textAlign: "center", paddingTop: "14vh" }}>
          <div style={{ fontSize: 52 }}>{allesGoed ? "🎉" : "👍"}</div>
          <h1 style={{ fontSize: 28, margin: "10px 0" }}>Bedankt!</h1>
          <p style={{ fontSize: 18, lineHeight: 1.6, color: "#4A5560" }}>
            {eind
              ? "Je hebt akkoord gegeven. We zetten je website live en sturen je de mail met je app en alles op een rij."
              : allesGoed
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
            StudioBaris · {eind ? "Laatste controle" : `Ronde ${ronde} van 2`}
          </p>
          <h1 style={{ fontSize: 30, margin: "8px 0 14px", lineHeight: 1.2 }}>Je website bekijken{bedrijf ? ` – ${bedrijf}` : ""}</h1>
          {eind ? (
            <>
              <p style={{ fontSize: 18, lineHeight: 1.6 }}>
                Al je wijzigingen zijn verwerkt. Loop je website nog één keer door, pagina voor pagina. Tik steeds op <strong>Volgende</strong>.
              </p>
              <p style={{ fontSize: 17, lineHeight: 1.6, color: "#4A5560" }}>
                Klopt alles? Dan geef je aan het eind akkoord en zetten wij je website live. Daarna krijg je een mail met je app en alles op een rij.
              </p>
            </>
          ) : (
            <>
              <p style={{ fontSize: 18, lineHeight: 1.6 }}>
                We lopen samen je website door, pagina voor pagina. Je ziet steeds één pagina van je website, met onderaan twee knoppen:
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
            </>
          )}
          <button type="button" onClick={() => setStap(0)} style={{ ...goudKnop, marginTop: 24 }}>Beginnen</button>
          <Hulp />
        </div>
      </main>
    );
  }

  // --- Slot --------------------------------------------------------------------
  if (stap === n && eind) {
    return (
      <main style={pagina}>
        <div style={binnen}>
          <p style={{ fontSize: 14, fontWeight: 700, color: "#7E5F28" }}>Laatste stap</p>
          <h1 style={{ fontSize: 26, margin: "6px 0 14px" }}>Is alles goed?</h1>
          <p style={{ fontSize: 17, lineHeight: 1.6, color: "#4A5560" }}>
            Tik op de knop hieronder, dan zetten wij je website live. Je krijgt daarna een mail met je app, je inloglink en alles op een rij.
          </p>
          <button type="button" onClick={verstuur} disabled={status === "bezig"} style={{ ...goudKnop, marginTop: 20, opacity: status === "bezig" ? 0.6 : 1 }}>
            {status === "bezig" ? "Bezig…" : "Akkoord, zet mijn website live"}
          </button>
          {fout && <p style={{ color: "#9E3B2E", fontSize: 16, marginTop: 12 }}>{fout} Bel of app ons op {TEL}.</p>}
          <p style={{ fontSize: 16, lineHeight: 1.6, color: "#4A5560", marginTop: 20, textAlign: "center" }}>
            Klopt er toch iets niet? Geef dan nog geen akkoord, maar bel of app ons even:{" "}
            <a href="tel:+31616732105" style={{ color: NAVY, fontWeight: 700 }}>{TEL}</a>
          </p>
          <button type="button" onClick={() => setStap(n - 1)} style={{ ...lichtKnop, marginTop: 12 }}>Terug</button>
        </div>
      </main>
    );
  }

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
  // De pagina staat ín het formulier (kader), zodat de klant niet weg hoeft
  // en terug moet komen. Onderaan altijd dezelfde twee knoppen.
  const p = PAGINAS[stap];
  const k = keuze[p.id];
  const url = basis ? basis + p.pad : "";

  function goed() {
    setKeuze({ ...keuze, [p.id]: "goed" });
    setStap(stap + 1);
  }

  return (
    <main style={{ ...pagina, height: "100dvh", minHeight: 0, display: "flex", flexDirection: "column" }}>
      {/* Kop: waar ben je */}
      <div style={{ padding: "10px 14px 8px", background: "#fff", borderBottom: "1px solid #E3DED3", flex: "0 0 auto" }}>
        <div style={{ display: "flex", gap: 5, marginBottom: 8 }}>
          {PAGINAS.map((x, i) => (
            <div key={x.id} style={{ flex: 1, height: 5, borderRadius: 3, background: i <= stap ? GOUD : "#E3DED3" }} />
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <button type="button" onClick={() => setStap(stap - 1)}
            style={{ background: "none", border: "none", fontSize: 16, fontWeight: 700, color: NAVY, padding: "4px 0", cursor: "pointer", fontFamily: "inherit" }}>
            ‹ Terug
          </button>
          <div style={{ textAlign: "center", flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{p.titel}</div>
            <div style={{ fontSize: 13, color: "#6F7A85" }}>Pagina {stap + 1} van {n}</div>
          </div>
          <span style={{ width: 52 }} />
        </div>
        <p style={{ fontSize: 14, color: "#4A5560", margin: "6px 0 0", textAlign: "center", lineHeight: 1.4 }}>
          {p.uitleg} Scroll in de pagina hieronder.
        </p>
      </div>

      {/* De pagina zelf */}
      <div style={{ flex: "1 1 auto", minHeight: 0, background: "#fff", position: "relative" }}>
        {url ? (
          <iframe key={url} src={url} title={p.titel} style={{ width: "100%", height: "100%", border: "none", display: "block" }} />
        ) : (
          <p style={{ padding: 20, fontSize: 16, color: "#4A5560" }}>Open je website en ga naar de pagina &quot;{p.titel}&quot;.</p>
        )}
      </div>

      {/* Onderbalk: altijd in beeld */}
      <div style={{ flex: "0 0 auto", background: "#fff", borderTop: "1px solid #E3DED3", padding: "12px 14px calc(12px + env(safe-area-inset-bottom))", boxShadow: "0 -4px 16px rgba(26,43,61,0.08)" }}>
        {eind ? (
          <>
            <button type="button" onClick={() => setStap(stap + 1)} style={{ ...navyKnop, padding: "16px 8px", fontSize: 16 }}>
              {stap === n - 1 ? "Naar akkoord" : "Volgende pagina"}
            </button>
            <p style={{ fontSize: 13, color: "#6F7A85", textAlign: "center", margin: "8px 0 0" }}>
              Klopt er iets niet? Bel of app ons: <a href="tel:+31616732105" style={{ color: NAVY, fontWeight: 700 }}>{TEL}</a>
            </p>
          </>
        ) : k === "anders" ? (
          <>
            <label style={{ fontSize: 16, fontWeight: 700 }}>Wat moet er anders op {p.titel}?</label>
            <textarea value={tekst[p.id] || ""} onChange={(e) => setTekst({ ...tekst, [p.id]: e.target.value })} rows={3} autoFocus
              placeholder="Schrijf het zoals je het zou zeggen. Bijvoorbeeld: mijn telefoonnummer klopt niet"
              style={{ width: "100%", boxSizing: "border-box", padding: 12, fontSize: 16, borderRadius: 12, border: "1px solid #D8D2C4", fontFamily: "inherit", marginTop: 6 }} />
            <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
              <button type="button" onClick={() => setKeuze({ ...keuze, [p.id]: undefined })} style={{ ...lichtKnop, padding: "14px 10px", fontSize: 16, flex: "0 0 32%" }}>Annuleer</button>
              <button type="button" disabled={!(tekst[p.id] || "").trim()} onClick={() => setStap(stap + 1)}
                style={{ ...goudKnop, padding: "14px 10px", fontSize: 16, opacity: (tekst[p.id] || "").trim() ? 1 : 0.45 }}>
                Volgende pagina
              </button>
            </div>
          </>
        ) : (
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" onClick={() => setKeuze({ ...keuze, [p.id]: "anders" })} style={{ ...lichtKnop, padding: "16px 8px", fontSize: 16 }}>
              ✏️ Dit wil ik anders
            </button>
            <button type="button" onClick={goed} style={{ ...navyKnop, padding: "16px 8px", fontSize: 16 }}>
              👍 Ziet er goed uit
            </button>
          </div>
        )}
        {url && (
          <a href={url} target="_blank" rel="noreferrer" style={{ display: "block", textAlign: "center", fontSize: 13, color: "#6F7A85", marginTop: 8 }}>
            Zie je de pagina niet? Tik hier om hem los te openen.
          </a>
        )}
      </div>
    </main>
  );
}
