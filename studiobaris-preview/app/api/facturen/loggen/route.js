import { NextResponse } from "next/server";
import { logFactuur } from "../../../../lib/abonnementen-data";
import { uploadBestand } from "../../../../lib/bestanden";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SOORTEN = ["eenmalig", "aanbetaling", "slottermijn", "maandelijks"];
const STATUSSEN = ["concept", "verstuurd", "betaald", "mislukt"];

// Voor facturen die je zelf in het sjabloon (Drive) invult en als PDF
// exporteert: geen regels-formulier meer, alleen de kerngegevens + het
// bestand zelf. Het factuurnummer komt hier — net als bij de automatische
// flow — uit de database, nooit uit wat er in de spreadsheet staat.
export async function POST(req) {
  try {
    const form = await req.formData();
    const slug = form.get("slug");
    const soort = form.get("soort");
    const omschrijving = String(form.get("omschrijving") || "").trim();
    const bedragExcl = Math.round((Number(form.get("bedragExcl")) || 0) * 100) / 100;
    const factuurdatum = form.get("factuurdatum") || new Date().toISOString().slice(0, 10);
    const status = form.get("status") || "verstuurd";
    const bestand = form.get("bestand");

    if (!slug) return NextResponse.json({ ok: false, error: "Kies een klant." }, { status: 400 });
    if (!SOORTEN.includes(soort)) return NextResponse.json({ ok: false, error: "Onbekend soort factuur." }, { status: 400 });
    if (!STATUSSEN.includes(status)) return NextResponse.json({ ok: false, error: "Onbekende status." }, { status: 400 });
    if (!omschrijving || bedragExcl <= 0) {
      return NextResponse.json({ ok: false, error: "Vul een omschrijving en een bedrag groter dan 0 in." }, { status: 400 });
    }
    if (!bestand || typeof bestand === "string") {
      return NextResponse.json({ ok: false, error: "Voeg de geëxporteerde PDF toe." }, { status: 400 });
    }
    if (bestand.type && bestand.type !== "application/pdf") {
      return NextResponse.json({ ok: false, error: "Alleen PDF-bestanden." }, { status: 400 });
    }

    // Nummer nog niet bekend op dit moment — het bestand krijgt een unieke
    // naam op basis van tijdstip, en wordt na het aanmaken van de factuur
    // niet meer hernoemd (het pad staat toch alleen intern, nooit zichtbaar
    // voor de klant).
    const bytes = Buffer.from(await bestand.arrayBuffer());
    const pad = `facturen/${slug}-${Date.now()}.pdf`;
    await uploadBestand(pad, bytes);

    const factuur = await logFactuur({
      slug, soort, omschrijving, bedragExcl, factuurdatum, status, pdfPad: pad,
    });

    return NextResponse.json({ ok: true, factuur });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
