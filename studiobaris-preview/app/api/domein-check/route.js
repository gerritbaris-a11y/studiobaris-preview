import { NextResponse } from "next/server";
import { leesSessie } from "../../../lib/auth";
import { domeinCheck } from "../../../lib/domein-check";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Verkoper typt een gewenste domeinnaam → is die nog vrij?
// Alleen voor ingelogde teamleden (staat ook in de middleware).
export async function POST(req) {
  const sessie = leesSessie();
  if (!sessie) return NextResponse.json({ ok: false, error: "Niet ingelogd." }, { status: 401 });
  try {
    const { domein } = await req.json();
    const r = await domeinCheck(domein);
    return NextResponse.json(r, { status: r.ok ? 200 : 400 });
  } catch {
    return NextResponse.json({ ok: false, error: "Opzoeken mislukt. Probeer het zo nog eens." }, { status: 500 });
  }
}
