import { NextResponse } from "next/server";
import { bijlageOphalen, maakDownloadUrl } from "../../../../lib/taken-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ ok: false, error: "Geen bijlage opgegeven." }, { status: 400 });
    const bijlage = await bijlageOphalen(id);
    if (!bijlage || !bijlage.pad) return NextResponse.json({ ok: false, error: "Bijlage niet gevonden." }, { status: 404 });
    const { url } = await maakDownloadUrl(bijlage.pad);
    return NextResponse.redirect(url);
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
