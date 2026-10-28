"use client";

// Balk onderaan de preview (okt 2026, herzien 28 okt).
// - Twee knoppen: "Open je app" (proberen) en "Dit wil ik" (naar de
//   aanbodpagina /<slug>/aanbod). Zolang de prospect nog niets plaatste is de
//   app de hoofdknop; daarna "Dit wil ik".
// - De einddatum van de proefapp staat zichtbaar in de balk.
// - Inklappen: de balk én de stijlknop verdwijnen samen; er blijft één klein
//   knopje rechtsonder over om ze terug te halen. Onthouden per preview zolang
//   het tabblad open is (sessionStorage). Bij een nieuw bezoek staat de balk
//   weer open, zodat niemand de app mist.
// - "Zo werkt het" klapt de stappen, de regels en het contact met Gerrit uit.
// Komt de prospect terug naar dit tabblad, dan verversen we de pagina, zodat
// zijn net geplaatste project er meteen staat.

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SB_TEL, SB_TEL_TOON, SB_PERSOON, waMet } from "../../lib/sb-contact";

const MAX = 3;

function leesDicht(slug) {
  try { return window.sessionStorage.getItem("sbp_dicht_" + slug) === "1"; } catch { return false; }
}
function zetDicht(slug, v) {
  try { window.sessionStorage.setItem("sbp_dicht_" + slug, v ? "1" : "0"); } catch {}
}

