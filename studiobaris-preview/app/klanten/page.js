import PreviewsPagina from "./previews-pagina";

export const dynamic = "force-dynamic";

// De inhoud staat in previews-pagina.js, zodat Previews test → Mijn previews
// esthetiek (/esthetiek) precies dezelfde pagina kan tonen.
export default function KlantenPage() {
  return <PreviewsPagina />;
}
