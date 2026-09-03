import { NextResponse } from "next/server";
import { diagnoseToken } from "../../../../lib/drive-backup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Tijdelijke diagnoseroute (stap 3 testronde): de Drive-backup van
// factuur 2026-004 kwam niet aan, terwijl mailen wel lukte. Geeft alleen
// terug of de drie env-vars aanwezig zijn (en hun lengte/voorvoegsel, nooit
// de waarde zelf) plus Google's eigen foutcode bij het verversen van het
// token. Na het uitzoeken weer verwijderen.
export async function GET() {
  const resultaat = await diagnoseToken();
  return NextResponse.json(resultaat);
}
