import { NextResponse } from "next/server";
import { syncLeadsUitSheet } from "../../../../lib/leads-sheet";
import { leesSessie } from "../../../../lib/auth";
import { log } from "../../../../lib/server-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Haalt de actuele leadlijst uit de Google Sheet en werkt Supabase bij.
//  - GET:  elke ochtend via Vercel Cron (zie vercel.json). Zelfde toegangsregels
//          als /api/facturen/dagelijks.
//  - POST: de knop "Nu bijwerken" op het Leads-tabblad; iedereen met een login.
// De route staat bewust niet in de middleware-matcher en controleert zelf.

async function draai(persoon) {
  try {
    const r = await syncLeadsUitSheet();
    await log({ persoon, soort: "leads_sync", details: r });
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
  if (!sessie) return NextResponse.json({ ok: false, error: "Niet ingelogd." }, { status: 401 });
  return draai(sessie.naam);
}
