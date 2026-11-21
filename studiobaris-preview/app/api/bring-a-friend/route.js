import { NextResponse } from "next/server";
import { setAanbrenger, bafToekennen, tegoedIntrekken } from "../../../lib/abonnementen-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Bring a friend vanuit Abonnementen → Beheren. Staat in middleware.js onder
// API_BEHEER: alleen Gerrit en Levi komen hier langs.
//   actie "aanbrenger"  — wie heeft deze klant aangebracht (leeg = wissen)
//   actie "toekennen"   — beloning nu toekennen, voor een klant die buiten
//                         Mollie om (bijv. per bank) de eerste keer betaalde
//   actie "intrekken"   — een nog niet verrekende gratis maand schrappen
export async function POST(req) {
  try {
    const body = await req.json();
    const actie = String(body.actie || "");
    const slug = String(body.slug || "").trim();

    if (actie === "aanbrenger") {
      if (!slug) return NextResponse.json({ ok: false, error: "slug ontbreekt." }, { status: 400 });
      const r = await setAanbrenger(slug, body.aanbrenger ? String(body.aanbrenger) : null);
      return NextResponse.json({ ok: true, resultaat: r });
    }
    if (actie === "toekennen") {
      if (!slug) return NextResponse.json({ ok: false, error: "slug ontbreekt." }, { status: 400 });
      const r = await bafToekennen(slug);
      if (!r) throw new Error("Toekennen lukte niet. Is supabase/bring_a_friend.sql al gedraaid?");
      return NextResponse.json({ ok: true, resultaat: r });
    }
    if (actie === "intrekken") {
      const id = String(body.tegoedId || "");
      if (!id) return NextResponse.json({ ok: false, error: "tegoedId ontbreekt." }, { status: 400 });
      const r = await tegoedIntrekken(id);
      return NextResponse.json({ ok: true, resultaat: r });
    }
    return NextResponse.json({ ok: false, error: "Onbekende actie." }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
