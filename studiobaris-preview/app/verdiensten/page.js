import { leesSessie, isBeheer } from "../../lib/auth";
import { getVerdiensten } from "../../lib/verdiensten";
import WerkplekShell from "../werkplek-shell";
import { KLEUR, HEAD } from "../werkplek-stijl";
import VerkoperKeuze from "./verkoper-keuze";

export const dynamic = "force-dynamic";

// Financieel overzicht (okt 2026): wat een verkoper verdiend heeft, wat al
// uitbetaald is en wat nog openstaat, per klant uitgesplitst. Verkoper ziet
// alleen zijn eigen klanten; beheer ziet iedereen en kan per verkoper kiezen.
// Bedragen volgen dezelfde regels als Team & omzet.

function euro(n) {
  const v = Number(n || 0);
  return "€ " + v.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function status(r) {
  const uit = Number(r.uitbetaald) || 0;
  const com = Number(r.commissie) || 0;
  if (com > 0 && uit >= com) return ["Volledig uitbetaald", "#0f6e56", "#e7f3ea"];
  if (uit > 0) return ["Deels uitbetaald", "#854f0b", "#fdf1dc"];
  return ["Wacht op betaling", "#7A7168", "#F3EEE6"];
}

export default async function VerdienstenPage({ searchParams }) {
  const sessie = leesSessie();
  const naam = sessie ? sessie.naam : "";
  const beheer = isBeheer(sessie);
  const gekozen = beheer ? (searchParams && searchParams.wie) || "" : naam;

  const alle = await getVerdiensten(beheer ? null : naam);
  const verkopers = [...new Set(alle.map((r) => r.verkoper).filter(Boolean))].sort((a, b) => a.localeCompare(b, "nl"));
  const rijen = gekozen ? alle.filter((r) => r.verkoper === gekozen) : alle;

  const tot = rijen.reduce(
    (a, r) => ({
      verkocht: a.verkocht + (Number(r.verkoopbedrag) || 0),
      commissie: a.commissie + (Number(r.commissie) || 0),
      uitbetaald: a.uitbetaald + (Number(r.uitbetaald) || 0),
    }),
    { verkocht: 0, commissie: 0, uitbetaald: 0 }
  );
  const open = tot.commissie - tot.uitbetaald;

  const kaart = { background: "#fff", border: `1px solid ${KLEUR.lijn}`, borderRadius: 12, padding: "12px 14px" };
  const th = { textAlign: "left", fontSize: 12, fontWeight: 700, color: KLEUR.gedempt, padding: "8px 10px", borderBottom: `1px solid ${KLEUR.lijn}`, whiteSpace: "nowrap" };
  const td = { fontSize: 14, padding: "10px", borderBottom: `1px solid ${KLEUR.lijn}`, whiteSpace: "nowrap" };
  const bedrag = { ...td, textAlign: "right", fontVariantNumeric: "tabular-nums" };

  return (
    <WerkplekShell
      naam={naam || "collega"}
      beheer={beheer}
      actief="/verdiensten"
      titel="Financieel overzicht"
      sub={beheer ? "Commissie per verkoper en per klant." : "Wat je verdiend hebt, wat al uitbetaald is en wat nog openstaat."}
    >
      {beheer && <VerkoperKeuze verkopers={verkopers} gekozen={gekozen} />}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, marginBottom: 16 }}>
        {[
          ["Klanten", String(rijen.length), KLEUR.inkt],
          ["Verkocht", euro(tot.verkocht), KLEUR.inkt],
          ["Commissie totaal", euro(tot.commissie), KLEUR.inkt],
          ["Uitbetaald", euro(tot.uitbetaald), "#0f6e56"],
          ["Nog te verdienen", euro(open), "#b45309"],
        ].map(([l, w, kleur]) => (
          <div key={l} style={kaart}>
            <div style={{ fontSize: 12, color: KLEUR.gedempt, fontWeight: 700 }}>{l}</div>
            <div style={{ fontFamily: HEAD, fontSize: 22, fontWeight: 800, color: kleur }}>{w}</div>
          </div>
        ))}
      </div>

      {rijen.length === 0 ? (
        <div style={{ background: KLEUR.amber.bg, border: `1px solid ${KLEUR.baanRand}`, borderRadius: 12, padding: "16px 18px", color: KLEUR.amber.tekst }}>
          Nog geen verkochte klanten. Zodra een preview van jou een verkoopbedrag heeft, staat hij hier.
        </div>
      ) : (
        <div style={{ background: "#fff", border: `1px solid ${KLEUR.lijn}`, borderRadius: 14, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th}>Klant</th>
                {beheer && !gekozen && <th style={th}>Verkoper</th>}
                <th style={th}>Status</th>
                <th style={{ ...th, textAlign: "right" }}>Verkocht</th>
                <th style={{ ...th, textAlign: "right" }}>Commissie</th>
                <th style={{ ...th, textAlign: "right" }}>Uitbetaald</th>
                <th style={{ ...th, textAlign: "right" }}>Nog te verdienen</th>
              </tr>
            </thead>
            <tbody>
              {rijen.map((r) => {
                const [label, kleur, bg] = status(r);
                const rest = (Number(r.commissie) || 0) - (Number(r.uitbetaald) || 0);
                return (
                  <tr key={r.slug}>
                    <td style={{ ...td, fontWeight: 700, whiteSpace: "normal", minWidth: 160 }}>{r.bedrijf}</td>
                    {beheer && !gekozen && <td style={td}>{r.verkoper}</td>}
                    <td style={td}>
                      <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 9px", borderRadius: 999, color: kleur, background: bg }}>{label}</span>
                    </td>
                    <td style={bedrag}>{euro(r.verkoopbedrag)}</td>
                    <td style={bedrag}>{euro(r.commissie)}</td>
                    <td style={{ ...bedrag, color: "#0f6e56" }}>{euro(r.uitbetaald)}</td>
                    <td style={{ ...bedrag, color: rest > 0 ? "#b45309" : KLEUR.gedempt }}>{euro(rest)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p style={{ fontSize: 12.5, color: KLEUR.gedempt, marginTop: 12 }}>
        Uitbetaald: de helft van je commissie zodra de klant akkoord geeft, de andere helft zodra de website is opgeleverd.
      </p>
    </WerkplekShell>
  );
}
