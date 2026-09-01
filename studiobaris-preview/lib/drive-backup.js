// Automatische backup van elke verstuurde factuur-PDF naar een vaste map in
// Google Drive, los van Supabase/Vercel. Puur een kopie voor de zekerheid —
// als dit misgaat (geen sleutel ingesteld, Drive tijdelijk onbereikbaar, geen
// toegang tot de map) mag dat NOOIT de factuur, de mail of de betaling zelf
// raken. Vandaar: altijd try/catch, nooit een fout laten doorgooien, nooit
// iets anders blokkeren.
//
// Dit loopt via een OAuth-koppeling met het eigen Google-account (niet via
// een "kaal" service-account) — service-accounts hebben op een gewoon
// Gmail-account geen eigen opslagruimte en kunnen daardoor nooit bestanden
// aanmaken, ook niet in een gedeelde map (bevestigd door Google zelf:
// "Service Accounts do not have storage quota"). Door in plaats daarvan
// een refresh-token van het eigen account te gebruiken, wordt elk bestand
// aangemaakt namens dat account zelf — dat account heeft wél ruimte.
//
// Benodigde omgevingsvariabelen (Vercel → Settings → Environment Variables):
//   GOOGLE_DRIVE_OAUTH_CLIENT_ID       Client-ID van de OAuth-credential
//   GOOGLE_DRIVE_OAUTH_CLIENT_SECRET   bijbehorend Client secret
//   GOOGLE_DRIVE_REFRESH_TOKEN         eenmalig verkregen refresh token (via
//                                      OAuth Playground) voor het eigen account
//   GOOGLE_DRIVE_BACKUP_FOLDER_ID      map-ID van de Drive-map "Backup"
//
// De map staat gewoon in het eigen Drive-account — geen aparte deling nodig,
// want er wordt niet meer via een los service-account ingelogd.

let cachedToken = null; // { token, verlooptOm }

async function haalToegangstoken() {
  const clientId = process.env.GOOGLE_DRIVE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_DRIVE_OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) return null;

  const nu = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.verlooptOm > nu + 30) return cachedToken.token;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
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
    if (!token) return { ok: false, reason: "geen Drive-toegangstoken (OAuth-gegevens ontbreken of ongeldig)" };

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
    if (!res.ok) {
      const tekst = await res.text().catch(() => "");
      return { ok: false, reason: `Drive-upload mislukt (${res.status}): ${tekst.slice(0, 300)}` };
    }
    const data = await res.json();
    return { ok: true, fileId: data.id };
  } catch (e) {
    return { ok: false, reason: String(e && e.message || e) };
  }
}
