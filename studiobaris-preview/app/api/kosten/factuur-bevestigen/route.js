import { NextResponse } from "next/server";
import { kostenFactuurToevoegen } from "../../../../lib/boekhouding-data";
import { leesSessie } from "../../../../lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Stap 2 van een factuur-upload: het bestand staat in de opslag, nu koppelen
// we 'm aan de kostenregel.
export async function POST(req) {
  try {
    const body = await req.json();
    const sessie = leesSessie();
    const kostenId = String(body.kostenId || "").trim();
    const pad = String(body.pad || "").trim();
    const bestandsnaam = String(body.bestandsnaam || "").trim();
    if (!kostenId || !pad || !bestandsnaam) {
      return NextResponse.json({ ok: false, error: "Onvolledige gegevens." }, { status: 400 });
    }
    // Het pad moet in de map van déze kostenregel liggen (zo zet factuur-upload-url 'm neer).
    if (!pad.startsWith(kostenId + "/")) {
      return NextResponse.json({ ok: false, error: "Ongeldig bestandspad." }, { status: 400 });
    }
    const factuur = await kostenFactuurToevoegen({
      kostenId,
      pad,
      bestandsnaam,
      grootte: Number.isFinite(body.grootte) ? Number(body.grootte) : null,
      contentType: body.contentType || null,
      geuploadDoor: sessie?.naam || null,
    });
    return NextResponse.json({ ok: true, factuur });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
