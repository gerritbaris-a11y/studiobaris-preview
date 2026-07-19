import { redirect } from "next/navigation";

/**
 * De oude /dashboard is samengevoegd met /klanten.
 *
 * Waarom dit bestand blijft bestaan in plaats van weg te gaan: beheerders
 * landden hier na het inloggen, en de pagina staat nog in bladwijzers en in
 * oude appjes. Een 404 is dan onnodig vervelend. Alle beheerfuncties die hier
 * stonden - akkoordlink, gegevens bewerken, inzendingen, verwijderen,
 * publiceren, maandbedrag en de naam van de verkoper - zitten nu in het
 * blok "Beheer" op elke klantkaart in /klanten.
 *
 * LET OP: de map app/dashboard/ zelf moet blijven staan. dashboard-actions.js
 * woont hier en wordt door /klanten en /vandaag gebruikt.
 */
export default function OudDashboard() {
  redirect("/klanten");
}
