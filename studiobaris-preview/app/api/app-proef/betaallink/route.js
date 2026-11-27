import { NextResponse } from "next/server";
import { leesSessie, isBeheer } from "../../../../lib/auth";
import { afrekenUrl } from "../../../../lib/app-proef";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Geeft de persoonlijke afreken-link voor een app-proef, om zelf te sturen
// (WhatsApp/mail). Alleen beheer.
export async function POST(req) {
  const sessie = leesSessie();
  if (!isBeheer(sessie)) return NextResponse.json({ ok: false, error: "Alleen voor beheer." }, { status: 403 });
  const { id } = await req.json().catch(() => ({}));
  if (!/^[0-9a-f-]{36}$/i.test(String(id || ""))) return NextResponse.json({ ok: false, error: "id ontbreekt." }, { status: 400 });
  return NextResponse.json({ ok: true, url: afrekenUrl(id) });
}
