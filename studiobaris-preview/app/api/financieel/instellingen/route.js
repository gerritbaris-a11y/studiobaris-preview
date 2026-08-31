import { NextResponse } from "next/server";
import { setFinancieleInstellingen } from "../../../../lib/abonnementen-data";
import { leesSessie } from "../../../../lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Tarieven bijwerken (Financieel > Marges). Alleen getallen ≥ 0, alle velden
// optioneel — een leeg veld laat de bestaande waarde ongemoeid (zie
// sb_financiele_instellingen_bijwerken: coalesce per kolom).
function getal(v) {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const sessie = leesSessie();

    const velden = {
      websiteEenmalig: getal(body.websiteEenmalig),
      maandbedragVol: getal(body.maandbedragVol),
      maandbedragPlugin: getal(body.maandbedragPlugin),
      kostprijsHosting: getal(body.kostprijsHosting),
      kostprijsDomein: getal(body.kostprijsDomein),
      kostprijsPluginVast: getal(body.kostprijsPluginVast),
    };

    for (const [naam, waarde] of Object.entries(velden)) {
      if (waarde !== null && waarde < 0) {
        return NextResponse.json({ ok: false, error: `${naam} kan niet negatief zijn.` }, { status: 400 });
      }
    }

    const instellingen = await setFinancieleInstellingen(velden, sessie?.naam || null);
    return NextResponse.json({ ok: true, instellingen });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
