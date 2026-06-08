import RevisionForm from "../../revision-form";

export const dynamic = "force-dynamic";

export default function IntakeClientPage({ params }) {
  return (
    <RevisionForm
      slug={params.slug}
      type="intake"
      titel="Vertel ons meer over je bedrijf"
      intro="Hoe completer je dit invult, hoe beter we je website maken. Velden die niet van toepassing zijn mag je leeg laten."
      velden={[
        { name: "contactgegevens", label: "Kloppen je contactgegevens? (telefoon, e-mail, adres)", type: "textarea", placeholder: "Vul aan of corrigeer waar nodig" },
        { name: "diensten", label: "Welke diensten bied je aan?", type: "textarea", placeholder: "Beschrijf je diensten" },
        { name: "bedrijfsverhaal", label: "Vertel kort over je bedrijf", type: "textarea", placeholder: "Hoe lang, wat maakt je uniek, je werkwijze" },
        { name: "reviews", label: "Heb je klantreviews? Plak ze hier", type: "textarea", placeholder: "Naam + wat ze zeiden" },
        { name: "aanpassingen", label: "Wil je nog iets anders aangepast zien?", type: "textarea", placeholder: "Teksten, kleuren, foto's, enz." },
      ]}
    />
  );
}
