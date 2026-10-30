import { NextResponse } from "next/server";
import {
  herinneringenLijst, herinneringGezet, testOpruimen, berichtenMaand, agendaVoorBedrijf, stuurHerinnering,
} from "../../../../lib/agenda";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Dagelijks (Vercel Cron, vercel.json): herinnering voor alle afspraken van
// morgen, en oude testboekingen opruimen. Zelfde toegangsregels als de andere crons.
export async function GET(req) {
  const geheim = process.env.CRON_SECRET;
  const kop = req.headers.get("authorization") || "";
  const agent = req.headers.get("user-agent") || "";
  const sleutel = new URL(req.url).searchParams.get("sleutel") || "";
  const magDoor = geheim ? kop === `Bearer ${geheim}` || sleutel === geheim : agent.startsWith("vercel-cron/");
  if (!magDoor) return NextResponse.json({ ok: false, error: "Geen toegang." }, { status: 401 });

  const uitkomst = { verstuurd: 0, whatsapp: 0, email: 0, overgeslagen: 0, opgeruimd: 0 };
  try {
    const lijst = await herinneringenLijst();
    const agendas = {}, tellers = {};
    for (const a of lijst) {
      if (!agendas[a.company_id]) {
        agendas[a.company_id] = await agendaVoorBedrijf(a.company_id);
        tellers[a.company_id] = await berichtenMaand(a.company_id);
      }
      const kanaal = agendas[a.company_id] ? await stuurHerinnering(a, agendas[a.company_id], tellers[a.company_id]) : null;
      await herinneringGezet(a.id);
      if (kanaal) { uitkomst.verstuurd++; uitkomst[kanaal]++; } else uitkomst.overgeslagen++;
    }
    uitkomst.opgeruimd = (await testOpruimen()) || 0;
    return NextResponse.json({ ok: true, ...uitkomst });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String((e && e.message) || e), ...uitkomst }, { status: 500 });
  }
}
