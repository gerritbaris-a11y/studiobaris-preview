import ProspectForm from "../prospect-form";

export const dynamic = "force-dynamic";

export default function IntakePage() {
  return (
    <ProspectForm
      mode="create"
      titel="Nieuwe prospect — previewsite genereren"
      intro="Vul in wat je hebt. Ontbrekende velden laat je leeg; Claude vult niets in wat er niet is. Hoe specifieker en vollediger je invult, hoe beter en overtuigender de website wordt."
      submitLabel="Genereer previewsite"
      busyLabel="Bezig met genereren…"
    />
  );
}
