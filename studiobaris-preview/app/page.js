import { redirect } from "next/navigation";
import { leesSessie, isBeheer } from "../lib/auth";

export const dynamic = "force-dynamic";

// De voordeur van de werkplek. Niet ingelogd? Dan het inlogscherm.
// Wel ingelogd? Dan meteen naar je eigen startpagina.
export default function Home() {
  const sessie = leesSessie();
  if (!sessie) redirect("/login");
  redirect("/vandaag");
}
