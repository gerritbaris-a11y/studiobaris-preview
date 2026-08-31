import { NextResponse } from "next/server";
import { herordenTaken } from "../../../../lib/taken-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KOLOMMEN = ["te_doen", "mee_bezig", "klaar"];

// Eén call per drop: de client stuurt de volledige, nieuwe volgorde van
// taak-id's in de kolom waar het kaartje is neergezet (zie sb_taken_herordenen).
export async function POST(req) {
  try {
    const body = await req.json();
    const kolom = String(body.kolom || "");
    if (!KOLOMMEN.includes(kolom)) {
      return NextResponse.json({ ok: false, error: "Onbekende kolom." }, { status: 400 });
    }
    const taakIds = Array.isArray(body.taakIds) ? body.taakIds.map(String) : [];

    const taken = await herordenTaken(kolom, taakIds);
    return NextResponse.json({ ok: true, taken });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
