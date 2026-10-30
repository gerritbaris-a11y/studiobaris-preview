import { NextResponse } from "next/server";
import { vrijeDagen, isUuid, CORS } from "../../../../lib/agenda";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

// Dagen met nog minstens één vrije tijd voor deze behandeling (komende 3 weken).
export async function GET(req) {
  const sp = new URL(req.url).searchParams;
  const c = sp.get("c"), b = sp.get("b");
  if (!isUuid(c) || !isUuid(b)) return NextResponse.json({ ok: false, error: "Onbekende agenda." }, { status: 400, headers: CORS });
  try {
    const dagen = await vrijeDagen(c, b, 28);
    return NextResponse.json({ ok: true, dagen }, { headers: CORS });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Agenda niet bereikbaar." }, { status: 500, headers: CORS });
  }
}
