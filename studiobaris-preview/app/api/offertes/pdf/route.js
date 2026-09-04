import { NextResponse } from "next/server";
import { getOfferte } from "../../../../lib/abonnementen-data";
import { offertePdf } from "../../../../lib/offertes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req) {
  const nummer = new URL(req.url).searchParams.get("nummer");
  if (!nummer) return NextResponse.json({ ok: false, error: "nummer ontbreekt." }, { status: 400 });

  const offerte = await getOfferte(nummer);
  if (!offerte) return NextResponse.json({ ok: false, error: "Offerte niet gevonden." }, { status: 404 });

  const pdf = await offertePdf(offerte);
  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="Offerte-${nummer}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
