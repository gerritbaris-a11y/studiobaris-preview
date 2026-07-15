"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const STATUS_LABELS = {
  nieuw: "Nieuw",
  opgepakt: "Opgepakt",
  benaderd: "Benaderd",
  preview: "Preview",
  klant: "Klant",
  afgewezen: "Afgewezen",
};
const STATUS_KLEUR = {
  nieuw: "#6B6258",
  opgepakt: "#b45309",
  benaderd: "#9E3B2E",
  preview: "#7c3aed",
  klant: "#1d7a46",
  afgewezen: "#b91c1c",
};
const POTENTIE_KLEUR = {
  "Erg hoog": "#1d7a46",
  Hoog: "#3f9142",
  Gemiddeld: "#b45309",
  Laag: "#9A9084",
  "Erg laag": "#B0A697",
};

const FASE_PILLS = ["nieuw", "opgepakt", "benaderd", "preview"];
const DONE = ["klant", "afgewezen"];

const REDENEN = [
  "Goede website",
  "Niet actief",
  "Geen ZZP / eenmanszaak",
  "Overig",
];
const PER_KEER = 10;

const sel = { padding: "10px 10px", fontSize: 14, border: "1px solid #d1d5db", borderRadius: 9, background: "#fff", fontFamily: "inherit", width: "100%", boxSizing: "border-box" };
const card = { background: "#fff", border: "1px solid #ECE4D7", borderRadius: 14, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 9 };

