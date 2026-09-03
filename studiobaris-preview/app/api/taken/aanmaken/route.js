import { NextResponse } from "next/server";
import { maakTaak } from "../../../../lib/taken-data";
import { leesSessie } from "../../../../lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KOLOMMEN = ["te_doen", "mee_bezig", "klaar"];

export async function POST(req) {
  try {
    const body = await req.json();
    const sessie = leesSessie();
    const titel = String(body.titel || "").trim();
    if (!titel) return NextResponse.json({ ok: false, error: "Vul een titel in." }, { status: 400 });

    const kolom = KOLOMMEN.includes(body.kolom) ? body.kolom : "te_doen";

    const toegewezenAanIds = Array.isArray(body.toegewezenAanIds)
      ? body.toegewezenAanIds.filter(Boolean)
      : [];

    const taak = await maakTaak({
      titel,
      omschrijving: body.omschrijving ? String(body.omschrijving).trim() : null,
      toegewezenAanIds,
      prioriteit: body.prioriteit || "normaal",
      deadline: body.deadline || null,
      aangemaaktDoor: sessie?.naam || null,
      kolom,
    });
    return NextResponse.json({ ok: true, taak });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
