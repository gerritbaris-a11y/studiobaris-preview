"use client";

import { useState } from "react";
import { KLEUR, redenKleur, HEAD, BODY } from "../werkplek-stijl";
import WerkplekShell from "../werkplek-shell";

const FASES = ["Lead", "Preview", "Verstuurd", "Feedback", "Akkoord", "Betaald", "Live"];

function dagdeelGroet() {
  const u = new Date().getHours();
  if (u < 6) return "Goedenacht";
  if (u < 12) return "Goedemorgen";
  if (u < 18) return "Goedemiddag";
  return "Goedenavond";
}

function Dot({ kleur, groot }) {
  const m = redenKleur(kleur);
  const d = groot ? 10 : 8;
  return <span style={{ width: d, height: d, borderRadius: d, background: m.dot, flex: "0 0 auto", display: "inline-block" }} />;
}

function RedenChip({ reden, tijd, kleur }) {
  const m = redenKleur(kleur);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 7, background: m.bg, color: m.tekst, fontSize: 12, fontWeight: 700, padding: "4px 11px", borderRadius: 999 }}>
      <Dot kleur={kleur} />
      {reden}{tijd ? ` · ${tijd}` : ""}
    </span>
  );
}

function FaseBalk({ fase }) {
  return (
    <div style={{ display: "flex", gap: 3, marginTop: 4 }}>
      {FASES.map((f, i) => {
        let bg = "#F1ECE3", kl = "#B9AFA1";
        if (i < fase) { bg = KLEUR.sage.bg; kl = KLEUR.sage.tekst; }
        else if (i === fase) { bg = KLEUR.inkt; kl = KLEUR.papier; }
        return (
          <div key={f} style={{ flex: 1, textAlign: "center", fontSize: 10, fontWeight: 700, textTransform: "uppercase", padding: "6px 2px", borderRadius: 7, background: bg, color: kl, letterSpacing: 0.3 }}>{f}</div>
        );
      })}
    </div>
  );
}

function Knop({ kind = "primair", children, onClick }) {
  const stijl = {
    primair: { background: KLEUR.klei, color: "#fff", border: "none" },
    secundair: { background: "#fff", color: KLEUR.inkt, border: `1px solid ${KLEUR.lijn2}` },
    ghost: { background: "none", color: "#9A9084", border: "none" },
  }[kind];
  return (
    <button onClick={onClick} style={{ ...stijl, borderRadius: 10, padding: "10px 16px", fontSize: 13, fontWeight: kind === "primair" ? 700 : 600, cursor: "pointer", fontFamily: BODY, whiteSpace: "nowrap" }}>
      {children}
    </button>
  );
}

// Zelfde redenen als in de leadlijst, zodat het archief consistent blijft.
const REDENEN = ["Goede website", "Niet actief", "Geen ZZP / eenmanszaak", "Overig"];

// Past een voorgestelde lead niet? Meteen wegzetten met een reden.
function ArchiveerKeuze({ t, i, archiveer }) {
  if (!t.lead_id) return null;
  return (
    <select
      defaultValue=""
      onChange={(e) => { const r = e.target.value; e.target.value = ""; archiveer(t, i, r); }}
      title="Past deze lead niet? Archiveer hem met een reden."
      style={{ fontSize: 12.5, fontWeight: 600, color: "#7A7168", background: "#fff", border: `1px solid ${KLEUR.lijn2}`, borderRadius: 9, padding: "8px 10px", fontFamily: BODY, cursor: "pointer" }}
    >
      <option value="">Past niet…</option>
      {REDENEN.map((r) => <option key={r} value={r}>{r}</option>)}
    </select>
  );
}

