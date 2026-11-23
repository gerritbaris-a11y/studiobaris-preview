import { NextResponse } from "next/server";
import { leesSessie, isBeheer } from "../../../../lib/auth";
import { getAppAccounts, zetWhatsappNummer } from "../../../../lib/server-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// WhatsApp-nummer van een salon koppelen: het phone-number-ID uit Meta (na
// Embedded Signup / coexistence) en het nummer zelf om te tonen. Alleen beheer.
// { id: companies.id, phone_id: "1234567890", nummer: "06 12345678" } — leeg = loskoppelen.
export async function POST(req) {
  const sessie = leesSessie();
  if (!sessie) return NextResponse.json({ ok: false, error: "Niet ingelogd." }, { status: 401 });
  if (!isBeheer(sessie)) return NextResponse.json({ ok: false, error: "Alleen voor beheer." }, { status: 403 });
  try {
    const { id, phone_id, nummer } = await req.json();
    const pid = String(phone_id || "").trim();
    if (pid && !/^\d{8,20}$/.test(pid)) {
      return NextResponse.json({ ok: false, error: "Het phone-number-ID is een lang getal uit Meta (WhatsApp Manager → Telefoonnummers), niet het telefoonnummer zelf." }, { status: 400 });
    }
    const accounts = await getAppAccounts();
    const app = accounts.find((a) => a.id === id);
    if (!app || app.soort !== "salon") return NextResponse.json({ ok: false, error: "Alleen voor salons met een app-account." }, { status: 403 });
    const rij = await zetWhatsappNummer(id, pid || null, pid ? String(nummer || "").trim().slice(0, 30) || null : null);
    if (!rij) return NextResponse.json({ ok: false, error: "Deze salon heeft nog geen online agenda. Zet die eerst aan in de app." }, { status: 400 });
    return NextResponse.json({ ok: true, phone_id: rij.whatsapp_phone_id, nummer: rij.whatsapp_nummer });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
