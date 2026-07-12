import { NextResponse } from "next/server";
import { leesSessie, isBeheer } from "../../../lib/auth";
import { zetVraagStatus } from "../../../lib/server-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  const sessie = leesSessie();
  if (!sessie || !isBeheer(sessie)) {
    return NextResponse.json({ ok: false, error: "Geen toegang." }, { status: 403 });
  }
  try {
    const { id, status, notitie } = await req.json();
    if (!id || !["open", "afgehandeld"].includes(status)) {
      return NextResponse.json({ ok: false, error: "Ongeldig verzoek." }, { status: 400 });
    }
    await zetVraagStatus(id, status, notitie || null);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
