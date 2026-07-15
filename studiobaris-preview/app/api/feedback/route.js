import { NextResponse } from "next/server";
import { leesSessie } from "../../../lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ipiqrsxbsgylxhgzlhsd.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// POST /api/feedback  -> interne teamfeedback opslaan. Alleen voor ingelogde
// teamleden; het bericht wordt gekoppeld aan wie is ingelogd.
export async function POST(req) {
  const sessie = leesSessie();
  if (!sessie) {
    return NextResponse.json({ ok: false, error: "Niet ingelogd" }, { status: 401 });
  }

  let body = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Ongeldig verzoek" }, { status: 400 });
  }

  const bericht = String(body.bericht || "").trim();
  if (!bericht) {
    return NextResponse.json({ ok: false, error: "Leeg bericht" }, { status: 400 });
  }

  const rij = {
    van: sessie.naam || null,
    rol: sessie.rol || null,
    type: String(body.type || "idee").slice(0, 40),
    bericht: bericht.slice(0, 4000),
    pad: String(body.pad || "").slice(0, 300),
  };

  const res = await fetch(`${SUPABASE_URL}/rest/v1/team_feedback`, {
    method: "POST",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(rij),
  });

  if (!res.ok) {
    return NextResponse.json({ ok: false, error: "Opslaan mislukt" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
