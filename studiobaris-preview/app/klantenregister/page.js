import { getOverview } from "../../lib/server-data";
import { leesSessie, isBeheer } from "../../lib/auth";
import WerkplekShell from "../werkplek-shell";
import { KLEUR, HEAD } from "../werkplek-stijl";
import { NieuweKlantKnop } from "../dashboard/dashboard-actions";
import KlantRij from "./klant-rij";

export const dynamic = "force-dynamic";

// Los van Abonnementen: hier staan alle klanten (met klantnummer), de
// toekomstige klanten (nog geen klantnummer, wel al bekend/vastgelegd) en de
// oud-klanten (hadden een klantnummer, zijn geen klant meer). Een toekomstige
// klant wordt pas een "echte" klant zodra hij hier of elders met "Markeer als
// klant" wordt geactiveerd — dat gebeurt nooit automatisch. Klik op een rij
// voor het volledige plaatje (adres, KvK, BTW) en om gegevens te bewerken.

const kaart = { background: KLEUR.kaart, border: `1px solid ${KLEUR.lijn}`, borderRadius: 14 };
const th = {
  textAlign: "left", fontSize: 11, letterSpacing: 1, textTransform: "uppercase",
  color: KLEUR.label, fontWeight: 700, padding: "10px 14px",
  background: KLEUR.baan, borderBottom: `1px solid ${KLEUR.baanRand}`, whiteSpace: "nowrap",
};

export default async function KlantenregisterPage() {
  const sessie = leesSessie();
  const naam = sessie && sessie.naam ? sessie.naam : "collega";
  const beheer = isBeheer(sessie);

  const alles = await getOverview();

  // Klanten: al een klantnummer, dus geactiveerd, en (nog) niet als
  // oud-klant gemarkeerd. Op volgorde van nummer.
  const klanten = alles
    .filter((r) => r.klantnummer && !r.oud_klant)
    .sort((a, b) => Number(a.klantnummer) - Number(b.klantnummer));

  // Oud-klanten: hadden een klantnummer, zijn geen klant meer. Klantnummer
  // en factuurhistorie blijven gewoon staan — alleen uit de actieve lijst.
  const oudKlanten = alles
    .filter((r) => r.klantnummer && r.oud_klant)
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
      sub="Al onze klanten en toekomstige klanten op één plek. Klik op een rij voor het volledige plaatje. Activeren (een klantnummer geven) doe je zelf, met 'Markeer als klant'."
      rechts={<NieuweKlantKnop kandidaten={kandidaten} />}
    >
      <div style={{ ...kaart, padding: "16px 18px", marginBottom: 20 }}>
        <div style={{ fontFamily: HEAD, fontSize: 15, fontWeight: 800, marginBottom: 2 }}>Klanten</div>
        <div style={{ fontSize: 12.5, color: KLEUR.label, marginBottom: 10 }}>
          Alle klanten met een klantnummer, op volgorde. Klik op een rij voor adres, KvK, BTW en meer.
        </div>
        {klanten.length === 0 ? (
          <div style={{ fontSize: 13.5, color: KLEUR.gedempt }}>Nog geen klanten met een klantnummer.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 720 }}>
              <thead>
                <tr>
                  <th style={th}>Nr.</th>
                  <th style={th}>Bedrijf</th>
                  <th style={th}>Contactpersoon</th>
                  <th style={th}>Telefoon</th>
                  <th style={th}>E-mail</th>
                  <th style={th}>Pakket</th>
                  <th style={{ ...th, textAlign: "right" }}>Maandbedrag</th>
                </tr>
              </thead>
              <tbody>
                {klanten.map((r) => (
                  <KlantRij key={r.slug} r={r} variant="klant" />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ ...kaart, padding: "16px 18px", marginBottom: oudKlanten.length > 0 ? 20 : 0 }}>
        <div style={{ fontFamily: HEAD, fontSize: 15, fontWeight: 800, marginBottom: 2 }}>Toekomstige klanten</div>
        <div style={{ fontSize: 12.5, color: KLEUR.label, marginBottom: 10 }}>
          Al vastgelegd, nog geen klantnummer. Klik op een rij voor het volledige plaatje, of op "Markeer als klant" zodra het zover is.
        </div>
        {toekomstig.length === 0 ? (
          <div style={{ fontSize: 13.5, color: KLEUR.gedempt }}>Geen toekomstige klanten in de wachtrij.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 720 }}>
              <thead>
                <tr>
                  <th style={th}>Bedrijf</th>
                  <th style={th}>Contactpersoon</th>
                  <th style={th}>Telefoon</th>
                  <th style={th}>E-mail</th>
                  <th style={th}>Pakket</th>
                  <th style={th}></th>
                </tr>
              </thead>
              <tbody>
                {toekomstig.map((r) => (
                  <KlantRij key={r.slug} r={r} variant="toekomstig" />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {oudKlanten.length > 0 && (
        <div style={{ ...kaart, padding: "16px 18px" }}>
          <div style={{ fontFamily: HEAD, fontSize: 15, fontWeight: 800, marginBottom: 2, color: KLEUR.labelDonker }}>Oud-klanten</div>
          <div style={{ fontSize: 12.5, color: KLEUR.label, marginBottom: 10 }}>
            Geen klant meer. Klantnummer en facturen blijven bewaard — hier terug te zetten met "Weer actief maken".
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 720 }}>
              <thead>
                <tr>
                  <th style={th}>Nr.</th>
                  <th style={th}>Bedrijf</th>
                  <th style={th}>Contactpersoon</th>
                  <th style={th}>Telefoon</th>
                  <th style={th}>E-mail</th>
                  <th style={th}></th>
                </tr>
              </thead>
              <tbody>
                {oudKlanten.map((r) => (
                  <KlantRij key={r.slug} r={r} variant="oud" />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </WerkplekShell>
  );
}
