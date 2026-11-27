import { NextResponse } from "next/server";
import { leesSessie, isBeheer } from "../../../../lib/auth";
import { zetSchakelaar, controleFaseB } from "../../../../lib/app-proef";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Proefpagina openzetten of dichtzetten. Alleen beheer (Levi/Gerrit).
// Aanzetten kan alleen als de app meldt dat het slot en de koppelknop er zijn
// (fase B), tenzij er bewust "forceer" wordt meegestuurd.
export async function POST(req) {
  const sessie = leesSessie();
  if (!isBeheer(sessie)) return NextResponse.json({ ok: false, error: "Alleen voor beheer." }, { status: 403 });

  const { open, forceer } = await req.json().catch(() => ({}));
  if (open === true && forceer !== true) {
    const b = await controleFaseB();
    if (!b.slot || !b.koppelknop) {
      return NextResponse.json({
        ok: false,
        error: "Nog niet klaar voor de lancering: " +
          [!b.slot && "het slot in de app", !b.koppelknop && "de koppelknop in de plugin"].filter(Boolean).join(" en ") +
          " ontbreekt nog.",
      }, { status: 409 });
    }
  }
  const r = await zetSchakelaar(open === true, sessie.naam || null);
  if (!r) return NextResponse.json({ ok: false, error: "Opslaan mislukt." }, { status: 500 });
  return NextResponse.json({ ok: true, ...r });
}
