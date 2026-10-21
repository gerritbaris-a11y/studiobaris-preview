import { NextResponse } from "next/server";
import { getOverview, getFull, getBrief } from "../../../../lib/server-data";
import { kaartjesPdf } from "../../../../lib/kaartje";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_KAARTJES = 40;

// GET /api/brieven/kaartjes?slugs=a,b,c
// Fotokaartjes voor de aangevinkte adressen in de Adressenlijst, twee per A4
// met snijlijnen. Alleen previews die online staan; aanspreekvorm volgt de
// opgeslagen brief (anders "jullie"). Alleen voor beheer (API_BEHEER
// "/api/brieven" in middleware.js).
export async function GET(req) {
  const slugs = String(new URL(req.url).searchParams.get("slugs") || "")
    .split(",").map((s) => s.trim()).filter(Boolean);
  if (!slugs.length) return NextResponse.json({ ok: false, error: "Geen adressen aangevinkt." }, { status: 400 });
  if (slugs.length > MAX_KAARTJES) {
    return NextResponse.json({ ok: false, error: `Maximaal ${MAX_KAARTJES} kaartjes per keer.` }, { status: 400 });
  }
  const alles = await getOverview();
  const perSlug = new Map(alles.map((r) => [r.slug, r]));
  const lijst = (await Promise.all(slugs.map(async (slug) => {
    const rij = perSlug.get(slug);
    if (!rij || !rij.gepubliceerd) return null;
    const [content, brief] = await Promise.all([getFull(slug), getBrief(slug)]);
    const vorm = brief && brief.teksten && brief.teksten.vorm === "je" ? "je" : "jullie";
    return { rij, content: content || {}, vorm };
  }))).filter(Boolean);
  if (!lijst.length) return NextResponse.json({ ok: false, error: "Geen online previews gevonden." }, { status: 404 });

  const pdf = await kaartjesPdf(lijst);
  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="Kaartjes-${lijst.length}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
