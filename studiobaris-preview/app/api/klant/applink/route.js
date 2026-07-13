import { NextResponse } from "next/server";
import { leesSessie } from "../../../../lib/auth";
import { getKlantOverzicht, nieuweLogin } from "../../../../lib/server-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Maakt een verse inloglink voor de app van een klant (14 dagen geldig).
// Zo hoef je daar niet meer voor naar /beheer.
export async function POST(req) {
  const sessie = leesSessie();
  if (!sessie) return NextResponse.json({ ok: false, error: "Niet ingelogd." }, { status: 401 });

  try {
    const { bedrijf } = await req.json();
    if (!bedrijf) return NextResponse.json({ ok: false, error: "bedrijf ontbreekt." }, { status: 400 });

    const klanten = await getKlantOverzicht();
    const naam = String(bedrijf).trim().toLowerCase();
    const klant = klanten.find((k) => String(k.naam || "").trim().toLowerCase() === naam);
    if (!klant) {
      return NextResponse.json(
        { ok: false, error: "Deze klant heeft nog geen app. De app wordt aangemaakt bij oplevering." },
        { status: 404 }
      );
    }

    const token = await nieuweLogin(klant.id, 14);
    if (!token) return NextResponse.json({ ok: false, error: "Inloglink maken mislukt." }, { status: 500 });

    return NextResponse.json({ ok: true, url: "https://app.studiobaris.nl/in/" + token, klant: klant.naam });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
