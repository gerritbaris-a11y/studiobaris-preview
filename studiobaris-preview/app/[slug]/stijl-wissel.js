"use client";

// Stijlwisselaar op de preview van de klant.
// - Knop "Andere stijl bekijken" zweeft onderaan (boven de proefbalk).
//   Klapt de prospect de proefbalk in, dan verdwijnt deze knop mee
//   (kenmerk data-sbdicht op <html>, gezet door proef-balk.js).
// - Paneel met alle stijlen: tikken = de hele site wisselt meteen naar die
//   stijl (zelfde teksten en foto's). Dat onthouden we in een sessie-cookie
//   (sbk_<slug>), zodat de server de juiste stijl rendert, ook na herladen.
// - "Deze stijl kies ik" slaat de keuze op (wordt de stijl van de preview en
//   verschijnt als badge in het dashboard). Daarna mag de klant nog wisselen.
// Niet zichtbaar in een iframe (Stijl kiezen-pagina van het team).

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { STIJLEN as VAK_STIJLEN } from "../../lib/stijlen";

const MONSTER = {
  stoer: { bg: "#1F2328", fg: "#fff", font: "system-ui,sans-serif", gewicht: 800, tekst: "Aa", rand: "transparent" },
  modern: { bg: "#fff", fg: "#10151F", font: "system-ui,sans-serif", gewicht: 800, tekst: "Aa", rand: "#E3E8DE" },
  persoonlijk: { bg: "#FDF3E7", fg: "#2A2018", font: "system-ui,sans-serif", gewicht: 700, tekst: "Aa", rand: "transparent" },
  ambacht: { bg: "#F4EEE3", fg: "#2A241D", font: "Georgia,'Times New Roman',serif", gewicht: 500, tekst: "Aa", rand: "transparent" },
  strak: { bg: "#0F1214", fg: "#fff", font: "system-ui,sans-serif", gewicht: 900, tekst: "AA", rand: "transparent" },
  // Salonstijlen
  zacht: { bg: "#FBF6F2", fg: "#2B2320", font: "system-ui,sans-serif", gewicht: 700, tekst: "Aa", rand: "#EADFD7" },
  salonmodern: { bg: "#FFFFFF", fg: "#121417", font: "system-ui,sans-serif", gewicht: 800, tekst: "AA", rand: "#E4E7EB" },
  luxe: { bg: "#111111", fg: "#F3EFE8", font: "system-ui,sans-serif", gewicht: 700, tekst: "AA", rand: "transparent" },
  natuurlijk: { bg: "#F2F0E8", fg: "#26302A", font: "Georgia,'Times New Roman',serif", gewicht: 500, tekst: "Aa", rand: "#DDDBCD" },
};

function leesLokaal(k) {
  try { return window.localStorage.getItem(k); } catch { return null; }
}
function zetLokaal(k, v) {
  try { window.localStorage.setItem(k, v); } catch {}
}

