import { NextResponse } from "next/server";
import { updateKlant, log, isGeldigeVerzamelaar, getOverview } from "../../../../lib/server-data";
import { leesSessie, isBeheer } from "../../../../lib/auth";
import { getRegio, magPreview, ALLEEN_BEHEER_FASES } from "../../../../lib/regio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Dashboard-bewerkingen: naam (verzamelaar), pipeline-status en/of maandbedrag.
// Verkopers (23 okt 2026): alleen de fase, alleen bij previews die ze mogen
// zien (eigen + eigen regio, lib/regio.js), en niet "Klaar" — de afwikkeling
// doen Gerrit en Levi. Akkoord en archiveren ("Geen interesse") mag wel.
export async function POST(req) {
  try {
    const sessie = leesSessie();
    if (!sessie) return NextResponse.json({ ok: false, error: "Niet ingelogd." }, { status: 401 });
    const body = await req.json();
    const slug = body.slug;
    if (!slug) return NextResponse.json({ ok: false, error: "slug ontbreekt." }, { status: 400 });

    if (!isBeheer(sessie)) {
      if (body.verzamelaar !== undefined || body.maandbedrag !== undefined) {
        return NextResponse.json({ ok: false, error: "Alleen Gerrit of Levi kan dit wijzigen." }, { status: 403 });
      }
      if (body.pipeline_status !== undefined && ALLEEN_BEHEER_FASES.includes(String(body.pipeline_status))) {
        return NextResponse.json({ ok: false, error: "Op Klaar zetten doen Gerrit of Levi." }, { status: 403 });
      }
      const [alles, regio] = await Promise.all([getOverview(), getRegio(sessie.naam)]);
      const rij = alles.find((r) => r.slug === String(slug));
      if (!rij || !magPreview(rij, sessie.naam, false, regio)) {
        return NextResponse.json({ ok: false, error: "Geen toegang tot deze preview." }, { status: 403 });
      }
      // Een preview die al op Klaar staat is afgewikkeld: niet meer terugzetten.
      if (ALLEEN_BEHEER_FASES.includes(String(rij.pipeline_status || ""))) {
        return NextResponse.json({ ok: false, error: "Deze klant is afgerond; alleen Gerrit of Levi kan dit nog wijzigen." }, { status: 403 });
      }
    }

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
      await log({
        persoon: sessie.naam,
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
