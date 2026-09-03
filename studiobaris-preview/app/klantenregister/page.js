import { getOverview } from "../../lib/server-data";
import { leesSessie, isBeheer } from "../../lib/auth";
import WerkplekShell from "../werkplek-shell";
import { KLEUR, HEAD } from "../werkplek-stijl";
import { NieuweKlantKnop, MarkeerAlsKlantKnop } from "../dashboard/dashboard-actions";

export const dynamic = "force-dynamic";

// Los van Abonnementen: hier staan alle klanten (met klantnummer) en de
// toekomstige klanten (nog geen klantnummer, wel al bekend/vastgelegd).
// Een toekomstige klant wordt pas een "echte" klant zodra hij hier of
// elders met "Markeer als klant" wordt geactiveerd — dat gebeurt nooit
// automatisch.

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

function PakketLabel({ type }) {
  return type === "plugin" ? "Alleen plugin" : type === "vol" ? "Vol pakket" : "—";
}

export default async function KlantenregisterPage() {
  const sessie = leesSessie();
  const naam = sessie && sessie.naam ? sessie.naam : "collega";
  const beheer = isBeheer(sessie);

  const alles = await getOverview();

  // Klanten: al een klantnummer, dus geactiveerd. Op volgorde van nummer.
  const klanten = alles
    .filter((r) => r.klantnummer)
    .sort((a, b) => Number(a.klantnummer) - Number(b.klantnummer));

  // Toekomstige klanten: bewust in het register gezet (klant_kandidaat),
  // maar nog geen klantnummer — wacht op "Markeer als klant".
  const toekomstig = alles.filter((r) => r.klant_kandidaat && !r.klantnummer);

  // Voor de "+ Klant toevoegen"-keuzelijst: leads/previews die nog nergens
  // als kandidaat of klant staan, en niet zijn afgewezen.
  const kandidaten = alles.filter(
    (r) => !r.klant_kandidaat && !r.klantnummer && (r.pipeline_status || "") !== "Afgewezen"
  );

  return (
    <WerkplekShell
      naam={naam}
      beheer={beheer}
      actief="/klantenregister"
      titel="Klantenregister"
      sub="Al onze klanten en toekomstige klanten op één plek. Activeren (een klantnummer geven) doe je zelf, met 'Markeer als klant'."
      rechts={<NieuweKlantKnop kandidaten={kandidaten} />}
    >
      <div style={{ ...kaart, padding: "16px 18px", marginBottom: 20 }}>
        <div style={{ fontFamily: HEAD, fontSize: 15, fontWeight: 800, marginBottom: 2 }}>Klanten</div>
        <div style={{ fontSize: 12.5, color: KLEUR.label, marginBottom: 10 }}>
          Alle klanten met een klantnummer, op volgorde.
        </div>
        {klanten.length === 0 ? (
          <div style={{ fontSize: 13.5, color: KLEUR.gedempt }}>Nog geen klanten met een klantnummer.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 640 }}>
              <thead>
                <tr>
                  <th style={th}>Nr.</th>
                  <th style={th}>Bedrijf</th>
                  <th style={th}>Contactpersoon</th>
                  <th style={th}>E-mail</th>
                  <th style={th}>Pakket</th>
                  <th style={{ ...th, textAlign: "right" }}>Maandbedrag</th>
                </tr>
              </thead>
              <tbody>
                {klanten.map((r) => (
                  <tr key={r.slug} style={{ borderTop: `1px solid ${KLEUR.baanRand}` }}>
                    <td style={{ padding: "8px 14px", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{r.klantnummer}</td>
                    <td style={{ padding: "8px 14px" }}>
                      <a href={`/facturen?klant=${encodeURIComponent(r.slug)}`} style={{ color: KLEUR.klei, fontWeight: 700, textDecoration: "none" }}>{r.company_name || r.slug}</a>
                    </td>
                    <td style={{ padding: "8px 14px" }}>{r.contactpersoon || "—"}</td>
                    <td style={{ padding: "8px 14px" }}>{r.lead_email || r.b_email || "—"}</td>
                    <td style={{ padding: "8px 14px" }}><PakketLabel type={r.pakket_type} /></td>
                    <td style={{ padding: "8px 14px", textAlign: "right" }}>{r.maandbedrag ? euro(r.maandbedrag) + " p/m" : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ ...kaart, padding: "16px 18px" }}>
        <div style={{ fontFamily: HEAD, fontSize: 15, fontWeight: 800, marginBottom: 2 }}>Toekomstige klanten</div>
        <div style={{ fontSize: 12.5, color: KLEUR.label, marginBottom: 10 }}>
          Al vastgelegd, nog geen klantnummer. Klik op "Markeer als klant" zodra het zover is.
        </div>
        {toekomstig.length === 0 ? (
          <div style={{ fontSize: 13.5, color: KLEUR.gedempt }}>Geen toekomstige klanten in de wachtrij.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 640 }}>
              <thead>
                <tr>
                  <th style={th}>Bedrijf</th>
                  <th style={th}>Contactpersoon</th>
                  <th style={th}>E-mail</th>
                  <th style={th}>Pakket</th>
                  <th style={th}></th>
                </tr>
              </thead>
              <tbody>
                {toekomstig.map((r) => (
                  <tr key={r.slug} style={{ borderTop: `1px solid ${KLEUR.baanRand}` }}>
                    <td style={{ padding: "8px 14px", fontWeight: 700 }}>{r.company_name || r.slug}</td>
                    <td style={{ padding: "8px 14px" }}>{r.contactpersoon || "—"}</td>
                    <td style={{ padding: "8px 14px" }}>{r.lead_email || r.b_email || "—"}</td>
                    <td style={{ padding: "8px 14px" }}><PakketLabel type={r.pakket_type} /></td>
                    <td style={{ padding: "8px 14px", textAlign: "right" }}>
                      <MarkeerAlsKlantKnop slug={r.slug} bedrijf={r.company_name} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </WerkplekShell>
  );
}
