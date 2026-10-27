"use client";

import { useState, useRef } from "react";
import { KLEUR, HEAD, BODY, NAV_BEHEER, NAV_VERKOPER } from "./werkplek-stijl";
import WerkplekIcoon from "./werkplek-icoon";

// Eén navigatiegroep (bijv. "Financieel") als knop met een uitklapmenu.
// Vervangt meerdere losse tabbladen door één, zodat de balk overzichtelijk blijft.
function NavGroep({ groep, actief }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const btnRef = useRef(null);
  const aan = groep.items.some((n) => n.href === actief);

  // Uitklapmenu positioneren t.o.v. de knop en met position:fixed tonen, zodat
  // het altijd boven de rest van de pagina ligt.
  function toggle() {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 6, left: r.left });
    }
    setOpen((v) => !v);
  }

  return (
    <div style={{ position: "relative", flex: "0 0 auto" }}>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        style={{
          padding: "9px 14px", borderRadius: 999, fontSize: 14,
          fontWeight: aan ? 700 : 600,
          color: aan ? "#fff" : KLEUR.gedempt,
          background: aan ? KLEUR.navy : "transparent",
          border: "none", cursor: "pointer", whiteSpace: "nowrap",
          fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 5,
        }}
      >
        {groep.label}
        <span style={{ fontSize: 10, opacity: 0.8 }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && pos && (
        <div
          style={{
            position: "fixed", top: pos.top, left: pos.left, zIndex: 50,
            background: "#fff", border: `1px solid ${KLEUR.lijn2}`, borderRadius: 12,
            boxShadow: "0 8px 24px rgba(43,39,36,.12)", padding: 6, minWidth: 180,
          }}
        >
          {groep.items.map((n) => {
            const itemAan = n.href === actief;
            return (
              <a
                key={n.href}
                href={n.href}
                style={{
                  display: "block", padding: "8px 12px", borderRadius: 8, fontSize: 14,
                  fontWeight: itemAan ? 700 : 500,
                  color: itemAan ? KLEUR.klei : KLEUR.inkt,
                  background: itemAan ? KLEUR.kleiZacht : "transparent",
                  textDecoration: "none", whiteSpace: "nowrap",
                }}
              >
                {n.label}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Eén losse knop in de navigatie.
function NavLink({ n, aan }) {
  return (
    <a
      href={n.href}
      style={{
        padding: "9px 14px", borderRadius: 999, fontSize: 14,
        fontWeight: aan ? 700 : 600,
        color: aan ? "#fff" : KLEUR.gedempt,
        background: aan ? KLEUR.navy : "transparent",
        textDecoration: "none", whiteSpace: "nowrap", flex: "0 0 auto",
      }}
    >
      {n.label}
    </a>
  );
}

// De gedeelde schil voor alle werkplek-schermen: kop met logo, navigatie, crème achtergrond
// en de juiste fonts. Zo voelt elk scherm als één product. De inhoud van het scherm
// geef je mee als children.
export default function WerkplekShell({ naam, beheer, actief, titel, sub, rechts, children }) {
  return (
    <div style={{ minHeight: "100vh", background: KLEUR.papier, color: KLEUR.inkt, fontFamily: BODY }}>

      <WerkplekIcoon />
      {/* Op een telefoon is er geen ruimte voor "werkplek" en "Ingelogd als …" naast het logo. */}
      <style>{`@media (max-width: 600px) { .wp-smal-weg { display: none !important; } }`}</style>
      <header style={{ position: "sticky", top: 0, zIndex: 20, background: "rgba(247,244,238,.92)", backdropFilter: "blur(8px)", borderBottom: `1px solid ${KLEUR.lijn2}` }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "12px 20px", display: "flex", alignItems: "center", gap: 12 }}>
          {/* Logo uit de huisstijl (Drive: Logo's / studiobaris-alle-logos / wordmark-navy.svg). */}
          <a href={beheer ? "/vandaag" : "/klanten"} style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }} aria-label="StudioBaris werkplek">
            <img src="/werkplek/wordmark-navy.svg" alt="StudioBaris" width={124} height={40} style={{ display: "block", height: 40, width: "auto" }} />
            <span className="wp-smal-weg" style={{ fontSize: 11, fontWeight: 700, color: KLEUR.goudTekst, textTransform: "uppercase", letterSpacing: 1, paddingTop: 4 }}>werkplek</span>
          </a>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
            <span className="wp-smal-weg" style={{ fontSize: 13, color: KLEUR.gedempt, whiteSpace: "nowrap" }}>
              Ingelogd als <strong style={{ color: KLEUR.inkt }}>{naam}</strong>
            </span>
            <Knop href="/api/auth/logout" kind="secondair" klein>Uitloggen</Knop>
          </div>
        </div>
        {/* Navigatie: het actieve scherm is een gevulde navy pil. Past de rij niet
            (smal scherm), dan loopt hij door naar een tweede regel i.p.v. te scrollen. */}
        <nav style={{ maxWidth: 1120, margin: "0 auto", padding: "0 20px 10px", display: "flex", flexWrap: "wrap", gap: 6 }}>
          {/* De ene gouden hoofdknop: een nieuwe preview beginnen, vanaf elk scherm. */}
          <a
            href="/intake"
            style={{
              padding: "9px 16px", borderRadius: 999, fontSize: 14, fontWeight: 700,
              color: KLEUR.navy, background: KLEUR.goud, textDecoration: "none", whiteSpace: "nowrap",
              flex: "0 0 auto", display: "inline-flex", alignItems: "center", gap: 6,
              boxShadow: "0 4px 12px rgba(199,154,86,.30)",
            }}
          >
            + Nieuwe preview
          </a>
          {(beheer ? NAV_BEHEER : NAV_VERKOPER).map((n) =>
            n.items ? (
              <NavGroep key={n.label} groep={n} actief={actief} />
            ) : (
              <NavLink key={n.href} n={n} aan={n.href === actief} />
            )
          )}
        </nav>
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
// kind: "primair" (navy, de hoofdactie) | "goud" (alleen de ene hoofdknop per scherm) | "secondair" (wit met rand) | "stil" (alleen tekst)
export function Knop({ href, onClick, kind = "secondair", klein, children, style, ...rest }) {
  const soorten = {
    primair: { background: KLEUR.navy, color: "#fff", border: `1px solid ${KLEUR.navy}` },
    goud: { background: KLEUR.goud, color: KLEUR.navy, border: `1px solid ${KLEUR.goud}` },
    secondair: { background: "#fff", color: KLEUR.inkt, border: `1px solid ${KLEUR.lijn2}` },
    stil: { background: "transparent", color: KLEUR.gedempt, border: "1px solid transparent" },
  };
  const basis = {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7,
    fontFamily: "inherit", fontWeight: 700, textDecoration: "none", cursor: "pointer",
    whiteSpace: "nowrap", borderRadius: 999,
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
