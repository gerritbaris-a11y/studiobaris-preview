import { NextResponse } from "next/server";
import { updateLead, getLead, log, verwijderLead } from "../../../lib/server-data";
import { leesSessie, isBeheer } from "../../../lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSSEN = ["nieuw", "opgepakt", "benaderd", "preview", "klant", "afgewezen", "archief"];

// Vaste redenen om een lead te archiveren. Zo kunnen we later filteren en
// bijvoorbeeld alle "later opnieuw benaderen" in één keer terughalen.
export const REDENEN = [
  "Heeft al een goede website",
  "Geen interesse",
  "Niet bereikbaar",
  "Past niet bij ons",
  "Later opnieuw benaderen",
  "Gegevens kloppen niet",
];

export async function POST(req) {
  try {
    const body = await req.json();
    const id = String(body.id || "");
    if (!id) return NextResponse.json({ ok: false, error: "id ontbreekt." }, { status: 400 });

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
      const reden = body.archief_reden ? String(body.archief_reden) : null;
      if (reden && !REDENEN.includes(reden)) {
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

// Lead definitief verwijderen. Alleen beheer, want dit is niet terug te draaien.
export async function DELETE(req) {
  const sessie = leesSessie();
  if (!sessie || !isBeheer(sessie)) {
    return NextResponse.json({ ok: false, error: "Alleen beheer mag leads verwijderen." }, { status: 403 });
  }
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ ok: false, error: "id ontbreekt." }, { status: 400 });
    const oud = await getLead(id);
    await verwijderLead(id);
    await log({
      persoon: sessie.naam,
      soort: "lead_verwijderd",
      bedrijf: oud ? oud.bedrijfsnaam : null,
      van: oud ? oud.status : null,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
