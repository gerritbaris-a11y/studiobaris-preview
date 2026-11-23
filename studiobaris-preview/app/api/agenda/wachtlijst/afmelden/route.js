import { wachtlijstAfmelden } from "../../../../../lib/agenda";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const pagina = (kop, tekst) => new Response(
  `<!doctype html><html lang="nl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${kop}</title><body style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:60px auto;padding:0 20px;color:#1A2B3D">
  <h1 style="font-size:22px">${kop}</h1><p>${tekst}</p></body></html>`,
  { headers: { "Content-Type": "text/html; charset=utf-8" } });

// Link uit de wachtlijstmail: van de wachtlijst af.
export async function GET(req) {
  const t = new URL(req.url).searchParams.get("t") || "";
  if (!/^[0-9a-f]{24}$/.test(t)) return pagina("Link niet geldig", "Deze link klopt niet (meer).");
  try { await wachtlijstAfmelden(t); } catch {}
  return pagina("Je staat niet meer op de wachtlijst", "Je krijgt geen mail meer als er een plek vrijkomt. Wil je toch een afspraak? Kijk op de website van de salon.");
}
