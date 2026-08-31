import { NextResponse } from "next/server";
import { bewerkTaak } from "../../../../lib/taken-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const body = await req.json();
    const id = String(body.id || "").trim();
    const titel = String(body.titel || "").trim();
    if (!id) return NextResponse.json({ ok: false, error: "Geen taak opgegeven." }, { status: 400 });
    if (!titel) return NextResponse.json({ ok: false, error: "Vul een titel in." }, { status: 400 });

    const taak = await bewerkTaak(id, {
      titel,
      omschrijving: body.omschrijving ? String(body.omschrijving).trim() : null,
      toegewezenAan: body.toegewezenAan || null,
      prioriteit: body.prioriteit || "normaal",
      deadline: body.deadline || null,
    });
    return NextResponse.json({ ok: true, taak });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