export default function ProefBalk({ slug, url, aanbodUrl, datum, geplaatst = 0 }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [dicht, setDicht] = useState(false);
  const [hoogte, setHoogte] = useState(0);
  const balkRef = useRef(null);

  useEffect(() => {
    const opTerugkeer = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    document.addEventListener("visibilitychange", opTerugkeer);
    return () => document.removeEventListener("visibilitychange", opTerugkeer);
  }, [router]);

  useEffect(() => { setDicht(leesDicht(slug)); }, [slug]);

  // De stijlknop luistert naar dit kenmerk op <html> (zie stijl-wissel.js).
  useEffect(() => {
    const el = document.documentElement;
    if (dicht) el.setAttribute("data-sbdicht", "1");
    else el.removeAttribute("data-sbdicht");
    return () => el.removeAttribute("data-sbdicht");
  }, [dicht]);

  // Ruimte onder de pagina = echte hoogte van de balk, zodat de footer van de
  // site nooit achter de balk verdwijnt (en geen lege strook als hij dicht is).
  useEffect(() => {
    const balk = balkRef.current;
    if (!balk) return;
    const meet = () => setHoogte(dicht ? 0 : balk.offsetHeight);
    meet();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(meet) : null;
    if (ro) ro.observe(balk);
    window.addEventListener("resize", meet);
    return () => { if (ro) ro.disconnect(); window.removeEventListener("resize", meet); };
  }, [dicht, open]);

  function klapIn() { setOpen(false); setDicht(true); zetDicht(slug, true); }
  function klapUit() { setDicht(false); zetDicht(slug, false); }

  const n = Number(geplaatst) || 0;
  const over = Math.max(0, MAX - n);
  const kop = over === 0 ? "Leuk, hè?" : n > 0 ? "Je project staat erop" : "Probeer je eigen app";
  const teller =
    over === MAX ? `Plaats zelf ${MAX} projecten`
    : over > 0 ? `Nog ${over} van ${MAX} proefprojecten`
    : `Je ${MAX} proefprojecten staan op je website`;
  const tot = datum ? `Actief tot ${datum}` : "Een maand actief";
  const appEerst = n === 0;

  const css = `
    .sbp,.sbp *,.sbp-tab{box-sizing:border-box;font-family:system-ui,-apple-system,"Segoe UI",sans-serif}
    .sbp{position:fixed;left:0;right:0;bottom:0;z-index:60;background:#111827;color:#fff;
      box-shadow:0 -6px 24px rgba(0,0,0,.18);padding:.65rem 1rem calc(.7rem + env(safe-area-inset-bottom));max-height:88vh;overflow-y:auto}
    .sbp[hidden],.sbp-tab[hidden]{display:none}
    .sbp-in{max-width:1100px;margin:0 auto}
    .sbp-rij{display:flex;align-items:center;gap:.6rem 1rem;flex-wrap:wrap;justify-content:space-between}
    .sbp-tekst{flex:1 1 240px;min-width:0;display:flex;align-items:flex-start;gap:.5rem}
    .sbp-tekst > div{flex:1;min-width:0}
    .sbp-kop{font-weight:800;font-size:1rem;line-height:1.3}
    .sbp-sub{font-size:.85rem;color:rgba(255,255,255,.8);margin-top:.1rem}
    .sbp-tot{white-space:nowrap;font-weight:700;color:#fff}
    .sbp-uitleg{background:none;border:0;color:#fff;text-decoration:underline;font:inherit;font-size:.85rem;padding:0;margin-left:.35rem;cursor:pointer}
    .sbp-dicht{flex:none;width:40px;height:40px;margin:-4px -6px 0 0;border:0;border-radius:999px;background:rgba(255,255,255,.1);color:#fff;display:grid;place-items:center;cursor:pointer}
    .sbp-knoppen{display:flex;gap:.5rem;flex:0 0 auto}
    .sbp-knop{display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:.65rem 1.2rem;
      border-radius:10px;font-weight:800;font-size:.96rem;text-decoration:none;background:var(--orange,#FF8300);color:var(--on-orange,#fff);border:0}
    .sbp-knop2{display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:.65rem 1.1rem;border-radius:10px;
      font-weight:700;font-size:.94rem;text-decoration:none;color:#fff;border:1.5px solid rgba(255,255,255,.45);background:transparent}
    .sbp-paneel{border-top:1px solid rgba(255,255,255,.14);margin-top:.75rem;padding-top:.85rem;display:grid;gap:.9rem}
    .sbp-stappen{list-style:none;margin:0;padding:0;display:grid;gap:.6rem}
    .sbp-stappen li{display:flex;gap:.65rem;align-items:flex-start;font-size:.9rem;line-height:1.45;color:rgba(255,255,255,.9)}
    .sbp-nr{flex:0 0 26px;height:26px;border-radius:50%;display:grid;place-items:center;font-weight:800;font-size:.82rem;
      background:var(--orange,#FF8300);color:var(--on-orange,#fff)}
    .sbp-blok{font-size:.88rem;line-height:1.5;color:rgba(255,255,255,.85)}
    .sbp-blok p{margin:0}
    .sbp-blok strong{color:#fff}
    .sbp-wie{display:flex;gap:.75rem;align-items:center;background:rgba(255,255,255,.06);border-radius:12px;padding:.7rem .8rem}
    .sbp-wie img{width:48px;height:48px;border-radius:50%;flex:none;object-fit:cover}
    .sbp-wie strong{display:block;color:#fff;font-size:.92rem}
    .sbp-wie span{font-size:.84rem;color:rgba(255,255,255,.8)}
    .sbp-contact{display:flex;gap:.5rem;flex-wrap:wrap}
    .sbp-tab{position:fixed;right:14px;bottom:calc(14px + env(safe-area-inset-bottom));z-index:60;display:flex;align-items:center;gap:7px;height:44px;padding:0 15px 0 12px;
      border:0;border-radius:999px;background:#111827;color:#fff;font-size:14px;font-weight:700;box-shadow:0 8px 24px rgba(0,0,0,.3);cursor:pointer}
    @media (min-width:760px){.sbp-paneel{grid-template-columns:1.3fr 1fr}}
    @media (max-width:560px){.sbp-knoppen{width:100%}.sbp-knop,.sbp-knop2{flex:1;padding-left:.6rem;padding-right:.6rem}}
  `;

  const knopApp = <a key="app" className={appEerst ? "sbp-knop" : "sbp-knop2"} href={url} target="_blank" rel="noopener">Open je app</a>;
  const knopWil = <a key="wil" className={appEerst ? "sbp-knop2" : "sbp-knop"} href={aanbodUrl}>Dit wil ik</a>;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div aria-hidden="true" style={{ height: hoogte }} />

      <button type="button" className="sbp-tab" hidden={!dicht} onClick={klapUit} aria-label="Balk met je app en de stijlen weer tonen">
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M6 15l6-6 6 6" /></svg>
        App &amp; stijlen
      </button>

      <div className="sbp" ref={balkRef} hidden={dicht} role="region" aria-label="Probeer je eigen app">
        <div className="sbp-in">
          <div className="sbp-rij">
            <div className="sbp-tekst">
              <div>
                <div className="sbp-kop">{kop}</div>
                <div className="sbp-sub">
                  {over === 0
                    ? <>Je {MAX} proefprojecten staan op je website. Volgende week kun je al beginnen met je eigen website.</>
                    : <>{teller} · <span className="sbp-tot">{tot}</span></>}
                  <button type="button" className="sbp-uitleg" onClick={() => setOpen(!open)} aria-expanded={open}>
                    {open ? "Sluit uitleg" : "Zo werkt het"}
                  </button>
                </div>
              </div>
              <button type="button" className="sbp-dicht" onClick={klapIn} aria-label="Balk verbergen om de website goed te bekijken" title="Verbergen">
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
              </button>
            </div>
            <div className="sbp-knoppen">
              {appEerst ? [knopApp, knopWil] : [knopWil, knopApp]}
            </div>
          </div>

          {open && (
            <div className="sbp-paneel">
              <ol className="sbp-stappen">
                <li><span className="sbp-nr">1</span><span>Tik op <strong>Open je app</strong>. Je komt meteen in je eigen app, zonder inloggen.</span></li>
                <li><span className="sbp-nr">2</span><span>Tik op de <strong>+</strong> onderaan en kies een foto van een klus. Typ in een paar woorden wat je hebt gedaan, wij maken er een nette tekst van.</span></li>
                <li><span className="sbp-nr">3</span><span>Kom terug naar deze pagina. Je project staat bovenaan bij je werk.</span></li>
              </ol>
              <div className="sbp-blok" style={{ display: "grid", gap: ".7rem" }}>
                <p><strong>Je mag {MAX} projecten plaatsen om het te ervaren.</strong> {datum ? `Je proefapp is actief tot ${datum}.` : "Je proefapp is een maand actief."} Op je echte website staat een project er binnen enkele minuten.</p>
                <p><strong>Bevalt het?</strong> Tik op <a href={aanbodUrl} style={{ color: "#fff", fontWeight: 700 }}>Dit wil ik</a>. Wij zetten je website en je app live, jij hoeft niks te regelen.</p>
                <div className="sbp-wie">
                  <img src={SB_PERSOON.foto} alt="" width="48" height="48" />
                  <div>
                    <strong>{SB_PERSOON.naam} · StudioBaris</strong>
                    <span>Vragen? Bel of app me gerust.</span>
                  </div>
                </div>
                <div className="sbp-contact">
                  <a className="sbp-knop2" href={`tel:${SB_TEL}`}>Bel {SB_TEL_TOON}</a>
                  <a className="sbp-knop2" href={waMet("Hoi Gerrit, ik heb een vraag over mijn website (preview.studiobaris.nl/" + slug + ").")} target="_blank" rel="noopener">WhatsApp</a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
