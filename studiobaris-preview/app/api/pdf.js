import { NextResponse } from "next/server";
import { getFactuur } from "../../../../lib/abonnementen-data";
import { factuurPdf } from "../../../../lib/facturen";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// De PDF opnieuw opmaken uit de bevroren snapshot. Dezelfde factuur geeft
// daarom over vijf jaar nog exact hetzelfde papier, ook als de prijs inmiddels
// is veranderd.
export async function GET(req) {
  const nummer = new URL(req.url).searchParams.get("nummer");
  if (!nummer) return NextResponse.json({ ok: false, error: "nummer ontbreekt." }, { status: 400 });

  const factuur = await getFactuur(nummer);
  if (!factuur) return NextResponse.json({ ok: false, error: "Factuur niet gevonden." }, { status: 404 });

  const pdf = await factuurPdf(factuur);
  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="Factuur-${nummer}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
