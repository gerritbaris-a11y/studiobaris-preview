"use client";

import { useMemo, useState } from "react";

const STATUS_LABELS = {
  nieuw: "Nieuw",
  opgepakt: "Opgepakt",
  benaderd: "Benaderd",
  preview: "Preview",
  klant: "Klant",
  afgewezen: "Afgewezen",
};
const STATUS_KLEUR = {
  nieuw: "#64748b",
  opgepakt: "#b45309",
  benaderd: "#2563eb",
  preview: "#7c3aed",
  klant: "#1d7a46",
  afgewezen: "#b91c1c",
};
const POTENTIE_KLEUR = {
  "Erg hoog": "#1d7a46",
  Hoog: "#3f9142",
  Gemiddeld: "#b45309",
  Laag: "#94a3b8",
  "Erg laag": "#cbd5e1",
};

const FASE_PILLS = ["nieuw", "opgepakt", "benaderd", "preview"];
const DONE = ["klant", "afgewezen"];
const PER_KEER = 10;

const sel = { padding: "10px 10px", fontSize: 14, border: "1px solid #d1d5db", borderRadius: 9, background: "#fff", fontFamily: "inherit", width: "100%", boxSizing: "border-box" };
const card = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 9 };

function uniek(arr) {
  return Array.from(new Set(arr.filter(Boolean))).sort();
}

