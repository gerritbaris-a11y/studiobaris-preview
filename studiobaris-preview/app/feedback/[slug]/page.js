import RevisionForm from "../../revision-form";

export const dynamic = "force-dynamic";

export default function FeedbackClientPage({ params }) {
  return (
    <RevisionForm
      slug={params.slug}
      type="feedback"
      titel="Laatste feedback op je website"
      intro="Bekijk je previewsite en laat ons weten wat er nog aangepast moet worden. Dit is de laatste ronde voordat we de site definitief opleveren."
      velden={[
        { name: "wijzigingen", label: "Wat wil je aangepast zien?", type: "textarea", placeholder: "Beschrijf zo concreet mogelijk wat er anders moet (teksten, kleuren, foto's, volgorde)" },
        { name: "ontbreekt", label: "Mist er nog iets?", type: "textarea", placeholder: "Diensten, informatie, foto's die er nog bij moeten" },
        { name: "opmerkingen", label: "Overige opmerkingen", type: "textarea", placeholder: "Optioneel" },
      ]}
    />
  );
}
