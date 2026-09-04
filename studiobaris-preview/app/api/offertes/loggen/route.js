import { NextResponse } from "next/server";
import { maakOfferte, setOfferteStatus } from "../../../../lib/abonnementen-data";
import { uploadBestand } from "../../../../lib/bestanden";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SOORTEN = ["eenmalig", "maandelijks"];
const STATUSSEN = ["concept", "verstuurd", "akkoord", "afgewezen", "verlopen"];

// Voor het bijzondere geval: een offerte vastleggen die niet via het
// normale "+ Nieuwe offerte"-formulier gaat (bijvoorbeeld een al akkoord
// bevonden of afgewezen offerte alsnog registreren) — verder dezelfde
// vrije regels (met eenmalig/maandelijks-splitsing) én dezelfde automatisch
// gegenereerde PDF-opmaak als een gewone offerte. Een eigen PDF uploaden
// kan nog steeds, voor het enkele geval dat de standaardopmaak echt niet
// past; laat 'm leeg en de offerte ziet er precies zo uit als elke andere.
export async function POST(req) {
  try {
    const form = await req.formData();
    const slug = form.get("slug");
    const status = form.get("status") || "verstuurd";
    const geldigDagen = form.get("geldigDagen");
    const intro = form.get("intro");
    const bestand = form.get("bestand");

    let regelsRuw;
    try {
      regelsRuw = JSON.parse(form.get("regels") || "[]");
    } catch {
      return NextResponse.json({ ok: false, error: "Ongeldige regels." }, { status: 400 });
    }

    if (!slug) return NextResponse.json({ ok: false, error: "Kies een klant." }, { status: 400 });
    if (!STATUSSEN.includes(status)) return NextResponse.json({ ok: false, error: "Onbekende status." }, { status: 400 });
    if (!Array.isArray(regelsRuw) || regelsRuw.length === 0) {
      return NextResponse.json({ ok: false, error: "Voeg minstens één regel toe." }, { status: 400 });
    }

    const regels = regelsRuw.map((r) => ({
      omschrijving: String((r && r.omschrijving) || "").trim(),
      aantal: Math.max(1, Math.round(Number(r && r.aantal) || 1)),
      bedrag_per_stuk: Math.round((Number(r && r.bedrag_per_stuk) || 0) * 100) / 100,
      soort: SOORTEN.includes(r && r.soort) ? r.soort : "eenmalig",
    }));
    if (regels.some((r) => !r.omschrijving || r.bedrag_per_stuk <= 0)) {
      return NextResponse.json(
        { ok: false, error: "Elke regel heeft een omschrijving en een bedrag groter dan 0 nodig." },
        { status: 400 }
      );
    }

    // De PDF-upload is optioneel: alleen voor het echte uitzonderingsgeval.
    // Zonder upload blijft pdfPad leeg en gebruikt de offerte straks gewoon
    // de standaard, automatisch gegenereerde opmaak — net als elke andere.
    let pdfPad = null;
    if (bestand && typeof bestand !== "string") {
      if (bestand.type && bestand.type !== "application/pdf") {
        return NextResponse.json({ ok: false, error: "Alleen PDF-bestanden." }, { status: 400 });
      }
      const bytes = Buffer.from(await bestand.arrayBuffer());
      pdfPad = `offertes/${slug}-${Date.now()}.pdf`;
      await uploadBestand(pdfPad, bytes);
    }

    // sb_offerte_maak accepteert alleen 'concept'/'verstuurd' als
    // aanmaakstatus; een verdere status (akkoord/afgewezen/verlopen) wordt
    // na het aanmaken alsnog gezet via sb_offerte_status.
    const aanmaakStatus = status === "concept" ? "concept" : "verstuurd";
    let offerte = await maakOfferte({
      slug,
      regels,
      geldigDagen: geldigDagen ? Number(geldigDagen) : 30,
      intro: intro ? String(intro).trim() || null : null,
      status: aanmaakStatus,
      pdfPad,
    });
    if (status !== aanmaakStatus) {
      offerte = await setOfferteStatus(offerte.nummer, status);
    }

    return NextResponse.json({ ok: true, offerte });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
