// Wie mag een cron-route aanroepen? Zelfde regel als /api/facturen/dagelijks:
//  1. Vercel Cron met een Bearer-token, als CRON_SECRET is ingesteld.
//  2. Handmatig, met ?sleutel=<CRON_SECRET> (om een keer te testen).
//  3. Zolang er geen CRON_SECRET is: alleen Vercel's eigen cron-user-agent.
export function cronMagDoor(req) {
  const geheim = process.env.CRON_SECRET;
  const kop = req.headers.get("authorization") || "";
  const agent = req.headers.get("user-agent") || "";
  const sleutel = new URL(req.url).searchParams.get("sleutel") || "";
  return geheim ? kop === `Bearer ${geheim}` || sleutel === geheim : agent.startsWith("vercel-cron/");
}
