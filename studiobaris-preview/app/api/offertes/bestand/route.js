import { NextResponse } from "next/server";
import { getOfferte } from "../../../../lib/abonnementen-data";
import { haalBestandOp } from "../../../../lib/bestanden";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req) {
  const nummer = new URL(req.url).searchParams.get("nummer");
  if (!nummer) return NextResponse.json({ ok: false, error: "nummer ontbreekt." }, { status: 400 });

  const offerte = await getOfferte(nummer);
  if (!offerte) return NextResponse.json({ ok: false, error: "Offerte niet gevonden." }, { status: 404 });
  if (!offerte.pdf_url) return NextResponse.json({ ok: false, error: "Geen bestand bij deze offerte." }, { status: 404 });

  const bytes = await haalBestandOp(offerte.pdf_url);
  if (!bytes) return NextResponse.json({ ok: false, error: "Bestand niet gevonden in opslag." }, { status: 404 });

  return new NextResponse(bytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="Offerte-${nummer}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
