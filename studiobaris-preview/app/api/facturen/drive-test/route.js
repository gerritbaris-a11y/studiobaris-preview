import { NextResponse } from "next/server";
import { getFactuur } from "../../../../lib/abonnementen-data";
import { factuurPdf } from "../../../../lib/facturen";
import { backupNaarDrive } from "../../../../lib/drive-backup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Tijdelijk testroutetje om de Drive-backup te controleren zonder ergens een
// mail te versturen of een status te wijzigen: pakt een bestaande factuur,
// bouwt 'm opnieuw op als PDF (puur lezen, geen bijwerking) en probeert 'm
// naar de Drive-map te uploaden. Wordt na de test weer verwijderd.
export async function GET(req) {
  const sleutel = new URL(req.url).searchParams.get("sleutel") || "";
  if (sleutel !== "tijdelijk-drive-test-9f13ac") {
    return NextResponse.json({ ok: false, error: "geen toegang" }, { status: 401 });
  }
  const nummer = new URL(req.url).searchParams.get("nummer") || "2026-002";
  const factuur = await getFactuur(nummer);
  if (!factuur) return NextResponse.json({ ok: false, error: "factuur niet gevonden" }, { status: 404 });
  const pdf = await factuurPdf(factuur);
  const resultaat = await backupNaarDrive(factuur, pdf);
  return NextResponse.json({ nummer, ...resultaat });
}
