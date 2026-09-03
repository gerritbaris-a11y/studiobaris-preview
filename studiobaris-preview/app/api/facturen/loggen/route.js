import { NextResponse } from "next/server";
import { logFactuur } from "../../../../lib/abonnementen-data";
import { uploadBestand } from "../../../../lib/bestanden";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SOORTEN = ["eenmalig", "aanbetaling", "slottermijn", "maandelijks"];
const STATUSSEN = ["concept", "verstuurd", "betaald", "mislukt"];

// Voor het bijzondere geval: een factuur met een afwijkende datum of status
// vastleggen (een oude factuur alsnog registreren, een correctie) — verder
// dezelfde vrije regels én dezelfde automatisch gegenereerde PDF-opmaak als
// een gewone factuur. Een eigen PDF uploaden kan nog steeds, voor het
// enkele geval dat de standaardopmaak echt niet past; laat 'm leeg en de
// factuur ziet er precies zo uit als elke andere.
export async function POST(req) {
  try {
    const form = await req.formData();
    const slug = form.get("slug");
    const soort = form.get("soort");
    const factuurdatum = form.get("factuurdatum") || new Date().toISOString().slice(0, 10);
    const status = form.get("status") || "verstuurd";
    const bestand = form.get("bestand");

    let regelsRuw;
    try {
      regelsRuw = JSON.parse(form.get("regels") || "[]");
    } catch {
      return NextResponse.json({ ok: false, error: "Ongeldige regels." }, { status: 400 });
    }

    if (!slug) return NextResponse.json({ ok: false, error: "Kies een klant." }, { status: 400 });
    if (!SOORTEN.includes(soort)) return NextResponse.json({ ok: false, error: "Onbekend soort factuur." }, { status: 400 });
    if (!STATUSSEN.includes(status)) return NextResponse.json({ ok: false, error: "Onbekende status." }, { status: 400 });
    if (!Array.isArray(regelsRuw) || regelsRuw.length === 0) {
      return NextResponse.json({ ok: false, error: "Voeg minstens één regel toe." }, { status: 400 });
    }

    const regels = regelsRuw.map((r) => ({
      omschrijving: String((r && r.omschrijving) || "").trim(),
      bedrag_excl: Math.round((Number(r && r.bedrag_excl) || 0) * 100) / 100,
    }));
    if (regels.some((r) => !r.omschrijving || r.bedrag_excl <= 0)) {
      return NextResponse.json(
        { ok: false, error: "Elke regel heeft een omschrijving en een bedrag groter dan 0 nodig." },
        { status: 400 }
      );
    }

    // De PDF-upload is nu optioneel: alleen voor het echte uitzonderingsgeval.
    // Zonder upload blijft pdfPad leeg en gebruikt de factuur straks gewoon
    // de standaard, automatisch gegenereerde opmaak — net als elke andere.
    let pdfPad = null;
    if (bestand && typeof bestand !== "string") {
      if (bestand.type && bestand.type !== "application/pdf") {
        return NextResponse.json({ ok: false, error: "Alleen PDF-bestanden." }, { status: 400 });
      }
      const bytes = Buffer.from(await bestand.arrayBuffer());
      pdfPad = `facturen/${slug}-${Date.now()}.pdf`;
      await uploadBestand(pdfPad, bytes);
    }

    const factuur = await logFactuur({ slug, soort, regels, factuurdatum, status, pdfPad });

    return NextResponse.json({ ok: true, factuur });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
