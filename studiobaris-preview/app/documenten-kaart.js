import { KLEUR, HEAD } from "./werkplek-stijl";

// Welke handleiding hoort bij welk vergoedingsmodel.
const HANDLEIDING = {
  "50pct": ["handleiding-50procent.pdf", "50% van het verkoopbedrag"],
  "50pct_abo": ["handleiding-50procent-abo.pdf", "50% van het verkoopbedrag + 1/3 van het maandbedrag"],
  "100eur": ["handleiding-100euro.pdf", "€100 per verkochte website"],
};

// Beheer ziet alle versies, een verkoper alleen die van hemzelf.
export default function DocumentenKaart({ beheer, model }) {
  const eigen = HANDLEIDING[model] || HANDLEIDING["50pct"];
  const docs = beheer
    ? [
        ["handleiding-50procent.pdf", "Verkoophandleiding — 50%", "Nick, Maurits en Kevin"],
        ["handleiding-50procent-abo.pdf", "Verkoophandleiding — 50% + 1/3 abo", "Brent"],
        ["handleiding-100euro.pdf", "Verkoophandleiding — €100 per klant", "reservemodel"],
      ]
    : [[eigen[0], "Jouw verkoophandleiding", eigen[1]]];
  docs.push(["algemene-voorwaarden.pdf", "Algemene voorwaarden", "wat de klant tekent bij akkoord"]);

  return (
    <div style={{ background: "#fff", border: `1px solid ${KLEUR.lijn}`, borderRadius: 16, padding: "16px 18px", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
        <h2 style={{ fontFamily: HEAD, fontSize: 16, margin: 0, fontWeight: 800 }}>Documenten</h2>
        <span style={{ fontSize: 13, color: "#9A9084" }}>
          {beheer ? "alle versies" : "altijd bij de hand"}
        </span>
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        {docs.map(([bestand, titel, sub]) => (
          <a
            key={bestand}
            href={`/documenten/${bestand}`}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "flex", alignItems: "center", gap: 12, textDecoration: "none",
              background: KLEUR.papier, border: `1px solid ${KLEUR.lijn}`, borderRadius: 10,
              padding: "11px 13px", color: "#2B2724",
            }}
          >
            <span style={{ fontSize: 18, lineHeight: 1 }}>📄</span>
            <span style={{ flex: "1 1 auto", minWidth: 0 }}>
              <span style={{ display: "block", fontWeight: 700, fontSize: 14 }}>{titel}</span>
              <span style={{ display: "block", fontSize: 12.5, color: "#6B6258" }}>{sub}</span>
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: KLEUR.klei, whiteSpace: "nowrap" }}>Openen ↗</span>
          </a>
        ))}
      </div>
    </div>
  );
}
