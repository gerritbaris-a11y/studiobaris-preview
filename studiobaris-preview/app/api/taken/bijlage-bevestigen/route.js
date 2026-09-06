import { NextResponse } from "next/server";
import { bijlageToevoegen } from "../../../../lib/taken-data";
import { leesSessie } from "../../../../lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const body = await req.json();
    const sessie = leesSessie();
    const taakId = String(body.taakId || "").trim();
    const pad = String(body.pad || "").trim();
    const bestandsnaam = String(body.bestandsnaam || "").trim();
    if (!taakId || !pad || !bestandsnaam) {
      return NextResponse.json({ ok: false, error: "Onvolledige gegevens." }, { status: 400 });
    }
    const grootte = Number.isFinite(body.grootte) ? Number(body.grootte) : null;

    const bijlage = await bijlageToevoegen({
      taakId,
      pad,
      bestandsnaam,
      grootte,
      contentType: body.contentType || null,
      geuploadDoor: sessie?.naam || null,
    });
    return NextResponse.json({ ok: true, bijlage });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