export default function VandaagClient({ taken, naam, beheer }) {
  const [variant, setVariant] = useState("A"); // A = werkstapel, B = triage-bord
  const [gedaan, setGedaan] = useState([]);

  function sleutel(t, i) { return (t.slug || "lead") + "-" + i; }
  const open = taken.filter((t, i) => !gedaan.includes(sleutel(t, i)));
  function afhandelen(t, i) { setGedaan((g) => [...g, sleutel(t, i)]); }

  // Archiveren met reden: verdwijnt hier én uit de leadstapel, blijft in het archief.
  async function archiveer(t, i, reden) {
    if (!reden || !t.lead_id) return;
    if (reden === "Overig") {
      const eigen = window.prompt("Waarom past " + (t.klant || "deze lead") + " niet?");
      if (!eigen || !eigen.trim()) return;
      reden = "Overig: " + eigen.trim();
    }
    afhandelen(t, i);
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: t.lead_id, archief_reden: reden }),
      });
    } catch {}
  }

  const nu = open.filter((t) => t.lane === "nu");
  const loopt = open.filter((t) => t.lane === "loopt");
  const wacht = open.filter((t) => t.lane === "wacht");

  return (
    <WerkplekShell
      naam={naam}
      beheer={beheer}
      actief="/vandaag"
      titel={`${dagdeelGroet()}, ${naam}`}
      sub={open.length === 0 ? "Niets meer te doen. Mooi werk." : `${open.length} ${open.length === 1 ? "ding vraagt" : "dingen vragen"} je aandacht${nu.length ? `, waarvan ${nu.length} nú` : ""}.`}
      rechts={
        <div style={{ display: "inline-flex", background: "#fff", border: `1px solid ${KLEUR.lijn2}`, borderRadius: 10, padding: 3 }}>
          {[["A", "Werkstapel"], ["B", "Triage-bord"]].map(([v, lab]) => (
            <button key={v} onClick={() => setVariant(v)} style={{ border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: BODY, background: variant === v ? KLEUR.inkt : "transparent", color: variant === v ? KLEUR.papier : KLEUR.gedempt }}>{lab}</button>
          ))}
        </div>
      }
    >
      {nu.length === 0 && loopt.length === 0 && wacht.length === 0 ? (
        <LegeStaat onReset={() => setGedaan([])} />
      ) : variant === "A" ? (
        <Werkstapel taken={open} nu={nu} afhandelen={afhandelen} archiveer={archiveer} sleutel={sleutel} />
      ) : (
        <Triage nu={nu} loopt={loopt} wacht={wacht} afhandelen={afhandelen} archiveer={archiveer} sleutel={sleutel} taken={open} />
      )}
    </WerkplekShell>
  );
}

