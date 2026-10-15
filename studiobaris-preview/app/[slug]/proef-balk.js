"use client";

// Balk onderaan de preview: "Probeer je eigen app".
// - Vaste balk: wat het is, hoeveel proefprojecten er nog over zijn, knop naar
//   de demo-app (nieuw tabblad) en een belknop naar StudioBaris.
// - Uitklapbaar "Zo werkt het": de stappen, de regel van 3 projecten, de
//   looptijd en contact.
// Komt de prospect terug naar dit tabblad, dan verversen we de pagina, zodat
// zijn net geplaatste project er meteen staat.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const SB_TEL = "+31616732105";
const SB_TEL_TOON = "06 16 73 21 05";
const SB_WA = "https://wa.me/31616732105";
const MAX = 3;

export default function ProefBalk({ url, datum, geplaatst = 0 }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const opTerugkeer = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    document.addEventListener("visibilitychange", opTerugkeer);
    return () => document.removeEventListener("visibilitychange", opTerugkeer);
  }, [router]);

  const over = Math.max(0, MAX - (Number(geplaatst) || 0));
  const teller =
    over === MAX ? `Plaats ${MAX} projecten om het te ervaren`
    : over > 0 ? `Nog ${over} van ${MAX} proefprojecten`
    : `Je ${MAX} proefprojecten staan op je website`;
  const looptijd = datum ? `Je proefapp is actief tot ${datum}.` : "Je proefapp is een maand actief.";

  const css = `
    .sbp-ruimte{height:120px}
    .sbp{position:fixed;left:0;right:0;bottom:0;z-index:60;background:#111827;color:#fff;
      box-shadow:0 -6px 24px rgba(0,0,0,.18);font-family:system-ui,-apple-system,"Segoe UI",sans-serif;
      padding:.7rem 1rem calc(.7rem + env(safe-area-inset-bottom));max-height:88vh;overflow-y:auto}
    .sbp-in{max-width:1100px;margin:0 auto}
    .sbp-rij{display:flex;align-items:center;gap:.7rem 1rem;flex-wrap:wrap;justify-content:space-between}
    .sbp-tekst{flex:1 1 240px;min-width:0}
    .sbp-kop{font-weight:800;font-size:1rem;line-height:1.3}
    .sbp-sub{font-size:.85rem;color:rgba(255,255,255,.78);margin-top:.1rem}
    .sbp-uitleg{background:none;border:0;color:#fff;text-decoration:underline;font:inherit;font-size:.85rem;padding:0;margin-left:.35rem;cursor:pointer}
    .sbp-knoppen{display:flex;gap:.5rem;flex:0 0 auto}
    .sbp-knop{display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:.65rem 1.2rem;
      border-radius:10px;font-weight:800;font-size:.96rem;text-decoration:none;background:var(--orange,#FF8300);color:var(--on-orange,#fff)}
    .sbp-bel{display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:.65rem .95rem;border-radius:10px;
      font-weight:700;font-size:.92rem;text-decoration:none;color:#fff;border:1.5px solid rgba(255,255,255,.4)}
    .sbp-paneel{border-top:1px solid rgba(255,255,255,.14);margin-top:.75rem;padding-top:.85rem;display:grid;gap:.9rem}
    .sbp-stappen{list-style:none;margin:0;padding:0;display:grid;gap:.6rem}
    .sbp-stappen li{display:flex;gap:.65rem;align-items:flex-start;font-size:.9rem;line-height:1.45;color:rgba(255,255,255,.9)}
    .sbp-nr{flex:0 0 26px;height:26px;border-radius:50%;display:grid;place-items:center;font-weight:800;font-size:.82rem;
      background:var(--orange,#FF8300);color:var(--on-orange,#fff)}
    .sbp-blok{font-size:.88rem;line-height:1.5;color:rgba(255,255,255,.85)}
    .sbp-blok strong{color:#fff}
    .sbp-contact{display:flex;gap:.5rem;flex-wrap:wrap}
    @media (min-width:760px){.sbp-paneel{grid-template-columns:1.3fr 1fr}}
    @media (max-width:560px){.sbp-knoppen{width:100%}.sbp-knop{flex:1}.sbp-ruimte{height:170px}}
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="sbp-ruimte" aria-hidden="true" />
      <div className="sbp" role="region" aria-label="Probeer je eigen app">
        <div className="sbp-in">
          <div className="sbp-rij">
            <div className="sbp-tekst">
              <div className="sbp-kop">Probeer je eigen app</div>
              <div className="sbp-sub">
                {teller}.
                <button type="button" className="sbp-uitleg" onClick={() => setOpen(!open)} aria-expanded={open}>
                  {open ? "Sluit uitleg" : "Zo werkt het"}
                </button>
              </div>
            </div>
            <div className="sbp-knoppen">
              <a className="sbp-knop" href={url} target="_blank" rel="noopener">Open je app</a>
              <a className="sbp-bel" href={`tel:${SB_TEL}`} aria-label={`Bel StudioBaris op ${SB_TEL_TOON}`}>Bel ons</a>
            </div>
          </div>

          {open && (
            <div className="sbp-paneel">
              <ol className="sbp-stappen">
                <li><span className="sbp-nr">1</span><span>Tik op <strong>Open je app</strong>. Je komt meteen in je eigen app, zonder inloggen.</span></li>
                <li><span className="sbp-nr">2</span><span>Tik op de <strong>+</strong> onderaan en kies een foto van een klus. Typ in een paar woorden wat je hebt gedaan, wij maken er een nette tekst van.</span></li>
                <li><span className="sbp-nr">3</span><span>Kom terug naar deze pagina. Je project staat bovenaan bij je werk.</span></li>
              </ol>
              <div className="sbp-blok">
                <p><strong>Je mag {MAX} projecten plaatsen om het te ervaren.</strong> {looptijd} Op je echte website staat een project er binnen enkele minuten.</p>
                <p style={{ marginTop: ".6rem" }}><strong>Bevalt het?</strong> Bel of app ons op {SB_TEL_TOON}. Wij zetten je website en je app live, jij hoeft niks te regelen.</p>
                <div className="sbp-contact" style={{ marginTop: ".7rem" }}>
                  <a className="sbp-bel" href={`tel:${SB_TEL}`}>Bel {SB_TEL_TOON}</a>
                  <a className="sbp-bel" href={SB_WA} target="_blank" rel="noopener">WhatsApp ons</a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