export default function LeadsClient({ leads: initieel, totaal, facetten, mij, filters, beheer }) {
  const router = useRouter();
  const params = useSearchParams();

  const [leads, setLeads] = useState(initieel || []);
  const [bezigId, setBezigId] = useState("");
  const [zoek, setZoek] = useState(filters.zoek || "");
  const [siteVeld, setSiteVeld] = useState({});
  const eersteRender = useRef(true);

  // Nieuwe gegevens van de server overnemen zodra de filters wijzigen.
  useEffect(() => { setLeads(initieel || []); }, [initieel]);

  const f = facetten || { provincies: [], vakgebieden: [], werk: 0, afgerond: 0, socials: 0 };
  const limiet = Number(filters.limiet || 30);

  function zet(veranderingen) {
    const q = new URLSearchParams(params.toString());
    Object.entries(veranderingen).forEach(([k, v]) => {
      if (v === "" || v == null) q.delete(k);
      else q.set(k, String(v));
    });
    if (!("limiet" in veranderingen)) q.delete("limiet"); // nieuwe filters: weer bovenaan beginnen
    router.push("/leads?" + q.toString());
  }

  // Zoeken met een korte vertraging, zodat we niet bij elke toets de server bevragen.
  useEffect(() => {
    if (eersteRender.current) { eersteRender.current = false; return; }
    const t = setTimeout(() => {
      if ((filters.zoek || "") !== zoek) zet({ zoek });
    }, 450);
    return () => clearTimeout(t);
  }, [zoek]); // eslint-disable-line react-hooks/exhaustive-deps

  async function patch(id, velden) {
    setBezigId(id);
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...velden } : l)));
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...velden }),
      });
    } catch {}
    setBezigId("");
  }

  function pakOp(l) {
    patch(l.id, { owner: mij || "", status: (l.status || "nieuw") === "nieuw" ? "opgepakt" : l.status });
  }

  // Archiveren met een reden: de lead verdwijnt uit de werkstapel maar blijft
  // vindbaar in het archief, gefilterd op die reden.
  async function archiveer(l, reden) {
    if (!reden) return;
    if (reden === "Overig") {
      const eigen = window.prompt("Waarom archiveer je " + (l.bedrijfsnaam || "deze lead") + "?");
      if (!eigen || !eigen.trim()) return;
      reden = "Overig: " + eigen.trim();
    }
    setBezigId(l.id);
    setLeads((prev) => prev.filter((x) => x.id !== l.id));
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: l.id, archief_reden: reden }),
      });
    } catch {}
    setBezigId("");
  }

  async function terugUitArchief(l) {
    setBezigId(l.id);
    setLeads((prev) => prev.filter((x) => x.id !== l.id));
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: l.id, archief_reden: null }),
      });
    } catch {}
    setBezigId("");
  }

  // De brondata klopt niet altijd: soms heeft een "alleen social"-bedrijf wel
  // degelijk een site. Corrigeer je dat hier, dan telt hij niet meer mee.
  async function bewaarSite(l) {
    const w = (siteVeld[l.id] || "").trim();
    if (!w) return;
    setBezigId(l.id);
    setLeads((prev) => prev.map((x) => (x.id === l.id ? { ...x, website: w, alleen_socials: false } : x)));
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: l.id, website: w }),
      });
    } catch {}
    setSiteVeld((v) => ({ ...v, [l.id]: "" }));
    setBezigId("");
  }

  const tab = filters.tab || "werk";
  const tabBtn = (key, label, n) => (
    <button onClick={() => zet({ tab: key === "werk" ? "" : key })}
      style={{
        padding: "9px 16px", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer",
        border: "1px solid " + (tab === key ? "#2B2724" : "#E3DACB"),
        background: tab === key ? "#2B2724" : "#fff", color: tab === key ? "#fff" : "#524A40",
      }}>
      {label} <span style={{ opacity: 0.7 }}>({n.toLocaleString("nl-NL")})</span>
    </button>
  );

  const pill = (aan, kleur) => ({
    padding: "5px 10px", borderRadius: 999, fontSize: 12.5, fontWeight: 700, cursor: "pointer",
    border: "1px solid " + (aan ? kleur : "#ECE4D7"),
    background: aan ? kleur : "#fff", color: aan ? "#fff" : "#6B6258",
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
        @media (min-width: 1080px) { .sb-cards { grid-template-columns: repeat(3, 1fr); } }
      `}</style>

      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        {tabBtn("werk", "Werkstapel", f.werk)}
        {tabBtn("afgerond", "Afgerond", f.afgerond)}
        {tabBtn("archief", "Archief", f.archief || 0)}
      </div>

      {tab === "archief" && (f.redenen || []).length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
          <button onClick={() => zet({ reden: "" })}
            style={{ ...sel, width: "auto", cursor: "pointer", fontWeight: 700,
              border: "1px solid " + (!filters.reden ? "#2B2724" : "#E3DACB"),
              background: !filters.reden ? "#2B2724" : "#fff",
              color: !filters.reden ? "#fff" : "#524A40" }}>
            Alle redenen
          </button>
          {(f.redenen || []).map((r) => (
            <button key={r.reden} onClick={() => zet({ reden: r.reden })}
              style={{ ...sel, width: "auto", cursor: "pointer", fontWeight: 700,
                border: "1px solid " + (filters.reden === r.reden ? "#2B2724" : "#E3DACB"),
                background: filters.reden === r.reden ? "#2B2724" : "#fff",
                color: filters.reden === r.reden ? "#fff" : "#524A40" }}>
              {r.reden} ({r.aantal})
            </button>
          ))}
        </div>
      )}

      <div className="sb-filters">
        <input className="sb-zoek" value={zoek} onChange={(e) => setZoek(e.target.value)}
          placeholder="Zoek bedrijf, plaats, e-mail of telefoon…" style={sel} />
        <select value={filters.wie || "alles"} onChange={(e) => zet({ wie: e.target.value === "alles" ? "" : e.target.value })} style={sel}>
          <option value="alles">Iedereen</option>
          <option value="mij">Mijn leads</option>
          <option value="vrij">Nog vrij</option>
        </select>
        <select value={filters.provincie || ""} onChange={(e) => zet({ provincie: e.target.value })} style={sel}>
          <option value="">Alle provincies</option>
          {f.provincies.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={filters.vakgebied || ""} onChange={(e) => zet({ vakgebied: e.target.value })} style={sel}>
          <option value="">Alle vakgebieden</option>
          {f.vakgebieden.map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
        <select value={filters.potentie || ""} onChange={(e) => zet({ potentie: e.target.value })} style={sel}>
          <option value="">Alle potentie</option>
          {["Erg hoog", "Hoog", "Gemiddeld", "Laag", "Erg laag"].map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      <div style={{ fontSize: 13, color: "#B0A697", marginBottom: 10 }}>
        {leads.length.toLocaleString("nl-NL")} van {Number(totaal || 0).toLocaleString("nl-NL")}
        {tab === "werk" ? " openstaande leads — Zuid-Holland eerst" : " afgeronde leads"}
      </div>

      <div className="sb-cards">
        {leads.map((l) => {
          const status = l.status || "nieuw";
          const done = DONE.includes(status);
          return (
            <div key={l.id} style={{ ...card, outline: bezigId === l.id ? "2px solid #C05A38" : "none", opacity: done ? 0.85 : 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                <div style={{ minWidth: 0 }}>
                  <strong style={{ fontSize: 16, lineHeight: 1.25, display: "block" }}>{l.bedrijfsnaam || "—"}</strong>
                  {l.potentie && (
                    <span style={{ fontSize: 12, fontWeight: 700, color: POTENTIE_KLEUR[l.potentie] || "#666" }}>{l.potentie}</span>
                  )}
                </div>
                {l.score != null && (() => {
                  const sc = Number(l.score);
                  const kl = sc >= 85 ? "#C05A38" : sc >= 75 ? "#5E8C61" : "#C98A2B";
                  return (
                    <div style={{ flex: "0 0 auto", textAlign: "center", lineHeight: 1 }}>
                      <div style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif", fontSize: 24, fontWeight: 800, color: kl }}>{sc}</div>
                      <div style={{ fontSize: 10, color: "#B0A697", textTransform: "uppercase", letterSpacing: 0.5 }}>kans</div>
                    </div>
                  );
                })()}
              </div>
              <div style={{ fontSize: 13, color: "#6B6258" }}>
                {[l.vakgebied, l.plaats].filter(Boolean).join(" · ")}
                {l.provincie && (
                  <span style={{ color: l.provincie === "Zuid-Holland" ? "#0f6e56" : "#9A9084", fontWeight: l.provincie === "Zuid-Holland" ? 700 : 400 }}> · {l.provincie}</span>
                )}
              </div>
              <div style={{ fontSize: 14, display: "flex", flexWrap: "wrap", gap: "2px 14px" }}>
                {l.telefoon && <a href={`tel:${l.telefoon.replace(/\s/g, "")}`} style={{ color: "#2B2724", textDecoration: "none", fontWeight: 600 }}>{l.telefoon}</a>}
                {l.email && <a href={`mailto:${l.email}`} style={{ color: "#9E3B2E", textDecoration: "none" }}>{l.email}</a>}
                {l.website ? <a href={l.website} target="_blank" rel="noreferrer" style={{ color: "#9E3B2E" }}>website</a> : <span style={{ color: "#b45309" }}>geen website</span>}
                {l.facebook && <a href={l.facebook} target="_blank" rel="noreferrer" style={{ color: "#9E3B2E" }}>facebook</a>}
                {l.instagram && <a href={l.instagram} target="_blank" rel="noreferrer" style={{ color: "#9E3B2E" }}>instagram</a>}
                {l.linkedin && <a href={l.linkedin} target="_blank" rel="noreferrer" style={{ color: "#9E3B2E" }}>linkedin</a>}
                {l.google_maps && <a href={l.google_maps} target="_blank" rel="noreferrer" style={{ color: "#9E3B2E" }}>maps</a>}
              </div>

              {l.alleen_socials && (
                <div style={{ display: "inline-flex", alignSelf: "flex-start", background: "#FBF7F0", border: "1px solid #E3DACB", color: "#9E3B2E", borderRadius: 8, padding: "5px 10px", fontSize: 12.5, fontWeight: 600 }}>
                  Wel social media, geen website
                </div>
              )}

              {(l.beoordeling || l.aantal_reviews) && (
                <div style={{ fontSize: 12.5, color: "#9A9084" }}>
                  Google: {l.beoordeling ? Number(l.beoordeling).toFixed(1) : "—"}
                  {l.aantal_reviews ? ` (${l.aantal_reviews} reviews)` : ""}
                </div>
              )}

              <div style={{ fontSize: 13 }}>
                {l.owner ? (
                  <span style={{ color: "#524A40" }}>
                    Opgepakt door <strong>{l.owner}</strong>
                    {" · "}
                    <button onClick={() => patch(l.id, { owner: "" })} style={{ background: "none", border: "none", color: "#b91c1c", cursor: "pointer", fontSize: 13, padding: 0 }}>vrijgeven</button>
                  </span>
                ) : (
                  <button onClick={() => pakOp(l)}
                    style={{ background: "#2B2724", color: "#fff", border: "none", padding: "7px 14px", borderRadius: 9, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                    Pak op{mij ? ` (${mij})` : ""}
                  </button>
                )}
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {FASE_PILLS.map((s) => (
                  <button key={s} onClick={() => patch(l.id, { status: s })} style={pill(status === s, STATUS_KLEUR[s])}>
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#9A9084" }}>Afronden:</span>
                <button onClick={() => patch(l.id, { status: "klant" })} style={pill(status === "klant", STATUS_KLEUR.klant)}>Klant geworden</button>
                <button onClick={() => patch(l.id, { status: "afgewezen" })} style={pill(status === "afgewezen", STATUS_KLEUR.afgewezen)}>Afgewezen</button>
              </div>

              {/* De brondata klopt niet altijd. Kom je toch een website tegen? Vul 'm hier in. */}
              {l.alleen_socials && tab !== "archief" && (
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <input
                    value={siteVeld[l.id] || ""}
                    onChange={(e) => setSiteVeld((v) => ({ ...v, [l.id]: e.target.value }))}
                    placeholder="Toch een website? Plak 'm hier"
                    style={{ ...sel, fontSize: 12.5, padding: "7px 9px" }}
                  />
                  <button onClick={() => bewaarSite(l)} disabled={!(siteVeld[l.id] || "").trim()}
                    style={{ border: "1px solid #E3DACB", background: "#fff", borderRadius: 8, padding: "7px 11px", cursor: "pointer", fontSize: 12.5, fontWeight: 700, color: "#524A40", whiteSpace: "nowrap" }}>
                    Opslaan
                  </button>
                </div>
              )}

              {!done && tab !== "archief" && (
                <a href={`/intake?lead=${l.id}`} target="_blank" rel="noreferrer"
                  style={{ display: "block", textAlign: "center", background: "#C05A38", color: "#fff", padding: "11px", borderRadius: 10, fontSize: 14, fontWeight: 700, textDecoration: "none", marginTop: 2 }}>
                  Preview aanvragen
                </a>
              )}

              {/* Archiveren met een reden, of terug uit het archief. */}
              <div style={{ display: "flex", gap: 6, alignItems: "center", borderTop: "1px solid #F4EEE3", paddingTop: 8, marginTop: 2 }}>
                {tab === "archief" ? (
                  <>
                    <span style={{ fontSize: 12, color: "#9A9084", flex: 1 }}>
                      Gearchiveerd{l.archief_reden ? ": " + l.archief_reden : ""}
                    </span>
                    <button onClick={() => terugUitArchief(l)}
                      style={{ border: "1px solid #2B2724", background: "#fff", color: "#2B2724", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 12.5, fontWeight: 700 }}>
                      Terug in de lijst
                    </button>
                  </>
                ) : (
                  <select
                    defaultValue=""
                    onChange={(e) => { archiveer(l, e.target.value); e.target.value = ""; }}
                    style={{ ...sel, fontSize: 12.5, padding: "7px 9px", flex: 1 }}
                  >
                    <option value="">Archiveren…</option>
                    {REDENEN.map((r) => (<option key={r} value={r}>{r}</option>))}
                  </select>
                )}

              </div>
            </div>
          );
        })}
        {leads.length === 0 && (
          <div style={{ textAlign: "center", color: "#9A9084", padding: 24 }}>
            Geen leads gevonden met deze filters.
          </div>
        )}
      </div>

      {leads.length < Number(totaal || 0) && (
        <div style={{ textAlign: "center", marginTop: 18 }}>
          <button onClick={() => zet({ limiet: limiet + PER_KEER })}
            style={{ background: "#fff", border: "1px solid #2B2724", color: "#2B2724", padding: "11px 22px", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            Toon volgende {Math.min(PER_KEER, Number(totaal) - leads.length)}
          </button>
        </div>
      )}
    </div>
  );
}
