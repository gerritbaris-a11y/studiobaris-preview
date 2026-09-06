import { getBoekhoudingOverzicht, getGrootboekrekeningen, getKostenLijst, getUrenOverzicht, getUrenLijst } from "../../lib/boekhouding-data";
import { leesSessie, isBeheer } from "../../lib/auth";
import WerkplekShell from "../werkplek-shell";
import BoekhoudingClient from "./boekhouding-client";

export const dynamic = "force-dynamic";

function huidigKwartaal() {
  const nu = new Date();
  return { jaar: nu.getFullYear(), kwartaal: Math.floor(nu.getMonth() / 3) + 1 };
}

export default async function BoekhoudingPage({ searchParams }) {
  const sessie = leesSessie();
  const beheer = isBeheer(sessie);
  const sp = (await searchParams) || {};
  const standaard = huidigKwartaal();
  const jaar = sp.jaar ? parseInt(sp.jaar, 10) : standaard.jaar;
  const kwartaal = sp.kwartaal ? parseInt(sp.kwartaal, 10) : standaard.kwartaal;
  // Urenregistratie kijkt per kalenderjaar (het urencriterium is een jaarnorm),
  // los van het kwartaal hierboven — met een eigen jaar-parameter in de URL.
  const urenJaar = sp.urenJaar ? parseInt(sp.urenJaar, 10) : standaard.jaar;

  const [overzicht, rekeningen, kosten, urenOverzicht, uren] = await Promise.all([
    getBoekhoudingOverzicht(jaar, kwartaal),
    getGrootboekrekeningen(),
    getKostenLijst(jaar, kwartaal),
    getUrenOverzicht(urenJaar),
    getUrenLijst(urenJaar),
  ]);

  return (
    <WerkplekShell
      naam={sessie?.naam || "collega"}
      beheer={beheer}
      actief="/boekhouding"
      titel="Boekhouding"
      sub="Kosten toevoegen, en in één oogopslag zien wat er binnenkwam, wat eruit ging, en wat er dit kwartaal aan btw klaarstaat."
    >
      <BoekhoudingClient
        overzicht={overzicht}
        rekeningen={rekeningen}
        kostenInitieel={kosten}
        jaar={jaar}
        kwartaal={kwartaal}
        urenOverzicht={urenOverzicht}
        urenInitieel={uren}
        urenJaar={urenJaar}
        naam={sessie?.naam || "collega"}
      />
    </WerkplekShell>
  );
}
