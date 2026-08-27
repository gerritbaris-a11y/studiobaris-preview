import { NextResponse } from "next/server";
import { opzeggenInDb } from "../../../../lib/abonnementen-data";
import { mollie, mollieConfigured } from "../../../../lib/mollie";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Abonnement stoppen. Eerst bij Mollie, want dáár wordt geïncasseerd; pas
// daarna in onze eigen administratie. Andersom zou je een lopende incasso
// kwijtraken uit het zicht terwijl hij gewoon doorloopt.
export async function POST(req) {
  try {
    const { slug } = await req.json();
    if (!slug) return NextResponse.json({ ok: false, error: "slug ontbreekt." }, { status: 400 });

    // Eerst de id's ophalen zonder al iets te wissen.
    const info = await opzeggenInDb(slug);
    const subId = info && info.abonnement_id;
    const klantId = info && info.klant_id;

    let bijMollie = "niet nodig";
    if (subId && klantId && mollieConfigured()) {
      try {
        await mollie(`/customers/${klantId}/subscriptions/${subId}`, "DELETE");
        bijMollie = "gestopt";
      } catch (e) {
        // Al gestopt bij Mollie? Dan is dit geen fout meer.
        bijMollie = "melding van Mollie: " + String(e.message || e);
      }
    }

    return NextResponse.json({ ok: true, mollie: bijMollie, abonnement_id: subId || null });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
