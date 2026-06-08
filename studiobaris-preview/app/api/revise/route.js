import { NextResponse } from "next/server";
import { SYSTEM_PROMPT_REVISE, extractJson, validateContent } from "../../../lib/intake-helpers";
import { callClaude } from "../../../lib/anthropic";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ipiqrsxbsgylxhgzlhsd.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function getHuidigeContent(slug) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/preview_public?slug=eq.${encodeURIComponent(slug)}&select=content`,
    { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` }, cache: "no-store" }
  );
  const rows = await res.json();
  return Array.isArray(rows) && rows[0] ? rows[0].content : null;
}

export async function POST(req) {
  try {
    if (!SERVICE_KEY || !process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ ok: false, error: "Server niet geconfigureerd." }, { status: 500 });
    }
    const body = await req.json();
    const slug = body.slug;
    const type = body.type === "feedback" ? "feedback" : "intake";
    const antwoorden = body.antwoorden || {};
    if (!slug) return NextResponse.json({ ok: false, error: "slug ontbreekt." }, { status: 400 });

    const huidig = await getHuidigeContent(slug);
    if (!huidig) return NextResponse.json({ ok: false, error: "Preview niet gevonden." }, { status: 404 });

    const docText =
      `(A) Huidige website-JSON:\n"""\n${JSON.stringify(huidig)}\n"""\n\n` +
      `(B) Antwoorden uit het ${type}-formulier:\n"""\n${JSON.stringify(antwoorden, null, 2)}\n"""`;

    const raw = await callClaude(SYSTEM_PROMPT_REVISE, docText);
    const content = extractJson(raw);
    const fout = validateContent(content);
    if (fout) return NextResponse.json({ ok: false, error: fout, raw }, { status: 422 });

    const review = content._review || {};
    delete content._review;
    if (content.seo) content.seo.noindex = true;

    const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/save_concept`, {
      method: "POST",
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ p_slug: slug, p_type: type, p_antwoorden: antwoorden, p_concept: content }),
    });
    if (!r.ok) return NextResponse.json({ ok: false, error: "Opslaan mislukt: " + (await r.text()) }, { status: 500 });

    const origin = new URL(req.url).origin;
    return NextResponse.json({ ok: true, slug, conceptUrl: `${origin}/${slug}?concept=1`, review });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
