// Melding bovenaan de preview. Klein, neutraal labeltje; de uitleg klapt uit
// op aanraken (<details>, werkt zonder JavaScript). De conceptmelding voor
// het team blijft opvallend.
//
// Toon (28 okt 2026): vooruit in plaats van verontschuldigend. Eerst wat het
// is (jouw website, al gemaakt), dan eerlijk wat nog voorbeeld is, dan de
// volgende stap. Zelfde feiten als voorheen, andere volgorde.

const css = `
  .sbvl{background:#111827;color:#E5E7EB;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;font-size:12.5px;line-height:1.45;text-align:center;position:relative;z-index:60}
  .sbvl summary{list-style:none;cursor:pointer;padding:7px 12px;display:flex;justify-content:center;align-items:center;gap:6px;flex-wrap:wrap}
  .sbvl summary::-webkit-details-marker{display:none}
  .sbvl .sbvl-m{color:#9CA3AF;text-decoration:underline;text-underline-offset:2px}
  .sbvl[open] .sbvl-m{display:none}
  @media(max-width:480px){.sbvl .sbvl-d{display:none}}
  .sbvl p{max-width:640px;margin:0 auto;padding:0 16px 10px;color:#D1D5DB}
  .sbvl a{color:#fff;font-weight:700}
`;

export default function VoorproefLabel({ isConcept, slug }) {
  if (isConcept) {
    return (
      <div style={{ background: "#b45309", color: "#fff", textAlign: "center", padding: "8px 12px", fontSize: 14, fontFamily: "system-ui, sans-serif" }}>
        Conceptversie — nog niet gepubliceerd. Controleer en publiceer via het dashboard.
      </div>
    );
  }
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <details className="sbvl">
        <summary>
          <strong style={{ color: "#fff", fontWeight: 600 }}>Jouw website, alvast gemaakt</strong>
          <span className="sbvl-d">· door StudioBaris</span>
          <span className="sbvl-m">hoe nu verder?</span>
        </summary>
        <p>
          Dit is jouw website, alvast voor je gemaakt. Wat nog voorbeeld is, zoals de reviews en sommige teksten en foto&apos;s,
          maken we samen met jou definitief. Knoppen zoals de offerteaanvraag werken zodra je site live staat.
          {slug ? <> <a href={`/${slug}/aanbod`}>Bekijk wat je krijgt &rarr;</a></> : null}
        </p>
      </details>
    </>
  );
}
