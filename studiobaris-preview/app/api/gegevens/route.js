import { NextResponse } from "next/server";
import { setBedrijfsgegevens, getBetaalinfo, log } from "../../../lib/server-data";

export const dynamic = "force-dynamic";

// Statussen waarin iemand akkoord heeft gegeven op de preview.
// "akkoord" = voorwaarden geaccepteerd, betaling gestart.
// "actief"  = betaling rond, abonnement loopt.
const NA_AKKOORD = ["akkoord", "actief"];

/**
 * Stap 2 van de intake: adres, KvK, BTW en de logo-toestemming.
 * Deze gegevens vragen we pas nadat iemand akkoord heeft gegeven op de
 * preview - vóór dat moment hoort niemand zijn KvK-nummer in te tikken.
 * De statuscontrole hieronder handhaaft dat ook echt: zonder akkoord
 * weigert dit eindpunt, ook als iemand de link raadt.
 */
export async function POST(req) {
  try {
    const body = await req.json();
    const slug = String(body.slug || "").trim();
    if (!slug) {
      return NextResponse.json({ ok: false, error: "Onbekende website." }, { status: 400 });
    }

    const info = await getBetaalinfo(slug);
    if (!info) {
      return NextResponse.json({ ok: false, error: "Onbekende website." }, { status: 404 });
    }

    if (!NA_AKKOORD.includes(String(info.betaal_status || ""))) {
      return NextResponse.json(
        { ok: false, error: "Deze gegevens kun je pas invullen nadat je akkoord hebt gegeven op de preview." },
        { status: 403 }
      );
    }

    const tekst = (k) => (typeof body[k] === "string" ? body[k].trim() : "");

    const res = await setBedrijfsgegevens(slug, {
      adres: tekst("adres") || null,
      kvk: tekst("kvk") || null,
      btw: tekst("btw") || null,
      logoToestemming: typeof body.logo_toestemming === "boolean" ? body.logo_toestemming : null,
    });

    if (!res) {
      return NextResponse.json({ ok: false, error: "Opslaan mislukt. Probeer het zo nog eens." }, { status: 500 });
    }

    try {
      await log({ persoon: "klant", soort: "gegevens-aangevuld", slug, bedrijf: info.company_name || "" });
    } catch {
      // Loggen mag het opslaan nooit laten mislukken.
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err && err.message ? err.message : String(err) },
      { status: 500 }
    );
  }
}
