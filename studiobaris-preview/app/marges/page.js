import { getMarges } from "../../lib/abonnementen-data";
import { leesSessie, isBeheer } from "../../lib/auth";
import WerkplekShell from "../werkplek-shell";
import MargesClient from "./marges-client";

export const dynamic = "force-dynamic";

// Marges: wat houden we over per pakket dat een klant afneemt? De tarieven
// (verkoopprijzen én kostprijzen) zijn hier bewerkbaar — wijzig je er een,
// dan rekent zowel het scenario-blok als het overzicht per klant meteen opnieuw.
export default async function MargesPage() {
  const sessie = leesSessie();
  const naam = sessie && sessie.naam ? sessie.naam : "collega";
  const beheer = isBeheer(sessie);

  const marges = await getMarges();

  return (
    <WerkplekShell
      naam={naam}
      beheer={beheer}
      actief="/marges"
      titel="Marges"
      sub="Wat een pakket kost, wat het opbrengt, en wat je eraan overhoudt — per pakket en per klant."
    >
      <MargesClient marges={marges} />
    </WerkplekShell>
  );
}
