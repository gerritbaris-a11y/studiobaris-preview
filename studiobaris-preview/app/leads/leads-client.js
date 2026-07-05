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

const sel = { padding: "10px 10px", fontSize: 14, border: "1px solid #d1d5db", borderRadius: 9, background: "#fff", fontFamily: "inherit", width: "100%", boxSizing: "border-box" };
const card = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 };

function uniek(arr) {
  return Array.from(new Set(arr.filter(Boolean))).sort();
}

export default function LeadsClient({ leads: initieel, team }) {
  const [leads, setLeads] = useState(initieel || []);
  const [zoek, setZoek] = useState("");
  const [fProvincie, setFProvincie] = useState("");
  const [fVak, setFVak] = useState("");
  const [fPotentie, setFPotentie] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [fOwner, setFOwner] = useState("");
  const [bezigId, setBezigId] = useState("");

  const provincies = useMemo(() => uniek(leads.map((l) => l.provincie)), [leads]);
  const vakken = useMemo(() => uniek(leads.map((l) => l.vakgebied)), [leads]);
  const potenties = ["Erg hoog", "Hoog", "Gemiddeld", "Laag", "Erg laag"];
  const teamNamen = (team || []).map((t) => t.naam);

  const zichtbaar = useMemo(() => {
    const q = zoek.trim().toLowerCase();
    return leads.filter((l) => {
      if (fProvincie && l.provincie !== fProvincie) return false;
      if (fVak && l.vakgebied !== fVak) return false;
      if (fPotentie && l.potentie !== fPotentie) return false;
      if (fStatus && (l.status || "nieuw") !== fStatus) return false;
      if (fOwner === "__leeg__") { if (l.owner) return false; }
      else if (fOwner && l.owner !== fOwner) return false;
      if (q) {
        const hay = [l.bedrijfsnaam, l.plaats, l.vakgebied, l.email, l.telefoon].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [leads, zoek, fProvincie, fVak, fPotentie, fStatus, fOwner]);

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

  return (
    <div>
      <style>{`
        .sb-filters { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 14px; }
        .sb-filters .sb-zoek { grid-column: 1 / -1; }
        .sb-cards { display: grid; grid-template-columns: 1fr; gap: 12px; }
        @media (min-width: 640px) {
          .sb-filters { grid-template-columns: repeat(3, 1fr); }
          .sb-filters .sb-zoek { grid-column: 1 / -1; }
          .sb-cards { grid-template-columns: repeat(2, 1fr); }
        }
        @media (min-width: 1080px) {
          .sb-cards { grid-template-columns: repeat(3, 1fr); }
        }
      `}</style>

      <div className="sb-filters">
        <input className="sb-zoek" value={zoek} onChange={(e) => setZoek(e.target.value)} placeholder="Zoek bedrijf, plaats, e-mail…" style={sel} />
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
        <select value={fStatus} onChange={(e) => setFStatus(e.target.value)} style={sel}>
          <option value="">Alle statussen</option>
          {Object.keys(STATUS_LABELS).map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
        <select value={fOwner} onChange={(e) => setFOwner(e.target.value)} style={sel}>
          <option value="">Alle eigenaars</option>
          <option value="__leeg__">Nog niet opgepakt</option>
          {teamNamen.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>

      <div style={{ fontSize: 13, color: "#888", marginBottom: 10 }}>{zichtbaar.length} van {leads.length} leads</div>

      <div className="sb-cards">
        {zichtbaar.map((l) => {
          const status = l.status || "nieuw";
          return (
            <div key={l.id} style={{ ...card, outline: bezigId === l.id ? "2px solid #FF8300" : "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                <strong style={{ fontSize: 16, lineHeight: 1.25 }}>{l.bedrijfsnaam || "—"}</strong>
                {l.potentie && (
                  <span style={{ flex: "0 0 auto", fontSize: 12, fontWeight: 700, color: POTENTIE_KLEUR[l.potentie] || "#666", whiteSpace: "nowrap" }}>{l.potentie}{l.score ? ` · ${l.score}` : ""}</span>
                )}
              </div>
              <div style={{ fontSize: 13, color: "#64748b" }}>
                {[l.vakgebied, l.plaats, l.provincie].filter(Boolean).join(" · ")}
              </div>
              <div style={{ fontSize: 14, display: "flex", flexWrap: "wrap", gap: "2px 14px" }}>
                {l.telefoon && <a href={`tel:${l.telefoon.replace(/\s/g, "")}`} style={{ color: "#1A2E40", textDecoration: "none" }}>📞 {l.telefoon}</a>}
                {l.email && <a href={`mailto:${l.email}`} style={{ color: "#2563eb", textDecoration: "none" }}>✉️ {l.email}</a>}
                {l.website ? <a href={l.website} target="_blank" rel="noreferrer" style={{ color: "#2563eb" }}>🌐 website</a> : <span style={{ color: "#b45309" }}>geen website</span>}
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <label style={{ flex: 1, fontSize: 11, color: "#888" }}>Status
                  <select value={status} onChange={(e) => patch(l.id, { status: e.target.value })}
                    style={{ ...sel, color: STATUS_KLEUR[status], fontWeight: 600, marginTop: 3 }}>
                    {Object.keys(STATUS_LABELS).map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                  </select>
                </label>
                <label style={{ flex: 1, fontSize: 11, color: "#888" }}>Eigenaar
                  <select value={l.owner || ""} onChange={(e) => patch(l.id, { owner: e.target.value, status: (!l.status || l.status === "nieuw") && e.target.value ? "opgepakt" : l.status })}
                    style={{ ...sel, marginTop: 3 }}>
                    <option value="">— niemand —</option>
                    {teamNamen.map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </label>
              </div>

              <a href={`/intake?lead=${l.id}`} target="_blank" rel="noreferrer"
                style={{ display: "block", textAlign: "center", background: "#FF8300", color: "#fff", padding: "11px", borderRadius: 10, fontSize: 14, fontWeight: 700, textDecoration: "none", marginTop: 2 }}>
                Preview aanvragen
              </a>
            </div>
          );
        })}
        {zichtbaar.length === 0 && (
          <div style={{ textAlign: "center", color: "#94a3b8", padding: 24 }}>Geen leads die aan de filters voldoen.</div>
        )}
      </div>
    </div>
  );
}
