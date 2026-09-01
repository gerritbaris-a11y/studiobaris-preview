import { NextResponse } from "next/server";
import { getFactuur, setFactuurStatus } from "../../../../lib/abonnementen-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TOEGESTAAN = ["concept", "verstuurd", "betaald", "mislukt"];

// Handmatige statuswijziging vanuit het facturenoverzicht — het vangnet voor
// betalingen die niet (of niet meer) via Mollie lopen, zoals een overschrijving
// of contante betaling. sb_factuur_status zet betaald_op vanzelf de eerste keer
// dat de status naar 'betaald' gaat.
export async function POST(req) {
  try {
    const { nummer, status } = await req.json();
    if (!nummer) return NextResponse.json({ ok: false, error: "factuurnummer ontbreekt." }, { status: 400 });
    if (!TOEGESTAAN.includes(status)) {
      return NextResponse.json({ ok: false, error: "onbekende status." }, { status: 400 });
    }

    const bestaat = await getFactuur(nummer);
    if (!bestaat) return NextResponse.json({ ok: false, error: "Factuur niet gevonden." }, { status: 404 });

    const factuur = await setFactuurStatus(nummer, status);
    if (!factuur) return NextResponse.json({ ok: false, error: "Opslaan mislukt." }, { status: 500 });
    return NextResponse.json({ ok: true, factuur });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
