"use client";

// Menuknop voor mobiel. Op een telefoon is de gewone menubalk (Home,
// Diensten, Projecten, Over, Contact) verborgen omdat hij de kop over twee
// regels liet lopen; deze knop klapt dezelfde links uit onder de kop.
// Alleen zichtbaar onder `tot` pixels breed (zelfde grens als waar de stijl
// zijn gewone menu verbergt).

import { useEffect, useState } from "react";

const LINKS = [
  ["#home", "Home"],
  ["#diensten", "Diensten"],
  ["#werk", "Projecten"],
  ["#over", "Over ons"],
  ["#contact", "Contact"],
];

export default function MobielMenu({ tot = 700, donker = false }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const esc = (e) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open]);

  const kleur = donker
    ? { tekst: "#fff", rand: "rgba(255,255,255,.35)", paneel: "#15191C", lijn: "#262C30" }
    : { tekst: "#111827", rand: "rgba(17,24,39,.18)", paneel: "#fff", lijn: "#EEF0F3" };

  const css = `
    .sbm-knop{display:none}
    .sbm-paneel{display:none}
    @media(max-width:${tot}px){
      .sbm-knop{display:grid;place-items:center;width:44px;height:44px;flex:none;border-radius:10px;border:1px solid ${kleur.rand};background:transparent;color:${kleur.tekst};cursor:pointer;padding:0}
      .sbm-paneel.open{display:block;position:absolute;left:0;right:0;top:100%;z-index:55;background:${kleur.paneel};border-bottom:1px solid ${kleur.lijn};box-shadow:0 12px 24px rgba(0,0,0,.14)}
      .sbm-rij{flex:none}
      .sbm-rij .cta{font-size:.8rem;padding:.55rem .75rem;white-space:nowrap}
      *:has(> .sbm-rij){flex-wrap:nowrap !important}
      *:has(> .sbm-rij) > :first-child{min-width:0;flex:0 1 auto;overflow:hidden}
      *:has(> .sbm-rij) > :first-child img{max-width:100%;object-fit:contain}
      .sbm-paneel a{display:block;padding:14px 22px;font-size:16px;font-weight:600;color:${kleur.tekst};border-top:1px solid ${kleur.lijn};text-decoration:none}
    }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <button type="button" className="sbm-knop" aria-label={open ? "Menu sluiten" : "Menu openen"} aria-expanded={open} onClick={() => setOpen(!open)}>
        {open ? (
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
        ) : (
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
        )}
      </button>
      <nav className={"sbm-paneel" + (open ? " open" : "")} aria-label="Menu">
        {LINKS.map(([href, tekst]) => (
          <a key={href} href={href} onClick={() => setOpen(false)}>{tekst}</a>
        ))}
      </nav>
    </>
  );
}
