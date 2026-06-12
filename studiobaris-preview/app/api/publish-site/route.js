import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ipiqrsxbsgylxhgzlhsd.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(req) {
  try {
    if (!SERVICE_KEY) {
      return NextResponse.json({ ok: false, error: "Server niet geconfigureerd." }, { status: 500 });
    }
    const { slug, value } = await req.json();
    if (!slug) return NextResponse.json({ ok: false, error: "slug ontbreekt." }, { status: 400 });
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/set_published`, {
      method: "POST",
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ p_slug: slug, p_value: !!value }),
    });
    if (!res.ok) return NextResponse.json({ ok: false, error: await res.text() }, { status: 500 });
    return NextResponse.json({ ok: true, result: await res.json() });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
