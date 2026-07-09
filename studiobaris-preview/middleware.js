import { NextResponse } from "next/server";

// Schermt alleen de interne werkplek af. Publieke klantpagina's
// (/[slug], /intake/[slug], /feedback/[slug], /akkoord/[slug]) en alle
// API-routes (incl. Mollie-webhook) staan NIET in de matcher en blijven werken.

const COOKIE = "sb_sessie";

function b64url(bytes) {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function fromB64url(s) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const bin = atob(s);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

async function verify(token) {
  if (!token || !token.includes(".")) return null;
  const secret =
    process.env.SESSION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "studiobaris-dev-secret";
  const [body, sig] = token.split(".");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  if (b64url(new Uint8Array(mac)) !== sig) return null;
  try {
    const p = JSON.parse(fromB64url(body));
    if (!p.exp || p.exp < Date.now()) return null;
    return p;
  } catch {
    return null;
  }
}

// Alleen voor beheerders (Gerrit/Levi). Verkopers → doorgestuurd naar /leads.
const BEHEER_ONLY = ["/dashboard", "/beheer", "/nieuw-akkoord", "/intake", "/team"];

export async function middleware(req) {
  const path = req.nextUrl.pathname;
  const sessie = await verify(req.cookies.get(COOKIE)?.value);

  if (!sessie) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "?next=" + encodeURIComponent(path);
    return NextResponse.redirect(url);
  }

  const beheerOnly = BEHEER_ONLY.some((p) => path === p || path.startsWith(p + "/"));
  if (beheerOnly && sessie.rol !== "beheer") {
    const url = req.nextUrl.clone();
    url.pathname = "/leads";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/leads/:path*",
    "/beheer/:path*",
    "/nieuw-akkoord/:path*",
    "/team/:path*",
    "/intake",
  ],
};
