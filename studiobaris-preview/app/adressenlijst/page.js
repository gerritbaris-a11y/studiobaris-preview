import { getOverview } from "../../lib/server-data";
import { leesSessie, isBeheer } from "../../lib/auth";
import WerkplekShell from "../werkplek-shell";
import AdressenTabel from "./adressen-tabel";

export const dynamic = "force-dynamic";

// Adressenlijst voor het offline marketingmodel: alle previews die online
// staan, met naam, telefoonnummer en adres onder elkaar. Het adres komt uit
// de preview zelf (content.bedrijf.adres, via get_overview als b_adres).

export default async function AdressenlijstPage() {
  const sessie = leesSessie();
  const naam = sessie && sessie.naam ? sessie.naam : "collega";
  const beheer = isBeheer(sessie);

  const alles = await getOverview();
  // Gearchiveerde previews ("Geen interesse", pipeline_status "Afgewezen")
  // horen niet in de lijst — zelfde regel als bij Mijn previews.
  const rijen = alles
    .filter((r) => r.gepubliceerd && (r.pipeline_status || "") !== "Afgewezen")
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
      sub={`${rijen.length} online previews${zonderAdres ? `, waarvan ${zonderAdres} nog zonder adres` : ""}. Vink aan wie je wilt bezoeken en kopieer alleen die.`}
    >
      <AdressenTabel rijen={rijen} />
    </WerkplekShell>
  );
}
