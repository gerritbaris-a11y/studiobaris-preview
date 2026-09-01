import { NextResponse } from "next/server";
import { getFactuur } from "../../../../lib/abonnementen-data";
import { factuurPdf } from "../../../../lib/facturen";
import { backupNaarDrive, haalOfMaakBackupMap, diagnoseToken } from "../../../../lib/drive-backup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Tijdelijk testroutetje om de Drive-backup (met het nieuwe drive.file-scope)
// te controleren zonder ergens een mail te versturen of een status te
// wijzigen. Met ?maak-map=1 wordt eenmalig de eigen "Backup"-map aangemaakt
// (nodig omdat de oude, met de hand gemaakte map buiten het scope valt).
// Wordt na de test weer verwijderd.
export async function GET(req) {
  const sleutel = new URL(req.url).searchParams.get("sleutel") || "";
  if (sleutel !== "tijdelijk-drive-test-9f13ac") {
    return NextResponse.json({ ok: false, error: "geen toegang" }, { status: 401 });
  }

  if (new URL(req.url).searchParams.get("maak-map") === "1") {
    const resultaat = await haalOfMaakBackupMap();
    return NextResponse.json(resultaat);
  }

  if (new URL(req.url).searchParams.get("diagnose") === "1") {
    const resultaat = await diagnoseToken();
    return NextResponse.json(resultaat);
  }

  const nummer = new URL(req.url).searchParams.get("nummer") || "2026-002";
  const factuur = await getFactuur(nummer);
  if (!factuur) return NextResponse.json({ ok: false, error: "factuur niet gevonden" }, { status: 404 });
  const pdf = await factuurPdf(factuur);
  const resultaat = await backupNaarDrive(factuur, pdf);
  return NextResponse.json({ nummer, ...resultaat });
}
