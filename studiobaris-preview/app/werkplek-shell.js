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

      <header style={{ position: "sticky", top: 0, zIndex: 20, background: "rgba(251,247,240,.9)", backdropFilter: "blur(8px)", borderBottom: `1px solid ${KLEUR.lijn}` }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "12px 20px", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: KLEUR.klei, color: "#fff", display: "grid", placeItems: "center", fontFamily: HEAD, fontWeight: 800, fontSize: 16 }}>S</div>
          <div style={{ lineHeight: 1.1 }}>
            <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 15 }}>StudioBaris</div>
            <div style={{ fontSize: 11, color: KLEUR.label, textTransform: "uppercase", letterSpacing: 1 }}>werkplek</div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 13, color: KLEUR.gedempt, whiteSpace: "nowrap" }}>
              Ingelogd als <strong style={{ color: KLEUR.inkt }}>{naam}</strong>
            </span>
            <Knop href="/api/auth/logout" kind="secondair" klein>Uitloggen</Knop>
          </div>
        </div>
        {/* Navigatie: het actieve scherm is een gevulde pil, dus je ziet in één oogopslag waar je bent. */}
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 20px 8px", display: "flex", gap: 6, overflowX: "auto" }}>
          {/* Altijd bij de hand: een nieuwe preview beginnen, vanaf elk scherm. */}
          <a
            href="/intake"
            style={{
              padding: "9px 14px", borderRadius: 999, fontSize: 14, fontWeight: 700,
              color: "#fff", background: KLEUR.klei, textDecoration: "none", whiteSpace: "nowrap",
              flex: "0 0 auto", display: "inline-flex", alignItems: "center", gap: 6,
            }}
          >
            + Nieuwe preview
          </a>
          {NAV.filter((n) => beheer || !n.beheer).map((n) => {
            const aan = n.href === actief;
            return (
              <a
                key={n.href}
                href={n.href}
                style={{
                  padding: "9px 14px", borderRadius: 999, fontSize: 14,
                  fontWeight: aan ? 700 : 600,
                  color: aan ? "#fff" : "#7A7168",
                  background: aan ? KLEUR.klei : "transparent",
                  textDecoration: "none", whiteSpace: "nowrap",
                }}
              >
                {n.label}
              </a>
            );
          })}
        </div>
      </header>

      <main style={{ maxWidth: 1120, margin: "0 auto", padding: "24px 20px 90px" }}>
        {(titel || rechts) && (
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
            <div>
              {titel && <h1 style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 29, margin: 0 }}>{titel}</h1>}
              {sub && <p style={{ color: KLEUR.gedempt, fontSize: 15, marginTop: 4, marginBottom: 0 }}>{sub}</p>}
            </div>
            {rechts && <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{rechts}</div>}
          </div>
        )}
        {children}
      </main>
    </div>
  );
}

// Eén knop voor de hele werkplek, zodat knoppen overal hetzelfde ogen en goed opvallen.
// kind: "primair" (oranje, de hoofdactie) | "secondair" (wit met rand) | "stil" (alleen tekst)
export function Knop({ href, onClick, kind = "secondair", klein, children, style, ...rest }) {
  const soorten = {
    primair: { background: KLEUR.klei, color: "#fff", border: `1px solid ${KLEUR.klei}` },
    secondair: { background: "#fff", color: KLEUR.inkt, border: `1px solid ${KLEUR.lijn2}` },
    stil: { background: "transparent", color: KLEUR.gedempt, border: "1px solid transparent" },
  };
  const basis = {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7,
    fontFamily: "inherit", fontWeight: 700, textDecoration: "none", cursor: "pointer",
    whiteSpace: "nowrap", borderRadius: 10,
    fontSize: klein ? 13 : 14,
    padding: klein ? "7px 12px" : "10px 16px",
    ...(soorten[kind] || soorten.secondair),
    ...style,
  };
  if (href) return <a href={href} style={basis} {...rest}>{children}</a>;
  return <button type="button" onClick={onClick} style={basis} {...rest}>{children}</button>;
}

// Kleine, herbruikbare bouwstenen in de nieuwe stijl.
export function Chip({ children, kleur }) {
  const bg = { klei: KLEUR.kleiZacht, sage: KLEUR.sage.bg, amber: KLEUR.amber.bg, rust: KLEUR.rust.bg, grijs: KLEUR.grijs.bg }[kleur] || KLEUR.grijs.bg;
  const tk = { klei: KLEUR.klei, sage: KLEUR.sage.tekst, amber: KLEUR.amber.tekst, rust: KLEUR.rust.tekst, grijs: KLEUR.grijs.tekst }[kleur] || KLEUR.grijs.tekst;
  return <span style={{ display: "inline-block", background: bg, color: tk, fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 999 }}>{children}</span>;
}
