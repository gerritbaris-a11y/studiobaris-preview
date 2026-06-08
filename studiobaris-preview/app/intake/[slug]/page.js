import RevisionForm from "../../revision-form";

export const dynamic = "force-dynamic";

export default function IntakeClientPage({ params }) {
  return (
    <RevisionForm
      slug={params.slug}
      type="intake"
      titel="Vul je bedrijfsgegevens aan"
      intro="Met deze gegevens maken we je website compleet. Klik op het i-tje achter een veld voor uitleg. Velden die niet van toepassing zijn mag je leeg laten."
      velden={[
        { name: "contactgegevens", label: "Contactgegevens", type: "textarea", placeholder: "Telefoon, e-mail, adres", info: "Deze tonen we op je website zodat klanten je kunnen bereiken. Controleer of telefoon, e-mail en adres kloppen — een zakelijk e-mailadres oogt professioneler dan bijv. hotmail." },
        { name: "diensten", label: "Welke diensten bied je aan?", type: "textarea", placeholder: "Beschrijf je diensten", info: "Hiermee vullen we de dienstenblokken op je site. Hoe concreter je bent, hoe beter klanten zien wat je doet — noem gerust losse onderdelen." },
        { name: "bedrijfsverhaal", label: "Vertel kort over je bedrijf", type: "textarea", placeholder: "Hoe lang actief, wat maakt je uniek, je werkwijze", info: "Dit gebruiken we voor de 'Over ons'-tekst. Een persoonlijk verhaal schept vertrouwen bij bezoekers." },
        { name: "reviews", label: "Klantreviews", type: "textarea", placeholder: "Naam + wat de klant zei", info: "Reviews verhogen je geloofwaardigheid enorm. Plak hier bestaande reviews (bijv. van Google) — naam erbij maakt ze sterker." },
        { name: "aanpassingen", label: "Wil je nog iets anders aangepast zien?", type: "textarea", placeholder: "Teksten, kleuren, foto's, enz.", info: "Alles wat je anders wilt op de eerste versie. Wij verwerken het in de volgende versie van je site." },
      ]}
    />
  );
}
