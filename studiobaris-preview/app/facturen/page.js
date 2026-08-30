import { getFacturenOverzicht, getKlantenVoorFactuur, getVolgendFactuurnummer } from "../../lib/abonnementen-data";
import { leesSessie, isBeheer } from "../../lib/auth";
import WerkplekShell from "../werkplek-shell";
import FacturenClient from "./facturen-client";

export const dynamic = "force-dynamic";

// Alle uitgaande facturen op één plek: automatisch gemaakt (maandelijks) of
// handmatig toegevoegd (eenmalig, aanbetaling, slottermijn — voor de klanten
// die niet in het standaard ritme passen). Leest rechtstreeks uit
// workflow.facturen via sb_facturen_overzicht(); er wordt hier niets
// herberekend of los bijgehouden.
export default async function FacturenPage() {
  const sessie = leesSessie();
  const naam = sessie && sessie.naam ? sessie.naam : "collega";
  const beheer = isBeheer(sessie);

  const [facturen, klanten, volgendNummer] = await Promise.all([
    getFacturenOverzicht(),
    getKlantenVoorFactuur(),
    getVolgendFactuurnummer(),
  ]);

  return (
    <WerkplekShell
      naam={naam}
      beheer={beheer}
      actief="/facturen"
      titel="Facturen"
      sub="Alle uitgaande facturen — automatisch gemaakt of handmatig toegevoegd."
    >
      <FacturenClient facturen={facturen} klanten={klanten} volgendNummer={volgendNummer} />
    </WerkplekShell>
  );
}
