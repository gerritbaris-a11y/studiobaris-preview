import ProspectForm from "../../prospect-form";

export const dynamic = "force-dynamic";

export default function IntakeClientPage({ params }) {
  return (
    <ProspectForm
      mode="revise"
      slug={params.slug}
      titel="Je website aanpassen"
      intro="Je preview staat klaar. Geef hieronder vooral aan wát er anders moet — de rest van het formulier hoef je alleen in te vullen als je daar iets wilt corrigeren of aanvullen. Leeg gelaten velden blijven zoals ze nu op de site staan."
      submitLabel="Aanpassingen versturen"
      busyLabel="Bezig met verwerken…"
    />
  );
}
