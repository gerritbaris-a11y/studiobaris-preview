import { KLEUR } from "../werkplek-stijl";

// Blok bovenaan het Bord met de laatste wekelijkse AI-update
// (OpenAI / Anthropic / Gemini). Alleen tonen, niets bewerken.

const OORDEEL = {
  actie_nodig: { label: "Actie nodig", ...KLEUR.rust },
  onderzoeken: { label: "Even onderzoeken", ...KLEUR.amber },
  geen_actie: { label: "Geen actie", ...KLEUR.sage },
};

// Zet [tekst](https://...) en losse https-links om in klikbare links.
// Alle overige tekst blijft platte tekst (React escapet die zelf).
function metLinks(tekst) {
  const delen = [];
  const re = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s)]+)/g;
  let laatste = 0;
  let m;
  let i = 0;
  while ((m = re.exec(tekst)) !== null) {
    if (m.index > laatste) delen.push(tekst.slice(laatste, m.index));
    const url = m[2] || m[3];
    delen.push(
      <a key={i++} href={url} target="_blank" rel="noopener noreferrer" style={{ color: KLEUR.kleiDonker }}>
        {m[1] || url}
      </a>
    );
    laatste = m.index + m[0].length;
  }
  if (laatste < tekst.length) delen.push(tekst.slice(laatste));
  return delen;
}

export default function AiUpdateBlok({ update }) {
  if (!update) return null;
  const o = OORDEEL[update.oordeel] || { label: update.oordeel, ...KLEUR.grijs };
  const datum = update.created_at
    ? new Date(update.created_at).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Amsterdam" })
    : null;

  return (
    <div
      style={{
        background: "#fff",
        border: `1px solid ${KLEUR.lijn}`,
        borderLeft: `4px solid ${o.dot}`,
        borderRadius: 14,
        padding: "14px 18px",
        marginBottom: 16,
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: KLEUR.inkt, textTransform: "uppercase", letterSpacing: 0.5 }}>
          AI-update week {update.week}
        </div>
        <span style={{ background: o.bg, color: o.tekst, fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 999 }}>
          {o.label}
        </span>
        <span style={{ fontSize: 12.5, color: KLEUR.label }}>
          {update.periode}
          {datum ? ` · geplaatst ${datum}` : ""}
        </span>
      </div>

      <div style={{ fontSize: 14, color: KLEUR.gedempt, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
        {metLinks(update.conclusie || "")}
      </div>

      <details style={{ marginTop: 10 }}>
        <summary style={{ cursor: "pointer", fontSize: 13, fontWeight: 700, color: KLEUR.kleiDonker }}>
          Volledige update lezen
        </summary>
        <div style={{ marginTop: 10, fontSize: 13.5, color: KLEUR.inkt, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
          {metLinks(update.inhoud || "")}
        </div>
      </details>
    </div>
  );
}
