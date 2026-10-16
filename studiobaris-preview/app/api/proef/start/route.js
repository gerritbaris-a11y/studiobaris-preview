import { NextResponse } from "next/server";
import { leesSessie } from "../../../../lib/auth";
import { startProef, getProefOverzicht } from "../../../../lib/proef";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Start de proefperiode van een preview (knop in Mijn previews).
// Mag door iedereen die is ingelogd: de verkoper drukt hem in als hij de
// preview of de brief verstuurt. Loopt de proef al, dan doet dit niets, zodat
// er nooit per ongeluk projecten van een prospect worden gewist.
export async function POST(req) {
  const sessie = leesSessie();
  if (!sessie) return NextResponse.json({ ok: false, error: "Niet ingelogd." }, { status: 401 });
  try {
    const { slug } = await req.json();
    if (!slug) return NextResponse.json({ ok: false, error: "slug ontbreekt." }, { status: 400 });
    // Server-side controle: geldt de proef voor deze preview, en loopt hij nog niet?
    const rij = (await getProefOverzicht()).find((r) => r.slug === String(slug));
    if (!rij) return NextResponse.json({ ok: false, error: "Proefperiode is voor deze preview nog niet beschikbaar." }, { status: 400 });
    if (rij.gestart_op) return NextResponse.json({ ok: false, error: "De proefperiode loopt al." }, { status: 409 });
    const r = await startProef(String(slug));
    if (!r || !r.ok) return NextResponse.json({ ok: false, error: (r && r.error) || "Starten mislukt." }, { status: 500 });
    return NextResponse.json({ ok: true, tot: r.tot });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
