import { getAbonnementen } from "../../lib/abonnementen-data";

export const dynamic = "force-dynamic";

// Alles wat maandelijks terugkomt op één plek: wat er loopt, wanneer er
// geïncasseerd wordt, en welke factuur er als laatste uit is gegaan.

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://preview.studiobaris.nl";

function euro(v) {
  const n = Number(v) || 0;
  return "€ " + n.toFixed(2).replace(".", ",");
}

function datumNL(iso) {
  if (!iso) return "—";
  const d = String(iso).slice(0, 10).split("-");
  if (d.length !== 3) return "—";
  const maanden = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
  return `${Number(d[2])} ${maanden[Number(d[1]) - 1]}`;
}

// Wat de status betekent in gewone taal, met een kleur die het meteen verraadt.
function statusInfo(rij) {
  if (rij.betaal_status === "actief" && rij.betaal_abonnement_id) {
    return { tekst: "Loopt", kleur: "#1E6B4F", achtergrond: "#DEF0E7" };
  }
  if (rij.betaal_status === "mislukt") {
    return { tekst: "Betaling mislukt", kleur: "#B33A2B", achtergrond: "#F7E4E1" };
  }
  if (rij.betaal_status === "akkoord") {
    return { tekst: "Wacht op betaling", kleur: "#8A5A0B", achtergrond: "#FBEEDA" };
  }
  return { tekst: "Nog geen machtiging", kleur: "#55697A", achtergrond: "#EDF1F4" };
}

const wrap = {
  maxWidth: 1080,
  margin: "0 auto",
  padding: "32px 24px 64px",
  fontFamily: "system-ui, sans-serif",
  color: "#12212C",
};
const kaart = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  overflow: "hidden",
};
const th = {
  textAlign: "left",
  fontSize: 11,
  letterSpacing: 1,
  textTransform: "uppercase",
  color: "#7D909D",
  fontWeight: 700,
  padding: "10px 14px",
  background: "#F4F7F9",
  borderBottom: "1px solid #e5e7eb",
  whiteSpace: "nowrap",
};
const td = { padding: "12px 14px", borderBottom: "1px solid #f0f3f5", verticalAlign: "top", fontSize: 14 };
const tdNum = { ...td, textAlign: "right", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" };

export default async function AbonnementenPage() {
  const rijen = await getAbonnementen();

  const lopend = rijen.filter((r) => r.betaal_status === "actief" && r.betaal_abonnement_id);
  const perMaandIncl = lopend.reduce((som, r) => som + (Number(r.maandbedrag_incl) || 0), 0);
  const aandacht = rijen.filter((r) => !(r.betaal_status === "actief" && r.betaal_abonnement_id));

  return (
    <main style={wrap}>
      <p style={{ fontSize: 12, letterSpacing: 2, textTransform: "uppercase", color: "#7D909D", margin: 0 }}>
        StudioBaris · beheer
      </p>
      <h1 style={{ fontSize: 30, margin: "6px 0 4px", letterSpacing: "-0.02em" }}>Abonnementen</h1>
      <p style={{ color: "#4A5E6D", margin: "0 0 24px" }}>
        Wat er maandelijks binnenkomt, wanneer er geïncasseerd wordt, en wie er aandacht nodig heeft.
      </p>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
        <div style={{ ...kaart, padding: "14px 18px", minWidth: 170 }}>
          <div style={{ fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: "#7D909D", fontWeight: 700 }}>
            Lopend
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, marginTop: 2 }}>{lopend.length}</div>
        </div>
        <div style={{ ...kaart, padding: "14px 18px", minWidth: 170 }}>
          <div style={{ fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: "#7D909D", fontWeight: 700 }}>
            Per maand
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, marginTop: 2, fontVariantNumeric: "tabular-nums" }}>
            {euro(perMaandIncl)}
          </div>
          <div style={{ fontSize: 12, color: "#7D909D" }}>incl. btw</div>
        </div>
        <div style={{ ...kaart, padding: "14px 18px", minWidth: 170 }}>
          <div style={{ fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: "#7D909D", fontWeight: 700 }}>
            Aandacht nodig
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, marginTop: 2 }}>{aandacht.length}</div>
        </div>
      </div>

      {rijen.length === 0 ? (
        <div style={{ ...kaart, padding: "20px 22px", color: "#4A5E6D" }}>
          Er is nog geen enkele klant met een maandbedrag. Zodra je er een instelt, verschijnt hij hier.
        </div>
      ) : (
        <div style={{ ...kaart, overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 860 }}>
            <thead>
              <tr>
                <th style={th}>Klant</th>
                <th style={{ ...th, textAlign: "right" }}>Per maand</th>
                <th style={th}>Incassodag</th>
                <th style={th}>Volgende incasso</th>
                <th style={th}>Laatste factuur</th>
                <th style={th}>Status</th>
                <th style={th}>Verkoper</th>
              </tr>
            </thead>
            <tbody>
              {rijen.map((r) => {
                const s = statusInfo(r);
                return (
                  <tr key={r.slug}>
                    <td style={td}>
                      <div style={{ fontWeight: 600 }}>{r.company_name || r.slug}</div>
                      <div style={{ fontSize: 12.5, color: "#7D909D" }}>
                        {r.contactpersoon ? r.contactpersoon + " · " : ""}
                        {r.lead_email || "geen e-mailadres"}
                      </div>
                      <a
                        href={`${SITE_URL}/akkoord/${r.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: 12.5, color: "#1A2E40" }}
                      >
                        Akkoordlink openen
                      </a>
                    </td>
                    <td style={tdNum}>
                      <div style={{ fontWeight: 600 }}>{euro(r.maandbedrag_incl)}</div>
                      <div style={{ fontSize: 12, color: "#7D909D" }}>{euro(r.maandbedrag)} excl.</div>
                    </td>
                    <td style={td}>{r.incassodag ? `de ${r.incassodag}e` : "—"}</td>
                    <td style={td}>{datumNL(r.volgende_incasso)}</td>
                    <td style={td}>
                      {r.laatste_factuur_nummer ? (
                        <>
                          <div>{r.laatste_factuur_nummer}</div>
                          <div style={{ fontSize: 12, color: "#7D909D" }}>
                            {r.laatste_factuur_periode || datumNL(r.laatste_factuur_op)}
                          </div>
                        </>
                      ) : (
                        <span style={{ color: "#7D909D" }}>nog geen</span>
                      )}
                    </td>
                    <td style={td}>
                      <span
                        style={{
                          background: s.achtergrond,
                          color: s.kleur,
                          fontSize: 12,
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: 4,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {s.tekst}
                      </span>
                    </td>
                    <td style={{ ...td, color: "#4A5E6D" }}>{r.verzamelaar || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
