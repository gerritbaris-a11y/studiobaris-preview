import { NextResponse } from "next/server";
import { setUserWachtwoord } from "../../../../lib/server-data";
import { leesSessie } from "../../../../lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Wachtwoord resetten (alleen beheer). Zet password_hash op null → nieuwe login stelt opnieuw in.
export async function POST(req) {
  try {
    const sessie = leesSessie();
    if (!sessie || sessie.rol !== "beheer") {
      return NextResponse.json({ ok: false, error: "Geen toegang." }, { status: 403 });
    }
    const { id } = await req.json();
    if (!id) return NextResponse.json({ ok: false, error: "id ontbreekt." }, { status: 400 });

    await setUserWachtwoord(id, null);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
