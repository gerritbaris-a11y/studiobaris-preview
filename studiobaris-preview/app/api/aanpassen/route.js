import { NextResponse } from "next/server";
import { leesSessie } from "../../../lib/auth";
import { log } from "../../../lib/server-data";
import {
  laadVoorAanpassen, bewaarWerk, publiceer, versies, zetTerug, magAanpassen, schoonInhoud,
} from "../../../lib/aanpassen";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Eén route voor het Aanpassen-scherm. Acties:
//  - werk:      werkversie bewaren (alleen zichtbaar op /<slug>?werk=1)
//  - publiceer: live zetten; de huidige versie gaat naar het archief
//  - versies:   versiegeschiedenis ophalen
//  - terug:     een oude versie terugzetten
export async function POST(req) {
  const sessie = leesSessie();
  if (!sessie) return NextResponse.json({ ok: false, error: "Niet ingelogd." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const actie = body && body.actie;
  const slug = body && typeof body.slug === "string" ? body.slug : "";
  if (!slug) return NextResponse.json({ ok: false, error: "Geen preview opgegeven." }, { status: 400 });

  try {
    const rij = await laadVoorAanpassen(slug);
    if (!rij) return NextResponse.json({ ok: false, error: "Preview niet gevonden." }, { status: 404 });
    if (!magAanpassen(sessie, rij)) {
      return NextResponse.json({ ok: false, error: "Alleen beheer of de maker van deze preview kan hem aanpassen." }, { status: 403 });
    }

    if (actie === "versies") {
      return NextResponse.json({ ok: true, versies: (await versies(slug)) || [] });
    }

    if (actie === "werk") {
      const content = schoonInhoud(body.content, rij.content);
      await bewaarWerk(slug, content, sessie.naam);
      return NextResponse.json({ ok: true, content });
    }

    if (actie === "publiceer") {
      const content = schoonInhoud(body.content, rij.content);
      const notitie = typeof body.notitie === "string" ? body.notitie.slice(0, 200) : "";
      const r = await publiceer(slug, content, notitie || "aangepast via Aanpassen", sessie.naam);
      await log({ persoon: sessie.naam, soort: "preview_aangepast", slug, bedrijf: rij.naam, details: { versie: r && r.versie, notitie } });
      return NextResponse.json({ ok: true, versie: r && r.versie, content });
    }

    if (actie === "terug") {
      const id = typeof body.versie_id === "string" ? body.versie_id : "";
      if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ ok: false, error: "Onbekende versie." }, { status: 400 });
      const r = await zetTerug(slug, id, sessie.naam);
      await log({ persoon: sessie.naam, soort: "preview_teruggezet", slug, bedrijf: rij.naam, details: { versie: r && r.versie } });
      const nu = await laadVoorAanpassen(slug);
      return NextResponse.json({ ok: true, versie: r && r.versie, content: nu && nu.content });
    }

    return NextResponse.json({ ok: false, error: "Onbekende actie." }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String((e && e.message) || e).slice(0, 300) }, { status: 500 });
  }
}
