import { NextResponse } from "next/server";
import { bijlageVerwijderen } from "../../../../lib/taken-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const body = await req.json();
    const id = String(body.id || "").trim();
    if (!id) return NextResponse.json({ ok: false, error: "Geen bijlage opgegeven." }, { status: 400 });
    await bijlageVerwijderen(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
