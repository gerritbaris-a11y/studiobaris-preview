// Automatische backup van elke verstuurde factuur-PDF naar een vaste map in
// Google Drive, los van Supabase/Vercel. Puur een kopie voor de zekerheid —
// als dit misgaat (geen sleutel ingesteld, Drive tijdelijk onbereikbaar, geen
// toegang tot de map) mag dat NOOIT de factuur, de mail of de betaling zelf
// raken. Vandaar: altijd try/catch, nooit een fout laten doorgooien, nooit
// iets anders blokkeren.
//
// Benodigde omgevingsvariabelen (Vercel → Settings → Environment Variables):
//   GOOGLE_DRIVE_CLIENT_EMAIL      e-mailadres van de service account
//   GOOGLE_DRIVE_PRIVATE_KEY       bijbehorende private key (met echte \n's)
//   GOOGLE_DRIVE_BACKUP_FOLDER_ID  map-ID van de Drive-map "Backup"
//
// De map zelf moet in Google Drive gedeeld zijn met dat service-account
// e-mailadres (rol: Editor/Content manager) — zonder die deling kan de
// service account de map niet zien, ongeacht de sleutel.

import crypto from "crypto";

let cachedToken = null; // { token, verlooptOm }

function base64url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function haalToegangstoken() {
  const clientEmail = process.env.GOOGLE_DRIVE_CLIENT_EMAIL;
  const privateKeyRaw = process.env.GOOGLE_DRIVE_PRIVATE_KEY;
  if (!clientEmail || !privateKeyRaw) return null;

  const nu = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.verlooptOm > nu + 30) return cachedToken.token;

  const privateKey = privateKeyRaw.includes("\\n")
    ? privateKeyRaw.replace(/\\n/g, "\n")
    : privateKeyRaw;

  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64url(JSON.stringify({
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/drive.file",
    aud: "https://oauth2.googleapis.com/token",
    iat: nu,
    exp: nu + 3600,
  }));
  const ondertekend = crypto.sign("RSA-SHA256", Buffer.from(`${header}.${payload}`), privateKey);
  const jwt = `${header}.${payload}.${base64url(ondertekend)}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.access_token) return null;

  cachedToken = { token: data.access_token, verlooptOm: nu + (Number(data.expires_in) || 3500) };
  return data.access_token;
}

// f: de factuur (voor de bestandsnaam), pdfBytes: de gegenereerde PDF.
export async function backupNaarDrive(f, pdfBytes) {
  try {
    const folderId = process.env.GOOGLE_DRIVE_BACKUP_FOLDER_ID;
    if (!folderId) return { ok: false, reason: "geen GOOGLE_DRIVE_BACKUP_FOLDER_ID ingesteld" };

    const token = await haalToegangstoken();
    if (!token) return { ok: false, reason: "geen Drive-toegangstoken (sleutel ontbreekt of ongeldig)" };

    const metadata = { name: `Factuur ${f.nummer}.pdf`, parents: [folderId] };
    const boundary = `studiobaris-${Date.now()}`;
    const pre = Buffer.from(
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n` +
      `--${boundary}\r\nContent-Type: application/pdf\r\n\r\n`
    );
    const post = Buffer.from(`\r\n--${boundary}--`);
    const body = Buffer.concat([pre, Buffer.from(pdfBytes), post]);

    const res = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": `multipart/related; boundary=${boundary}`,
        },
        body,
      }
    );
    if (!res.ok) return { ok: false, reason: `Drive-upload mislukt (${res.status})` };
    const data = await res.json();
    return { ok: true, fileId: data.id };
  } catch (e) {
    return { ok: false, reason: String(e && e.message || e) };
  }
}
