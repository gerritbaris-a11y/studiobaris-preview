import { NextResponse } from "next/server";
import { maakFactuur } from "../../../../lib/abonnementen-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SOORTEN = ["eenmalig", "aanbetaling", "slottermijn", "maandelijks"];

// Een handmatige factuur: voor klanten die niet in het standaard maandritme
// vallen — in één keer betaald, een losse correctie, een eenmalige dienst.
// De regels komen letterlijk van het formulier; er wordt niets automatisch
// bijgeteld. Nummering en btw-berekening lopen via de bestaande
// sb_factuur_maak-functie, dezelfde die de automatische maandfacturatie
// gebruikt — dus geen dubbele of overslagen factuurnummers.
export async function POST(req) {
  try {
    const body = await req.json();
    const { slug, soort, regels, periode, incassodatum, vervaldagen } = body;

    if (!slug) {
      return NextResponse.json({ ok: false, error: "Kies een klant." }, { status: 400 });
    }
    if (!SOORTEN.includes(soort)) {
      return NextResponse.json({ ok: false, error: "Onbekend soort factuur." }, { status: 400 });
    }
    if (!Array.isArray(regels) || regels.length === 0) {
      return NextResponse.json({ ok: false, error: "Voeg minstens één regel toe." }, { status: 400 });
    }

    const schoneRegels = regels.map((r) => ({
      omschrijving: String((r && r.omschrijving) || "").trim(),
      bedrag_excl: Math.round((Number(r && r.bedrag_excl) || 0) * 100) / 100,
    }));
    if (schoneRegels.some((r) => !r.omschrijving || r.bedrag_excl <= 0)) {
      return NextResponse.json(
        { ok: false, error: "Elke regel heeft een omschrijving en een bedrag groter dan 0 nodig." },
        { status: 400 }
      );
    }

    const factuur = await maakFactuur({
      slug,
      soort,
      regels: schoneRegels,
      periode: periode || null,
      incassodatum: incassodatum || null,
      vervaldagen: vervaldagen ? Number(vervaldagen) : 14,
      status: "concept",
    });

    return NextResponse.json({ ok: true, factuur });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
