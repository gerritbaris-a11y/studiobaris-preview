import { getAbonnementen, getFacturenKlant, getKandidaten } from "../../lib/abonnementen-data";
import { leesSessie, isBeheer } from "../../lib/auth";
import WerkplekShell from "../werkplek-shell";
import { KLEUR, HEAD } from "../werkplek-stijl";
import KlantRegel from "./klant-regel";
import NieuweKlant from "./nieuwe-klant";

export const dynamic = "force-dynamic";

// Alles wat met geld te maken heeft op één plek: wat er is afgesproken, wat er
// maandelijks binnenkomt, wanneer er geïncasseerd wordt en welke facturen er
// uit zijn gegaan. Daarom staan het maandbedrag en de akkoordlink niet meer op
// de klantkaart — twee plekken voor hetzelfde bedrag gaat een keer mis.

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://preview.studiobaris.nl";

function euro(v) {
  const n = Number(v) || 0;
  return "€ " + n.toFixed(2).replace(".", ",");
}

const kaart = { background: KLEUR.kaart, border: `1px solid ${KLEUR.lijn}`, borderRadius: 14 };
const th = {
  textAlign: "left", fontSize: 11, letterSpacing: 1, textTransform: "uppercase",
  color: KLEUR.label, fontWeight: 700, padding: "10px 14px",
  background: KLEUR.baan, borderBottom: `1px solid ${KLEUR.baanRand}`, whiteSpace: "nowrap",
};

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
  const kandidaten = await getKandidaten();

  // De facturen per klant erbij. Het gaat om een handvol klanten; zodra dat er
  // honderden worden, halen we ze pas op bij het openklappen van een regel.
  const facturenPerKlant = {};
  await Promise.all(
    rijen.map(async (r) => {
      facturenPerKlant[r.slug] = await getFacturenKlant(r.slug);
    })
  );

  const lopend = rijen.filter((r) => r.betaal_status === "actief" && r.betaal_abonnement_id);
  const perMaand = lopend.reduce((som, r) => som + (Number(r.maandbedrag_incl) || 0), 0);
  const aandacht = rijen.filter(
    (r) => r.betaal_status === "mislukt" || r.betaal_status === "achterstand"
  ).length;

  return (
    <WerkplekShell
      naam={naam}
      beheer={beheer}
      actief="/abonnementen"
      titel="Abonnementen"
      sub="Wat er is afgesproken, wat er maandelijks binnenkomt, en welke facturen eruit zijn."
      rechts={<NieuweKlant kandidaten={kandidaten} />}
    >
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
        <Cijfer label="Lopend" waarde={lopend.length} onder={lopend.length === 1 ? "abonnement" : "abonnementen"} />
        <Cijfer label="Per maand" waarde={euro(perMaand)} onder="incl. btw" />
        <Cijfer label="Aandacht nodig" waarde={aandacht} onder={aandacht ? "betaling mislukt" : "alles loopt"} />
      </div>

      {rijen.length === 0 ? (
        <div style={{ ...kaart, padding: "20px 22px", color: KLEUR.gedempt }}>
          Er is nog geen enkele klant met een maandbedrag. Voeg er hierboven een toe, dan verschijnt hij hier.
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
              {rijen.map((r) => (
                <KlantRegel
                  key={r.slug}
                  rij={r}
                  facturen={facturenPerKlant[r.slug] || []}
                  siteUrl={SITE_URL}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: 16, fontSize: 12.5, color: KLEUR.label, maxWidth: 640, lineHeight: 1.6 }}>
        De maandfactuur gaat automatisch veertien dagen vóór de incassodatum de deur uit; dat is
        tegelijk de wettelijk verplichte vooraankondiging van de SEPA-incasso. De factuur voor de
        website ontstaat zodra Mollie de eerste betaling bevestigt.
      </div>
    </WerkplekShell>
  );
}
