import { NextResponse } from "next/server";
import { updateBedrijf } from "../../../../lib/server-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Werkt bedrijf-/contactvelden bij (slogan, telefoon, whatsapp, email, adres, kvk, btw).
const TOEGESTAAN = ["slogan", "telefoon", "whatsapp", "email", "adres", "kvk", "btw"];

export async function POST(req) {
  try {
    const body = await req.json();
    const slug = body.slug;
    if (!slug) return NextResponse.json({ ok: false, error: "slug ontbreekt." }, { status: 400 });

    const velden = {};
    for (const k of TOEGESTAAN) {
      if (body[k] !== undefined) velden[k] = String(body[k]).trim();
    }
    if (Object.keys(velden).length === 0) {
      return NextResponse.json({ ok: false, error: "Geen velden om bij te werken." }, { status: 400 });
    }

    const res = await updateBedrijf(slug, velden);
    if (!res) return NextResponse.json({ ok: false, error: "Opslaan mislukt (server-key?)." }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
