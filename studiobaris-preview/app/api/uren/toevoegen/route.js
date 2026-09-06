import { NextResponse } from "next/server";
import { urenToevoegen } from "../../../../lib/boekhouding-data";
import { leesSessie } from "../../../../lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Een gewerkte periode registreren, t.b.v. het urencriterium (1.225 uur/jaar).
export async function POST(req) {
  try {
    const sessie = leesSessie();
    const body = await req.json();
    const { datum, aantalUren, omschrijving } = body;

    if (!omschrijving || !String(omschrijving).trim()) {
      return NextResponse.json({ ok: false, error: "Vul een omschrijving in." }, { status: 400 });
    }
    const uren = Number(aantalUren);
    if (!Number.isFinite(uren) || uren <= 0) {
      return NextResponse.json({ ok: false, error: "Aantal uur moet groter dan 0 zijn." }, { status: 400 });
    }

    const resultaat = await urenToevoegen({
      datum: datum || null,
      aantalUren: uren,
      omschrijving: String(omschrijving).trim(),
      toegevoegdDoor: sessie?.naam || null,
    });

    return NextResponse.json({ ok: true, resultaat });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
