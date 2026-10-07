import { NextResponse } from "next/server";
import { leesSessie, isBeheer } from "../../../../lib/auth";
import { getVoorstel, setVoorstelStatus } from "../../../../lib/taken-data";
import { POST as intakePost } from "../../intake/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STIJLEN = ["stoer", "modern", "persoonlijk"];

function tekst(x) {
  if (Array.isArray(x)) return x.filter(Boolean).join(", ");
  return x ? String(x).trim() : "";
}

// Goedkeuren = meteen de preview maken. We vullen het intakeformulier namens
// de ingelogde collega met de klaargezette intake en laten de bestaande
// intake-route het werk doen (AI-teksten, vakfoto's, demo-app, pipeline,
// lead koppelen). Duurt ongeveer een minuut.
export async function POST(req) {
  const sessie = leesSessie();
  if (!isBeheer(sessie)) return NextResponse.json({ ok: false, error: "Alleen voor beheer." }, { status: 403 });

  const body = await req.json().catch(() => null);
  const id = body && body.id;
  if (!id) return NextResponse.json({ ok: false, error: "Geen voorstel opgegeven." }, { status: 400 });

  let v;
  try {
    v = await getVoorstel(id);
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
  if (!v || !v.id) return NextResponse.json({ ok: false, error: "Voorstel niet gevonden." }, { status: 404 });
  // "bezig" dat al 10 minuten hangt, is vrijwel zeker afgebroken: mag opnieuw.
  const hangt = v.status === "bezig" && v.beoordeeld_op && Date.now() - new Date(v.beoordeeld_op).getTime() > 10 * 60 * 1000;
  if (!["voorgesteld", "mislukt"].includes(v.status) && !hangt) {
    return NextResponse.json({ ok: false, error: "Dit voorstel is al opgepakt." }, { status: 409 });
  }

  const door = sessie.naam || null;
  await setVoorstelStatus(id, "bezig", { door });

  const intake = v.intake || {};
  const fd = new FormData();
  const zet = (k, waarde) => { const t = tekst(waarde); if (t) fd.set(k, t); };
  zet("naam", v.bedrijfsnaam);
  zet("branche", intake.branche || v.vakgebied);
  zet("diensten", intake.diensten);
  zet("regio", intake.regio || v.plaats);
  zet("slogan", intake.slogan);
  zet("kernwaarden", intake.kernwaarden);
  zet("tone_of_voice", intake.tone_of_voice);
  zet("telefoon", v.telefoon);
  zet("email", v.email);
  zet("adres", v.adres);
  // Een offline site of portaalpagina levert niets op; alleen een echte,
  // verouderde site lezen we uit voor extra feiten.
  if (v.website && v.website_status === "verouderd") zet("oude_website", v.website);
  // Site altijd bewaren voor de vergelijk-link; huisstijl alleen van een site die werkt.
  zet("website", v.website);
  if (["offline", "portaal", "geen"].includes(v.website_status)) fd.set("huisstijl_lezen", "nee");
  zet("notities", [v.reden, intake.notities].filter(Boolean).join("\n\n"));
  fd.set("stijl", STIJLEN.includes(intake.stijl) ? intake.stijl : "stoer");
  if (door) fd.set("verzamelaar", door);
  if (v.lead_id) fd.set("lead_id", v.lead_id);
  fd.set("bron", "Voorstel Claude");

  let uit;
  try {
    const res = await intakePost(new Request("http://intern/api/intake", { method: "POST", body: fd }));
    uit = await res.json();
  } catch (e) {
    uit = { ok: false, error: String((e && e.message) || e) };
  }

  if (uit && uit.ok) {
    await setVoorstelStatus(id, "preview_gemaakt", { slug: uit.slug }).catch(() => {});
    return NextResponse.json({ ok: true, slug: uit.slug, url: uit.url });
  }
  const fout = String((uit && uit.error) || "Preview maken mislukt.").slice(0, 300);
  await setVoorstelStatus(id, "mislukt", { fout }).catch(() => {});
  return NextResponse.json({ ok: false, error: fout }, { status: 500 });
}
