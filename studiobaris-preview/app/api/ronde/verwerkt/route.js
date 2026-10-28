import { NextResponse } from "next/server";
import { leesSessie, isBeheer } from "../../../../lib/auth";
import { rondeVerwerkt } from "../../../../lib/ronde";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Feedbackronde afvinken als verwerkt. Alleen beheer (staat ook in de middleware).
export async function POST(req) {
  const sessie = leesSessie();
  if (!sessie || !isBeheer(sessie)) return NextResponse.json({ ok: false, error: "Geen toegang." }, { status: 403 });
  try {
    const { id } = await req.json();
    if (!Number(id)) return NextResponse.json({ ok: false, error: "id ontbreekt." }, { status: 400 });
    const r = await rondeVerwerkt(id, sessie.naam);
    if (!r) return NextResponse.json({ ok: false, error: "Afvinken mislukt." }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Afvinken mislukt." }, { status: 500 });
  }
}
