import PreviewsPagina from "./previews-pagina";
import { leesSessie, isBeheer } from "../../lib/auth";
import { kiesSector } from "../../lib/segment";

export const dynamic = "force-dynamic";

// Mijn previews, per sector (?sector=boeking|spoed; zonder = Portfolio).
// Verkopers zien alleen Portfolio (kiesSector).
export default async function KlantenPage({ searchParams }) {
  const sp = (await searchParams) || {};
  const sector = kiesSector(sp.sector, isBeheer(leesSessie()));
  return <PreviewsPagina sector={sector} />;
}
