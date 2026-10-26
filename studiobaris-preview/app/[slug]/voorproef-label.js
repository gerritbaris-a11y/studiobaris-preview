// Melding bovenaan de preview. Was een brede oranje balk die op mobiel een
// derde van het eerste scherm innam en vloekte met de merkkleur. Nu een klein,
// neutraal labeltje; de volledige uitleg klapt uit op aanraken (<details>,
// werkt zonder JavaScript). De conceptmelding voor het team blijft opvallend.

const UITLEG =
  "Dit is een eerste voorproefje van jouw website. Het geeft een goed beeld, maar teksten, foto's en details zijn nog voorbeeld en sommige knoppen werken nog niet. Bij de definitieve site maken we alles samen met jou op maat, werkend en netjes af.";

const css = `
  .sbvl{background:#111827;color:#E5E7EB;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;font-size:12.5px;line-height:1.45;text-align:center;position:relative;z-index:60}
  .sbvl summary{list-style:none;cursor:pointer;padding:7px 12px;display:flex;justify-content:center;align-items:center;gap:6px;flex-wrap:wrap}
  .sbvl summary::-webkit-details-marker{display:none}
  .sbvl .sbvl-m{color:#9CA3AF;text-decoration:underline;text-underline-offset:2px}
  .sbvl[open] .sbvl-m{display:none}
  @media(max-width:480px){.sbvl .sbvl-d{display:none}}
  .sbvl p{max-width:640px;margin:0 auto;padding:0 16px 10px;color:#D1D5DB}
`;

export default function VoorproefLabel({ isConcept }) {
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
          <strong style={{ color: "#fff", fontWeight: 600 }}>Voorbeeld van jouw website</strong>
          <span className="sbvl-d">· gemaakt door StudioBaris</span>
          <span className="sbvl-m">wat betekent dit?</span>
        </summary>
        <p>{UITLEG}</p>
      </details>
    </>
  );
}
