import { NextResponse } from "next/server";
import { leesSessie, isBeheer } from "../../../../lib/auth";
import { naarOpvolging } from "../../../../lib/app-proef";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// "Naar opvolging": een (verlopen) app-proef bewust in Toekomstig zetten,
// eventueel met een verkoper. Alleen beheer.
export async function POST(req) {
  const sessie = leesSessie();
  if (!isBeheer(sessie)) return NextResponse.json({ ok: false, error: "Alleen voor beheer." }, { status: 403 });

  const { id, verkoper } = await req.json().catch(() => ({}));
  if (!/^[0-9a-f-]{36}$/i.test(String(id || ""))) return NextResponse.json({ ok: false, error: "id ontbreekt." }, { status: 400 });

  const r = await naarOpvolging(id, verkoper ? String(verkoper).slice(0, 60) : null);
  if (!r || r.ok !== true) return NextResponse.json({ ok: false, error: "Lukte niet." }, { status: 500 });
  return NextResponse.json({ ok: true, slug: r.slug });
}
