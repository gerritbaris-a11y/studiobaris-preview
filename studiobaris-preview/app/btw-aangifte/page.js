import { redirect } from "next/navigation";

// Het losse "Omzet & btw"-overzicht is opgegaan in de Boekhouding-pagina
// (zelfde omzetcijfers per kwartaal, plus kosten en de btw per rubriek).
// Oude links en bladwijzers sturen we daarheen door.
export default function BtwAangiftePage() {
  redirect("/boekhouding");
}
