import { getTeam } from "../../lib/server-data";
import AkkoordForm from "./akkoord-form";

export const dynamic = "force-dynamic";

// Servercomponent die alleen het team ophaalt voor de "Wie krijgt deze
// verkoop op zijn naam?"-keuzelijst in AkkoordForm (client). Verder zit alle
// logica in dat formulier, ongewijzigd.
export default async function NieuwAkkoordPage() {
  const team = await getTeam();
  return <AkkoordForm team={team} />;
}
