import { leesSessie } from "../../lib/auth";
import { getRestbetalingen } from "../../lib/server-data";
import WerkplekShell from "../werkplek-shell";
import RestClient from "./rest-client";

export const dynamic = "force-dynamic";

export default async function Restbetalingen() {
  const sessie = leesSessie();
  const beheer = sessie?.rol === "beheer";
  const lijst = await getRestbetalingen(beheer ? "" : sessie?.naam || "");

  return (
    <WerkplekShell
      naam={sessie?.naam || "collega"}
      beheer={beheer}
      actief="/overzicht"
      titel="Openstaande restbetalingen"
      sub={
        lijst.length === 0
          ? "Niemand staat open. Zodra een klant is opgeleverd en de aanbetaling voldeed, komt hij hier."
          : `${lijst.length} ${lijst.length === 1 ? "klant heeft" : "klanten hebben"} de tweede helft nog niet betaald.`
      }
    >
      <RestClient lijst={lijst} />
    </WerkplekShell>
  );
}
