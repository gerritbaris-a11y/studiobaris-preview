import { NextResponse } from "next/server";
import { leesSessie } from "../../../../lib/auth";
import { getOverview, getFull, getBrief, slaBriefOp } from "../../../../lib/server-data";
import { briefTeksten, briefPdf, normaliseerTeksten, vandaagNL } from "../../../../lib/brieven";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60; // bij GET zonder opgeslagen tekst schrijft Claude eerst

// Printklare brief voor één online preview uit de Adressenlijst, ondertekend
// door wie ingelogd is. Alleen voor beheer: zie API_BEHEER in middleware.js.
//
// POST (formulier vanuit het bewerkvenster, veld "data" = JSON
//   { slug, teksten, notitie_vlak }): slaat de tekst op en geeft de PDF.
// GET ?slug=...: zonder bewerken; gebruikt de opgeslagen tekst als die er is,
//   anders schrijft Claude er een (en die wordt opgeslagen).

async function laadPreview(slug) {
  const alles = await getOverview();
  const rij = alles.find((r) => r.slug === slug);
  if (!rij || !rij.gepubliceerd) return null;
  const content = (await getFull(slug)) || {};
  return { rij, content };
}

async function maakPdf(slug, teksten, notitieVlak) {
  const preview = await laadPreview(slug);
  if (!preview) {
    return NextResponse.json({ ok: false, error: "Geen online preview gevonden voor deze slug." }, { status: 404 });
  }
  const sessie = leesSessie();
  const afzender = sessie && sessie.naam ? sessie.naam : null;
  const schoon = normaliseerTeksten(teksten || (await briefTeksten(preview.rij, preview.content)));
  await slaBriefOp(slug, schoon, notitieVlak, afzender); // mislukt opslaan blokkeert de brief niet

  const pdf = await briefPdf({ ...preview, teksten: schoon, afzender, notitieVlak, dagtekening: vandaagNL() });
  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="Brief-${slug}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(req) {
  const slug = new URL(req.url).searchParams.get("slug");
  if (!slug) return NextResponse.json({ ok: false, error: "slug ontbreekt." }, { status: 400 });
  const opgeslagen = await getBrief(slug);
  return maakPdf(slug, opgeslagen ? opgeslagen.teksten : null, opgeslagen ? opgeslagen.notitie_vlak !== false : true);
}

export async function POST(req) {
  let data = null;
  try {
    const form = await req.formData();
    data = JSON.parse(String(form.get("data") || ""));
  } catch {}
  if (!data || !data.slug || !data.teksten) {
    return NextResponse.json({ ok: false, error: "Ongeldige aanvraag." }, { status: 400 });
  }
  return maakPdf(data.slug, data.teksten, data.notitie_vlak !== false);
}
