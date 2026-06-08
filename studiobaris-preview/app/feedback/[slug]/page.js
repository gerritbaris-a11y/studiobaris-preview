import RevisionForm from "../../revision-form";

export const dynamic = "force-dynamic";

export default function FeedbackClientPage({ params }) {
  return (
    <RevisionForm
      slug={params.slug}
      type="feedback"
      titel="Laatste feedback op je website"
      intro="Bekijk je previewsite en laat ons weten wat er nog aangepast moet worden. Dit is de laatste ronde voordat we de site definitief opleveren. Klik op het i-tje voor uitleg."
      velden={[
        { name: "wijzigingen", label: "Wat wil je aangepast zien?", type: "textarea", placeholder: "Teksten, kleuren, foto's, volgorde…", info: "Beschrijf zo concreet mogelijk wat er anders moet, dan passen we het gericht aan zonder de rest te wijzigen." },
        { name: "ontbreekt", label: "Mist er nog iets?", type: "textarea", placeholder: "Diensten, informatie of foto's die er nog bij moeten", info: "Laat het weten zodat we niets vergeten vóór je site definitief live gaat." },
        { name: "opmerkingen", label: "Overige opmerkingen", type: "textarea", placeholder: "Optioneel", info: "Vragen of opmerkingen die nergens anders passen kun je hier kwijt." },
      ]}
    />
  );
}
