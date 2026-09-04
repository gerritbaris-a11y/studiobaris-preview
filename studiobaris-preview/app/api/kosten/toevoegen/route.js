import { NextResponse } from "next/server";
import { kostenToevoegen } from "../../../../lib/boekhouding-data";
import { leesSessie } from "../../../../lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Eén kostenregel toevoegen (abonnement, tool, promotiekosten, etc.).
// Btw wordt hier uitgerekend uit het ingevulde tarief — de gebruiker vult
// alleen het bedrag excl. btw en kiest een rekening; alle rekenwerk gebeurt
// hier zodat er nooit een verkeerd btw-bedrag met de hand wordt ingetypt.
export async function POST(req) {
  try {
    const sessie = leesSessie();
    const body = await req.json();
    const { grootboekCode, omschrijving, leverancier, bedragExcl, btwTarief, btwType, datum, terugkerend, frequentie } = body;

    if (!grootboekCode) {
      return NextResponse.json({ ok: false, error: "Kies een grootboekrekening." }, { status: 400 });
    }
    const om = String(omschrijving || "").trim();
    if (!om) {
      return NextResponse.json({ ok: false, error: "Omschrijving is verplicht." }, { status: 400 });
    }
    const bedrag = Math.round((Number(bedragExcl) || 0) * 100) / 100;
    if (bedrag <= 0) {
      return NextResponse.json({ ok: false, error: "Bedrag moet groter dan 0 zijn." }, { status: 400 });
    }
    const tarief = btwTarief === null || btwTarief === undefined ? 0.21 : Number(btwTarief);
    const btwBedrag = Math.round(bedrag * tarief * 100) / 100;

    const kosten = await kostenToevoegen({
      grootboekCode,
      omschrijving: om,
      leverancier,
      bedragExcl: bedrag,
      btwBedrag,
      btwTarief: tarief,
      btwType: btwType || "HOOG_21",
      datum,
      terugkerend,
      frequentie: terugkerend ? frequentie || "maandelijks" : null,
      toegevoegdDoor: sessie?.naam || null,
    });

    return NextResponse.json({ ok: true, kosten });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
