import { NextResponse } from "next/server";
import { leesSessie, isBeheer } from "../../../../lib/auth";
import { getKlantOverzicht, nieuweLogin, KLANT_APP_BASE } from "../../../../lib/server-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DAGEN = 14;

// Maakt een verse inloglink voor de app van een klant (14 dagen geldig).
// De vorige link vervalt daarmee. Twee manieren om de klant aan te wijzen:
// - { id }: het app-account direct (Klantenregister, alleen beheer);
// - { bedrijf }: op naam (oude knop op de Klanten-pagina).
export async function POST(req) {
  const sessie = leesSessie();
  if (!sessie) return NextResponse.json({ ok: false, error: "Niet ingelogd." }, { status: 401 });

  try {
    const { bedrijf, id } = await req.json();
    let klantId = null;
    let klantNaam = null;

    if (id) {
      if (!isBeheer(sessie)) return NextResponse.json({ ok: false, error: "Alleen voor beheer." }, { status: 403 });
      klantId = id;
    } else {
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
      klantId = klant.id;
      klantNaam = klant.naam;
    }

    const token = await nieuweLogin(klantId, DAGEN);
    if (!token || typeof token !== "string") {
      return NextResponse.json({ ok: false, error: "Inloglink maken mislukt." }, { status: 500 });
    }

    const verloopt = new Date(Date.now() + DAGEN * 24 * 3600 * 1000).toISOString();
    return NextResponse.json({ ok: true, url: KLANT_APP_BASE + "/in/" + token, verloopt, klant: klantNaam });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
