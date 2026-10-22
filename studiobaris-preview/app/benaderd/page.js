import { leesSessie, isBeheer } from "../../lib/auth";
import { getBenaderdLijst, magZien } from "../../lib/benaderd";
import WerkplekShell from "../werkplek-shell";
import BenaderdLijst from "./benaderd-lijst";

export const dynamic = "force-dynamic";

// Benaderd (okt 2026): de bedrijven die je hebt benaderd (vinkje "Benaderd"
// op Mijn previews) en wat ze daarna deden. Verkoper ziet alleen zijn eigen
// previews, beheer (Gerrit, Levi) alles.
export default async function BenaderdPage() {
  const sessie = leesSessie();
  const naam = sessie ? sessie.naam : "";
  const beheer = isBeheer(sessie);
  const rijen = (await getBenaderdLijst()).filter((r) => magZien(r, naam, beheer));

  return (
    <WerkplekShell
      naam={naam || "collega"}
      beheer={beheer}
      actief="/benaderd"
      titel="Benaderd"
      sub="De bedrijven die je hebt benaderd en wat ze daarna deden. Zet een preview hier op met het vinkje Benaderd op Mijn previews."
    >
      <BenaderdLijst rijen={rijen} beheer={beheer} />
    </WerkplekShell>
  );
}
