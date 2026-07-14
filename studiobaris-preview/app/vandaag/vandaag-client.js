"use client";

import { useState } from "react";
import { KLEUR, redenKleur, HEAD, BODY, NAV } from "../werkplek-stijl";

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

export default function VandaagClient({ taken, naam, beheer }) {
  const [variant, setVariant] = useState("A"); // A = werkstapel, B = triage-bord
  const [gedaan, setGedaan] = useState([]);

  function sleutel(t, i) { return (t.slug || "lead") + "-" + i; }
  const open = taken.filter((t, i) => !gedaan.includes(sleutel(t, i)));
  function afhandelen(t, i) { setGedaan((g) => [...g, sleutel(t, i)]); }

  const nu = open.filter((t) => t.lane === "nu");
  const loopt = open.filter((t) => t.lane === "loopt");
  const wacht = open.filter((t) => t.lane === "wacht");

  const paginaAchtergrond = { minHeight: "100vh", background: KLEUR.papier, color: KLEUR.inkt, fontFamily: BODY };
  const shell = { maxWidth: 1120, margin: "0 auto", padding: "24px 20px 90px" };

  return (
    <div style={paginaAchtergrond}>
      {/* Kop */}
      <header style={{ position: "sticky", top: 0, zIndex: 20, background: "rgba(251,247,240,.85)", backdropFilter: "blur(8px)", borderBottom: `1px solid ${KLEUR.lijn}` }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "12px 20px", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: KLEUR.klei, color: "#fff", display: "grid", placeItems: "center", fontFamily: HEAD, fontWeight: 800, fontSize: 16 }}>S</div>
          <div style={{ lineHeight: 1.1 }}>
            <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 15 }}>StudioBaris</div>
            <div style={{ fontSize: 11, color: KLEUR.label, textTransform: "uppercase", letterSpacing: 1 }}>werkplek</div>
          </div>
          <span style={{ marginLeft: "auto", fontSize: 13, color: KLEUR.gedempt }}>
            Ingelogd als <strong style={{ color: KLEUR.inkt }}>{naam}</strong>
            {" · "}
            <a href="/api/auth/logout" style={{ color: KLEUR.klei }}>Uitloggen</a>
          </span>
        </div>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 20px", display: "flex", gap: 18, overflowX: "auto" }}>
          {NAV.filter((n) => beheer || !n.beheer).map((n) => {
            const aan = n.href === "/vandaag";
            return (
              <a key={n.href} href={n.href} style={{ padding: "10px 0", fontSize: 14, fontWeight: aan ? 700 : 500, color: aan ? KLEUR.klei : "#7A7168", borderBottom: aan ? `2px solid ${KLEUR.klei}` : "2px solid transparent", whiteSpace: "nowrap" }}>{n.label}</a>
            );
          })}
        </div>
      </header>

      <main style={shell}>
        {/* Begroeting + toggle */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
          <div>
            <h1 style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 29 }}>{dagdeelGroet()}, {naam}</h1>
            <p style={{ color: KLEUR.gedempt, fontSize: 15, marginTop: 4 }}>
              {nu.length === 0 ? "Niets urgents op dit moment." : `${nu.length} ${nu.length === 1 ? "ding vraagt" : "dingen vragen"} nú je aandacht.`}
            </p>
          </div>
          <div style={{ display: "inline-flex", background: "#fff", border: `1px solid ${KLEUR.lijn2}`, borderRadius: 10, padding: 3 }}>
            {[["A", "Werkstapel"], ["B", "Triage-bord"]].map(([v, lab]) => (
              <button key={v} onClick={() => setVariant(v)} style={{ border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: BODY, background: variant === v ? KLEUR.inkt : "transparent", color: variant === v ? KLEUR.papier : KLEUR.gedempt }}>{lab}</button>
            ))}
          </div>
        </div>

        {nu.length === 0 && loopt.length === 0 && wacht.length === 0 ? (
          <LegeStaat onReset={() => setGedaan([])} />
        ) : variant === "A" ? (
          <Werkstapel taken={open} nu={nu} afhandelen={afhandelen} sleutel={sleutel} />
        ) : (
          <Triage nu={nu} loopt={loopt} wacht={wacht} afhandelen={afhandelen} sleutel={sleutel} taken={open} />
        )}
      </main>
    </div>
  );
}

// --- Variant A: werkstapel (top 3 groot, rest compact) ---
function Werkstapel({ taken, nu, afhandelen, sleutel }) {
  const top = [...nu].slice(0, 3);
  const topSleutels = top.map((t) => taken.indexOf(t));
  const rest = taken.filter((t) => !top.includes(t));

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
                  <span style={{ marginLeft: "auto" }}><Knop kind="secundair">{t.prim}</Knop></span>
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
function Triage({ nu, loopt, wacht, afhandelen, sleutel, taken }) {
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
