import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { maakUploadUrl } from "../../../../lib/taken-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function veiligeBestandsnaam(naam) {
  const schoon = String(naam || "bestand").trim().replace(/[\\/]/g, "_");
  return schoon.slice(-180) || "bestand";
}

export async function POST(req) {
  try {
    const body = await req.json();
    const taakId = String(body.taakId || "").trim();
    if (!taakId) return NextResponse.json({ ok: false, error: "Geen taak opgegeven." }, { status: 400 });
    const bestandsnaam = veiligeBestandsnaam(body.bestandsnaam);

    const pad = `${taakId}/${randomUUID()}-${bestandsnaam}`;
    const { url } = await maakUploadUrl(pad);
    return NextResponse.json({ ok: true, url, pad });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
