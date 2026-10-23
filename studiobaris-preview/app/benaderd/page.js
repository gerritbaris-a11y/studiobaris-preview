import { leesSessie, isBeheer } from "../../lib/auth";
import { getBenaderdLijst, magZien } from "../../lib/benaderd";
import { getOverview } from "../../lib/server-data";
import { getRegio } from "../../lib/regio";
import WerkplekShell from "../werkplek-shell";
import BenaderdLijst from "./benaderd-lijst";

export const dynamic = "force-dynamic";

// Benaderd (okt 2026): de bedrijven die je hebt benaderd (vinkje "Benaderd"
// op Mijn previews) en wat ze daarna deden. Verkoper ziet zijn eigen previews
// en die uit zijn regio (lib/regio.js), beheer (Gerrit, Levi) alles.
export default async function BenaderdPage() {
  const sessie = leesSessie();
  const naam = sessie ? sessie.naam : "";
  const beheer = isBeheer(sessie);
  const [lijst, alles, regio] = await Promise.all([getBenaderdLijst(), getOverview(), beheer ? null : getRegio(naam)]);
  const rijen = lijst.filter((r) => magZien(r, naam, beheer, regio));
  // Totaal aantal previews dat deze persoon ziet (zelfde regel als Mijn
  // previews), voor het percentage "benaderd".
  const totaal = (alles || []).filter((r) => magZien(r, naam, beheer, regio)).length;

  return (
    <WerkplekShell
      naam={naam || "collega"}
      beheer={beheer}
      actief="/benaderd"
      titel="Benaderd"
      sub="De bedrijven die je hebt benaderd en wat ze daarna deden. Zet een preview hier op met het vinkje Benaderd op Mijn previews."
    >
      <BenaderdLijst rijen={rijen} beheer={beheer} totaal={totaal} />
    </WerkplekShell>
  );
}
