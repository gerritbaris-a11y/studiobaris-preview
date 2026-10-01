import { getOverview } from "../../lib/server-data";
import { leesSessie, isBeheer } from "../../lib/auth";
import WerkplekShell from "../werkplek-shell";
import { KLEUR } from "../werkplek-stijl";
import KopieerLijst from "./kopieer-lijst";

export const dynamic = "force-dynamic";

// Adressenlijst voor het offline marketingmodel: alle previews die online
// staan, met naam, telefoonnummer en adres onder elkaar. Het adres komt uit
// de preview zelf (content.bedrijf.adres, via get_overview als b_adres).

const kaart = { background: KLEUR.kaart, border: `1px solid ${KLEUR.lijn}`, borderRadius: 14, overflow: "hidden" };
const th = {
  textAlign: "left", fontSize: 11, letterSpacing: 1, textTransform: "uppercase",
  color: KLEUR.label, fontWeight: 700, padding: "10px 14px",
  background: KLEUR.baan, borderBottom: `1px solid ${KLEUR.baanRand}`, whiteSpace: "nowrap",
};
const td = { padding: "10px 14px", borderBottom: `1px solid ${KLEUR.lijn}`, fontSize: 14, verticalAlign: "top" };

export default async function AdressenlijstPage() {
  const sessie = leesSessie();
  const naam = sessie && sessie.naam ? sessie.naam : "collega";
  const beheer = isBeheer(sessie);

  const alles = await getOverview();
  const rijen = alles
    .filter((r) => r.gepubliceerd)
    .map((r) => ({
      slug: r.slug,
      bedrijf: r.company_name || r.slug,
      telefoon: r.lead_phone || r.b_telefoon || "",
      adres: (r.b_adres || "").trim(),
    }))
    .sort((a, b) => a.bedrijf.localeCompare(b.bedrijf, "nl"));

  const zonderAdres = rijen.filter((r) => !r.adres).length;

  return (
    <WerkplekShell
      naam={naam}
      beheer={beheer}
      actief="/adressenlijst"
      titel="Adressenlijst"
      sub={`${rijen.length} online previews${zonderAdres ? `, waarvan ${zonderAdres} nog zonder adres` : ""}.`}
      rechts={<KopieerLijst rijen={rijen} />}
    >
      <div style={kaart}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th}>Bedrijf</th>
                <th style={th}>Telefoon</th>
                <th style={th}>Adres</th>
              </tr>
            </thead>
            <tbody>
              {rijen.map((r) => (
                <tr key={r.slug}>
                  <td style={{ ...td, fontWeight: 700, color: KLEUR.inkt }}>{r.bedrijf}</td>
                  <td style={{ ...td, whiteSpace: "nowrap", color: KLEUR.gedempt }}>
                    {r.telefoon ? <a href={`tel:${r.telefoon.replace(/[^0-9+]/g, "")}`} style={{ color: KLEUR.gedempt, textDecoration: "none" }}>{r.telefoon}</a> : "—"}
                  </td>
                  <td style={{ ...td, color: r.adres ? KLEUR.gedempt : KLEUR.label }}>
                    {r.adres || "Adres onbekend"}
                  </td>
                </tr>
              ))}
              {rijen.length === 0 && (
                <tr><td colSpan={3} style={{ ...td, color: KLEUR.label }}>Nog geen online previews.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </WerkplekShell>
  );
}
