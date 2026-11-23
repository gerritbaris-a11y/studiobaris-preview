import { NextResponse } from "next/server";
import { getFactuur, crediteerFactuur, setFactuurStatus } from "../../../../lib/abonnementen-data";
import { factuurPdf, mailFactuur } from "../../../../lib/facturen";
import { getFactuurAdres } from "../../../../lib/server-data";
import { backupNaarDrive } from "../../../../lib/drive-backup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Een verstuurde of betaalde factuur volledig crediteren. Annuleren mag
// fiscaal alleen bij een concept (die is nooit de deur uit gegaan); een
// factuur die de klant al heeft, wordt gecorrigeerd met een creditnota:
// eigen nummer uit dezelfde reeks, negatieve bedragen, verwijzing naar de
// originele factuur. Zie supabase/creditnota.sql voor hoe dat meetelt.
//
// Body: { nummer, reden?, mailen? } — mailen=true stuurt de creditnota-PDF
// naar het actuele factuuradres van de klant.
export async function POST(req) {
  try {
    const { nummer, reden, mailen } = await req.json();
    if (!nummer) return NextResponse.json({ ok: false, error: "factuurnummer ontbreekt." }, { status: 400 });

    const origineel = await getFactuur(nummer);
    if (!origineel) return NextResponse.json({ ok: false, error: "Factuur niet gevonden." }, { status: 404 });

    // De database bewaakt de regels (status, al gecrediteerd, geen credit op
    // credit) en geeft een leesbare melding terug als het niet mag.
    const credit = await crediteerFactuur(nummer, reden ? String(reden).slice(0, 300) : null);
    if (!credit || !credit.nummer) {
      return NextResponse.json({ ok: false, error: "Creditnota aanmaken mislukte." }, { status: 500 });
    }

    const pdf = await factuurPdf(credit);
    backupNaarDrive(credit, pdf).catch(() => {});

    let mail = { sent: false, reason: "niet gemaild" };
    if (mailen) {
      const slug = credit.snapshot && credit.snapshot.klant && credit.snapshot.klant.slug;
      const naar = slug ? await getFactuurAdres(slug).catch(() => null) : null;
      mail = await mailFactuur(credit, pdf, { naar });
      if (mail.sent) await setFactuurStatus(credit.nummer, "verstuurd");
    }

    return NextResponse.json({
      ok: true,
      creditnota: credit.nummer,
      gemaild: mail.sent,
      mailFout: mailen && !mail.sent ? mail.reason : null,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
