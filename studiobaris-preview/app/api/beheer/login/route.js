import { NextResponse } from "next/server";
import { nieuweLogin } from "../../../../lib/server-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KLANT_APP_BASE = process.env.NEXT_PUBLIC_KLANT_APP_URL || "https://app.studiobaris.nl";

// Genereer een nieuwe, verlopende persoonlijke inlog-link voor een klant.
export async function POST(req) {
  try {
    const { id, dagen } = await req.json();
    if (!id) return NextResponse.json({ ok: false, error: "id ontbreekt." }, { status: 400 });
    const token = await nieuweLogin(id, dagen ? Number(dagen) : 14);
    if (!token) return NextResponse.json({ ok: false, error: "Kon geen link genereren." }, { status: 502 });
    return NextResponse.json({ ok: true, token, link: KLANT_APP_BASE + "/in/" + token });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
