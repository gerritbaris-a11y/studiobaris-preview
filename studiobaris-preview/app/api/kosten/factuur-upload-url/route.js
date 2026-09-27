import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { maakFactuurUploadUrl } from "../../../../lib/boekhouding-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 25 * 1024 * 1024;

function veiligeBestandsnaam(naam) {
  const schoon = String(naam || "factuur").trim().replace(/[\\/]/g, "_").replace(/[^\w.\- ()]/g, "_");
  return schoon.slice(-180) || "factuur";
}

// Stap 1 van een factuur-upload: een kortlopende link waarmee de browser het
// bestand rechtstreeks naar de privé-opslag stuurt.
export async function POST(req) {
  try {
    const body = await req.json();
    const kostenId = String(body.kostenId || "").trim();
    if (!kostenId) return NextResponse.json({ ok: false, error: "Geen kostenregel opgegeven." }, { status: 400 });
    if (Number(body.grootte || 0) > MAX_BYTES) {
      return NextResponse.json({ ok: false, error: "Bestand is te groot (maximaal 25 MB)." }, { status: 400 });
    }
    const bestandsnaam = veiligeBestandsnaam(body.bestandsnaam);
    const pad = `${kostenId}/${randomUUID()}-${bestandsnaam}`;
    const { url } = await maakFactuurUploadUrl(pad);
    return NextResponse.json({ ok: true, url, pad });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
