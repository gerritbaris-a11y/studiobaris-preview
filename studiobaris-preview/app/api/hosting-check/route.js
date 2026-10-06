import { NextResponse } from "next/server";
import { leesSessie } from "../../../lib/auth";
import { hostingCheck } from "../../../lib/hosting-check";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Verkoper plakt een websiteadres → waar staan domein, website en mail.
// Alleen voor ingelogde teamleden (staat ook in de middleware).
export async function POST(req) {
  const sessie = leesSessie();
  if (!sessie) return NextResponse.json({ ok: false, error: "Niet ingelogd." }, { status: 401 });
  try {
    const { adres } = await req.json();
    const r = await hostingCheck(adres);
    return NextResponse.json(r, { status: r.ok ? 200 : 400 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Opzoeken mislukt. Probeer het zo nog eens." }, { status: 500 });
  }
}
