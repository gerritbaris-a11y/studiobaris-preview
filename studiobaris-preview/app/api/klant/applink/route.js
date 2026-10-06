import { NextResponse } from "next/server";
import { leesSessie, isBeheer } from "../../../../lib/auth";
import {
  nieuweLogin, KLANT_APP_BASE, getOverview, getAppAccounts, zoekAppAccount,
} from "../../../../lib/server-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DAGEN = 14;

// Maakt een verse inloglink voor de app van een klant (14 dagen geldig).
// De vorige link vervalt daarmee. Alleen vanuit het Klantenregister (beheer)
// en alleen voor wie daarin staat; { id } = het app-account (companies.id).
export async function POST(req) {
  const sessie = leesSessie();
  if (!sessie) return NextResponse.json({ ok: false, error: "Niet ingelogd." }, { status: 401 });

  try {
    const { id } = await req.json();

    if (!isBeheer(sessie)) return NextResponse.json({ ok: false, error: "Alleen voor beheer." }, { status: 403 });
    if (!id) return NextResponse.json({ ok: false, error: "id ontbreekt." }, { status: 400 });

    // Alleen voor wie in het Klantenregister staat: klanten (klantnummer),
    // toekomstige klanten (klant_kandidaat) en oud-klanten. Losse
    // previews/leads krijgen geen app-link — die hebben de demo-app.
    const [rijen, accounts] = await Promise.all([getOverview(), getAppAccounts()]);
    const klant = rijen.find(
      (r) => (r.klantnummer || r.klant_kandidaat) && zoekAppAccount(r, accounts)?.id === id
    );
    if (!klant) {
      return NextResponse.json(
        { ok: false, error: "Alleen voor klanten in het Klantenregister." },
        { status: 403 }
      );
    }
    const klantId = id;
    const klantNaam = klant.company_name || null;

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
