import { NextResponse } from "next/server";
import { maakKlant } from "../../../../lib/server-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Een klant handmatig los neerzetten (geen AI-intake, geen klantnummer).
export async function POST(req) {
  try {
    const body = await req.json();
    const bedrijfsnaam = String(body.bedrijfsnaam || "").trim();
    if (!bedrijfsnaam) {
      return NextResponse.json({ ok: false, error: "Bedrijfsnaam is verplicht." }, { status: 400 });
    }

    const num = (v) => {
      if (v === undefined || v === null || v === "") return null;
      const n = Number(String(v).replace(",", "."));
      return Number.isNaN(n) ? null : n;
    };

    const res = await maakKlant({
      bedrijfsnaam,
      contactpersoon: body.contactpersoon || null,
      email: body.email || null,
      telefoon: body.telefoon || null,
      adres: body.adres || null,
      kvk: body.kvk || null,
      btw: body.btw || null,
      pakket_type: body.pakket_type || null,
      websiteprijs: num(body.websiteprijs),
      maandbedrag: num(body.maandbedrag),
      notitie: body.notitie || null,
    });

    if (!res || res.ok !== true) {
      return NextResponse.json({ ok: false, error: "Aanmaken mislukt (server-key?)." }, { status: 500 });
    }
    return NextResponse.json({ ok: true, slug: res.slug });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
