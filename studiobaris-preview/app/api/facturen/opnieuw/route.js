import { NextResponse } from "next/server";
import { getFactuur, setFactuurStatus } from "../../../../lib/abonnementen-data";
import { factuurPdf, mailFactuur } from "../../../../lib/facturen";
import { backupNaarDrive } from "../../../../lib/drive-backup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// "Klant zegt dat hij de factuur niet heeft gehad." Zelfde nummer, zelfde
// bedragen, opnieuw uit de bevroren snapshot opgemaakt en verstuurd.
export async function POST(req) {
  try {
    const { nummer } = await req.json();
    if (!nummer) return NextResponse.json({ ok: false, error: "factuurnummer ontbreekt." }, { status: 400 });

    const factuur = await getFactuur(nummer);
    if (!factuur) return NextResponse.json({ ok: false, error: "Factuur niet gevonden." }, { status: 404 });

    const pdf = await factuurPdf(factuur);
    const mail = await mailFactuur(factuur, pdf);
    if (!mail.sent) {
      return NextResponse.json({ ok: false, error: mail.reason || "Mailen mislukte." }, { status: 502 });
    }
    await setFactuurStatus(nummer, "verstuurd");
    backupNaarDrive(factuur, pdf).catch(() => {});
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
