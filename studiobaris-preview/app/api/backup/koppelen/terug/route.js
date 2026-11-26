import { NextResponse } from "next/server";
import { terugUrl } from "../../../../../lib/drive-koppelen";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function pagina(titel, tekst, ok) {
  const kleur = ok ? "#1f7a3a" : "#b42318";
  return new NextResponse(
    `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${titel}</title></head>
<body style="font-family:'Plus Jakarta Sans',system-ui,sans-serif;max-width:520px;margin:15vh auto;padding:0 20px;color:#1a1a1a">
<h1 style="color:${kleur};font-size:24px">${titel}</h1><p style="line-height:1.6">${tekst}</p>
<p><a href="/dashboard" style="color:#1a1a1a">Terug naar het dashboard</a></p></body></html>`,
    { status: ok ? 200 : 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

export async function GET(req) {
  const u = new URL(req.url);
  const fout = u.searchParams.get("error");
  if (fout) return pagina("Koppelen afgebroken", `Google gaf terug: ${fout.replace(/[<>&]/g, "")}.`, false);
  const code = u.searchParams.get("code");
  const state = u.searchParams.get("state");
  const verwacht = req.cookies.get("sb_drive_state")?.value;
  if (!code || !state || state !== verwacht) {
    return pagina("Koppelen mislukt", "De aanvraag klopte niet (verlopen of van een ander tabblad). Probeer het opnieuw via de knop.", false);
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: process.env.GOOGLE_DRIVE_OAUTH_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_DRIVE_OAUTH_CLIENT_SECRET || "",
      redirect_uri: terugUrl(req),
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.refresh_token) {
    const reden = [data.error, data.error_description].filter(Boolean).join(": ") || `status ${res.status}`;
    console.error("[drive koppelen] mislukt:", reden);
    return pagina("Koppelen mislukt", `Google weigerde de sleutel (${String(reden).replace(/[<>&]/g, "")}).`, false);
  }

  const k = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const sb = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ipiqrsxbsgylxhgzlhsd.supabase.co";
  const opslaan = await fetch(`${sb}/rest/v1/rpc/sb_drive_token_set`, {
    method: "POST",
    headers: { apikey: k, Authorization: `Bearer ${k}`, "Content-Type": "application/json" },
    body: JSON.stringify({ p_token: data.refresh_token, p_scope: data.scope || null }),
  });
  if (!opslaan.ok) return pagina("Koppelen mislukt", "De sleutel kon niet worden opgeslagen in de database.", false);

  const out = pagina(
    "Google Drive is gekoppeld",
    "De wekelijkse back-up (StudioBaris &gt; Back-up) en de factuur-backup kunnen weer in de Drive schrijven. Je kunt dit tabblad sluiten.",
    true
  );
  out.cookies.set("sb_drive_state", "", { path: "/api/backup/koppelen", maxAge: 0 });
  return out;
}
