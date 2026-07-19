import { leesSessie, isBeheer } from "../../lib/auth";
import WerkplekShell from "../werkplek-shell";
import { getKlantOverzicht } from "../../lib/server-data";
import StoringenClient from "./storingen-client";

export const dynamic = "force-dynamic";

// Terugvalwaarde: alleen gebruikt als het update-endpoint even niet bereikbaar is.
export const NIEUWSTE_PLUGIN = "1.1.10";

// De nieuwste versie komt uit hetzelfde endpoint dat de plugin zelf gebruikt om
// bij te werken. Zo is er één waarheid: brengen we een nieuwe plugin uit, dan
// klopt dit scherm meteen, zonder dat we hier een versienummer moeten bijwerken.
async function haalNieuwstePluginVersie() {
  try {
    const res = await fetch("https://app.studiobaris.nl/api/plugin/sb-embed", {
      cache: "no-store",
    });
    if (!res.ok) return NIEUWSTE_PLUGIN;
    const data = await res.json();
    const v = data && typeof data.version === "string" ? data.version.trim() : "";
    return v || NIEUWSTE_PLUGIN;
  } catch {
    return NIEUWSTE_PLUGIN;
  }
}

export default async function Storingen() {
  const sessie = leesSessie();
  const beheer = isBeheer(sessie);
  const [klanten, nieuwste] = await Promise.all([
    getKlantOverzicht(),
    haalNieuwstePluginVersie(),
  ]);

  return (
    <WerkplekShell
      naam={sessie?.naam || "collega"}
      beheer={beheer}
      actief="/storingen"
      titel="Storingen"
      sub="Werkt de site van elke klant nog? Hier zie je in één oogopslag wie achterloopt, en herstel je het van hieruit."
    >
      <StoringenClient klanten={klanten} nieuwste={nieuwste} />
    </WerkplekShell>
  );
}
