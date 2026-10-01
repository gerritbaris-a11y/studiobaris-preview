import { NextResponse } from "next/server";
import { leesSessie, isBeheer } from "../../../../lib/auth";
import { getVoorstel, setVoorstelStatus } from "../../../../lib/taken-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Afwijzen met een korte reden. De dagelijkse zoekronde leest die redenen
// terug, zodat vergelijkbare kandidaten niet opnieuw worden voorgesteld.
export async function POST(req) {
  const sessie = leesSessie();
  if (!isBeheer(sessie)) return NextResponse.json({ ok: false, error: "Alleen voor beheer." }, { status: 403 });

  const body = await req.json().catch(() => null);
  const id = body && body.id;
  const reden = String((body && body.reden) || "").trim().slice(0, 300);
  if (!id) return NextResponse.json({ ok: false, error: "Geen voorstel opgegeven." }, { status: 400 });
  if (!reden) return NextResponse.json({ ok: false, error: "Geef een reden op." }, { status: 400 });

  try {
    const v = await getVoorstel(id);
    if (!v || !v.id) return NextResponse.json({ ok: false, error: "Voorstel niet gevonden." }, { status: 404 });
    // "bezig" dat al 10 minuten hangt, is vrijwel zeker afgebroken: mag opnieuw.
    const hangt = v.status === "bezig" && v.beoordeeld_op && Date.now() - new Date(v.beoordeeld_op).getTime() > 10 * 60 * 1000;
    if (!["voorgesteld", "mislukt"].includes(v.status) && !hangt) {
      return NextResponse.json({ ok: false, error: "Dit voorstel is al opgepakt." }, { status: 409 });
    }
    await setVoorstelStatus(id, "afgewezen", { door: sessie.naam || null, reden });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
