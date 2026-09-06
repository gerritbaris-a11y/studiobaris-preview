import { NextResponse } from "next/server";
import { urenBijwerken } from "../../../../lib/boekhouding-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Een bestaande urenregel corrigeren (verkeerde datum, aantal uur, omschrijving).
export async function POST(req) {
  try {
    const body = await req.json();
    const { id, datum, aantalUren, omschrijving } = body;

    if (!id) {
      return NextResponse.json({ ok: false, error: "Geen urenregel opgegeven." }, { status: 400 });
    }

    let uren;
    if (aantalUren !== undefined && aantalUren !== null) {
      uren = Number(aantalUren);
      if (!Number.isFinite(uren) || uren <= 0) {
        return NextResponse.json({ ok: false, error: "Aantal uur moet groter dan 0 zijn." }, { status: 400 });
      }
    }

    await urenBijwerken(id, {
      datum: datum || null,
      aantalUren: uren,
      omschrijving: omschrijving ? String(omschrijving).trim() : undefined,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
