import { NextResponse } from "next/server";
import { setFactuurEmail } from "../../../../lib/server-data";
import { leesSessie } from "../../../../lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Apart factuuradres per klant. Leeg = facturen naar het standaardadres.
export async function POST(req) {
  try {
    const sessie = leesSessie();
    if (!sessie) return NextResponse.json({ ok: false, error: "Geen toegang." }, { status: 403 });

    const { slug, email } = await req.json();
    if (!slug) return NextResponse.json({ ok: false, error: "slug ontbreekt." }, { status: 400 });

    const schoon = String(email || "").trim();
    if (schoon && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(schoon)) {
      return NextResponse.json({ ok: false, error: "Dat lijkt geen geldig e-mailadres." }, { status: 400 });
    }

    await setFactuurEmail(slug, schoon);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
