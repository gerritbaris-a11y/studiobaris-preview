
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ipiqrsxbsgylxhgzlhsd.supabase.co";

// Abonneerbare agenda van een salon: de salon zet deze link één keer in de
// agenda-app van zijn telefoon (iPhone, Google Agenda) en ziet daar al zijn
// afspraken, automatisch bijgewerkt. Geheime link per salon (ical_token).
export async function GET(req, { params }) {
  const token = String(params.token || "").replace(/\.ics$/, "");
  if (!/^[0-9a-f]{20,64}$/.test(token)) return new Response("Niet gevonden", { status: 404 });
  const k = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/sb_agenda_ical`, {
    method: "POST", cache: "no-store",
    headers: { apikey: k, Authorization: `Bearer ${k}`, "Content-Type": "application/json" },
    body: JSON.stringify({ p_token: token }),
  });
  const data = res.ok ? await res.json() : null;
  if (!data) return new Response("Niet gevonden", { status: 404 });

  const z = (iso) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const t = (s) => String(s || "").replace(/[\\,;]/g, (m) => "\\" + m).replace(/\n/g, "\\n");
  const regels = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//StudioBaris//Agenda//NL", "CALSCALE:GREGORIAN",
    `X-WR-CALNAME:${t("Afspraken " + data.naam)}`, "X-WR-TIMEZONE:Europe/Amsterdam", "REFRESH-INTERVAL;VALUE=DURATION:PT15M"];
  for (const a of data.afspraken || []) {
    regels.push("BEGIN:VEVENT", `UID:${a.id}@studiobaris.nl`, `DTSTAMP:${z(a.created_at)}`,
      `DTSTART:${z(a.start)}`, `DTEND:${z(a.eind)}`,
      `SUMMARY:${t(`${a.klant_naam} · ${a.behandeling_naam}`)}`,
      `DESCRIPTION:${t([a.klant_telefoon, a.klant_email, a.opmerking].filter(Boolean).join("\n"))}`,
      a.status === "geannuleerd" ? "STATUS:CANCELLED" : "STATUS:CONFIRMED", "END:VEVENT");
  }
  regels.push("END:VCALENDAR");
  return new Response(regels.join("\r\n"), {
    headers: { "Content-Type": "text/calendar; charset=utf-8", "Cache-Control": "no-store" },
  });
}
