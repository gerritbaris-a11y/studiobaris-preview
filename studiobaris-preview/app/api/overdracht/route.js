import { NextResponse } from "next/server";
import { leesSessie, isBeheer } from "../../../lib/auth";
import {
  getOverview, getAppAccounts, zoekAppAccount, nieuweLogin, KLANT_APP_BASE, getFull, log,
} from "../../../lib/server-data";
import { overdrachtPdf, mailOverdracht, overdrachtVerstuurd } from "../../../lib/overdracht";
import { schoonSite } from "../../../lib/ronde";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Overdrachtsdocument "Je website en je app" (alleen beheer; staat ook in de
// middleware). Twee acties:
//  - "voorbeeld": PDF zonder echte inloglink, niets veranderd.
//  - "versturen": maakt een nieuwe app-inloglink (de vorige vervalt), zet die
//    in de PDF en mailt de PDF naar de klant (bcc StudioBaris). Geeft de PDF
//    ook terug om te bewaren. De link zelf wordt nergens gelogd.
const DAGEN = 14; // zelfde als de inloglink uit het Klantenregister
const MAILS = ["bij-ons", "blijft", "geen"];

export async function POST(req) {
  const sessie = leesSessie();
  if (!sessie || !isBeheer(sessie)) return NextResponse.json({ ok: false, error: "Alleen voor beheer." }, { status: 403 });
  try {
    const b = await req.json();
    const slug = String(b.slug || "");
    const actie = b.actie === "versturen" ? "versturen" : "voorbeeld";
    const site = schoonSite(b.site);
    const wp = String(b.wp || "").trim().slice(0, 120);
    const mail = MAILS.includes(b.mail) ? b.mail : "geen";
    const naar = String(b.naar || "").trim();

    if (!/^[a-z0-9-]{1,120}$/.test(slug)) return NextResponse.json({ ok: false, error: "Onbekende preview." }, { status: 400 });
    if (!site) return NextResponse.json({ ok: false, error: "Vul de domeinnaam van de website in." }, { status: 400 });
    if (!wp) return NextResponse.json({ ok: false, error: "Vul de WordPress-gebruikersnaam van de klant in." }, { status: 400 });

    const [rijen, inhoud] = await Promise.all([getOverview(), getFull(slug)]);
    const rij = (rijen || []).find((r) => r.slug === slug);
    if (!rij) return NextResponse.json({ ok: false, error: "Preview niet gevonden." }, { status: 404 });
    const diensten = Array.isArray(inhoud && inhoud.diensten) ? inhoud.diensten.map((x) => x && x.titel) : [];
    const basis = { bedrijf: rij.company_name || slug, site, wp, mail, diensten, datum: new Date() };

    if (actie === "voorbeeld") {
      const pdf = await overdrachtPdf({ ...basis, link: null });
      return NextResponse.json({ ok: true, pdf: Buffer.from(pdf).toString("base64") });
    }

    // Versturen
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(naar)) return NextResponse.json({ ok: false, error: "Vul een geldig e-mailadres van de klant in." }, { status: 400 });
    const account = zoekAppAccount(rij, await getAppAccounts());
    if (!account) {
      return NextResponse.json({ ok: false, error: "Er is nog geen app-account voor deze klant. Maak dat eerst aan (zie het draaiboek: gebruiker, bedrijfsregel en plugin koppelen)." }, { status: 409 });
    }
    const token = await nieuweLogin(account.id, DAGEN);
    if (!token || typeof token !== "string") return NextResponse.json({ ok: false, error: "Inloglink maken mislukt." }, { status: 500 });

    const pdf = await overdrachtPdf({ ...basis, link: KLANT_APP_BASE + "/in/" + token });
    const r = await mailOverdracht({ naar, contact: rij.contactpersoon, bedrijf: basis.bedrijf, site, pdfBytes: pdf });
    if (!r.sent) {
      return NextResponse.json({
        ok: false,
        error: "De inloglink is gemaakt, maar de mail kon niet worden verstuurd. Download de PDF en stuur hem zelf.",
        pdf: Buffer.from(pdf).toString("base64"),
      }, { status: 502 });
    }
    await Promise.all([
      overdrachtVerstuurd({ slug, site, naar, door: sessie.naam }).catch(() => {}),
      log({ persoon: sessie.naam, soort: "overdracht", slug, bedrijf: basis.bedrijf, naar, details: "Overdrachtsdocument met nieuwe app-inloglink verstuurd" }).catch(() => {}),
    ]);
    return NextResponse.json({ ok: true, verstuurd: true, app: account.name || account.slug, pdf: Buffer.from(pdf).toString("base64") });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Er ging iets mis: " + String(e.message || e) }, { status: 500 });
  }
}
