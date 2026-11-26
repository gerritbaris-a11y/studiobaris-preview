// Eenmalig (of na het verlopen van de sleutel) Google Drive koppelen vanuit het
// dashboard: /api/backup/koppelen stuurt je naar Google, /api/backup/koppelen/terug
// slaat de refresh token op in workflow.drive_koppeling. Alleen voor beheer
// (zie middleware.js). Log bij Google in als peacestarmedia@gmail.com.
export const SCOPE = "https://www.googleapis.com/auth/drive";

export function terugUrl(req) {
  const u = new URL(req.url);
  return `${u.protocol}//${u.host}/api/backup/koppelen/terug`;
}
