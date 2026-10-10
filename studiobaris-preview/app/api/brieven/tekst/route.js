import { NextResponse } from "next/server";
import { getOverview, getFull, getBrief } from "../../../../lib/server-data";
import { briefTeksten } from "../../../../lib/brieven";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// POST /api/brieven/tekst  { slug, opnieuw?: boolean }
// Teksten voor het bewerkvenster van "Brief maken". Is er al een opgeslagen
// brief voor deze preview, dan komt die terug (tenzij opnieuw = true: dan
// schrijft Claude een nieuwe variant). Er wordt hier niets opgeslagen; dat
// gebeurt pas bij "PDF maken". Alleen voor beheer (API_BEHEER in middleware.js).
export async function POST(req) {
  let body = {};
  try { body = await req.json(); } catch {}
  const slug = body && body.slug;
  if (!slug) return NextResponse.json({ ok: false, error: "slug ontbreekt." }, { status: 400 });

  if (!body.opnieuw) {
    const opgeslagen = await getBrief(slug);
    if (opgeslagen && opgeslagen.teksten) {
      return NextResponse.json({
        ok: true,
        teksten: opgeslagen.teksten,
        notitie_vlak: opgeslagen.notitie_vlak !== false,
        opgeslagen: { afzender: opgeslagen.afzender, bijgewerkt_op: opgeslagen.bijgewerkt_op, keer: opgeslagen.aantal_keer_gemaakt },
      });
    }
  }

  const alles = await getOverview();
  const rij = alles.find((r) => r.slug === slug);
  if (!rij || !rij.gepubliceerd) {
    return NextResponse.json({ ok: false, error: "Geen online preview gevonden." }, { status: 404 });
  }
  const content = (await getFull(slug)) || {};
  const t = await briefTeksten(rij, content);
  return NextResponse.json({
    ok: true,
    teksten: { vorm: t.vorm, aanhef: t.aanhef, opening: t.opening, eigen: "", app: t.app },
    notitie_vlak: true,
    bron: t.bron,
    opgeslagen: null,
  });
}
