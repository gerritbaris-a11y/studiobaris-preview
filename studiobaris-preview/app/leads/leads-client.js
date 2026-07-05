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

const sel = { padding: "6px 8px", fontSize: 13, border: "1px solid #d1d5db", borderRadius: 7, background: "#fff", fontFamily: "inherit" };
const th = { textAlign: "left", padding: "9px 10px", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "#888", borderBottom: "1px solid #e5e7eb", position: "sticky", top: 0, background: "#f8fafc" };
const td = { padding: "10px", fontSize: 13.5, borderBottom: "1px solid #f1f5f9", verticalAlign: "top" };

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
      if (fOwner === "__leeg__" ? l.owner : fOwner && l.owner !== fOwner) return false;
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

  const telling = leads.length;

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 14 }}>
        <input value={zoek} onChange={(e) => setZoek(e.target.value)} placeholder="Zoek bedrijf, plaats, e-mail…" style={{ ...sel, minWidth: 220 }} />
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
        <span style={{ fontSize: 13, color: "#888", marginLeft: "auto" }}>{zichtbaar.length} van {telling} leads</span>
      </div>

      <div style={{ overflowX: "auto", border: "1px solid #e5e7eb", borderRadius: 12 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
          <thead>
            <tr>
              <th style={th}>Bedrijf</th>
              <th style={th}>Plaats</th>
              <th style={th}>Potentie</th>
              <th style={th}>Contact</th>
              <th style={th}>Status</th>
              <th style={th}>Eigenaar</th>
              <th style={th}>Actie</th>
            </tr>
          </thead>
          <tbody>
            {zichtbaar.map((l) => {
              const status = l.status || "nieuw";
              return (
                <tr key={l.id} style={{ background: bezigId === l.id ? "#fffdf5" : "#fff" }}>
                  <td style={td}>
                    <strong>{l.bedrijfsnaam || "—"}</strong>
                    <div style={{ fontSize: 12, color: "#888" }}>{[l.vakgebied, l.categorie].filter(Boolean).join(" · ")}</div>
                  </td>
                  <td style={td}>{l.plaats || "—"}<div style={{ fontSize: 12, color: "#888" }}>{l.provincie || ""}</div></td>
                  <td style={td}>
                    {l.potentie ? (
                      <span style={{ fontSize: 12, fontWeight: 700, color: POTENTIE_KLEUR[l.potentie] || "#666" }}>{l.potentie}{l.score ? ` · ${l.score}` : ""}</span>
                    ) : "—"}
                  </td>
                  <td style={td}>
                    {l.telefoon && <div>{l.telefoon}</div>}
                    {l.email && <div style={{ color: "#64748b" }}>{l.email}</div>}
                    {l.website ? <a href={l.website} target="_blank" rel="noreferrer" style={{ color: "#2563eb", fontSize: 12 }}>website ↗</a> : <span style={{ fontSize: 12, color: "#b45309" }}>geen website</span>}
                  </td>
                  <td style={td}>
                    <select value={status} onChange={(e) => patch(l.id, { status: e.target.value })}
                      style={{ ...sel, color: STATUS_KLEUR[status], fontWeight: 600 }}>
                      {Object.keys(STATUS_LABELS).map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                    </select>
                  </td>
                  <td style={td}>
                    <select value={l.owner || ""} onChange={(e) => patch(l.id, { owner: e.target.value, status: (l.status === "nieuw" || !l.status) && e.target.value ? "opgepakt" : l.status })}
                      style={sel}>
                      <option value="">— niemand —</option>
                      {teamNamen.map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </td>
                  <td style={td}>
                    <a href={`/intake?lead=${l.id}`} target="_blank" rel="noreferrer"
                      style={{ display: "inline-block", background: "#FF8300", color: "#fff", padding: "6px 12px", borderRadius: 8, fontSize: 12.5, fontWeight: 700, textDecoration: "none" }}>
                      Preview aanvragen
                    </a>
                  </td>
                </tr>
              );
            })}
            {zichtbaar.length === 0 && (
              <tr><td style={{ ...td, textAlign: "center", color: "#94a3b8", padding: 24 }} colSpan={7}>Geen leads die aan de filters voldoen.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
