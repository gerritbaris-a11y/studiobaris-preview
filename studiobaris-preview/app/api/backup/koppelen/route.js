import { NextResponse } from "next/server";
import crypto from "crypto";
import { SCOPE, terugUrl } from "../../../../lib/drive-koppelen";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req) {
  const clientId = process.env.GOOGLE_DRIVE_OAUTH_CLIENT_ID;
  if (!clientId) return NextResponse.json({ ok: false, error: "GOOGLE_DRIVE_OAUTH_CLIENT_ID ontbreekt." }, { status: 500 });
  const state = crypto.randomBytes(16).toString("hex");
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: terugUrl(req),
    response_type: "code",
    scope: SCOPE,
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    login_hint: "peacestarmedia@gmail.com",
    state,
  });
  const res = NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
  res.cookies.set("sb_drive_state", state, { httpOnly: true, secure: true, sameSite: "lax", path: "/api/backup/koppelen", maxAge: 600 });
  return res;
}
