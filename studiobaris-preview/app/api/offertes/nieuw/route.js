import { NextResponse } from "next/server";
import { maakOfferte } from "../../../../lib/abonnementen-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SOORTEN = ["eenmalig", "maandelijks"];

// Een nieuwe offerte: vrije regels, elk eenmalig of maandelijks. Bevat de
// offerte beide soorten, dan splitst de PDF vanzelf in twee blokken met
// eigen subtotaal/btw/totaal (zie lib/offertes.js). Nummering en
// btw-berekening lopen via sb_offerte_maak.
export async function POST(req) {
  try {
    const body = await req.json();
    const { slug, regels, geldigDagen, intro, status } = body;

    if (!slug) {
      return NextResponse.json({ ok: false, error: "Kies een klant." }, { status: 400 });
    }
    if (!Array.isArray(regels) || regels.length === 0) {
      return NextResponse.json({ ok: false, error: "Voeg minstens één regel toe." }, { status: 400 });
    }

    const schoneRegels = regels.map((r) => ({
      omschrijving: String((r && r.omschrijving) || "").trim(),
      aantal: Math.max(1, Math.round(Number(r && r.aantal) || 1)),
      bedrag_per_stuk: Math.round((Number(r && r.bedrag_per_stuk) || 0) * 100) / 100,
      soort: SOORTEN.includes(r && r.soort) ? r.soort : "eenmalig",
    }));
    if (schoneRegels.some((r) => !r.omschrijving || r.bedrag_per_stuk <= 0)) {
      return NextResponse.json(
        { ok: false, error: "Elke regel heeft een omschrijving en een bedrag groter dan 0 nodig." },
        { status: 400 }
      );
    }

    const offerte = await maakOfferte({
      slug,
      regels: schoneRegels,
      geldigDagen: geldigDagen ? Number(geldigDagen) : 30,
      intro: intro ? String(intro).trim() || null : null,
      status: status === "verstuurd" ? "verstuurd" : "concept",
      pdfPad: null,
    });

    return NextResponse.json({ ok: true, offerte });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
