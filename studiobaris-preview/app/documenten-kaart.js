import { KLEUR, HEAD } from "./werkplek-stijl";

// Documenten op Mijn previews (22 okt 2026): stappenplan, belscript en de
// algemene voorwaarden. De oude handleidingen en dienstverlening staan niet
// meer in deze lijst. De voorwaarden-pdf komt uit lib/voorwaarden-tekst.mjs
// (scripts/voorwaarden-pdf.mjs). De pdf's zelf staan nog in public/documenten.
// beheer en model worden niet meer gebruikt, maar blijven als props bestaan
// zodat de aanroep in app/klanten/page.js niet hoeft te veranderen.
export default function DocumentenKaart() {
  const docs = [
    ["stappenplan-verkopers.pdf", "Stappenplan verkopers", "van preview tot klant, stap voor stap"],
    ["belscript.pdf", "Belscript", "zo bel je een prospect over zijn preview en app"],
    ["algemene-voorwaarden.pdf", "Algemene voorwaarden", "waar de klant akkoord op geeft, met verwerkersovereenkomst"],
  ];

  return (
    <div style={{ background: "#fff", border: `1px solid ${KLEUR.lijn}`, borderRadius: 16, padding: "16px 18px", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
        <h2 style={{ fontFamily: HEAD, fontSize: 16, margin: 0, fontWeight: 800 }}>Documenten</h2>
        <span style={{ fontSize: 13, color: "#9A9084" }}>altijd bij de hand</span>
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
