import { NextResponse } from "next/server";
import {
  TOEGESTANE_EXTENSIES,
  MAX_BESTAND_BYTES,
  MAX_AANTAL_FOTOS,
  extensieVan,
} from "../../../lib/bestand-validatie";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ipiqrsxbsgylxhgzlhsd.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = "klant-media";

/**
 * Geeft de browser tijdelijke toestemming om bestanden RECHTSTREEKS naar onze
 * opslag te sturen, buiten het formulier om.
 *
 * Waarom: het platform weigert elk verzoek boven ~4,5 MB, en dat geldt voor het
 * hele formulier bij elkaar. Foto's van een telefoon halen dat plafond met
 * gemak. Door ze langs deze weg te sturen bestaat die grens niet meer; het
 * formulier verstuurt daarna alleen nog de links.
 *
 * De sleutel blijft hier op de server. De browser krijgt alleen een kortlopende
 * link per bestand, op een pad dat wij bepalen - hij kan dus niets overschrijven
 * wat van iemand anders is.
 */
export async function POST(req) {
  try {
    if (!SERVICE_KEY) {
      return NextResponse.json({ ok: false, error: "Server niet geconfigureerd." }, { status: 500 });
    }

    const body = await req.json().catch(() => null);
    const bestanden = body && Array.isArray(body.bestanden) ? body.bestanden : [];
    if (!bestanden.length) {
      return NextResponse.json({ ok: false, error: "Geen bestanden opgegeven." }, { status: 400 });
    }
    if (bestanden.length > MAX_AANTAL_FOTOS + 1) {
      return NextResponse.json({ ok: false, error: "Te veel bestanden in één keer." }, { status: 400 });
    }

    // Eigen map per inzending, zodat twee mensen die tegelijk hetzelfde bedrijf
    // invullen elkaars beeld niet overschrijven.
    const map = "inzendingen/" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);

    const uit = [];
    for (let i = 0; i < bestanden.length; i++) {
      const b = bestanden[i] || {};
      const ext = TOEGESTANE_EXTENSIES.includes(extensieVan(b.naam)) ? extensieVan(b.naam) : "jpg";
      const grootte = Number(b.grootte || 0);

      if (grootte > MAX_BESTAND_BYTES) {
        return NextResponse.json(
          { ok: false, error: `"${b.naam || "bestand"}" is te groot. Maximaal 100 MB per foto.` },
          { status: 400 }
        );
      }

      const rol = b.rol === "logo" ? "logo" : "foto-" + (i + 1);
      const pad = `${map}/${rol}.${ext}`;

      const res = await fetch(`${SUPABASE_URL}/storage/v1/object/upload/sign/${BUCKET}/${pad}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SERVICE_KEY}`,
          apikey: SERVICE_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ expiresIn: 60 * 30 }),
      });

      if (!res.ok) {
        return NextResponse.json(
          { ok: false, error: "Kon de upload niet voorbereiden. Probeer het zo nog eens." },
          { status: 502 }
        );
      }

      const data = await res.json();
      uit.push({
        naam: b.naam || "",
        rol: b.rol === "logo" ? "logo" : "foto",
        uploadUrl: `${SUPABASE_URL}/storage/v1${data.url}`,
        publiekeUrl: `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${pad}`,
      });
    }

    return NextResponse.json({ ok: true, bestanden: uit });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String((e && e.message) || e) }, { status: 500 });
  }
}
