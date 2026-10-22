import { leesSessie, isBeheer } from "../../lib/auth";
import { getBenaderdLijst, magZien } from "../../lib/benaderd";
import { getOverview } from "../../lib/server-data";
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
  const [lijst, alles] = await Promise.all([getBenaderdLijst(), getOverview()]);
  const rijen = lijst.filter((r) => magZien(r, naam, beheer));
  // Totaal aantal previews dat deze persoon ziet (zelfde regel als Mijn
  // previews), voor het percentage "benaderd".
  const totaal = (alles || []).filter((r) => {
    let bron = null;
    try { bron = r.internal_notes ? JSON.parse(r.internal_notes).bron : null; } catch {}
    return magZien({ verzamelaar: r.verzamelaar, bron }, naam, beheer);
  }).length;

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
