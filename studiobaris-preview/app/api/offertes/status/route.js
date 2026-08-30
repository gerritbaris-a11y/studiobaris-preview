import { NextResponse } from "next/server";
import { setOfferteStatus } from "../../../../lib/abonnementen-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSSEN = ["concept", "verstuurd", "akkoord", "afgewezen", "verlopen"];

// Status handmatig bijwerken (versturen/akkoord/afwijzen). Er wordt hier
// bewust niets automatisch gemaild — offertes gaan er per e-mail of
// WhatsApp uit, precies zoals in de eigen voorwaarden staat.
export async function POST(req) {
  try {
    const { nummer, status } = await req.json();
    if (!nummer) return NextResponse.json({ ok: false, error: "offertenummer ontbreekt." }, { status: 400 });
    if (!STATUSSEN.includes(status)) {
      return NextResponse.json({ ok: false, error: "Onbekende status." }, { status: 400 });
    }
    const offerte = await setOfferteStatus(nummer, status);
    return NextResponse.json({ ok: true, offerte });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
