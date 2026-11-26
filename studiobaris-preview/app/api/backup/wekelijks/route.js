import { NextResponse } from "next/server";
import { cronMagDoor } from "../../../../lib/cron-toegang";
import { maakWekelijkseBackup, logRun } from "../../../../lib/dashboard-backup";
import { getTaken, maakTaak } from "../../../../lib/taken-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Elke zondagnacht via Vercel Cron (zie vercel.json): volledige back-up van
// database, database-opbouw, code en instellingen-namen naar Google Drive,
// map "Back-up dashboard/<datum>". Max. 4 weken bewaard. Zie lib/dashboard-backup.js.
export async function GET(req) {
  if (!cronMagDoor(req)) {
    return NextResponse.json({ ok: false, error: "Geen toegang." }, { status: 401 });
  }
  try {
    const uitkomst = await maakWekelijkseBackup();
    console.log("[backup wekelijks]", JSON.stringify(uitkomst));
    await logRun("wekelijks", uitkomst);
    return NextResponse.json(uitkomst);
  } catch (e) {
    const melding = String((e && e.message) || e);
    console.error("[backup wekelijks] mislukt:", melding);
    await logRun("wekelijks", { ok: false, error: melding });
    try {
      const titel = "Wekelijkse back-up naar Google Drive mislukt";
      const taken = await getTaken();
      if (!(Array.isArray(taken) ? taken : []).some((t) => t.kolom !== "klaar" && t.titel === titel)) {
        await maakTaak({
          titel,
          omschrijving: `De back-up van het dashboard kon niet worden gemaakt:\n\n${melding}\n\nVraag Claude om het na te kijken.`,
          prioriteit: "hoog", kolom: "te_doen", aangemaaktDoor: "Cron (Back-up)",
        });
      }
    } catch {}
    return NextResponse.json({ ok: false, error: melding }, { status: 500 });
  }
}
