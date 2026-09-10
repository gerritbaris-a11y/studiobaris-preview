import { NextResponse } from "next/server";
import { getBetaalinfo } from "../../../../lib/server-data";
import { berekenSlottermijn } from "../../../../lib/betaling-berekening";
import { slottermijnAankondigen, maakFactuur, setFactuurStatus } from "../../../../lib/abonnementen-data";
import { factuurPdf, mailFactuur, OMSCHRIJVING } from "../../../../lib/facturen";
import { backupNaarDrive } from "../../../../lib/drive-backup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// "Slottermijn versturen" — optie 5 uit het betaallinkenplan. Bevriest het
// bedrag (standaard het berekende restant, hier eventueel overschreven) en
// verstuurt meteen de wettelijk verplichte 14-dagen-vooraankondiging.
// De daadwerkelijke incasso gebeurt niet hier, maar 14 dagen later door de
// dagelijkse cron (/api/facturen/dagelijks), tegen het bestaande mandaat.
export async function POST(req) {
  try {
    const body = await req.json();
    const slug = String(body.slug || "").trim();
    if (!slug) return NextResponse.json({ ok: false, error: "slug ontbreekt." }, { status: 400 });

    const info = await getBetaalinfo(slug);
    if (!info) return NextResponse.json({ ok: false, error: "Klant niet gevonden." }, { status: 404 });

    const overschrijving = body.bedrag !== undefined && body.bedrag !== null && body.bedrag !== ""
      ? Number(String(body.bedrag).replace(",", "."))
      : null;
    const bedrag = overschrijving !== null && Number.isFinite(overschrijving)
      ? overschrijving
      : berekenSlottermijn(info).bedrag;

    if (!bedrag || bedrag <= 0) {
      return NextResponse.json({ ok: false, error: "Er staat geen (positief) slottermijnbedrag klaar voor deze klant." }, { status: 400 });
    }

    const aankondiging = await slottermijnAankondigen(slug, bedrag);
    const incassodatum = aankondiging && aankondiging.incassodatum;

    const factuur = await maakFactuur({
      slug,
      soort: "slottermijn",
      incassodatum,
      vervaldagen: 14,
      regels: [{ omschrijving: OMSCHRIJVING.slottermijn, bedrag_excl: bedrag }],
    });
    if (!factuur || !factuur.nummer) {
      return NextResponse.json({ ok: false, error: "Aankondiging is vastgelegd, maar de factuur kon niet worden aangemaakt." }, { status: 500 });
    }

    let mailStatus = { sent: false, reason: "niet geprobeerd" };
    if (factuur.status !== "verstuurd") {
      const pdf = await factuurPdf(factuur);
      mailStatus = await mailFactuur(factuur, pdf);
      if (mailStatus.sent) await setFactuurStatus(factuur.nummer, "verstuurd");
      backupNaarDrive(factuur, pdf).catch(() => {});
    } else {
      mailStatus = { sent: true };
    }

    return NextResponse.json({
      ok: true,
      bedrag,
      incassodatum,
      factuurnummer: factuur.nummer,
      gemaild: mailStatus.sent,
      mailFout: mailStatus.sent ? null : mailStatus.reason,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
