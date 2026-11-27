import { NextResponse } from "next/server";
import { cronMagDoor } from "../../../../lib/cron-toegang";
import { dagelijks, stuurMail, mailGestuurd } from "../../../../lib/app-proef";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Elke ochtend: verlopen app-proeven op "verlopen" zetten en de mails van
// dag 5 ("nog 2 dagen") en dag 7 ("proef afgelopen") versturen. Elke mail
// gaat maar één keer (bijgehouden in workflow.app_proef_mail).
export async function GET(req) {
  if (!cronMagDoor(req)) return NextResponse.json({ ok: false, error: "Geen toegang." }, { status: 401 });

  const r = await dagelijks();
  if (!r || typeof r !== "object") return NextResponse.json({ ok: false, error: "Database niet bereikbaar." }, { status: 500 });

  let verstuurd = 0;
  for (const m of Array.isArray(r.mails) ? r.mails : []) {
    const res = await stuurMail(m.soort, m);
    if (res.sent) {
      await mailGestuurd(m.company_id, m.soort);
      verstuurd++;
    }
  }
  return NextResponse.json({ ok: true, verlopen: r.verlopen || 0, mails: verstuurd });
}
