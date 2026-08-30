import { NextResponse } from "next/server";
import { getFactuur } from "../../../../lib/abonnementen-data";
import { haalBestandOp } from "../../../../lib/bestanden";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Voor handmatig gelogde facturen: het zelfgemaakte PDF-bestand teruggeven
// (in plaats van er zelf een te tekenen, zoals /api/facturen/pdf doet voor
// de automatische facturen).
export async function GET(req) {
  const nummer = new URL(req.url).searchParams.get("nummer");
  if (!nummer) return NextResponse.json({ ok: false, error: "nummer ontbreekt." }, { status: 400 });

  const factuur = await getFactuur(nummer);
  if (!factuur) return NextResponse.json({ ok: false, error: "Factuur niet gevonden." }, { status: 404 });
  if (!factuur.pdf_url) return NextResponse.json({ ok: false, error: "Geen bestand bij deze factuur." }, { status: 404 });

  const bytes = await haalBestandOp(factuur.pdf_url);
  if (!bytes) return NextResponse.json({ ok: false, error: "Bestand niet gevonden in opslag." }, { status: 404 });

  return new NextResponse(bytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="Factuur-${nummer}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
