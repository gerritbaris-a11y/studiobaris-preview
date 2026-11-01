import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { getPreview } from "../../../../lib/preview";
import { getConcept } from "../../../../lib/server-data";
import { vulVoorbeeld } from "../../../../lib/preview-voorbeeld";
import SpoedSite, { SPOED_STIJLEN, plaatsSlug } from "../../../styles/spoed";

export const dynamic = "force-dynamic";

// Werkgebiedpagina van een spoedsite: /<slug>/in/<plaats>. Eén pagina per
// plaats uit content.spoed.werkgebied, zodat "loodgieter <plaats>" een eigen,
// vindbare pagina heeft (lokale SEO).

async function laad(slug, concept) {
  const content = concept ? await getConcept(slug) : (await getPreview(slug))?.content;
  if (!content || content.sector !== "spoed") return null;
  const lijst = (content.spoed && content.spoed.werkgebied) || [];
  return { content, lijst };
}

function vind(lijst, content, plaats) {
  const kandidaten = [...lijst, String((content.bedrijf || {}).regio || "").split(/[,/]/)[0].trim()].filter(Boolean);
  return kandidaten.find((p) => plaatsSlug(p) === plaats) || null;
}

export async function generateMetadata({ params, searchParams }) {
  const d = await laad(params.slug, searchParams?.concept === "1");
  if (!d) return { title: "Niet gevonden" };
  const p = vind(d.lijst, d.content, params.plaats);
  const b = d.content.bedrijf || {};
  const seo = d.content.seo || {};
  return {
    title: p ? `${b.branche || "Vakman"} ${p} | ${b.naam || ""}` : b.naam,
    description: p ? `${b.branche || "Vakman"} in ${p} nodig? ${b.naam || "Wij"} helpt je snel. Bel direct of stuur een WhatsApp.` : "",
    robots: seo.noindex === false ? undefined : { index: false, follow: false },
  };
}

export default async function WerkgebiedPagina({ params, searchParams }) {
  const isConcept = searchParams?.concept === "1";
  const d = await laad(params.slug, isConcept);
  if (!d) notFound();
  const plaats = vind(d.lijst, d.content, params.plaats);
  if (!plaats) notFound();
  const c = vulVoorbeeld(d.content);
  const ids = SPOED_STIJLEN.map((x) => x.id);
  const kijk = cookies().get("sbk_" + params.slug)?.value;
  const stijl = ids.includes(kijk) ? kijk : ids.includes(c.merk && c.merk.stijl) ? c.merk.stijl : "signaal";
  return <SpoedSite content={c} slug={params.slug} isConcept={isConcept} isReview={!isConcept} stijl={stijl} plaats={plaats} />;
}
