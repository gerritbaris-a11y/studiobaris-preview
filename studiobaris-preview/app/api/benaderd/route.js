import { NextResponse } from "next/server";
import { leesSessie, isBeheer } from "../../../lib/auth";
import { getOverview } from "../../../lib/server-data";
import { zetBenaderd, magZien } from "../../../lib/benaderd";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Vinkje "Benaderd" aan of uit zetten (Mijn previews en de pagina Benaderd).
// Een verkoper mag dit alleen bij zijn eigen previews; beheer bij alle.
export async function POST(req) {
  const sessie = leesSessie();
  if (!sessie) return NextResponse.json({ ok: false, error: "Niet ingelogd." }, { status: 401 });
  try {
    const { slug, aan } = await req.json();
    if (!slug) return NextResponse.json({ ok: false, error: "slug ontbreekt." }, { status: 400 });
    const beheer = isBeheer(sessie);
    if (!beheer) {
      const rij = (await getOverview()).find((r) => r.slug === String(slug));
      let bron = null;
      try { bron = rij && rij.internal_notes ? JSON.parse(rij.internal_notes).bron : null; } catch {}
      if (!rij || !magZien({ verzamelaar: rij.verzamelaar, bron }, sessie.naam, false)) {
        return NextResponse.json({ ok: false, error: "Geen toegang tot deze preview." }, { status: 403 });
      }
    }
    const r = await zetBenaderd(String(slug), !!aan, sessie.naam);
    if (!r || !r.ok) return NextResponse.json({ ok: false, error: (r && r.error) || "Opslaan mislukt." }, { status: 500 });
    return NextResponse.json(r);
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
