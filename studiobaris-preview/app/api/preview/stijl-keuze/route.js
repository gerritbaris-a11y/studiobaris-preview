import { NextResponse } from "next/server";
import { klantKiestStijl, log } from "../../../../lib/server-data";
import { geldigeStijl, stijlKort } from "../../../../lib/stijlen";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Publiek: de klant tikt op zijn preview op "Deze stijl kies ik".
// Wordt de stijl van de preview + badge in het dashboard (Mijn previews).
// Niets gevoeligs: alleen de stijl van een bestaande preview wisselen, iets
// wat het team en de klant toch al kunnen.
export async function POST(req) {
  try {
    const { slug, stijl } = await req.json();
    const s = geldigeStijl(stijl);
    if (!slug || typeof slug !== "string" || !/^[a-z0-9-]{1,120}$/.test(slug) || !s) {
      return NextResponse.json({ ok: false, error: "Onbekende stijl." }, { status: 400 });
    }
    const gelukt = await klantKiestStijl(slug, s);
    if (gelukt !== true) {
      return NextResponse.json({ ok: false, error: "Preview niet gevonden." }, { status: 404 });
    }
    await log({ persoon: "Klant", soort: "stijl", slug, naar: s, details: `Klant koos stijl ${stijlKort(s)} op de preview` });
    return NextResponse.json({ ok: true, stijl: s });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Opslaan lukte niet." }, { status: 500 });
  }
}