export default function LeadsClient({ leads: initieel, team, mij }) {
  const [leads, setLeads] = useState(initieel || []);
  const [tab, setTab] = useState("werk");
  const [zoek, setZoek] = useState("");
  const [fProvincie, setFProvincie] = useState("");
  const [fVak, setFVak] = useState("");
  const [fPotentie, setFPotentie] = useState("");
  const [fWie, setFWie] = useState("alles"); // alles | mij | vrij
  const [limiet, setLimiet] = useState(PER_KEER);
  const [bezigId, setBezigId] = useState("");

  const provincies = useMemo(() => uniek(leads.map((l) => l.provincie)), [leads]);
  const vakken = useMemo(() => uniek(leads.map((l) => l.vakgebied)), [leads]);
  const potenties = ["Erg hoog", "Hoog", "Gemiddeld", "Laag", "Erg laag"];

  function matcht(l) {
    const q = zoek.trim().toLowerCase();
    if (fProvincie && l.provincie !== fProvincie) return false;
    if (fVak && l.vakgebied !== fVak) return false;
    if (fPotentie && l.potentie !== fPotentie) return false;
    if (fWie === "mij" && l.owner !== mij) return false;
    if (fWie === "vrij" && l.owner) return false;
    if (q) {
      const hay = [l.bedrijfsnaam, l.plaats, l.vakgebied, l.email, l.telefoon].join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  }

  // Zuid-Holland eerst, daarna op score.
  function sorteer(list) {
    return [...list].sort((a, b) => {
      const za = a.provincie === "Zuid-Holland" ? 0 : 1;
      const zb = b.provincie === "Zuid-Holland" ? 0 : 1;
      if (za !== zb) return za - zb;
      return (Number(b.score) || 0) - (Number(a.score) || 0);
    });
  }

  const gefilterd = leads.filter(matcht);
  const actief = sorteer(gefilterd.filter((l) => !DONE.includes(l.status || "nieuw")));
  const afgerond = sorteer(gefilterd.filter((l) => DONE.includes(l.status)));
  const lijst = tab === "werk" ? actief.slice(0, limiet) : afgerond;

  async function patch(id, fields) {
    setBezigId(id);
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...fields } : l)));
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...fields }),
      });
    } catch {}
    setBezigId("");
  }

  function pakOp(l) {
    patch(l.id, { owner: mij || "", status: (l.status || "nieuw") === "nieuw" ? "opgepakt" : l.status });
  }

  const tabBtn = (key, label, n) => (
    <button onClick={() => setTab(key)}
      style={{
        padding: "9px 16px", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer",
        border: "1px solid " + (tab === key ? "#1A2E40" : "#d8dde3"),
        background: tab === key ? "#1A2E40" : "#fff", color: tab === key ? "#fff" : "#475569",
      }}>
      {label} <span style={{ opacity: 0.7 }}>({n})</span>
    </button>
  );

  const pill = (actiefPill, kleur) => ({
    padding: "5px 10px", borderRadius: 999, fontSize: 12.5, fontWeight: 700, cursor: "pointer",
    border: "1px solid " + (actiefPill ? kleur : "#e2e8f0"),
    background: actiefPill ? kleur : "#fff", color: actiefPill ? "#fff" : "#64748b",
  });

  return (
    <div>
      <style>{`
        .sb-filters { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 14px; }
        .sb-filters .sb-zoek { grid-column: 1 / -1; }
        .sb-cards { display: grid; grid-template-columns: 1fr; gap: 12px; }
        @media (min-width: 640px) {
          .sb-filters { grid-template-columns: repeat(4, 1fr); }
          .sb-filters .sb-zoek { grid-column: 1 / -1; }
          .sb-cards { grid-template-columns: repeat(2, 1fr); }
        }
        @media (min-width: 1080px) {
          .sb-cards { grid-template-columns: repeat(3, 1fr); }
        }
      `}</style>

      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        {tabBtn("werk", "Werkstapel", actief.length)}
        {tabBtn("afgerond", "Afgerond", afgerond.length)}
      </div>

      <div className="sb-filters">
        <input className="sb-zoek" value={zoek} onChange={(e) => setZoek(e.target.value)} placeholder="Zoek bedrijf, plaats, e-mail…" style={sel} />
        <select value={fWie} onChange={(e) => setFWie(e.target.value)} style={sel}>
          <option value="alles">Iedereen</option>
          <option value="mij">Mijn leads</option>
          <option value="vrij">Nog vrij</option>
        </select>
        <select value={fProvincie} onChange={(e) => setFProvincie(e.target.value)} style={sel}>
          <option value="">Alle provincies</option>
          {provincies.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={fVak} onChange={(e) => setFVak(e.target.value)} style={sel}>
          <option value="">Alle vakgebieden</option>
          {vakken.map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
        <select value={fPotentie} onChange={(e) => setFPotentie(e.target.value)} style={sel}>
          <option value="">Alle potentie</option>
          {potenties.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      <div style={{ fontSize: 13, color: "#888", marginBottom: 10 }}>
        {tab === "werk"
          ? `${Math.min(limiet, actief.length)} van ${actief.length} openstaande leads — Zuid-Holland eerst`
          : `${afgerond.length} afgeronde leads`}
      </div>

      <div className="sb-cards">
        {lijst.map((l) => {
          const status = l.status || "nieuw";
          const done = DONE.includes(status);
          return (
            <div key={l.id} style={{ ...card, outline: bezigId === l.id ? "2px solid #FF8300" : "none", opacity: done ? 0.85 : 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                <strong style={{ fontSize: 16, lineHeight: 1.25 }}>{l.bedrijfsnaam || "—"}</strong>
                {l.potentie && (
                  <span style={{ flex: "0 0 auto", fontSize: 12, fontWeight: 700, color: POTENTIE_KLEUR[l.potentie] || "#666", whiteSpace: "nowrap" }}>{l.potentie}{l.score ? ` · ${l.score}` : ""}</span>
                )}
              </div>
              <div style={{ fontSize: 13, color: "#64748b" }}>
                {[l.vakgebied, l.plaats].filter(Boolean).join(" · ")}
                {l.provincie && (
                  <span style={{ color: l.provincie === "Zuid-Holland" ? "#0f6e56" : "#94a3b8", fontWeight: l.provincie === "Zuid-Holland" ? 700 : 400 }}> · {l.provincie}</span>
                )}
              </div>
              <div style={{ fontSize: 14, display: "flex", flexWrap: "wrap", gap: "2px 14px" }}>
                {l.telefoon && <a href={`tel:${l.telefoon.replace(/\s/g, "")}`} style={{ color: "#1A2E40", textDecoration: "none", fontWeight: 600 }}>{l.telefoon}</a>}
                {l.email && <a href={`mailto:${l.email}`} style={{ color: "#2563eb", textDecoration: "none" }}>{l.email}</a>}
                {l.website ? <a href={l.website} target="_blank" rel="noreferrer" style={{ color: "#2563eb" }}>website</a> : <span style={{ color: "#b45309" }}>geen website</span>}
                {l.facebook && <a href={l.facebook} target="_blank" rel="noreferrer" style={{ color: "#2563eb" }}>facebook</a>}
                {l.instagram && <a href={l.instagram} target="_blank" rel="noreferrer" style={{ color: "#2563eb" }}>instagram</a>}
                {l.linkedin && <a href={l.linkedin} target="_blank" rel="noreferrer" style={{ color: "#2563eb" }}>linkedin</a>}
              </div>

              {l.alleen_socials && (
                <div style={{ display: "inline-flex", alignItems: "center", alignSelf: "flex-start", gap: 6, background: "#f0f7ff", border: "1px solid #bfdcff", color: "#0c447c", borderRadius: 8, padding: "5px 10px", fontSize: 12.5, fontWeight: 600 }}>
                  Wel social media, geen website
                </div>
              )}

              {/* Eigenaar */}
              <div style={{ fontSize: 13 }}>
                {l.owner ? (
                  <span style={{ color: "#334155" }}>
                    Opgepakt door <strong>{l.owner}</strong>
                    {" · "}
                    <button onClick={() => patch(l.id, { owner: "" })} style={{ background: "none", border: "none", color: "#b91c1c", cursor: "pointer", fontSize: 13, padding: 0 }}>vrijgeven</button>
                  </span>
                ) : (
                  <button onClick={() => pakOp(l)}
                    style={{ background: "#1A2E40", color: "#fff", border: "none", padding: "7px 14px", borderRadius: 9, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                    Pak op{mij ? ` (${mij})` : ""}
                  </button>
                )}
              </div>

              {/* Status-knoppen */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {FASE_PILLS.map((s) => (
                  <button key={s} onClick={() => patch(l.id, { status: s })} style={pill(status === s, STATUS_KLEUR[s])}>
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#94a3b8" }}>Afronden:</span>
                <button onClick={() => patch(l.id, { status: "klant" })} style={pill(status === "klant", STATUS_KLEUR.klant)}>Klant geworden</button>
                <button onClick={() => patch(l.id, { status: "afgewezen" })} style={pill(status === "afgewezen", STATUS_KLEUR.afgewezen)}>Afgewezen</button>
              </div>

              {!done && (
                <a href={`/intake?lead=${l.id}`} target="_blank" rel="noreferrer"
                  style={{ display: "block", textAlign: "center", background: "#FF8300", color: "#fff", padding: "11px", borderRadius: 10, fontSize: 14, fontWeight: 700, textDecoration: "none", marginTop: 2 }}>
                  Preview aanvragen
                </a>
              )}
            </div>
          );
        })}
        {lijst.length === 0 && (
          <div style={{ textAlign: "center", color: "#94a3b8", padding: 24 }}>
            {tab === "werk" ? "Geen openstaande leads (met deze filters)." : "Nog niets afgerond."}
          </div>
        )}
      </div>

      {tab === "werk" && actief.length > limiet && (
        <div style={{ textAlign: "center", marginTop: 18 }}>
          <button onClick={() => setLimiet(limiet + PER_KEER)}
            style={{ background: "#fff", border: "1px solid #1A2E40", color: "#1A2E40", padding: "11px 22px", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            Toon volgende {Math.min(PER_KEER, actief.length - limiet)}
          </button>
        </div>
      )}
    </div>
  );
}
