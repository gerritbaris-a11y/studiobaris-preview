import { NextResponse } from "next/server";
import { vrijeTijden, isUuid, isDatum, CORS } from "../../../../lib/agenda";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

// Vrije starttijden op één dag.
export async function GET(req) {
  const sp = new URL(req.url).searchParams;
  const c = sp.get("c"), b = sp.get("b"), d = sp.get("d");
  if (!isUuid(c) || !isUuid(b) || !isDatum(d)) {
    return NextResponse.json({ ok: false, error: "Onbekende agenda." }, { status: 400, headers: CORS });
  }
  try {
    const tijden = await vrijeTijden(c, b, d);
    return NextResponse.json({ ok: true, tijden }, { headers: CORS });
  } catch {
    return NextResponse.json({ ok: false, error: "Agenda niet bereikbaar." }, { status: 500, headers: CORS });
  }
}
