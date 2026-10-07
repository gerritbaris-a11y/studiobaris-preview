import { NextResponse } from "next/server";
import { leesSessie, isBeheer } from "../../../../lib/auth";
import { getLeadVoorPreview, claimLead } from "../../../../lib/server-data";
import { POST as intakePost } from "../../intake/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://preview.studiobaris.nl";

// De leadlijst kent vakgebieden die de vakfoto-indeling niet herkent. Door er
// een herkenbaar woord bij te zetten krijgen die previews tóch de juiste
// vakfoto's (anders vallen ze terug op algemene stockfoto's).
const BRANCHE = {
  bestrater: "bestrater (tuinbestrating en sierbestrating)",
  groenvoorziening: "groenvoorziening en tuinonderhoud",
  boomverzorger: "boomverzorger (bomen en tuin)",
  tuinaanleg: "tuinaanleg",
};
function branche(v) {
  const k = String(v || "").trim().toLowerCase();
  return BRANCHE[k] || v;
}

// "Preview aanvragen" op de leadlijst = meteen een preview maken, net als het
// goedkeuren van een voorstel op de Vandaag-tab. We vullen het intakeformulier
// met wat we van de lead weten en laten de bestaande intake-route het werk doen
// (AI-teksten, vakfoto's, demo-app, lead koppelen). Duurt ongeveer een minuut.
export async function POST(req) {
  const sessie = leesSessie();
  if (!sessie) return NextResponse.json({ ok: false, error: "Niet ingelogd." }, { status: 401 });
  const naam = sessie.naam;

  const body = await req.json().catch(() => null);
  const id = body && body.id ? String(body.id) : "";
  if (!id) return NextResponse.json({ ok: false, error: "Geen lead opgegeven." }, { status: 400 });

  const lead = await getLeadVoorPreview(id);
  if (!lead) return NextResponse.json({ ok: false, error: "Lead niet gevonden." }, { status: 404 });

  // Er is al een preview: geen tweede maken, gewoon de bestaande teruggeven.
  if (lead.preview_slug) {
    return NextResponse.json({ ok: true, bestond: true, slug: lead.preview_slug, url: `${SITE_URL}/${lead.preview_slug}` });
  }

  // Van een collega? Dan niet. Nog vrij? Dan eerst op jouw naam zetten, zodat
  // niemand anders tegelijk dezelfde preview start.
  if (lead.owner && lead.owner !== naam && !isBeheer(sessie)) {
    return NextResponse.json({ ok: false, error: `Deze lead is opgepakt door ${lead.owner}.` }, { status: 409 });
  }
  if (!lead.owner) {
    const c = await claimLead(id, naam);
    if (!c.ok) {
      return NextResponse.json({ ok: false, error: `Deze lead is net opgepakt door ${c.owner || "een collega"}.` }, { status: 409 });
    }
  }

  const fd = new FormData();
  const zet = (k, w) => { const t = w ? String(w).trim() : ""; if (t) fd.set(k, t); };
  zet("naam", lead.bedrijfsnaam);
  zet("branche", branche(lead.vakgebied));
  zet("regio", lead.plaats);
  zet("telefoon", lead.telefoon);
  zet("email", lead.email);
  zet("adres", lead.adres);
  // Alleen een echte, verouderde site levert bruikbare feiten op.
  const oud = lead.website || (lead.website_status === "VEROUDERD" ? lead.gevonden_url : "");
  if (oud) zet("oude_website", oud);
  // De site van de prospect altijd bewaren (link in het dashboard) en daar de
  // huisstijl van lezen, behalve als het alleen social media of een geparkeerd
  // domein is.
  zet("website", lead.website || lead.gevonden_url);
  if (["ALLEEN SOCIAL", "PARKED", "GEEN SITE"].includes(String(lead.website_status || "").toUpperCase())) fd.set("huisstijl_lezen", "nee");
  zet("notities", lead.reden);
  fd.set("stijl", "stoer");
  fd.set("verzamelaar", naam);
  fd.set("lead_id", id);
  fd.set("bron", "Leadlijst");

  let uit;
  try {
    const res = await intakePost(new Request("http://intern/api/intake", { method: "POST", body: fd }));
    uit = await res.json();
  } catch (e) {
    uit = { ok: false, error: String((e && e.message) || e) };
  }
  if (uit && uit.ok) return NextResponse.json({ ok: true, slug: uit.slug, url: uit.url });
  return NextResponse.json({ ok: false, error: String((uit && uit.error) || "Preview maken mislukt.").slice(0, 300) }, { status: 500 });
}
