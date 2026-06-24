import { NextResponse } from "next/server";
import { updateKlant } from "../../../../lib/server-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Dashboard-bewerkingen: naam (verzamelaar), pipeline-status en/of maandbedrag.
export async function POST(req) {
  try {
    const body = await req.json();
    const slug = body.slug;
    if (!slug) return NextResponse.json({ ok: false, error: "slug ontbreekt." }, { status: 400 });

    const verzamelaar = body.verzamelaar !== undefined ? String(body.verzamelaar) : null;
    const status = body.pipeline_status !== undefined ? String(body.pipeline_status) : null;
    let maandbedrag = null;
    if (body.maandbedrag !== undefined && body.maandbedrag !== "") {
      const n = Number(String(body.maandbedrag).replace(",", "."));
      if (!Number.isNaN(n)) maandbedrag = n;
    }

    const res = await updateKlant(slug, { verzamelaar, status, maandbedrag });
    if (!res) return NextResponse.json({ ok: false, error: "Opslaan mislukt (server-key?)." }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
