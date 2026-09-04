import { NextResponse } from "next/server";
import { kostenVerwijderen } from "../../../../lib/boekhouding-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Een kostenregel weer weghalen (bijv. per ongeluk twee keer ingevoerd).
export async function POST(req) {
  try {
    const body = await req.json();
    const { id } = body;
    if (!id) {
      return NextResponse.json({ ok: false, error: "Geen kostenregel opgegeven." }, { status: 400 });
    }
    await kostenVerwijderen(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
