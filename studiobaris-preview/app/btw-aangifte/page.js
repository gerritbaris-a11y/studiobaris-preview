import Link from "next/link";
import { getOmzetOverzicht } from "../../lib/abonnementen-data";
import { leesSessie, isBeheer } from "../../lib/auth";
import WerkplekShell from "../werkplek-shell";
import { KLEUR } from "../werkplek-stijl";

export const dynamic = "force-dynamic";

const KWARTAAL_LABEL = {
  1: "Q1 (jan–mrt)",
  2: "Q2 (apr–jun)",
  3: "Q3 (jul–sep)",
  4: "Q4 (okt–dec)",
};

function euro(v) {
  const n = Number(v) || 0;
  return "€ " + n.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const kaart = { background: "#fff", border: `1px solid ${KLEUR.lijn}`, borderRadius: 14 };
const th = {
  textAlign: "left", fontSize: 11, letterSpacing: 1, textTransform: "uppercase",
  color: KLEUR.label, fontWeight: 700, padding: "12px 14px",
  background: KLEUR.baan, borderBottom: `1px solid ${KLEUR.baanRand}`,
};
const td = { padding: "13px 14px", fontSize: 14.5, borderBottom: `1px solid ${KLEUR.lijn}` };
const tdGetal = { ...td, textAlign: "right", fontVariantNumeric: "tabular-nums" };

// Omzet per kwartaal + btw, geteld op factuurdatum (factuurstelsel) — zelfde
// opzet als het 'Overzicht & btw-aangifte'-tabblad in de eigen
// administratie-spreadsheet. Puur leeswerk: er wordt hier niets herberekend
// of los bijgehouden, alles komt rechtstreeks uit workflow.facturen.
export default async function BtwAangiftePage({ searchParams }) {
  const sessie = leesSessie();
  const naam = sessie && sessie.naam ? sessie.naam : "collega";
  const beheer = isBeheer(sessie);

  const nu = new Date().getFullYear();
  const jaarParam = searchParams && searchParams.jaar ? parseInt(searchParams.jaar, 10) : nu;
  const jaar = Number.isFinite(jaarParam) ? jaarParam : nu;

  const overzicht = await getOmzetOverzicht(jaar);

  return (
    <WerkplekShell
      naam={naam}
      beheer={beheer}
      actief="/btw-aangifte"
      titel="Omzet & btw-aangifte"
      sub="Per kwartaal, op basis van factuurdatum — zo geef je makkelijk en overzichtelijk aan."
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <Link
          href={`/btw-aangifte?jaar=${overzicht.jaar - 1}`}
          style={{ fontSize: 13, fontWeight: 700, color: KLEUR.klei, textDecoration: "none" }}
        >
          ← {overzicht.jaar - 1}
        </Link>
        <div style={{ fontFamily: "inherit", fontSize: 18, fontWeight: 800, color: KLEUR.inkt }}>
          {overzicht.jaar}
        </div>
        <Link
          href={`/btw-aangifte?jaar=${overzicht.jaar + 1}`}
          style={{ fontSize: 13, fontWeight: 700, color: KLEUR.klei, textDecoration: "none" }}
        >
          {overzicht.jaar + 1} →
        </Link>
      </div>

      <div style={{ ...kaart, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>Periode</th>
              <th style={{ ...th, textAlign: "right" }}>Omzet excl. btw</th>
              <th style={{ ...th, textAlign: "right" }}>Btw</th>
              <th style={{ ...th, textAlign: "right" }}>Omzet incl. btw</th>
            </tr>
          </thead>
          <tbody>
            {(overzicht.kwartalen || []).map((k) => (
              <tr key={k.kwartaal}>
                <td style={td}>{KWARTAAL_LABEL[k.kwartaal] || `Q${k.kwartaal}`}</td>
                <td style={tdGetal}>{euro(k.omzet_excl)}</td>
                <td style={tdGetal}>{euro(k.btw)}</td>
                <td style={tdGetal}>{euro(k.omzet_incl)}</td>
              </tr>
            ))}
            <tr>
              <td style={{ ...td, fontWeight: 800, borderBottom: "none" }}>Jaartotaal</td>
              <td style={{ ...tdGetal, fontWeight: 800, borderBottom: "none" }}>{euro(overzicht.jaartotaal_excl)}</td>
              <td style={{ ...tdGetal, fontWeight: 800, borderBottom: "none" }}>{euro(overzicht.jaartotaal_btw)}</td>
              <td style={{ ...tdGetal, fontWeight: 800, borderBottom: "none" }}>{euro(overzicht.jaartotaal_incl)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 16, ...kaart, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: KLEUR.gedempt }}>
          Nog te ontvangen in {overzicht.jaar} (status = concept of verstuurd)
        </span>
        <span style={{ fontSize: 16, fontWeight: 800 }}>{euro(overzicht.nog_te_ontvangen)}</span>
      </div>

      <p style={{ marginTop: 18, fontSize: 12.5, color: KLEUR.label, maxWidth: 640, lineHeight: 1.5 }}>
        Let op: dit overzicht telt op basis van factuurdatum, niet op basis van betaaldatum (factuurstelsel).
        Voor de btw-aangifte tel je meestal het bedrag mee in de periode waarin je de factuur hebt verstuurd —
        controleer dit met de Belastingdienst of je boekhouder als je twijfelt over welk stelsel voor jou geldt.
      </p>
    </WerkplekShell>
  );
}
