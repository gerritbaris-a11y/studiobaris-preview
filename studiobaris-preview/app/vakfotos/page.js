import { leesSessie, isBeheer } from "../../lib/auth";
import { getAlleVakfotos } from "../../lib/vakfotos";
import WerkplekShell from "../werkplek-shell";
import VakfotosClient from "./vakfotos-client";

export const dynamic = "force-dynamic";

// Beeldbank per vakgebied voor nieuwe previews. Een preview zonder eigen
// foto's krijgt hieruit een achtergrondfoto bovenaan en twee projectfoto's.
export default async function VakfotosPage() {
  const sessie = leesSessie();
  const naam = sessie && sessie.naam ? sessie.naam : "collega";
  const beheer = isBeheer(sessie);
  const vakken = await getAlleVakfotos();

  return (
    <WerkplekShell
      naam={naam}
      beheer={beheer}
      actief="/vakfotos"
      titel="Vakfoto's"
      sub="Foto's per vakgebied voor nieuwe previews: één wordt de achtergrond bovenaan, twee komen bij de projecten. Liggende foto's werken het best als achtergrond."
    >
      <VakfotosClient vakken={vakken} />
    </WerkplekShell>
  );
}
