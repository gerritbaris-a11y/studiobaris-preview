import { reviewAfmelden } from "../../../../lib/agenda";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const pagina = (kop, tekst) => new Response(
  `<!doctype html><html lang="nl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${kop}</title><body style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:60px auto;padding:0 20px;color:#1A2B3D">
  <h1 style="font-size:22px">${kop}</h1><p>${tekst}</p></body></html>`,
  { headers: { "Content-Type": "text/html; charset=utf-8" } });

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Link onderaan het automatische reviewverzoek: nooit meer vragen.
export async function GET(req) {
  const t = new URL(req.url).searchParams.get("t") || "";
  if (!/^[A-Z0-9]{6,20}$/.test(t)) return pagina("Link niet geldig", "Deze link klopt niet (meer).");
  let r = null;
  try { r = await reviewAfmelden(t); } catch {}
  if (!r) return pagina("Link niet geldig", "Deze link klopt niet (meer).");
  return pagina("Afgemeld", `Je krijgt geen reviewverzoeken meer van ${esc(r.salon || "deze salon")}. Bedankt dat je er was!`);
}
