import { NextResponse } from "next/server";
import { syncEsthetiekUitSheet } from "../../../../lib/leads-sheet";
import { leesSessie, isBeheer } from "../../../../lib/auth";
import { log } from "../../../../lib/server-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Esthetieklijst (test): zelfde werking als /api/leads/sync, maar dan voor de
// Sheet met kappers, nagel- en beautysalons.
//  - GET:  elke ochtend via Vercel Cron (vercel.json), zelfde toegangsregels.
//  - POST: de knop "Nu bijwerken" op Previews test → Leads; alleen beheer.
// Staat bewust niet in de middleware-matcher en controleert zelf.

async function draai(persoon) {
  try {
    const r = await syncEsthetiekUitSheet();
    if (!r.overgeslagen) await log({ persoon, soort: "leads_sync_esthetiek", details: r });
    return NextResponse.json({ ok: true, ...r });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String((e && e.message) || e) }, { status: 500 });
  }
}

export async function GET(req) {
  const geheim = process.env.CRON_SECRET;
  const kop = req.headers.get("authorization") || "";
  const agent = req.headers.get("user-agent") || "";
  const sleutel = new URL(req.url).searchParams.get("sleutel") || "";
  const magDoor = geheim
    ? kop === `Bearer ${geheim}` || sleutel === geheim
    : agent.startsWith("vercel-cron/");
  if (!magDoor) {
    return NextResponse.json({ ok: false, error: "Geen toegang." }, { status: 401 });
  }
  return draai("cron");
}

export async function POST() {
  const sessie = leesSessie();
  if (!sessie || !isBeheer(sessie)) {
    return NextResponse.json({ ok: false, error: "Geen toegang." }, { status: 403 });
  }
  return draai(sessie.naam);
}
