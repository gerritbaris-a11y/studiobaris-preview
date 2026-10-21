import { NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
import { leesSessie } from "../../../../lib/auth";
import { getOverview, getFull, getBrief, slaBriefOp } from "../../../../lib/server-data";
import { briefPdf, normaliseerTeksten, leesDatum, datumIso, vandaagNL } from "../../../../lib/brieven";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_BRIEVEN = 40;

// POST /api/brieven/stapel (formulier vanuit de Adressenlijst, veld "data" =
// JSON { slugs, verzonden }): alle brieven voor de route in één PDF.
// - Alleen adressen met een gecontroleerde (opgeslagen) brief; de rest slaan
//   we over. Er wordt hier nooit nieuwe tekst door Claude geschreven.
// - Volgorde: alfabetisch op bedrijfsnaam, dezelfde als de kaartjes-stapel.
// - verzonden ("YYYY-MM-DD") geldt voor de hele stapel en wordt per brief
//   opgeslagen, zodat opnieuw printen dezelfde datum en deadline geeft.
// Alleen voor beheer (API_BEHEER "/api/brieven" in middleware.js).
export async function POST(req) {
  let data = null;
  try {
    const form = await req.formData();
    data = JSON.parse(String(form.get("data") || ""));
  } catch {}
  const slugs = Array.isArray(data && data.slugs) ? data.slugs.map(String).filter(Boolean) : [];
  if (!slugs.length) return NextResponse.json({ ok: false, error: "Geen adressen aangevinkt." }, { status: 400 });
  if (slugs.length > MAX_BRIEVEN) return NextResponse.json({ ok: false, error: `Maximaal ${MAX_BRIEVEN} brieven per keer.` }, { status: 400 });
  const verzonden = datumIso(leesDatum(data.verzonden) || vandaagNL());

  const sessie = leesSessie();
  const afzender = sessie && sessie.naam ? sessie.naam : null;
  const alles = await getOverview();
  const perSlug = new Map(alles.map((r) => [r.slug, r]));

  const klaar = (await Promise.all(slugs.map(async (slug) => {
    const rij = perSlug.get(slug);
    if (!rij || !rij.gepubliceerd) return null;
    const brief = await getBrief(slug);
    if (!brief || !brief.teksten) return null; // nog niet gecontroleerd: overslaan
    const content = (await getFull(slug)) || {};
    const teksten = normaliseerTeksten({ ...brief.teksten, verzonden });
    const notitieVlak = brief.notitie_vlak !== false;
    await slaBriefOp(slug, teksten, notitieVlak, afzender);
    const pdf = await briefPdf({ rij, content, teksten, afzender, notitieVlak });
    return { naam: String(rij.company_name || slug), pdf };
  }))).filter(Boolean);

  if (!klaar.length) {
    return NextResponse.json({ ok: false, error: "Geen van de aangevinkte adressen heeft al een gecontroleerde brief." }, { status: 404 });
  }
  klaar.sort((a, b) => a.naam.localeCompare(b.naam, "nl"));

  const samen = await PDFDocument.create();
  samen.setTitle(`Brieven ${verzonden} (${klaar.length})`);
  samen.setAuthor("StudioBaris");
  for (const k of klaar) {
    const los = await PDFDocument.load(k.pdf);
    const paginas = await samen.copyPages(los, los.getPageIndices());
    paginas.forEach((p) => samen.addPage(p));
  }
  const bytes = await samen.save();
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="Brieven-${verzonden}-${klaar.length}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
