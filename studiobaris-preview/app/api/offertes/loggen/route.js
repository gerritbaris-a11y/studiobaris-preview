import { NextResponse } from "next/server";
import { maakOfferte } from "../../../../lib/abonnementen-data";
import { uploadBestand } from "../../../../lib/bestanden";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSSEN = ["concept", "verstuurd"];

// Zelfde idee als bij facturen: jij vult het offerte-sjabloon zelf in en
// exporteert 'm als PDF; hier loggen we alleen de kerngegevens + het bestand.
export async function POST(req) {
  try {
    const form = await req.formData();
    const slug = form.get("slug");
    const omschrijving = String(form.get("omschrijving") || "").trim();
    const bedragExcl = Math.round((Number(form.get("bedragExcl")) || 0) * 100) / 100;
    const geldigDagen = form.get("geldigDagen") ? Number(form.get("geldigDagen")) : 30;
    const status = form.get("status") || "concept";
    const bestand = form.get("bestand");

    if (!slug) return NextResponse.json({ ok: false, error: "Kies een klant." }, { status: 400 });
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

    const bytes = Buffer.from(await bestand.arrayBuffer());
    const pad = `offertes/${slug}-${Date.now()}.pdf`;
    await uploadBestand(pad, bytes);

    const offerte = await maakOfferte({
      slug,
      regels: [{ omschrijving, aantal: 1, bedrag_per_stuk: bedragExcl }],
      geldigDagen,
      status,
      pdfPad: pad,
    });

    return NextResponse.json({ ok: true, offerte });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
