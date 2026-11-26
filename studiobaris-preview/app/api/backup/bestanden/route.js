import { NextResponse } from "next/server";
import { cronMagDoor } from "../../../../lib/cron-toegang";
import { spiegelBestanden, logRun } from "../../../../lib/dashboard-backup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Elke nacht via Vercel Cron: nieuwe en gewijzigde bestanden uit Supabase
// Storage (foto's, bonnen, klantmedia, social) naar de Drive-map
// "Back-up dashboard/Bestanden (doorlopend bijgewerkt)". Wat al in de Drive
// staat wordt overgeslagen; loopt de tijd op, dan gaat de volgende run verder.
export async function GET(req) {
  if (!cronMagDoor(req)) {
    return NextResponse.json({ ok: false, error: "Geen toegang." }, { status: 401 });
  }
  try {
    const uitkomst = await spiegelBestanden({ tijdbudgetMs: 150000 });
    console.log("[backup bestanden]", JSON.stringify(uitkomst));
    await logRun("bestanden", uitkomst);
    return NextResponse.json(uitkomst);
  } catch (e) {
    console.error("[backup bestanden] mislukt:", String((e && e.message) || e));
    await logRun("bestanden", { ok: false, error: String((e && e.message) || e) });
    return NextResponse.json({ ok: false, error: String((e && e.message) || e) }, { status: 500 });
  }
}
