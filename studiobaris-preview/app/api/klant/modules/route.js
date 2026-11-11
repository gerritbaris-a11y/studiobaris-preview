import { NextResponse } from "next/server";
import { leesSessie, isBeheer } from "../../../../lib/auth";
import { getOverview, getAppAccounts, zoekAppAccount, zetModules, BEKENDE_MODULES } from "../../../../lib/server-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Modules van een klant aan- of uitzetten (Facturatie, later Offertes).
// Alleen beheer, en alleen voor app-accounts die in het Klantenregister
// staan. { id: companies.id, modules: ["facturatie"] }
export async function POST(req) {
  const sessie = leesSessie();
  if (!sessie) return NextResponse.json({ ok: false, error: "Niet ingelogd." }, { status: 401 });
  if (!isBeheer(sessie)) return NextResponse.json({ ok: false, error: "Alleen voor beheer." }, { status: 403 });

  try {
    const { id, modules } = await req.json();
    if (!id || !Array.isArray(modules)) return NextResponse.json({ ok: false, error: "id of modules ontbreekt." }, { status: 400 });
    if (modules.some((m) => !BEKENDE_MODULES.includes(m))) {
      return NextResponse.json({ ok: false, error: "Onbekende module." }, { status: 400 });
    }

    const [rijen, accounts] = await Promise.all([getOverview(), getAppAccounts()]);
    const klant = rijen.find(
      (r) => (r.klantnummer || r.klant_kandidaat) && zoekAppAccount(r, accounts)?.id === id
    );
    if (!klant) {
      return NextResponse.json({ ok: false, error: "Alleen voor klanten in het Klantenregister." }, { status: 403 });
    }

    const rij = await zetModules(id, modules, sessie.naam || null);
    if (!rij) return NextResponse.json({ ok: false, error: "Opslaan mislukt." }, { status: 500 });
    return NextResponse.json({ ok: true, modules: rij.modules, op: rij.updated_at, door: rij.updated_by });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
