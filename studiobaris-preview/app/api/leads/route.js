import { NextResponse } from "next/server";
import { updateLead, getLead, claimLead, log } from "../../../lib/server-data";
import { leesSessie } from "../../../lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSSEN = ["nieuw", "opgepakt", "benaderd", "preview", "klant", "afgewezen", "archief"];

// Vaste redenen om een lead te archiveren. Zo kunnen we later filteren en
// bijvoorbeeld alle "later opnieuw benaderen" in één keer terughalen.
export const REDENEN = ["Goede website", "Niet actief", "Geen ZZP / eenmanszaak"];

export async function POST(req) {
  try {
    const body = await req.json();
    const id = String(body.id || "");
    if (!id) return NextResponse.json({ ok: false, error: "id ontbreekt." }, { status: 400 });

    // Claim-met-slot: oppakken gebeurt op naam van de ingelogde verkoper en
    // lukt alleen als de lead nog vrij is. Zo belt niemand een lead die een
    // collega al heeft opgepakt.
    if (body.claim === true) {
      const sessie = leesSessie();
      const wie = sessie ? sessie.naam : null;
      if (!wie) return NextResponse.json({ ok: false, error: "Niet ingelogd." }, { status: 401 });
      const r = await claimLead(id, wie);
      if (!r.ok) {
        return NextResponse.json({
          ok: false, taken: true, owner: r.owner || null,
          error: r.owner ? `Al opgepakt door ${r.owner}` : "Deze lead is niet meer vrij.",
        });
      }
      await log({ persoon: wie, soort: "lead_claim", leadId: id,
                  bedrijf: r.lead ? r.lead.bedrijfsnaam : null, naar: "opgepakt" });
      return NextResponse.json({ ok: true, owner: wie, status: (r.lead && r.lead.status) || "opgepakt" });
    }

    const fields = {};
    if (typeof body.status === "string") {
      if (!STATUSSEN.includes(body.status)) {
        return NextResponse.json({ ok: false, error: "Onbekende status." }, { status: 400 });
      }
      fields.status = body.status;
    }
    if (body.owner !== undefined) {
      fields.owner = body.owner ? String(body.owner) : null;
    }
    if (body.notitie !== undefined) {
      fields.notitie = body.notitie ? String(body.notitie) : null;
    }
    // Website corrigeren: de brondata klopt niet altijd. Vult iemand alsnog een
    // website in, dan telt de lead niet langer als "alleen social media".
    if (body.website !== undefined) {
      let w = String(body.website || "").trim();
      if (w && !/^https?:\/\//i.test(w)) w = "https://" + w;
      fields.website = w || null;
    }
    if (body.archief_reden !== undefined) {
      const reden = body.archief_reden ? String(body.archief_reden).slice(0, 120) : null;
      // Vaste redenen, of een eigen omschrijving die met "Overig: " begint.
      if (reden && !REDENEN.includes(reden) && !reden.startsWith("Overig")) {
        return NextResponse.json({ ok: false, error: "Onbekende reden." }, { status: 400 });
      }
      fields.archief_reden = reden;
      fields.gearchiveerd_op = reden ? new Date().toISOString() : null;
      fields.status = reden ? "archief" : "nieuw";
    }

    if (Object.keys(fields).length === 0) {
      return NextResponse.json({ ok: false, error: "Niets om bij te werken." }, { status: 400 });
    }

    // Eerst de oude stand ophalen, zodat we in het logboek kunnen zetten
    // wat er precies veranderde (en dus waar leads sneuvelen).
    const oud = await getLead(id);

    const res = await updateLead(id, fields);
    if (!res) return NextResponse.json({ ok: false, error: "Bijwerken mislukt." }, { status: 500 });

    const sessie = leesSessie();
    const wie = sessie ? sessie.naam : null;
    const bedrijf = oud ? oud.bedrijfsnaam : null;

    if (fields.status !== undefined && (!oud || oud.status !== fields.status)) {
      await log({ persoon: wie, soort: "lead_status", leadId: id, bedrijf,
                  van: oud ? oud.status || "nieuw" : null, naar: fields.status });
    }
    if (fields.owner !== undefined && (!oud || (oud.owner || null) !== (fields.owner || null))) {
      await log({ persoon: wie, soort: "lead_owner", leadId: id, bedrijf,
                  van: oud ? oud.owner : null, naar: fields.owner || null });
    }

    return NextResponse.json({ ok: true, lead: Array.isArray(res) ? res[0] : res });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}

