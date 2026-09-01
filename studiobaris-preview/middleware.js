import { NextResponse } from "next/server";

// Schermt alleen de interne werkplek af. Publieke klantpagina's
// (/[slug], /intake/[slug], /feedback/[slug], /akkoord/[slug]) en de
// klantgerichte API-routes (intake, akkoord, mollie/start + webhook) staan NIET
// in de matcher en blijven werken. De interne API-routes hieronder checkten zelf
// geen sessie; die schermen we hier af (fail-closed).
//
// LET OP: een nieuwe interne pagina moet hier op TWEE plekken bij, anders is hij
// zonder inloggen bereikbaar: in de matcher onderaan, en (als alleen Gerrit en
// Levi erbij mogen) in BEHEER_ONLY.

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
const BEHEER_ONLY = ["/dashboard", "/beheer", "/nieuw-akkoord", "/team", "/leads/import", "/overzicht", "/bord", "/vragen", "/kosten", "/storingen", "/restbetalingen", "/abonnementen", "/facturen", "/offertes", "/btw-aangifte", "/marges"];

// Interne API-routes die een geldige sessie vereisen. Deze checkten zelf niets
// en waren daardoor publiek aanroepbaar. Destructieve/gevoelige acties eisen de
// beheer-rol; de rest een geldige sessie (zodat verkopers blijven werken).
const API_BEHEER = ["/api/klant/delete", "/api/beheer/login", "/api/beheer/instellen", "/api/abonnement/instellen", "/api/abonnement/opzeggen", "/api/facturen/opnieuw", "/api/facturen/pdf", "/api/facturen/nieuw", "/api/facturen/loggen", "/api/facturen/bestand", "/api/facturen/status", "/api/offertes/status", "/api/offertes/loggen", "/api/offertes/bestand", "/api/financieel/instellingen", "/api/taken/aanmaken", "/api/taken/bijwerken", "/api/taken/verplaatsen", "/api/taken/verwijderen"];
const API_INGELOGD = ["/api/klant/update", "/api/klant/gegevens", "/api/klant/verkoopbedrag", "/api/publish", "/api/publish-site"];

function raakt(path, lijst) {
  return lijst.some((p) => path === p || path.startsWith(p + "/"));
}

export async function middleware(req) {
  const path = req.nextUrl.pathname;
  const sessie = await verify(req.cookies.get(COOKIE)?.value);

  // Interne API-routes: geen redirect maar een nette 401/403 in JSON.
  const apiBeheer = raakt(path, API_BEHEER);
  const apiIngelogd = raakt(path, API_INGELOGD);
  if (apiBeheer || apiIngelogd) {
    if (!sessie) {
      return NextResponse.json({ ok: false, error: "Niet ingelogd." }, { status: 401 });
    }
    if (apiBeheer && sessie.rol !== "beheer") {
      return NextResponse.json({ ok: false, error: "Geen toegang." }, { status: 403 });
    }
    return NextResponse.next();
  }

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
    "/vandaag/:path*",
    "/leads/:path*",
    "/klanten/:path*",
    "/vergelijk/:path*",
    "/overzicht/:path*",
    "/bord/:path*",
    "/vragen/:path*",
    "/kosten/:path*",
    "/restbetalingen/:path*",
    "/abonnementen/:path*",
    "/facturen/:path*",
    "/offertes/:path*",
    "/btw-aangifte/:path*",
    "/marges/:path*",
    "/storingen/:path*",
    "/beheer/:path*",
    "/nieuw-akkoord/:path*",
    "/team/:path*",
    "/api/klant/delete",
    "/api/klant/update",
    "/api/klant/gegevens",
    "/api/klant/verkoopbedrag",
    "/api/beheer/login",
    "/api/beheer/instellen",
    "/api/abonnement/instellen",
    "/api/abonnement/opzeggen",
    "/api/facturen/opnieuw",
    "/api/facturen/pdf",
    "/api/facturen/nieuw",
    "/api/facturen/loggen",
    "/api/facturen/bestand",
    "/api/offertes/status",
    "/api/offertes/loggen",
    "/api/offertes/bestand",
    "/api/financieel/instellingen",
    "/api/taken/aanmaken",
    "/api/taken/bijwerken",
    "/api/taken/verplaatsen",
    "/api/taken/verwijderen",
    "/api/publish",
    "/api/publish-site",
  ],
};
