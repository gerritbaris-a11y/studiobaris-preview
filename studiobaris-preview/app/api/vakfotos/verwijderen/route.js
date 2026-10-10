import { NextResponse } from "next/server";
import { leesSessie, isBeheer } from "../../../../lib/auth";
import { verwijderVakfoto } from "../../../../lib/vakfotos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  if (!isBeheer(leesSessie())) return NextResponse.json({ ok: false, error: "Alleen voor beheer." }, { status: 403 });
  const body = await req.json().catch(() => null);
  const ok = body ? await verwijderVakfoto(body.vakgebied, body.naam, body.soort === "hero" ? "hero" : undefined) : false;
  return ok
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ ok: false, error: "Verwijderen mislukt." }, { status: 400 });
}
