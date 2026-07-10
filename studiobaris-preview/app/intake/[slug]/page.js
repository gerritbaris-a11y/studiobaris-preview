import ProspectForm from "../../prospect-form";
import { getPreview } from "../../../lib/preview";

export const dynamic = "force-dynamic";

export default async function IntakeClientPage({ params }) {
  const pv = await getPreview(params.slug).catch(() => null);
  const merk = (pv && pv.content && pv.content.merk) || {};
  const bedrijf = (pv && pv.content && pv.content.bedrijf && pv.content.bedrijf.naam) || (pv && pv.content && pv.content.naam) || "";
  const thema = { accent: merk.secundaire_kleur || merk.primaire_kleur || "", bedrijf, stijl: merk.stijl || "" };

  return (
    <ProspectForm
      mode="revise"
      slug={params.slug}
      titel="Je website aanpassen"
      intro="Je preview staat klaar. Geef hieronder vooral aan wat er anders moet - de rest van het formulier hoef je alleen in te vullen als je daar iets wilt corrigeren of aanvullen. Leeg gelaten velden blijven zoals ze nu op de site staan."
      submitLabel="Aanpassingen versturen"
      busyLabel="Bezig met verwerken..."
      thema={thema}
    />
  );
}
