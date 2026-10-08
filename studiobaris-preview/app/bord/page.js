import { getTaken } from "../../lib/taken-data";
import { getTeamLogin } from "../../lib/server-data";
import { leesSessie, isBeheer } from "../../lib/auth";
import WerkplekShell from "../werkplek-shell";
import BordClient from "./bord-client";

export const dynamic = "force-dynamic";

// Takenbord voor Levi & Gerrit: drie kolommen, kaartjes slepen om de status
// te wijzigen. Bewust los van klanten/leads voor nu (kan later gekoppeld
// worden — daar staat al een veld voor klaar in de database).
export default async function BordPage() {
  const sessie = leesSessie();
  const naam = sessie && sessie.naam ? sessie.naam : "collega";
  const beheer = isBeheer(sessie);

  const [taken, team] = await Promise.all([getTaken(), getTeamLogin()]);

  return (
    <WerkplekShell
      naam={naam}
      beheer={beheer}
      actief="/bord"
      titel="Bord"
      sub="Wijzig de status via het menu op een kaartje, of sleep het naar een andere kolom."
    >
      <BordClient taken={taken} team={team} ingelogdAls={naam} />
    </WerkplekShell>
  );
}
