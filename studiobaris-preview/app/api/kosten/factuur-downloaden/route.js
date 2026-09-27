import { NextResponse } from "next/server";
import { kostenFactuurOphalen, maakFactuurDownloadUrl } from "../../../../lib/boekhouding-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Opent de factuur via een kortlopende link naar de privé-opslag.
export async function GET(req) {
  try {
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ ok: false, error: "Geen factuur opgegeven." }, { status: 400 });
    const factuur = await kostenFactuurOphalen(id);
    if (!factuur || !factuur.pad) return NextResponse.json({ ok: false, error: "Factuur niet gevonden." }, { status: 404 });
    const { url } = await maakFactuurDownloadUrl(factuur.pad);
    return NextResponse.redirect(url);
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
