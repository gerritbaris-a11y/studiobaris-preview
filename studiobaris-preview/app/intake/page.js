import ProspectForm from "../prospect-form";
import { leesSessie } from "../../lib/auth";
import { getLead } from "../../lib/server-data";

export const dynamic = "force-dynamic";

// Deze pagina is bewust PUBLIEK: hij staat op studiobaris.nl achter de knop
// "Gratis preview". Vult een collega hem in vanuit de leadlijst (?lead=...),
// dan vullen we de bekende gegevens alvast in en koppelen we de preview aan hem.
export default async function IntakePage({ searchParams }) {
  const sp = (await searchParams) || {};
  const sessie = leesSessie();
  const leadId = sp.lead ? String(sp.lead) : "";

  let lead = null;
  if (leadId && sessie) {
    try { lead = await getLead(leadId); } catch { lead = null; }
  }

  const intern = Boolean(sessie);
  const afzender = intern ? sessie.naam : "";

  return (
    <ProspectForm
      mode="create"
      titel={lead ? `Preview maken voor ${lead.bedrijfsnaam}` : "Nieuwe prospect — previewsite genereren"}
      intro={
        lead
          ? "De gegevens uit de leadlijst staan al ingevuld. Vul aan wat je hebt gevonden — hoe meer je invult, hoe overtuigender de website wordt. Foto's van hun werk maken het verschil."
          : "Vul in wat je hebt. Ontbrekende velden laat je leeg; Claude vult niets in wat er niet is. Hoe specifieker en vollediger je invult, hoe beter en overtuigender de website wordt."
      }
      submitLabel="Genereer previewsite"
      busyLabel="Bezig met genereren…"
      prefill={lead}
      leadId={lead ? leadId : ""}
      afzender={afzender}
    />
  );
}