// --- Variant A: werkstapel (top 3 groot, rest compact) ---
function Werkstapel({ taken, nu, afhandelen, archiveer, sleutel }) {
  // De taken komen al op prioriteit binnen. Toon de drie belangrijkste groot,
  // ongeacht hun baan - anders voelt het scherm leeg terwijl er werk ligt.
  const top = taken.slice(0, 3);
  const rest = taken.slice(3);

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {top.map((t, k) => {
          const i = taken.indexOf(t);
          const m = redenKleur(t.kleur);
          return (
            <div key={sleutel(t, i)} style={{ background: "#fff", border: `1px solid ${KLEUR.lijn}`, borderLeft: `4px solid ${m.dot}`, borderRadius: 16, padding: 20, display: "flex", gap: 18, boxShadow: "0 1px 3px rgba(43,39,36,.05)" }}>
              <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 34, color: "#E6DCCB", lineHeight: 1, flex: "0 0 auto", width: 30 }}>{k + 1}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <RedenChip reden={t.reden} tijd={t.tijd} kleur={t.kleur} />
                <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 20, marginTop: 8 }}>{t.klant}</div>
                <div style={{ fontSize: 13, color: KLEUR.labelDonker, marginTop: 2 }}>{t.vak}{t.verkoper ? ` · via ${t.verkoper}` : ""}</div>
                <FaseBalk fase={t.fase} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "stretch", flex: "0 0 auto" }}>
                <Knop kind="primair">{t.prim}</Knop>
                {t.sec && <Knop kind="secundair">{t.sec}</Knop>}
                <button onClick={() => afhandelen(t, i)} style={{ background: "none", border: "none", color: "#9A9084", fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: BODY, padding: "2px 0" }}>Afgehandeld ✓</button>
                <ArchiveerKeuze t={t} i={i} archiveer={archiveer} />
              </div>
            </div>
          );
        })}
      </div>

      {rest.length > 0 && (
        <section style={{ marginTop: 26 }}>
          <h2 style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 13, textTransform: "uppercase", letterSpacing: 0.5, color: KLEUR.label, marginBottom: 10 }}>Verder deze week</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {rest.map((t) => {
              const i = taken.indexOf(t);
              return (
                <div key={sleutel(t, i)} style={{ background: "#fff", border: `1px solid ${KLEUR.lijn}`, borderRadius: 12, padding: "11px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                  <Dot kleur={t.kleur} />
                  <strong style={{ fontSize: 14 }}>{t.klant}</strong>
                  <span style={{ fontSize: 13, color: KLEUR.labelDonker }}>{t.reden}{t.tijd ? ` · ${t.tijd}` : ""}</span>
                  <span style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}><ArchiveerKeuze t={t} i={i} archiveer={archiveer} /><Knop kind="secundair">{t.prim}</Knop></span>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}

// --- Variant B: triage-bord (drie banen) ---
function Triage({ nu, loopt, wacht, afhandelen, archiveer, sleutel, taken }) {
  const tellers = [
    ["Nu oppakken", nu, "rust"],
    ["Loopt, in de gaten", loopt, "grijs"],
    ["Wacht op klant", wacht, "amber"],
  ];
  return (
    <>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        {tellers.map(([titel, lijst, kleur]) => (
          <div key={titel} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#fff", border: `1px solid ${KLEUR.lijn}`, borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 600, color: KLEUR.gedempt }}>
            <Dot kleur={kleur} groot />{lijst.length} {titel.toLowerCase()}
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
        {tellers.map(([titel, lijst, kleur]) => (
          <div key={titel} style={{ background: KLEUR.baan, border: `1px solid ${KLEUR.baanRand}`, borderRadius: 16, padding: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <Dot kleur={kleur} groot />
              <span style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 14 }}>{titel}</span>
              <span style={{ marginLeft: "auto", fontSize: 13, color: KLEUR.label, fontWeight: 700 }}>{lijst.length}</span>
            </div>
            {lijst.length === 0 ? (
              <p style={{ color: KLEUR.label, fontSize: 13, fontStyle: "italic", padding: "8px 2px" }}>Niets hier.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {lijst.map((t) => {
                  const i = taken.indexOf(t);
                  return (
                    <div key={sleutel(t, i)} style={{ background: "#fff", border: `1px solid ${KLEUR.lijn}`, borderRadius: 12, padding: 13 }}>
                      <RedenChip reden={t.reden} tijd={t.tijd} kleur={t.kleur} />
                      <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 16, marginTop: 7 }}>{t.klant}</div>
                      <div style={{ fontSize: 12.5, color: KLEUR.labelDonker, marginTop: 1 }}>{t.vak}{t.verkoper ? ` · ${t.verkoper}` : ""}</div>
                      <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                        <button onClick={() => afhandelen(t, i)} style={{ flex: 1, background: KLEUR.klei, color: "#fff", border: "none", borderRadius: 9, padding: "9px 12px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: BODY }}>{t.prim}</button>
                        <ArchiveerKeuze t={t} i={i} archiveer={archiveer} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

function LegeStaat({ onReset }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${KLEUR.lijn}`, borderRadius: 16, padding: "40px 24px", textAlign: "center" }}>
      <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 20 }}>Niets urgents meer. Mooi werk.</div>
      <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 16 }}>
        <a href="/leads"><Knop kind="primair">Naar de leadstapel</Knop></a>
        <span onClick={onReset}><Knop kind="secundair">Zet taken terug</Knop></span>
      </div>
    </div>
  );
}
