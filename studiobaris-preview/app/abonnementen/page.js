import { getAbonnementen } from "../../lib/abonnementen-data";
import { leesSessie, isBeheer } from "../../lib/auth";
import WerkplekShell, { Chip } from "../werkplek-shell";
import { KLEUR, HEAD } from "../werkplek-stijl";

export const dynamic = "force-dynamic";

// Alles wat maandelijks terugkomt op één plek: wat er loopt, wanneer er
// geïncasseerd wordt, en welke factuur er als laatste uit is gegaan.

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://preview.studiobaris.nl";

function euro(v) {
  const n = Number(v) || 0;
  return "€ " + n.toFixed(2).replace(".", ",");
}

const MAANDEN = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];

function datumNL(iso) {
  if (!iso) return null;
  const d = String(iso).slice(0, 10).split("-");
  if (d.length !== 3) return null;
  return `${Number(d[2])} ${MAANDEN[Number(d[1]) - 1]}`;
}

// Wat de status betekent in gewone taal, in de kleuren van de werkplek.
function status(rij) {
  if (rij.betaal_status === "actief" && rij.betaal_abonnement_id) return { tekst: "Loopt", kleur: "sage" };
  if (rij.betaal_status === "mislukt") return { tekst: "Betaling mislukt", kleur: "rust" };
  if (rij.betaal_status === "akkoord") return { tekst: "Wacht op betaling", kleur: "amber" };
  return { tekst: "Nog geen machtiging", kleur: "grijs" };
}

const kaart = { background: KLEUR.kaart, border: `1px solid ${KLEUR.lijn}`, borderRadius: 14 };
const th = {
  textAlign: "left", fontSize: 11, letterSpacing: 1, textTransform: "uppercase",
  color: KLEUR.label, fontWeight: 700, padding: "10px 14px",
  background: KLEUR.baan, borderBottom: `1px solid ${KLEUR.baanRand}`, whiteSpace: "nowrap",
};
const td = { padding: "13px 14px", borderBottom: `1px solid ${KLEUR.lijn}`, verticalAlign: "top", fontSize: 14 };
const tdNum = { ...td, textAlign: "right", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" };

function Cijfer({ label, waarde, onder }) {
  return (
    <div style={{ ...kaart, padding: "14px 18px", minWidth: 168 }}>
      <div style={{ fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: KLEUR.label, fontWeight: 700 }}>
        {label}
      </div>
      <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 26, marginTop: 2, fontVariantNumeric: "tabular-nums" }}>
        {waarde}
      </div>
      {onder && <div style={{ fontSize: 12, color: KLEUR.label }}>{onder}</div>}
    </div>
  );
}

export default async function AbonnementenPage() {
  const sessie = leesSessie();
  const naam = sessie && sessie.naam ? sessie.naam : "collega";
  const beheer = isBeheer(sessie);

  const rijen = await getAbonnementen();
  const lopend = rijen.filter((r) => r.betaal_status === "actief" && r.betaal_abonnement_id);
  const perMaand = lopend.reduce((som, r) => som + (Number(r.maandbedrag_incl) || 0), 0);
  const aandacht = rijen.length - lopend.length;

  return (
    <WerkplekShell
      naam={naam}
      beheer={beheer}
      actief="/abonnementen"
      titel="Abonnementen"
      sub="Wat er maandelijks binnenkomt, wanneer er geïncasseerd wordt, en wie er aandacht nodig heeft."
    >
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
        <Cijfer label="Lopend" waarde={lopend.length} />
        <Cijfer label="Per maand" waarde={euro(perMaand)} onder="incl. btw" />
        <Cijfer label="Aandacht nodig" waarde={aandacht} />
      </div>

      {rijen.length === 0 ? (
        <div style={{ ...kaart, padding: "20px 22px", color: KLEUR.gedempt }}>
          Er is nog geen enkele klant met een maandbedrag. Zodra je er een instelt, verschijnt hij hier.
        </div>
      ) : (
        <div style={{ ...kaart, overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 880 }}>
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
                const s = status(r);
                const volgende = datumNL(r.volgende_incasso);
                return (
                  <tr key={r.slug}>
                    <td style={td}>
                      <div style={{ fontWeight: 700 }}>{r.company_name || r.slug}</div>
                      <div style={{ fontSize: 12.5, color: KLEUR.label }}>
                        {r.contactpersoon ? r.contactpersoon + " · " : ""}
                        {r.lead_email || "geen e-mailadres"}
                      </div>
                      <a
                        href={`${SITE_URL}/akkoord/${r.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: 12.5, color: KLEUR.klei, fontWeight: 700, textDecoration: "none" }}
                      >
                        Akkoordlink openen →
                      </a>
                    </td>
                    <td style={tdNum}>
                      <div style={{ fontWeight: 700 }}>{euro(r.maandbedrag_incl)}</div>
                      <div style={{ fontSize: 12, color: KLEUR.label }}>{euro(r.maandbedrag)} excl.</div>
                    </td>
                    <td style={td}>{r.incassodag ? `de ${r.incassodag}e` : "—"}</td>
                    <td style={td}>{volgende || "—"}</td>
                    <td style={td}>
                      {r.laatste_factuur_nummer ? (
                        <>
                          <div>{r.laatste_factuur_nummer}</div>
                          <div style={{ fontSize: 12, color: KLEUR.label }}>
                            {r.laatste_factuur_periode || datumNL(r.laatste_factuur_op) || ""}
                          </div>
                        </>
                      ) : (
                        <span style={{ color: KLEUR.label }}>nog geen</span>
                      )}
                    </td>
                    <td style={td}><Chip kleur={s.kleur}>{s.tekst}</Chip></td>
                    <td style={{ ...td, color: KLEUR.gedempt }}>{r.verzamelaar || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </WerkplekShell>
  );
}
