import { NextResponse } from "next/server";
import { markeerKlant } from "../../../../lib/server-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Handmatig "dit is nu al een klant" aanvinken — koppelt het eerstvolgende
// klantnummer, los van een factuur of Mollie-betaling.
export async function POST(req) {
  try {
    const body = await req.json();
    const slug = body.slug;
    if (!slug) return NextResponse.json({ ok: false, error: "slug ontbreekt." }, { status: 400 });

    const num = (v) => {
      if (v === undefined || v === null || v === "") return null;
      const n = Number(String(v).replace(",", "."));
      return Number.isNaN(n) ? null : n;
    };

    const res = await markeerKlant(slug, {
      websiteprijs: num(body.websiteprijs),
      maandbedrag: num(body.maandbedrag),
      pakket_type: body.pakket_type || null,
    });
    if (!res || res.ok !== true) {
      return NextResponse.json({ ok: false, error: "Markeren mislukt (server-key?)." }, { status: 500 });
    }
    return NextResponse.json({ ok: true, klantnummer: res.klantnummer });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
