import { getAiUpdate } from "../../lib/taken-data";
import { leesSessie, isBeheer } from "../../lib/auth";
import WerkplekShell from "../werkplek-shell";
import AiUpdateBlok from "./ai-update-blok";
import { KLEUR } from "../werkplek-stijl";

export const dynamic = "force-dynamic";

// "Vandaag": het startscherm voor beheer met wat er nu speelt. Voor nu alleen
// de wekelijkse AI-update (OpenAI / Anthropic / Gemini); hier komt later meer
// bij. De oude takenlijst die hier stond is vervangen — die taken staan op het
// Bord. getVandaag() in lib/server-data bestaat nog, maar wordt niet gebruikt.
export default async function VandaagPage() {
  const sessie = leesSessie();
  const naam = sessie && sessie.naam ? sessie.naam : "collega";
  const beheer = isBeheer(sessie);

  const aiUpdate = await getAiUpdate();

  return (
    <WerkplekShell
      naam={naam}
      beheer={beheer}
      actief="/vandaag"
      titel="Vandaag"
      sub="Wat er nu speelt."
    >
      {aiUpdate ? (
        <AiUpdateBlok update={aiUpdate} />
      ) : (
        <div style={{ background: "#fff", border: `1px solid ${KLEUR.lijn}`, borderRadius: 14, padding: "16px 18px", color: KLEUR.gedempt, fontSize: 14 }}>
          Nog geen AI-update. De eerste verschijnt hier zodra de geplande taak &quot;Wekelijkse AI-update&quot; heeft gedraaid.
        </div>
      )}
    </WerkplekShell>
  );
}
