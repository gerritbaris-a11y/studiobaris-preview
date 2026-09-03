import { NextResponse } from "next/server";
import { maakOudKlant } from "../../../../lib/server-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Klant markeren als "geen klant meer" — klantnummer en facturen blijven
// bestaan, hij verdwijnt alleen uit de actieve Klanten-lijst.
export async function POST(req) {
  try {
    const body = await req.json();
    const slug = body.slug;
    if (!slug) return NextResponse.json({ ok: false, error: "slug ontbreekt." }, { status: 400 });

    const res = await maakOudKlant(slug);
    if (!res || res.ok !== true) {
      return NextResponse.json({ ok: false, error: "Mislukt (server-key?)." }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
