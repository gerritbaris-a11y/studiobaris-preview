import { VERSIE, DATUM, BEDRIJF, INLEIDING, ARTIKELEN, BIJLAGE } from "../../lib/voorwaarden-tekst.mjs";

export const dynamic = "force-static";

export const metadata = { title: "Algemene voorwaarden — StudioBaris" };

// De klant linkt hier naartoe vanaf de akkoordpagina. De tekst staat in
// lib/voorwaarden-tekst.mjs (zelfde bron als de pdf in Documenten).

const kop = { fontSize: 18, fontWeight: 800, margin: "30px 0 8px" };
const lid = { margin: "0 0 8px", paddingLeft: 30, position: "relative" };
const nr = { position: "absolute", left: 0, color: "#888", fontVariantNumeric: "tabular-nums" };

function Leden({ a, n }) {
  let teller = 0;
  return (
    <div>
      {a.definities && (
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          {a.definities.map((d) => (
            <li key={d.term} style={{ marginBottom: 6 }}><strong>{d.term}</strong>: {d.uitleg}</li>
          ))}
        </ul>
      )}
      {(a.leden || []).map((l, i) => {
        if (typeof l !== "string") {
          return (
            <ul key={i} style={{ margin: "0 0 8px", paddingLeft: 50 }}>
              {l.lijst.map((x) => <li key={x}>{x}</li>)}
            </ul>
          );
        }
        teller += 1;
        const meer = (a.leden || []).filter((x) => typeof x === "string").length > 1;
        return (
          <p key={i} style={meer ? lid : { margin: "0 0 8px" }}>
            {meer && <span style={nr}>{n}.{teller}</span>}
            {l}
          </p>
        );
      })}
    </div>
  );
}

export default function VoorwaardenPage() {
  return (
    <main style={{ maxWidth: 760, margin: "6vh auto", padding: "0 24px 80px", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", color: "#222", lineHeight: 1.65, fontSize: 15 }}>
      <p style={{ fontSize: 13, letterSpacing: 2, textTransform: "uppercase", color: "#888", margin: 0 }}>StudioBaris</p>
      <h1 style={{ fontSize: 30, margin: "6px 0 4px" }}>Algemene voorwaarden</h1>
      <p style={{ color: "#888", marginTop: 0 }}>Versie {VERSIE} · {DATUM}</p>
      <p>{INLEIDING}</p>

      {ARTIKELEN.map((a, i) => (
        <section key={a.titel}>
          <h2 style={kop}>Artikel {i + 1} — {a.titel}</h2>
          <Leden a={a} n={i + 1} />
        </section>
      ))}

      <h2 style={{ ...kop, fontSize: 22, marginTop: 48 }}>{BIJLAGE.titel}</h2>
      <p>{BIJLAGE.intro}</p>
      {BIJLAGE.artikelen.map((a, i) => (
        <section key={a.titel}>
          <h3 style={{ ...kop, fontSize: 16 }}>{i + 1}. {a.titel}</h3>
          <Leden a={a} n={i + 1} />
        </section>
      ))}

      <p style={{ marginTop: 40, color: "#888", fontSize: 13 }}>
        {BEDRIJF.naam} · {BEDRIJF.adres} · KvK {BEDRIJF.kvk} · {BEDRIJF.email} · {BEDRIJF.website}
      </p>
    </main>
  );
}
