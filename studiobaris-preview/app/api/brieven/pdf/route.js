import { NextResponse } from "next/server";
import { leesSessie } from "../../../../lib/auth";
import { getOverview, getFull } from "../../../../lib/server-data";
import { briefTeksten, briefPdf, vandaagNL } from "../../../../lib/brieven";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60; // Claude schrijft de persoonlijke alinea's

// GET /api/brieven/pdf?slug=<preview-slug>
// Maakt een printklare brief voor één online preview uit de Adressenlijst.
// Ondertekend door wie ingelogd is (die zet er met de hand zijn handtekening
// onder). Alleen voor beheer: zie API_BEHEER in middleware.js.
export async function GET(req) {
  const slug = new URL(req.url).searchParams.get("slug");
  if (!slug) return NextResponse.json({ ok: false, error: "slug ontbreekt." }, { status: 400 });

  const sessie = leesSessie();
  const afzender = sessie && sessie.naam ? sessie.naam : null;

  const alles = await getOverview();
  const rij = alles.find((r) => r.slug === slug);
  if (!rij || !rij.gepubliceerd) {
    return NextResponse.json({ ok: false, error: "Geen online preview gevonden voor deze slug." }, { status: 404 });
  }
  const content = (await getFull(slug)) || {};

  const teksten = await briefTeksten(rij, content);
  const pdf = await briefPdf({ rij, content, teksten, afzender, dagtekening: vandaagNL() });

  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="Brief-${slug}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
