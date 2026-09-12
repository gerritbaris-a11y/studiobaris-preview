import { NextResponse } from "next/server";
import { updateKlant, log, isGeldigeVerzamelaar } from "../../../../lib/server-data";
import { leesSessie } from "../../../../lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Dashboard-bewerkingen: naam (verzamelaar), pipeline-status en/of maandbedrag.
export async function POST(req) {
  try {
    const body = await req.json();
    const slug = body.slug;
    if (!slug) return NextResponse.json({ ok: false, error: "slug ontbreekt." }, { status: 400 });

    // Let op: de RPC doet coalesce(p_verzamelaar, verzamelaar) — alleen een
    // echte SQL null betekent daar "niet wijzigen". Een lege string is dus
    // bewust géén null: dat is hoe je de koppeling juist wél loslaat.
    const verzamelaar = body.verzamelaar !== undefined ? String(body.verzamelaar) : null;
    if (!(await isGeldigeVerzamelaar(verzamelaar))) {
      return NextResponse.json({ ok: false, error: "Onbekend teamlid." }, { status: 400 });
    }
    const status = body.pipeline_status !== undefined ? String(body.pipeline_status) : null;
    let maandbedrag = null;
    if (body.maandbedrag !== undefined && body.maandbedrag !== "") {
      const n = Number(String(body.maandbedrag).replace(",", "."));
      if (!Number.isNaN(n)) maandbedrag = n;
    }

    const res = await updateKlant(slug, { verzamelaar, status, maandbedrag });
    if (!res) return NextResponse.json({ ok: false, error: "Opslaan mislukt (server-key?)." }, { status: 500 });

    if (status) {
      const sessie = leesSessie();
      await log({
        persoon: sessie ? sessie.naam : null,
        soort: "klant_fase",
        slug,
        bedrijf: body.bedrijf ? String(body.bedrijf) : null,
        van: body.van ? String(body.van) : null,
        naar: status,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
