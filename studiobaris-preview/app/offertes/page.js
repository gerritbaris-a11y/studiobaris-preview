import { getOffertesOverzicht, getKlantenVoorFactuur, getVolgendOffertenummer } from "../../lib/abonnementen-data";
import { leesSessie, isBeheer } from "../../lib/auth";
import WerkplekShell from "../werkplek-shell";
import OffertesClient from "./offertes-client";

export const dynamic = "force-dynamic";

// Offertes: los van facturen, met een eigen nummerreeks. Zodra een offerte
// 'Akkoord' krijgt, maak je de bijbehorende factuur/facturen gewoon zelf aan
// bij Facturen — dat gebeurt hier bewust niet automatisch.
export default async function OffertesPage() {
  const sessie = leesSessie();
  const naam = sessie && sessie.naam ? sessie.naam : "collega";
  const beheer = isBeheer(sessie);

  const [offertes, klanten, volgendNummer] = await Promise.all([
    getOffertesOverzicht(),
    getKlantenVoorFactuur(),
    getVolgendOffertenummer(),
  ]);

  return (
    <WerkplekShell
      naam={naam}
      beheer={beheer}
      actief="/offertes"
      titel="Offertes"
      sub="Alle offertes op één plek — bij akkoord maak je de factuur zelf aan bij Facturen."
    >
      <OffertesClient offertes={offertes} klanten={klanten} volgendNummer={volgendNummer} />
    </WerkplekShell>
  );
}
