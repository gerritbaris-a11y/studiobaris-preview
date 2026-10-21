import { NextResponse } from "next/server";
import { getOverview, getFull, getBrief } from "../../../../lib/server-data";
import { kaartjePdf } from "../../../../lib/kaartje";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// GET /api/brieven/kaartje?slug=...
// Printklaar fotokaartje (A6) bij de brief: de preview op een telefoon, met
// QR-code. Aanspreekvorm volgt de opgeslagen brief (anders "jullie").
// Alleen voor beheer (API_BEHEER "/api/brieven" in middleware.js).
export async function GET(req) {
  const slug = new URL(req.url).searchParams.get("slug");
  if (!slug) return NextResponse.json({ ok: false, error: "slug ontbreekt." }, { status: 400 });
  const alles = await getOverview();
  const rij = alles.find((r) => r.slug === slug);
  if (!rij || !rij.gepubliceerd) {
    return NextResponse.json({ ok: false, error: "Geen online preview gevonden voor deze slug." }, { status: 404 });
  }
  const content = (await getFull(slug)) || {};
  const brief = await getBrief(slug);
  const vorm = brief && brief.teksten && brief.teksten.vorm === "je" ? "je" : "jullie";
  const pdf = await kaartjePdf({ rij, content, vorm });
  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="Kaartje-${slug}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
