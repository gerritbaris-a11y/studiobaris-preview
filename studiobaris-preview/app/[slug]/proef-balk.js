"use client";

// Balk onderaan de preview: "Probeer je eigen app".
// Opent de persoonlijke demo-app in een nieuw tabblad, zodat de website open
// blijft. Komt de prospect terug naar dit tabblad, dan verversen we de pagina,
// zodat zijn net geplaatste project er meteen staat.

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProefBalk({ url, datum, klaar }) {
  const router = useRouter();

  useEffect(() => {
    const opTerugkeer = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    document.addEventListener("visibilitychange", opTerugkeer);
    return () => document.removeEventListener("visibilitychange", opTerugkeer);
  }, [router]);

  const zin = klaar
    ? "Je 3 proefprojecten staan op je website, bij het werk hieronder."
    : "Zet zelf een project online vanaf je telefoon en zie het hier verschijnen.";
  const looptijd = datum ? `Je proefapp is actief tot ${datum}.` : "Je proefapp is een maand actief.";

  const css = `
    .sbp-ruimte{height:150px}
    .sbp{position:fixed;left:0;right:0;bottom:0;z-index:60;padding:.75rem 1rem calc(.75rem + env(safe-area-inset-bottom));
      background:#111827;color:#fff;box-shadow:0 -6px 24px rgba(0,0,0,.18);font-family:system-ui,-apple-system,"Segoe UI",sans-serif}
    .sbp-in{max-width:1100px;margin:0 auto;display:flex;align-items:center;gap:.9rem 1.2rem;flex-wrap:wrap;justify-content:space-between}
    .sbp-tekst{flex:1 1 260px;min-width:0}
    .sbp-kop{font-weight:800;font-size:1rem;line-height:1.3}
    .sbp-zin{font-size:.88rem;color:rgba(255,255,255,.82);line-height:1.4;margin-top:.15rem}
    .sbp-klein{font-size:.76rem;color:rgba(255,255,255,.6);margin-top:.2rem}
    .sbp-knop{flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:.7rem 1.3rem;
      border-radius:10px;font-weight:800;font-size:.98rem;text-decoration:none;background:var(--orange,#FF8300);color:var(--on-orange,#fff)}
    @media (max-width:560px){.sbp-knop{width:100%}.sbp-ruimte{height:190px}}
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="sbp-ruimte" aria-hidden="true" />
      <div className="sbp" role="region" aria-label="Probeer je eigen app">
        <div className="sbp-in">
          <div className="sbp-tekst">
            <div className="sbp-kop">Probeer je eigen app</div>
            <div className="sbp-zin">{zin} {looptijd}</div>
            <div className="sbp-klein">Op je echte website staat een project er binnen enkele minuten.</div>
          </div>
          <a className="sbp-knop" href={url} target="_blank" rel="noopener">Open je app</a>
        </div>
      </div>
    </>
  );
}
