import { NextResponse } from "next/server";
import { leesSessie } from "../../../../lib/auth";
import { handelAanvraagAf } from "../../../../lib/aanbod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Terugbelverzoek van de aanbodpagina afvinken ("Gebeld"). Ieder ingelogd
// teamlid: de verkoper die zijn eigen prospect terugbelt mag hem ook afvinken.
export async function POST(req) {
  const sessie = leesSessie();
  if (!sessie) return NextResponse.json({ ok: false, error: "Niet ingelogd." }, { status: 401 });
  try {
    const { id } = await req.json();
    if (!Number(id)) return NextResponse.json({ ok: false, error: "id ontbreekt." }, { status: 400 });
    const r = await handelAanvraagAf(id, sessie.naam);
    if (!r || !r.ok) return NextResponse.json({ ok: false, error: "Afvinken mislukt." }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Afvinken mislukt." }, { status: 500 });
  }
}
