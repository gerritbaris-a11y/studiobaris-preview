import PreviewsPagina from "../klanten/previews-pagina";
import { leesSessie, isBeheer } from "../../lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// Previews test → Mijn previews esthetiek. Alleen Gerrit en Levi (beheer, ook
// afgedwongen in middleware.js).
export default function EsthetiekPage() {
  if (!isBeheer(leesSessie())) redirect("/klanten");
  return <PreviewsPagina segment="esthetiek" />;
}
