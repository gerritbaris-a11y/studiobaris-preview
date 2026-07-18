import { NextResponse } from "next/server";
import { maakAkkoord } from "../../../../lib/server-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://preview.studiobaris.nl";

export async function POST(req) {
  try {
    const body = await req.json();
    const companyName = String(body.companyName || "").trim();
    if (!companyName) {
      return NextResponse.json({ ok: false, error: "Vul een bedrijfsnaam in." }, { status: 400 });
    }

    const maandbedrag = Number(body.maandbedrag);
    if (!maandbedrag || maandbedrag <= 0) {
      return NextResponse.json({ ok: false, error: "Kies een pakket (maandbedrag)." }, { status: 400 });
    }

    const aanbetaling = Number(body.aanbetaling);
    if (!aanbetaling || aanbetaling <= 0) {
      return NextResponse.json({ ok: false, error: "Vul een aanbetalingsbedrag in." }, { status: 400 });
    }

    const diensten = Array.isArray(body.diensten)
      ? body.diensten.map((d) => String(d).trim()).filter(Boolean)
      : [];

    const slug = await maakAkkoord({
      companyName,
      email: body.email ? String(body.email).trim() : null,
      phone: body.phone ? String(body.phone).trim() : null,
      pakket: body.pakket ? String(body.pakket).trim() : null,
      maandbedrag,
      aanbetaling,
      diensten,
      verzamelaar: body.verzamelaar ? String(body.verzamelaar).trim() : null,
    });

    if (!slug) {
      return NextResponse.json({ ok: false, error: "Aanmaken mislukt. Probeer het opnieuw." }, { status: 500 });
    }

    return NextResponse.json({ ok: true, slug, url: `${SITE_URL}/akkoord/${slug}` });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
