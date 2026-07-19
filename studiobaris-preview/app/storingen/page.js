import { leesSessie, isBeheer } from "../../lib/auth";
import WerkplekShell from "../werkplek-shell";
import { getKlantOverzicht } from "../../lib/server-data";
import StoringenClient from "./storingen-client";

export const dynamic = "force-dynamic";

// De versie die iedereen hoort te draaien. Bij elke nieuwe plugin één keer bijwerken.
export const NIEUWSTE_PLUGIN = "1.1.8";

export default async function Storingen() {
  const sessie = leesSessie();
  const beheer = isBeheer(sessie);
  const klanten = await getKlantOverzicht();

  return (
    <WerkplekShell
      naam={sessie?.naam || "collega"}
      beheer={beheer}
      actief="/storingen"
      titel="Storingen"
      sub="Werkt de site van elke klant nog? Hier zie je in één oogopslag wie achterloopt, en herstel je het van hieruit."
    >
      <StoringenClient klanten={klanten} nieuwste={NIEUWSTE_PLUGIN} />
    </WerkplekShell>
  );
}
