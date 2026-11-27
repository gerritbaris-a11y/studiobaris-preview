import { NextResponse } from "next/server";
import { getBetaalinfo, setBetaling } from "../../../../lib/server-data";
import { mollie, mollieConfigured, inclBtw } from "../../../../lib/mollie";
import {
  leesAfrekenToken, afrekenToken, afrekenenVoorbereiden, getAccount, webhookUrl, paginaBasis,
  geldigEmail, APP_PRO_MAAND_EXCL,
} from "../../../../lib/app-proef";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// "Doorgaan met Pro": maakt (pas nu) de klant aan in het Klantenregister —
// onzichtbaar tot de betaling binnen is — en start de eerste Mollie-betaling
// (iDEAL, € 14,95 + btw) die meteen de machtiging voor de maandincasso geeft.
// Het abonnement en het klantnummer regelt de webhook.
export async function POST(req) {
  try {
    if (!mollieConfigured()) return NextResponse.json({ ok: false, error: "Betalen is nog niet ingesteld." }, { status: 500 });

    const b = await req.json().catch(() => ({}));
    const companyId = leesAfrekenToken(b.k);
    if (!companyId) return NextResponse.json({ ok: false, error: "Deze link klopt niet (meer)." }, { status: 403 });
    if (b.akkoord !== true) return NextResponse.json({ ok: false, error: "Ga eerst akkoord met de voorwaarden." }, { status: 400 });

    const factuurEmail = String(b.factuur_email || "").trim().toLowerCase();
    if (!geldigEmail(factuurEmail)) return NextResponse.json({ ok: false, error: "Vul een geldig e-mailadres voor de factuur in." }, { status: 400 });

    const account = await getAccount(companyId);
    if (!account) return NextResponse.json({ ok: false, error: "Account niet gevonden." }, { status: 404 });

    const voor = await afrekenenVoorbereiden({
      companyId, factuurEmail,
      contact: String(b.contact || "").trim().slice(0, 120),
      kvk: String(b.kvk || "").replace(/\s/g, "").slice(0, 12),
      btw: String(b.btw || "").replace(/\s/g, "").toUpperCase().slice(0, 20),
    });
    if (!voor || voor.ok !== true) {
      const al = voor && voor.fout === "al_actief";
      return NextResponse.json({ ok: false, error: al ? "Je hebt Pro al. Je hoeft niets te doen." : "Afrekenen lukte niet. Probeer het later opnieuw." }, { status: al ? 409 : 500 });
    }
    const slug = voor.slug;

    const info = await getBetaalinfo(slug);
    let klantId = info && info.betaal_klant_id;
    if (!klantId) {
      const customer = await mollie("/customers", "POST", {
        name: account.name, email: factuurEmail, metadata: { slug, company_id: companyId },
      });
      klantId = customer.id;
      await setBetaling(slug, { provider: "mollie", klant_id: klantId });
    }

    const payment = await mollie("/payments", "POST", {
      amount: { currency: "EUR", value: inclBtw(APP_PRO_MAAND_EXCL).toFixed(2) },
      customerId: klantId,
      sequenceType: "first",
      method: "ideal",
      description: `StudioBaris-app Pro, eerste maand (${account.name})`,
      redirectUrl: `${paginaBasis(req)}/app/pro/klaar?k=${encodeURIComponent(afrekenToken(companyId))}`,
      webhookUrl: webhookUrl(req),
      metadata: { slug, soort: "app_pro", company_id: companyId },
    });

    await setBetaling(slug, { status: "akkoord", provider: "mollie", klant_id: klantId, voorwaarden: true });

    const checkout = payment && payment._links && payment._links.checkout && payment._links.checkout.href;
    if (!checkout) return NextResponse.json({ ok: false, error: "Geen betaalpagina ontvangen van Mollie." }, { status: 502 });
    return NextResponse.json({ ok: true, checkoutUrl: checkout });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Afrekenen lukte niet. Probeer het later opnieuw." }, { status: 500 });
  }
}
