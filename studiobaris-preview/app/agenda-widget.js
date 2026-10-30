"use client";

// Online agenda voor salons: behandeling → dag → tijd → gegevens → klaar.
// Draait op de previewsite (testmodus) én als losse pagina /boek/<bedrijf> die
// de SB Embed-plugin op de echte klantsite toont. Praat met /api/agenda/*.

import { useEffect, useMemo, useState } from "react";

const DAG = ["zo", "ma", "di", "wo", "do", "vr", "za"];
const MAAND = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];

function dagLabel(iso) {
  const [j, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(j, m - 1, d));
  return { dag: DAG[dt.getUTCDay()], nr: d, maand: MAAND[m - 1] };
}
function euro(n) {
  if (n == null) return "";
  return "€ " + Number(n).toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function duur(min) {
  if (min < 60) return `${min} min`;
  const u = Math.floor(min / 60), r = min % 60;
  return r ? `${u} u ${r} min` : `${u} uur`;
}

export default function AgendaWidget({ agenda, test = false, kleur = "#1A2B3D", tekstOpKleur = "#fff", bron = "site", basis = "" }) {
  const behandelingen = agenda?.behandelingen || [];
  const categorieen = useMemo(() => [...new Set(behandelingen.map((b) => b.categorie))], [behandelingen]);
  const [cat, setCat] = useState(categorieen[0] || "");
  const [beh, setBeh] = useState(null);
  const [dagen, setDagen] = useState(null);
  const [dag, setDag] = useState("");
  const [tijden, setTijden] = useState(null);
  const [tijd, setTijd] = useState("");
  const [form, setForm] = useState({ naam: "", telefoon: "", email: "", opmerking: "", website: "" });
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState("");
  const [klaar, setKlaar] = useState(null);
  const [testMail, setTestMail] = useState(agenda?.melding_email || "");
  const [testMailStand, setTestMailStand] = useState("");

  const c = agenda?.company_id;

  useEffect(() => {
    if (!beh) return;
    setDagen(null); setDag(""); setTijden(null); setTijd("");
    fetch(`${basis}/api/agenda/dagen?c=${c}&b=${beh.id}`).then((r) => r.json())
      .then((j) => { const d = j.dagen || []; setDagen(d); if (d[0]) setDag(d[0]); })
      .catch(() => setDagen([]));
  }, [beh, c, basis]);

  useEffect(() => {
    if (!beh || !dag) return;
    setTijden(null); setTijd("");
    fetch(`${basis}/api/agenda/tijden?c=${c}&b=${beh.id}&d=${dag}`).then((r) => r.json())
      .then((j) => setTijden(j.tijden || []))
      .catch(() => setTijden([]));
  }, [beh, dag, c, basis]);

  async function bevestig(e) {
    e.preventDefault();
    setFout("");
    if (!form.naam.trim()) return setFout("Vul je naam in.");
    if (!form.telefoon.trim() && !form.email.trim()) return setFout("Vul een telefoonnummer of e-mailadres in.");
    setBezig(true);
    try {
      const res = await fetch(`${basis}/api/agenda/boek`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ c, b: beh.id, d: dag, t: tijd, ...form, bron }),
      });
      const j = await res.json().catch(() => ({}));
      if (!j.ok) {
        setFout(j.error || "Boeken is niet gelukt.");
        if (j.code === "bezet") { setTijd(""); setTijden(null);
          fetch(`${basis}/api/agenda/tijden?c=${c}&b=${beh.id}&d=${dag}`).then((r) => r.json()).then((x) => setTijden(x.tijden || [])); }
        return;
      }
      setKlaar(j.afspraak);
    } catch {
      setFout("Geen verbinding. Probeer het opnieuw.");
    } finally {
      setBezig(false);
    }
  }

  async function bewaarTestMail() {
    setTestMailStand("bezig");
    const r = await fetch(`${basis}/api/agenda/test-email`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ c, email: testMail }),
    }).then((x) => x.json()).catch(() => ({}));
    setTestMailStand(r.ok ? "ok" : r.error || "Opslaan mislukt.");
  }

  function opnieuw() {
    setKlaar(null); setBeh(null); setDag(""); setTijd(""); setFout("");
    setForm({ naam: "", telefoon: "", email: "", opmerking: "", website: "" });
  }

  if (!agenda || behandelingen.length === 0) return null;

  const s = stijlen(kleur, tekstOpKleur);
  const stap = klaar ? 4 : !beh ? 1 : !tijd ? 2 : 3;

  return (
    <div style={s.kaart}>
      {test && (
        <div style={s.test}>
          <strong>Dit is een werkende testagenda.</strong> Boek gerust een afspraak: je krijgt de melding die straks bij elke
          echte boeking binnenkomt. Meldingen gaan naar:
          <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
            <input value={testMail} onChange={(e) => { setTestMail(e.target.value); setTestMailStand(""); }}
              placeholder="jouw@email.nl" type="email" style={{ ...s.veld, flex: "1 1 200px", margin: 0 }} />
            <button type="button" onClick={bewaarTestMail} style={{ ...s.knopKlein }} disabled={testMailStand === "bezig"}>
              {testMailStand === "ok" ? "Opgeslagen ✓" : "Opslaan"}
            </button>
          </div>
          {testMailStand && !["ok", "bezig"].includes(testMailStand) && <div style={s.fout}>{testMailStand}</div>}
        </div>
      )}

      <ol style={s.stappen} aria-label="Stappen">
        {["Behandeling", "Dag en tijd", "Gegevens"].map((t, i) => (
          <li key={t} style={s.stapItem(stap > i + 1, stap === i + 1)}>{i + 1}. {t}</li>
        ))}
      </ol>

      {klaar ? (
        <div style={{ textAlign: "center", padding: "12px 4px" }}>
          <div style={s.vink}>✓</div>
          <h3 style={s.kop}>Je afspraak staat vast</h3>
          <p style={s.tekst}>
            {klaar.behandeling}<br />
            <strong>{new Date(klaar.start).toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Amsterdam" })}{" "}
              om {new Date(klaar.start).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Amsterdam" })}</strong>
          </p>
          <p style={s.klein}>{form.email ? "Je krijgt een bevestiging per e-mail, met een link om te verzetten of te annuleren." : "Bewaar deze gegevens goed."}
            {klaar.test ? " (Testboeking: wordt na 30 dagen gewist.)" : ""}</p>
          <button type="button" onClick={opnieuw} style={s.knopLicht}>Nog een afspraak maken</button>
        </div>
      ) : !beh ? (
        <div>
          {categorieen.length > 1 && (
            <div style={s.tabs} role="tablist">
              {categorieen.map((k) => (
                <button key={k} type="button" role="tab" aria-selected={cat === k} onClick={() => setCat(k)} style={s.tab(cat === k)}>{k}</button>
              ))}
            </div>
          )}
          <div style={{ display: "grid", gap: 8 }}>
            {behandelingen.filter((b) => categorieen.length < 2 || b.categorie === cat).map((b) => (
              <button key={b.id} type="button" onClick={() => setBeh(b)} style={s.behandeling}>
                <span style={{ textAlign: "left" }}>
                  <span style={{ display: "block", fontWeight: 700 }}>{b.naam}</span>
                  <span style={s.klein}>{duur(b.duur_min)}{b.omschrijving ? ` · ${b.omschrijving}` : ""}</span>
                </span>
                <span style={{ fontWeight: 700, whiteSpace: "nowrap" }}>{b.prijs_vanaf ? "v.a. " : ""}{euro(b.prijs)}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <button type="button" onClick={() => setBeh(null)} style={s.terug}>← {beh.naam} · {duur(beh.duur_min)} · wijzigen</button>

          {!tijd ? (
            <>
              <div style={s.label}>Kies een dag</div>
              {dagen === null ? <div style={s.klein}>Even kijken wanneer er plek is…</div>
                : dagen.length === 0 ? <div style={s.klein}>Er is de komende weken geen plek meer voor deze behandeling. Bel ons even.</div>
                : (
                  <div style={s.dagen}>
                    {dagen.map((d) => { const l = dagLabel(d); return (
                      <button key={d} type="button" onClick={() => setDag(d)} style={s.dag(d === dag)}>
                        <span style={{ fontSize: 12, textTransform: "uppercase" }}>{l.dag}</span>
                        <span style={{ fontSize: 18, fontWeight: 800 }}>{l.nr}</span>
                        <span style={{ fontSize: 12 }}>{l.maand}</span>
                      </button>
                    ); })}
                  </div>
                )}
              {dag && (
                <>
                  <div style={s.label}>Kies een tijd</div>
                  {tijden === null ? <div style={s.klein}>Tijden laden…</div>
                    : tijden.length === 0 ? <div style={s.klein}>Deze dag is net vol. Kies een andere dag.</div>
                    : <div style={s.tijden}>{tijden.map((t) => (
                        <button key={t} type="button" onClick={() => setTijd(t)} style={s.tijd}>{t}</button>
                      ))}</div>}
                </>
              )}
            </>
          ) : (
            <form onSubmit={bevestig}>
              <button type="button" onClick={() => setTijd("")} style={s.terug}>
                ← {(() => { const l = dagLabel(dag); return `${l.dag} ${l.nr} ${l.maand}`; })()} om {tijd} · wijzigen
              </button>
              <input aria-label="Naam" placeholder="Je naam" value={form.naam} onChange={(e) => setForm({ ...form, naam: e.target.value })} style={s.veld} autoComplete="name" />
              <input aria-label="Telefoon" placeholder="Telefoonnummer" value={form.telefoon} onChange={(e) => setForm({ ...form, telefoon: e.target.value })} style={s.veld} type="tel" autoComplete="tel" />
              <input aria-label="E-mail" placeholder="E-mailadres (voor je bevestiging)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={s.veld} type="email" autoComplete="email" />
              <textarea aria-label="Opmerking" placeholder="Opmerking (optioneel)" value={form.opmerking} onChange={(e) => setForm({ ...form, opmerking: e.target.value })} style={{ ...s.veld, minHeight: 64, resize: "vertical" }} />
              <input tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })}
                style={{ position: "absolute", left: -9999, width: 1, height: 1, opacity: 0 }} aria-hidden="true" />
              {fout && <div style={s.fout}>{fout}</div>}
              <button type="submit" disabled={bezig} style={s.knop}>{bezig ? "Bezig…" : "Afspraak bevestigen"}</button>
              <p style={{ ...s.klein, marginTop: 8 }}>We gebruiken je gegevens alleen voor deze afspraak.</p>
            </form>
          )}
          {fout && !tijd && <div style={s.fout}>{fout}</div>}
        </div>
      )}
    </div>
  );
}

function stijlen(kleur, op) {
  const rand = "1px solid rgba(26,43,61,.14)";
  return {
    kaart: { background: "#fff", color: "#1A2B3D", border: rand, borderRadius: 18, padding: 18, maxWidth: 560, margin: "0 auto",
      boxShadow: "0 10px 30px rgba(26,43,61,.08)", fontFamily: "inherit", textAlign: "left", position: "relative" },
    test: { background: "#FFF6E5", border: "1px solid #F1D9A6", color: "#6B4E12", borderRadius: 12, padding: "10px 12px", fontSize: 13.5, lineHeight: 1.45, marginBottom: 14 },
    stappen: { display: "flex", gap: 6, listStyle: "none", padding: 0, margin: "0 0 14px", flexWrap: "wrap" },
    stapItem: (af, nu) => ({ fontSize: 12.5, fontWeight: 700, padding: "4px 10px", borderRadius: 999,
      background: nu ? kleur : af ? "rgba(26,43,61,.08)" : "transparent", color: nu ? op : "#4A5560", border: nu ? "none" : rand }),
    tabs: { display: "flex", gap: 6, overflowX: "auto", marginBottom: 12, paddingBottom: 2 },
    tab: (aan) => ({ border: aan ? "none" : rand, background: aan ? kleur : "#fff", color: aan ? op : "#1A2B3D", borderRadius: 999,
      padding: "8px 14px", fontWeight: 700, fontSize: 14, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit" }),
    behandeling: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, width: "100%", border: rand,
      background: "#fff", borderRadius: 12, padding: "12px 14px", cursor: "pointer", fontSize: 15, color: "#1A2B3D", fontFamily: "inherit" },
    terug: { background: "none", border: "none", padding: 0, marginBottom: 12, color: "#4A5560", cursor: "pointer", fontSize: 13.5, fontFamily: "inherit", textAlign: "left" },
    label: { fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.4, color: "#6F7A85", margin: "4px 0 8px" },
    dagen: { display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6, marginBottom: 10 },
    dag: (aan) => ({ flex: "0 0 auto", width: 62, display: "flex", flexDirection: "column", alignItems: "center", gap: 1, padding: "8px 0",
      borderRadius: 12, border: aan ? "none" : rand, background: aan ? kleur : "#fff", color: aan ? op : "#1A2B3D", cursor: "pointer", fontFamily: "inherit" }),
    tijden: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(76px, 1fr))", gap: 8 },
    tijd: { border: rand, background: "#fff", borderRadius: 10, padding: "10px 0", fontWeight: 700, fontSize: 15, cursor: "pointer", color: "#1A2B3D", fontFamily: "inherit" },
    veld: { display: "block", width: "100%", boxSizing: "border-box", border: rand, borderRadius: 10, padding: "11px 12px", fontSize: 15,
      marginBottom: 8, fontFamily: "inherit", color: "#1A2B3D", background: "#fff" },
    knop: { width: "100%", border: "none", background: kleur, color: op, borderRadius: 999, padding: "13px 18px", fontWeight: 800, fontSize: 16, cursor: "pointer", fontFamily: "inherit" },
    knopKlein: { border: "none", background: kleur, color: op, borderRadius: 999, padding: "8px 14px", fontWeight: 700, fontSize: 13.5, cursor: "pointer", fontFamily: "inherit" },
    knopLicht: { border: rand, background: "#fff", color: "#1A2B3D", borderRadius: 999, padding: "10px 16px", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" },
    fout: { color: "#9E3B2E", background: "#F6E1DB", borderRadius: 8, padding: "8px 10px", fontSize: 13.5, margin: "6px 0 8px" },
    kop: { fontSize: 20, fontWeight: 800, margin: "6px 0" },
    tekst: { fontSize: 15, lineHeight: 1.5, margin: "6px 0" },
    klein: { fontSize: 13, color: "#6F7A85", lineHeight: 1.45 },
    vink: { width: 48, height: 48, borderRadius: 999, background: kleur, color: op, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 800 },
  };
}
