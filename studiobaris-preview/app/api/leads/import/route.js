import { NextResponse } from "next/server";
import { leesSessie, isBeheer } from "../../../../lib/auth";
import { importeerLeads } from "../../../../lib/server-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Importeert een batch leads. Bestaande leads (zelfde bedrijfsnaam + adres) worden
// bijgewerkt; hun status, eigenaar en preview-koppeling blijven staan.
export async function POST(req) {
  const sessie = leesSessie();
  if (!sessie || !isBeheer(sessie)) {
    return NextResponse.json({ ok: false, error: "Geen toegang." }, { status: 403 });
  }
  try {
    const { rijen, bron } = await req.json();
    if (!Array.isArray(rijen) || rijen.length === 0) {
      return NextResponse.json({ ok: false, error: "Geen rijen ontvangen." }, { status: 400 });
    }
    if (rijen.length > 1000) {
      return NextResponse.json({ ok: false, error: "Maximaal 1000 rijen per keer." }, { status: 400 });
    }
    const uitkomst = await importeerLeads(rijen, bron);
    if (!uitkomst) {
      return NextResponse.json({ ok: false, error: "Import mislukt (server-key?)." }, { status: 500 });
    }
    return NextResponse.json({ ok: true, ...uitkomst });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
