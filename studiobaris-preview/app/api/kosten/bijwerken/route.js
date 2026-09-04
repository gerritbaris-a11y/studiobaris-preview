import { NextResponse } from "next/server";
import { kostenBijwerken } from "../../../../lib/boekhouding-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Een bestaande kostenregel corrigeren (verkeerd bedrag, verkeerde rekening, ...).
export async function POST(req) {
  try {
    const body = await req.json();
    const { id, grootboekCode, omschrijving, leverancier, bedragExcl, btwTarief, btwType, datum, terugkerend, frequentie } = body;

    if (!id) {
      return NextResponse.json({ ok: false, error: "Geen kostenregel opgegeven." }, { status: 400 });
    }

    let btwBedrag;
    let bedrag;
    let tarief;
    if (bedragExcl !== undefined && bedragExcl !== null) {
      bedrag = Math.round((Number(bedragExcl) || 0) * 100) / 100;
      if (bedrag <= 0) {
        return NextResponse.json({ ok: false, error: "Bedrag moet groter dan 0 zijn." }, { status: 400 });
      }
      tarief = btwTarief === null || btwTarief === undefined ? 0.21 : Number(btwTarief);
      btwBedrag = Math.round(bedrag * tarief * 100) / 100;
    }

    const kosten = await kostenBijwerken(id, {
      grootboekCode,
      omschrijving: omschrijving ? String(omschrijving).trim() : undefined,
      leverancier,
      bedragExcl: bedrag,
      btwBedrag,
      btwTarief: tarief,
      btwType,
      datum,
      terugkerend,
      frequentie: terugkerend === false ? null : frequentie,
    });

    return NextResponse.json({ ok: true, kosten });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
