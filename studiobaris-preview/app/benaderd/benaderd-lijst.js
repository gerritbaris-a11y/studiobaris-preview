"use client";

import { useMemo, useState } from "react";
import { KLEUR, HEAD } from "../werkplek-stijl";

// Lijst + filters voor de pagina Benaderd. Filtert in beeld, zonder herladen.

function wanneer(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const dag = d.toLocaleDateString("nl-NL", { day: "numeric", month: "short", timeZone: "Europe/Amsterdam" });
  const tijd = d.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Amsterdam" });
  return dag + ", " + tijd;
}

const JA_NEE = [
  { key: "", label: "Alle" },
  { key: "ja", label: "Ja" },
  { key: "nee", label: "Nee" },
];

function Schakel({ titel, waarde, zet }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
      <span style={{ fontSize: 12.5, fontWeight: 700, color: KLEUR.gedempt, minWidth: 116 }}>{titel}</span>
      {JA_NEE.map((o) => {
        const aan = waarde === o.key;
        return (
          <button
            key={o.key}
            type="button"
            onClick={() => zet(o.key)}
            style={{
              padding: "6px 12px", borderRadius: 999, fontSize: 13, fontWeight: aan ? 700 : 600,
              color: aan ? "#fff" : "#4A5560", background: aan ? KLEUR.klei : "#fff",
              border: `1px solid ${aan ? KLEUR.klei : KLEUR.lijn}`, cursor: "pointer", fontFamily: "inherit",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function Kies({ titel, waarde, zet, opties }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12.5, fontWeight: 700, color: KLEUR.gedempt, flex: "1 1 150px" }}>
      {titel}
      <select
        value={waarde}
        onChange={(e) => zet(e.target.value)}
        style={{ padding: "8px 10px", borderRadius: 9, border: `1px solid ${KLEUR.lijn}`, background: "#fff", fontSize: 14, fontFamily: "inherit", color: KLEUR.inkt }}
      >
        <option value="">Alle</option>
        {opties.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

function past(jaNee, waar) {
  if (!jaNee) return true;
  return jaNee === "ja" ? waar : !waar;
}

function uniek(lijst) {
  return [...new Set(lijst.filter(Boolean))].sort((a, b) => a.localeCompare(b, "nl"));
}

export default function BenaderdLijst({ rijen, beheer, totaal = 0 }) {
  const [zoek, setZoek] = useState("");
  const [bekeken, setBekeken] = useState("");
  const [app, setApp] = useState("");
  const [project, setProject] = useState("");
  const [branche, setBranche] = useState("");
  const [plaats, setPlaats] = useState("");
  const [verkoper, setVerkoper] = useState("");

  const branches = useMemo(() => uniek(rijen.map((r) => r.branche)), [rijen]);
  const plaatsen = useMemo(() => uniek(rijen.map((r) => r.plaats)), [rijen]);
  const verkopers = useMemo(() => uniek(rijen.map((r) => r.benaderd_door)), [rijen]);

  const zichtbaar = rijen.filter((r) => {
    const q = zoek.trim().toLowerCase();
    if (q && !(r.bedrijf || "").toLowerCase().includes(q)) return false;
    if (!past(bekeken, Number(r.bekeken_aantal) > 0)) return false;
    if (!past(app, !!r.app_geopend)) return false;
    if (!past(project, Number(r.geplaatst) > 0)) return false;
    if (branche && r.branche !== branche) return false;
    if (plaats && r.plaats !== plaats) return false;
    if (verkoper && r.benaderd_door !== verkoper) return false;
    return true;
  });

  const tel = {
    bekeken: rijen.filter((r) => Number(r.bekeken_aantal) > 0).length,
    app: rijen.filter((r) => r.app_geopend).length,
    project: rijen.filter((r) => Number(r.geplaatst) > 0).length,
  };

  const filterAan = zoek || bekeken || app || project || branche || plaats || verkoper;
  function wis() {
    setZoek(""); setBekeken(""); setApp(""); setProject(""); setBranche(""); setPlaats(""); setVerkoper("");
  }

  const regel = { fontSize: 12.5, color: "#4A5560", whiteSpace: "nowrap" };
  const uit = { ...regel, color: "#6F7A85" };
  const aan = { ...regel, fontWeight: 700, color: "#0f6e56" };

  return (
    <div>
      {/* Percentages bovenaan. "Benaderd" is t.o.v. al je previews; de rest
          t.o.v. het aantal benaderde bedrijven. Telt altijd de hele lijst,
          los van de filters hieronder. */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 14 }}>
        {[
          ["Benaderd", rijen.length, totaal, "van je previews"],
          ["Preview geopend", tel.bekeken, rijen.length, "van benaderd"],
          ["App geopend", tel.app, rijen.length, "van benaderd"],
          ["Project geplaatst", tel.project, rijen.length, "van benaderd"],
        ].map(([l, n, van, uitleg]) => {
          const pct = van > 0 ? Math.round((n / van) * 100) : 0;
          return (
            <div key={l} style={{ background: "#fff", border: `1px solid ${KLEUR.lijn}`, borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ fontSize: 12, color: KLEUR.gedempt, fontWeight: 700 }}>{l}</div>
              <div style={{ fontFamily: HEAD, fontSize: 26, fontWeight: 800, lineHeight: 1.2 }}>{pct}%</div>
              <div style={{ fontSize: 12, color: "#4A5560" }}>{n} {uitleg === "van je previews" ? `van ${van} previews` : `van ${van} benaderd`}</div>
              <div style={{ height: 6, background: KLEUR.papier, borderRadius: 999, marginTop: 8, overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: KLEUR.klei, borderRadius: 999 }} />
              </div>
            </div>
          );
        })}
      </div>

      {rijen.length === 0 && (
        <div style={{ background: KLEUR.amber.bg, border: `1px solid ${KLEUR.baanRand}`, borderRadius: 12, padding: "16px 18px", color: KLEUR.amber.tekst }}>
          Nog niets benaderd. Zet op <a href="/klanten" style={{ color: KLEUR.amber.tekst, fontWeight: 700 }}>Mijn previews</a> het vinkje Benaderd aan bij een preview die je hebt benaderd.
        </div>
      )}

      {rijen.length > 0 && (<>
      <div style={{ background: "#fff", border: `1px solid ${KLEUR.lijn}`, borderRadius: 14, padding: "14px 16px", display: "grid", gap: 10, marginBottom: 14 }}>
        <input
          value={zoek}
          onChange={(e) => setZoek(e.target.value)}
          placeholder="Zoek op bedrijfsnaam…"
          style={{ padding: "10px 12px", borderRadius: 10, border: `1px solid ${KLEUR.lijn}`, fontSize: 15, fontFamily: "inherit" }}
        />
        <Schakel titel="Preview bekeken" waarde={bekeken} zet={setBekeken} />
        <Schakel titel="App geopend" waarde={app} zet={setApp} />
        <Schakel titel="Project geplaatst" waarde={project} zet={setProject} />
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Kies titel="Branche" waarde={branche} zet={setBranche} opties={branches} />
          <Kies titel="Plaats" waarde={plaats} zet={setPlaats} opties={plaatsen} />
          {beheer && <Kies titel="Benaderd door" waarde={verkoper} zet={setVerkoper} opties={verkopers} />}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: KLEUR.gedempt }}>
          {zichtbaar.length} van {rijen.length} bedrijven
          {filterAan && (
            <button type="button" onClick={wis} style={{ marginLeft: "auto", background: "none", border: "none", color: KLEUR.klei, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>
              Filters wissen
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        {zichtbaar.map((r) => {
          const geplaatst = Number(r.geplaatst) || 0;
          return (
            <div key={r.slug} style={{ display: "flex", gap: 12, alignItems: "flex-start", flexWrap: "wrap", background: "#fff", border: `1px solid ${KLEUR.lijn}`, borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ flex: "1 1 220px", minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{r.bedrijf}</div>
                <div style={{ fontSize: 12.5, color: "#4A5560" }}>{[r.branche, r.plaats].filter(Boolean).join(" · ") || "—"}</div>
                <div style={{ fontSize: 12, color: "#6F7A85", marginTop: 2 }}>
                  Benaderd {wanneer(r.benaderd_op)}{r.benaderd_door ? ` door ${r.benaderd_door}` : ""}
                </div>
                {r.telefoon && (
                  <a href={`tel:${String(r.telefoon).replace(/\s/g, "")}`} style={{ display: "inline-block", marginTop: 4, fontSize: 13, fontWeight: 600, color: KLEUR.inkt, textDecoration: "none" }}>{r.telefoon}</a>
                )}
              </div>
              <div style={{ display: "grid", gap: 3 }}>
                {Number(r.bekeken_aantal) > 0
                  ? <span style={aan}>● Preview bekeken {r.bekeken_aantal}× · laatst {wanneer(r.bekeken_laatst)}</span>
                  : <span style={uit}>○ Preview nog niet bekeken</span>}
                {r.app_geopend
                  ? <span style={aan}>● App geopend {wanneer(r.app_geopend_op)}</span>
                  : <span style={uit}>○ App nog niet geopend</span>}
                {geplaatst > 0
                  ? <span style={aan}>● {geplaatst} van 3 projecten geplaatst · laatst {wanneer(r.laatst_geplaatst_op)}</span>
                  : <span style={uit}>○ Nog geen project geplaatst</span>}
              </div>
            </div>
          );
        })}
        {zichtbaar.length === 0 && (
          <div style={{ padding: "14px 16px", color: KLEUR.gedempt, fontSize: 14 }}>Geen bedrijven met deze filters.</div>
        )}
      </div>
      </>)}
    </div>
  );
}
