import { notFound } from "next/navigation";
import { agendaVoorBedrijf, isUuid } from "../../../lib/agenda";
import { hexNaarRgb, contrast } from "../../../lib/huisstijl";
import AgendaWidget from "../../agenda-widget";
import Hoogte from "./hoogte";

export const dynamic = "force-dynamic";
export const metadata = { title: "Afspraak maken", robots: { index: false, follow: false } };

function tekstOp(hex) {
  const rgb = hexNaarRgb(hex);
  return rgb && contrast(rgb, [255, 255, 255]) < 2.2 ? "#111111" : "#fff";
}

// Losse boekingspagina per bedrijf. De SB Embed-plugin toont deze op de echte
// klantsite (shortcode [sb_agenda]), zodat de agenda daar precies hetzelfde
// werkt als op de preview. ?kleur=hex (zonder #) neemt de huisstijl van de site over.
export default async function BoekPagina({ params, searchParams }) {
  if (!isUuid(params.id)) notFound();
  const agenda = await agendaVoorBedrijf(params.id);
  if (!agenda || !agenda.instellingen || !agenda.instellingen.actief) notFound();
  const k = /^[0-9a-f]{6}$/i.test(searchParams?.kleur || "") ? "#" + searchParams.kleur : "#1A2B3D";
  return (
    <div style={{ padding: "8px 4px", fontFamily: "system-ui, -apple-system, sans-serif", background: "transparent" }}>
      <AgendaWidget agenda={agenda} test={!!agenda.instellingen.test_modus} kleur={k} tekstOpKleur={tekstOp(k)} bron="site" />
      <Hoogte />
    </div>
  );
}
