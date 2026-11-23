import { NextResponse } from "next/server";
import { leesSessie } from "../../../../lib/auth";
import { zetDemoModules } from "../../../../lib/demo-app";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Modules in de demo-app van een salonpreview aan/uit (om een prospect te
// laten zien wat er kan). Raakt nooit een echte klant: alleen demo-bedrijven.
// { slug: previewslug, modules: ["cadeaubonnen", "wachtlijst", "whatsapp_s"] }
export async function POST(req) {
  const sessie = leesSessie();
  if (!sessie) return NextResponse.json({ ok: false, error: "Niet ingelogd." }, { status: 401 });
  try {
    const { slug, modules } = await req.json();
    if (!slug || !Array.isArray(modules)) return NextResponse.json({ ok: false, error: "slug of modules ontbreekt." }, { status: 400 });
    const nieuw = await zetDemoModules(String(slug), modules, sessie.naam || null);
    return NextResponse.json({ ok: true, modules: nieuw });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 400 });
  }
}
