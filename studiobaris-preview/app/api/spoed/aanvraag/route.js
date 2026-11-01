import { NextResponse } from "next/server";
import { getPreview } from "../../../../lib/preview";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Storingsmelding vanaf een spoedsite (app/styles/spoed-formulier.js): gaat
// per e-mail naar de vakman. Op een preview zonder eigen e-mailadres staat
// daar ons adres (zelfde regel als de belknoppen), dan komt hij bij ons uit.

const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export async function POST(req) {
  const b = await req.json().catch(() => null);
  if (!b || typeof b.slug !== "string") return NextResponse.json({ ok: false, error: "Ongeldig verzoek." }, { status: 400 });
  if (b.website) return NextResponse.json({ ok: true }); // honeypot
  const naam = String(b.naam || "").trim().slice(0, 120);
  const telefoon = String(b.telefoon || "").trim().slice(0, 40);
  if (!naam || telefoon.replace(/\D/g, "").length < 9) {
    return NextResponse.json({ ok: false, error: "Vul je naam en een geldig telefoonnummer in." }, { status: 400 });
  }
  const row = await getPreview(b.slug).catch(() => null);
  const c = row && row.content;
  if (!c || c.sector !== "spoed") return NextResponse.json({ ok: false, error: "Deze site is niet gevonden." }, { status: 404 });
  const bedrijf = c.bedrijf || {};
  const naar = /@voorbeeld\.nl$/i.test(bedrijf.email || "") || !bedrijf.email ? "info@studiobaris.nl" : bedrijf.email;
  const key = process.env.RESEND_API_KEY;
  if (!key) return NextResponse.json({ ok: false, error: "Versturen lukt nu niet. Bel ons gerust." }, { status: 503 });

  const storing = String(b.storing || "").slice(0, 80);
  const adres = String(b.adres || "").trim().slice(0, 200);
  const omschrijving = String(b.omschrijving || "").trim().slice(0, 1000);
  const tel = telefoon.replace(/[^0-9+]/g, "");
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;color:#1A2B3D">
    <h2 style="font-size:20px;margin:0 0 6px">Nieuwe melding: ${esc(storing || "storing")}</h2>
    <p style="margin:0 0 14px;color:#4A5560">Via je website. Bel zo snel mogelijk terug.</p>
    <p style="font-size:18px;margin:0 0 4px"><strong>${esc(naam)}</strong></p>
    <p style="margin:0 0 14px"><a href="tel:${esc(tel)}" style="font-size:22px;font-weight:bold;color:#1A2B3D">${esc(telefoon)}</a></p>
    ${adres ? `<p style="margin:0 0 6px"><strong>Adres:</strong> ${esc(adres)}</p>` : ""}
    ${omschrijving ? `<p style="margin:0 0 6px"><strong>Omschrijving:</strong> ${esc(omschrijving)}</p>` : ""}
    <p style="font-size:12px;color:#6F7A85;margin-top:22px">Verstuurd via preview.studiobaris.nl/${esc(b.slug)} · StudioBaris</p></div>`;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "StudioBaris <info@studiobaris.nl>", to: naar,
        subject: `Terugbellen: ${storing || "storing"} · ${naam} · ${telefoon}`, html,
      }),
    });
    if (!res.ok) return NextResponse.json({ ok: false, error: "Versturen is niet gelukt. Bel ons gerust." }, { status: 502 });
  } catch {
    return NextResponse.json({ ok: false, error: "Versturen is niet gelukt. Bel ons gerust." }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
