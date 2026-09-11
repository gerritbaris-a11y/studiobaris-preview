import { redirect } from "next/navigation";
import { leesSessie, isBeheer } from "../lib/auth";

export const dynamic = "force-dynamic";

// De voordeur van de werkplek. Niet ingelogd? Dan het inlogscherm.
// Wel ingelogd? Dan meteen naar je eigen startpagina.
// Het tabblad "Vandaag" is vervallen: taken staan nu op het Bord (beheer)
// resp. Mijn previews (verkoper).
export default function Home() {
  const sessie = leesSessie();
  if (!sessie) redirect("/login");
  redirect(isBeheer(sessie) ? "/bord" : "/klanten");
}
