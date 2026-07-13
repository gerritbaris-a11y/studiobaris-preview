import { NextResponse } from "next/server";
import { leesSessie } from "../../../../lib/auth";
import { setStijl, log } from "../../../../lib/server-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STIJLEN = ["stoer", "modern", "persoonlijk"];

// Kiest de stijl waarmee we verder gaan. Er wordt niets opnieuw gegenereerd:
// het is dezelfde inhoud in een andere jas.
export async function POST(req) {
  const sessie = leesSessie();
  if (!sessie) return NextResponse.json({ ok: false, error: "Niet ingelogd." }, { status: 401 });
  try {
    const { slug, stijl, bedrijf } = await req.json();
    if (!slug || !STIJLEN.includes(stijl)) {
      return NextResponse.json({ ok: false, error: "Onbekende stijl." }, { status: 400 });
    }
    await setStijl(slug, stijl);
    await log({
      persoon: sessie.naam,
      soort: "stijl",
      slug,
      bedrijf: bedrijf || null,
      naar: stijl,
    });
    return NextResponse.json({ ok: true, stijl });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