export default function StijlWissel({ slug, huidige, onze, merk = {}, metBalk, stijlen = null }) {
  const STIJLEN = stijlen || VAK_STIJLEN;
  const router = useRouter();
  const [zichtbaar, setZichtbaar] = useState(false);
  const [open, setOpen] = useState(false);
  const [klaar, setKlaar] = useState(false);
  const [gekozen, setGekozen] = useState(null);
  const [bezig, setBezig] = useState(null);
  const [bewaren, setBewaren] = useState(false);
  const [fout, setFout] = useState("");
  const [onder, setOnder] = useState(16);
  const [laden, startTransition] = useTransition();
  const accent = /^#[0-9a-fA-F]{6}$/.test(merk.secundaire_kleur || "") ? merk.secundaire_kleur : "#FF8300";

  useEffect(() => {
    let inFrame = false;
    try { inFrame = window.self !== window.top; } catch { inFrame = true; }
    if (inFrame) return;
    setZichtbaar(true);
    setGekozen(leesLokaal("sbk_gekozen_" + slug));
    try { if (window.sessionStorage.getItem("sbk_open_" + slug) === "1") setOpen(true); } catch {}
  }, [slug]);

  // Knop netjes boven de proefbalk ("Probeer je eigen app") houden.
  useEffect(() => {
    if (!zichtbaar) return;
    const meet = () => {
      const balk = metBalk ? document.querySelector(".sbp") : null;
      setOnder((balk ? balk.offsetHeight : 0) + 14);
    };
    meet();
    const balk = document.querySelector(".sbp");
    const ro = balk && typeof ResizeObserver !== "undefined" ? new ResizeObserver(meet) : null;
    if (ro) ro.observe(balk);
    window.addEventListener("resize", meet);
    return () => { if (ro) ro.disconnect(); window.removeEventListener("resize", meet); };
  }, [zichtbaar, metBalk]);

  useEffect(() => {
    if (!laden) setBezig(null);
  }, [laden]);

  useEffect(() => {
    if (!open && !klaar) return;
    const esc = (e) => { if (e.key === "Escape") sluit(); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  });

  function onthoudOpen(v) {
    try { window.sessionStorage.setItem("sbk_open_" + slug, v ? "1" : "0"); } catch {}
  }
  function openen() { setOpen(true); setKlaar(false); onthoudOpen(true); }
  function sluit() { setOpen(false); setKlaar(false); onthoudOpen(false); }

  function bekijk(id) {
    if (id === huidige) return;
    setBezig(id);
    setFout("");
    document.cookie = `sbk_${slug}=${id}; path=/; SameSite=Lax`;
    startTransition(() => router.refresh());
  }

  async function kies() {
    setBewaren(true);
    setFout("");
    try {
      const res = await fetch("/api/preview/stijl-keuze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, stijl: huidige }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j.ok) throw new Error(j.error || "Opslaan lukte niet.");
      zetLokaal("sbk_gekozen_" + slug, huidige);
      setGekozen(huidige);
      setOpen(false);
      setKlaar(true);
      onthoudOpen(false);
    } catch (e) {
      setFout("Dat lukte even niet. Probeer het nog eens, of bel ons op 06 16 73 21 05.");
    }
    setBewaren(false);
  }

  if (!zichtbaar) return null;

  const naamVan = (id) => (STIJLEN.find((s) => s.id === id) || {}).kort || id;
  const labelVan = (id) => {
    if (gekozen) return id === gekozen ? "Jouw keuze" : null;
    return id === onze ? "Onze keuze" : null;
  };

  const css = `
    .sbw,.sbw *{box-sizing:border-box;font-family:system-ui,-apple-system,"Segoe UI",sans-serif}
    .sbw-knop{position:fixed;left:50%;transform:translateX(-50%);z-index:70;display:flex;align-items:center;gap:10px;height:48px;padding:0 18px 0 15px;border:0;border-radius:999px;background:#16202E;color:#fff;font-size:15px;font-weight:600;box-shadow:0 10px 28px rgba(0,0,0,.35);cursor:pointer;white-space:nowrap}
    .sbw-knop:hover{background:#0B121C}
    html[data-sbdicht="1"] .sbw-knop{display:none}
    .sbw-tel{font-size:12px;font-weight:700;color:#16202E;background:#fff;border-radius:999px;padding:2px 8px}
    .sbw-dek{position:fixed;inset:0;z-index:80;background:rgba(10,12,16,.28)}
    .sbw-paneel{position:fixed;left:0;right:0;bottom:0;z-index:81;background:#fff;color:#16202E;border-radius:22px 22px 0 0;box-shadow:0 -10px 40px rgba(0,0,0,.25);padding:10px 16px calc(20px + env(safe-area-inset-bottom));display:flex;flex-direction:column;gap:14px;max-width:620px;margin:0 auto}
    .sbw-greep{align-self:center;width:40px;height:4px;border-radius:999px;background:#D5DADF}
    .sbw-kop{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
    .sbw-kop strong{display:block;font-size:18px}
    .sbw-kop span{font-size:13px;color:#4A5560}
    .sbw-x{width:44px;height:44px;flex:none;border:0;border-radius:999px;background:#F1F3F5;color:#16202E;display:grid;place-items:center;cursor:pointer}
    .sbw-rij{display:grid;grid-template-columns:repeat(${STIJLEN.length},minmax(0,1fr));gap:7px;padding-top:8px}
    .sbw-tegel{position:relative;border:1.5px solid #E1E5E9;background:#fff;border-radius:12px;padding:5px 5px 8px;display:flex;flex-direction:column;gap:6px;cursor:pointer;color:#16202E;min-height:44px}
    .sbw-tegel[aria-pressed="true"]{border:2px solid #16202E;padding:4.5px 4.5px 7.5px}
    .sbw-monster{height:52px;border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;font-size:18px;line-height:1}
    .sbw-streep{width:22px;height:3px;border-radius:2px}
    .sbw-naam{font-size:10.5px;font-weight:700;text-align:center;letter-spacing:-.2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    @media(min-width:400px){.sbw-naam{font-size:11.5px;letter-spacing:0}}
    .sbw-label{position:absolute;top:-9px;left:50%;transform:translateX(-50%);white-space:nowrap;font-size:9.5px;font-weight:700;background:#E79B43;color:#16202E;padding:2px 7px;border-radius:999px}
    .sbw-nu{display:flex;align-items:center;gap:8px;font-size:13px;color:#4A5560;background:#F6F7F8;border-radius:10px;padding:10px 12px}
    .sbw-nu strong{color:#16202E}
    .sbw-kies{height:52px;border:0;border-radius:999px;background:#16202E;color:#fff;font-weight:700;font-size:16px;cursor:pointer}
    .sbw-kies:disabled{opacity:.6;cursor:default}
    .sbw-fout{font-size:13px;color:#B42318}
    .sbw-draai{width:14px;height:14px;border:2px solid #C8CED4;border-top-color:#16202E;border-radius:50%;animation:sbwd .7s linear infinite;display:inline-block}
    @keyframes sbwd{to{transform:rotate(360deg)}}
    .sbw-klaar{align-items:center;text-align:center;padding-top:26px}
    .sbw-vink{width:56px;height:56px;border-radius:999px;background:#E6F4EA;color:#1E7A3C;display:grid;place-items:center}
    .sbw-klaar p{font-size:14px;line-height:1.5;color:#4A5560;max-width:320px}
    .sbw-terug{height:48px;width:100%;border:1.5px solid #D5DADF;border-radius:999px;background:#fff;color:#16202E;font-weight:600;font-size:15px;cursor:pointer}
    @media(min-width:700px){.sbw-paneel{bottom:16px;border-radius:22px}.sbw-knop{left:auto;right:20px;transform:none}}
  `;

  return (
    <div className="sbw">
      <style dangerouslySetInnerHTML={{ __html: css }} />

      {!open && !klaar && (
        <button type="button" className="sbw-knop" style={{ bottom: onder }} onClick={openen} aria-haspopup="dialog">
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.6-.8 1.6-1.6 0-.5-.2-.8-.5-1.2-.3-.3-.5-.7-.5-1.2 0-.9.7-1.6 1.6-1.6H16a5 5 0 0 0 5-5c0-4.1-4-7.4-9-7.4z" /><circle cx="7.5" cy="11" r="1" /><circle cx="10.5" cy="7.5" r="1" /><circle cx="15" cy="7.5" r="1" /></svg>
          Andere stijl bekijken
          <span className="sbw-tel">{STIJLEN.length}</span>
        </button>
      )}

      {open && (
        <>
          <div className="sbw-dek" onClick={sluit} aria-hidden="true" />
          <div className="sbw-paneel" role="dialog" aria-modal="true" aria-label="Kies je stijl">
            <span className="sbw-greep" aria-hidden="true" />
            <div className="sbw-kop">
              <div><strong>Kies je stijl</strong><span>Zelfde teksten en foto&apos;s, andere uitstraling.</span></div>
              <button type="button" className="sbw-x" onClick={sluit} aria-label="Sluiten">
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
            </div>
            <div className="sbw-rij">
              {STIJLEN.map((s) => {
                const mo = MONSTER[s.id] || MONSTER.stoer;
                const label = labelVan(s.id);
                return (
                  <button key={s.id} type="button" className="sbw-tegel" aria-pressed={s.id === huidige} onClick={() => bekijk(s.id)} title={s.uitleg}>
                    <span className="sbw-monster" style={{ background: mo.bg, color: mo.fg, fontFamily: mo.font, fontWeight: mo.gewicht, boxShadow: `inset 0 0 0 1px ${mo.rand}` }}>
                      {bezig === s.id ? <span className="sbw-draai" /> : mo.tekst}
                      <span className="sbw-streep" style={{ background: accent }} />
                    </span>
                    <span className="sbw-naam">{s.kort}</span>
                    {label && <span className="sbw-label">{label}</span>}
                  </button>
                );
              })}
            </div>
            <div className="sbw-nu">
              {laden ? <span className="sbw-draai" /> : (
                <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>
              )}
              <span>Je bekijkt nu: <strong>{naamVan(huidige)}</strong>. Sluit dit venster en scroll gerust door de site.</span>
            </div>
            {fout && <div className="sbw-fout">{fout}</div>}
            <button type="button" className="sbw-kies" onClick={kies} disabled={bewaren || laden}>
              {bewaren ? "Even bezig…" : gekozen === huidige ? `Je koos al voor ${naamVan(huidige)}` : "Deze stijl kies ik"}
            </button>
          </div>
        </>
      )}

      {klaar && (
        <>
          <div className="sbw-dek" onClick={sluit} aria-hidden="true" />
          <div className="sbw-paneel sbw-klaar" role="dialog" aria-modal="true" aria-label="Stijl gekozen">
            <span className="sbw-vink">
              <svg aria-hidden="true" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg>
            </span>
            <strong style={{ fontSize: 20 }}>Top, je kiest &lsquo;{naamVan(huidige)}&rsquo;</strong>
            <p>We hebben je keuze doorgekregen en maken je website in deze stijl. Twijfel je toch? Je kunt altijd nog een andere stijl kiezen.</p>
            <button type="button" className="sbw-terug" onClick={sluit}>Verder kijken</button>
          </div>
        </>
      )}
    </div>
  );
}
