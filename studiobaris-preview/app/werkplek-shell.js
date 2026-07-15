"use client";

import { KLEUR, HEAD, BODY, FONT_LINK, NAV } from "./werkplek-stijl";

// De gedeelde schil voor alle werkplek-schermen: warme kop, navigatie, papier-achtergrond
// en de juiste fonts. Zo voelt elk scherm als één product. De inhoud van het scherm
// geef je mee als children.
export default function WerkplekShell({ naam, beheer, actief, titel, sub, rechts, children }) {
  return (
    <div style={{ minHeight: "100vh", background: KLEUR.papier, color: KLEUR.inkt, fontFamily: BODY }}>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={FONT_LINK} />

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
            const aan = n.href === actief;
            return (
              <a key={n.href} href={n.href} style={{ padding: "10px 0", fontSize: 14, fontWeight: aan ? 700 : 500, color: aan ? KLEUR.klei : "#7A7168", borderBottom: aan ? `2px solid ${KLEUR.klei}` : "2px solid transparent", whiteSpace: "nowrap" }}>{n.label}</a>
            );
          })}
        </div>
      </header>

      <main style={{ maxWidth: 1120, margin: "0 auto", padding: "24px 20px 90px" }}>
        {(titel || rechts) && (
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
            <div>
              {titel && <h1 style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 29 }}>{titel}</h1>}
              {sub && <p style={{ color: KLEUR.gedempt, fontSize: 15, marginTop: 4 }}>{sub}</p>}
            </div>
            {rechts}
          </div>
        )}
        {children}
      </main>
    </div>
  );
}

// Kleine, herbruikbare bouwstenen in de nieuwe stijl.
export function Chip({ children, kleur }) {
  const bg = { klei: KLEUR.kleiZacht, sage: KLEUR.sage.bg, amber: KLEUR.amber.bg, rust: KLEUR.rust.bg, grijs: KLEUR.grijs.bg }[kleur] || KLEUR.grijs.bg;
  const tk = { klei: KLEUR.klei, sage: KLEUR.sage.tekst, amber: KLEUR.amber.tekst, rust: KLEUR.rust.tekst, grijs: KLEUR.grijs.tekst }[kleur] || KLEUR.grijs.tekst;
  return <span style={{ display: "inline-block", background: bg, color: tk, fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 999 }}>{children}</span>;
}
