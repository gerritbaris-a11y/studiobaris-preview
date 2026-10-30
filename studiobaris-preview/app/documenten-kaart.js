import { KLEUR, HEAD } from "./werkplek-stijl";

// Documenten op Mijn previews (22 okt 2026): stappenplan, belscript en de
// algemene voorwaarden. De oude handleidingen en dienstverlening staan niet
// meer in deze lijst. De voorwaarden-pdf komt uit lib/voorwaarden-tekst.mjs
// (scripts/voorwaarden-pdf.mjs). De pdf's zelf staan nog in public/documenten.
// beheer en model worden niet meer gebruikt, maar blijven als props bestaan
// zodat de aanroep in app/klanten/page.js niet hoeft te veranderen.
//
// Aangepast-melding (30 okt 2026): geef een document een `aangepast`-datum,
// dan staat er MELDING_DAGEN lang een melding boven de lijst en een label bij
// het document. De datum zit ook in de link (?v=...), zodat niemand een oude
// versie uit de browsercache te zien krijgt.
const MELDING_DAGEN = 21;

const DOCS = [
  { bestand: "stappenplan-verkopers.pdf", titel: "Stappenplan verkopers", sub: "van preview tot klant, stap voor stap" },
  {
    bestand: "belscript.pdf",
    titel: "Belscript",
    sub: "zo bel je een prospect over zijn preview en app",
    aangepast: "2026-10-30",
    wat: "Het gesprek begint nu met vragen over zijn werk; de app noem je pas daarna, in één zin. Nieuw: wat te doen bij irritatie, voicemail of als hij ophangt.",
  },
  { bestand: "algemene-voorwaarden.pdf", titel: "Algemene voorwaarden", sub: "waar de klant akkoord op geeft, met verwerkersovereenkomst" },
];

function datumNL(iso) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("nl-NL", { day: "numeric", month: "long" });
}

function isRecent(iso) {
  if (!iso) return false;
  const dagen = (Date.now() - new Date(`${iso}T00:00:00`).getTime()) / 86400000;
  return dagen >= 0 && dagen <= MELDING_DAGEN;
}

export default function DocumentenKaart() {
  const recent = DOCS.filter((d) => isRecent(d.aangepast));

  return (
    <div style={{ background: "#fff", border: `1px solid ${KLEUR.lijn}`, borderRadius: 16, padding: "16px 18px", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
        <h2 style={{ fontFamily: HEAD, fontSize: 16, margin: 0, fontWeight: 800 }}>Documenten</h2>
        <span style={{ fontSize: 13, color: "#6F7A85" }}>altijd bij de hand</span>
      </div>

      {recent.map((d) => (
        <div
          key={`melding-${d.bestand}`}
          role="status"
          style={{
            background: "#F9EEDA", border: "1px solid #E8D3A8", borderRadius: 10,
            padding: "10px 13px", marginBottom: 10, fontSize: 13.5, color: "#1A2B3D", lineHeight: 1.45,
          }}
        >
          <strong>{d.titel} aangepast op {datumNL(d.aangepast)}.</strong> {d.wat} Lees hem even door voordat je weer belt.
        </div>
      ))}

      <div style={{ display: "grid", gap: 8 }}>
        {DOCS.map((d) => (
          <a
            key={d.bestand}
            href={`/documenten/${d.bestand}${d.aangepast ? `?v=${d.aangepast.replaceAll("-", "")}` : ""}`}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "flex", alignItems: "center", gap: 12, textDecoration: "none",
              background: KLEUR.papier, border: `1px solid ${KLEUR.lijn}`, borderRadius: 10,
              padding: "11px 13px", color: "#1A2B3D",
            }}
          >
            <span style={{ fontSize: 18, lineHeight: 1 }}>📄</span>
            <span style={{ flex: "1 1 auto", minWidth: 0 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", fontWeight: 700, fontSize: 14 }}>
                {d.titel}
                {isRecent(d.aangepast) && (
                  <span style={{
                    fontSize: 11.5, fontWeight: 700, color: "#7A4E0E", background: "#F9EEDA",
                    border: "1px solid #E8D3A8", borderRadius: 999, padding: "1px 8px",
                  }}>
                    Aangepast {datumNL(d.aangepast)}
                  </span>
                )}
              </span>
              <span style={{ display: "block", fontSize: 12.5, color: "#4A5560" }}>{d.sub}</span>
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: KLEUR.klei, whiteSpace: "nowrap" }}>Openen ↗</span>
          </a>
        ))}
      </div>
    </div>
  );
}
