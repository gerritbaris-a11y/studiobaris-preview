import { NextResponse } from "next/server";
import { leesSessie, isBeheer } from "../../../../lib/auth";
import { roepKlantSite, log } from "../../../../lib/server-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Beheer duwt een actie naar de WordPress-site van een klant.
// actie = "ververs" (projecten opnieuw ophalen + cache legen)
//       = "bijwerken" (plugin zichzelf laten updaten naar de nieuwste versie)
export async function POST(req) {
  const sessie = leesSessie();
  if (!isBeheer(sessie)) {
    return NextResponse.json({ ok: false, error: "Alleen voor beheer." }, { status: 403 });
  }

  const { id, actie } = await req.json();
  if (!id) return NextResponse.json({ ok: false, error: "id ontbreekt." }, { status: 400 });
  const pad = actie === "bijwerken" ? "bijwerken" : "ververs";

  const uit = await roepKlantSite(id, pad);

  try {
    await log({
      persoon: sessie.naam,
      soort: pad === "bijwerken" ? "plugin bijgewerkt" : "site ververst",
      details: uit.ok ? JSON.stringify(uit.data).slice(0, 400) : `MISLUKT: ${uit.error}`,
    });
  } catch {}

  return NextResponse.json(uit, { status: uit.ok ? 200 : 502 });
}
