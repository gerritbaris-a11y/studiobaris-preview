import { NextResponse } from "next/server";
import { nieuweRonde, schoonSite } from "../../../lib/ronde";
import { getBetaalinfo, log } from "../../../lib/server-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Publiek: de klant stuurt een feedbackronde op zijn gebouwde website in
// (/ronde/<slug>). De database checkt of de klant akkoord heeft gegeven en
// remt (max 3 per uur). Daarna een mail naar StudioBaris.

const HULP = "Versturen lukte niet.";

function html(s) {
  return String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

async function mail({ slug, bedrijf, ronde, antwoorden }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  const to = process.env.NOTIFY_EMAIL || "gerritbaris@gmail.com";
  const from = process.env.EMAIL_FROM || "StudioBaris <onboarding@resend.dev>";
  const regels = Object.entries(antwoorden)
    .map(([k, v]) => `<li><strong>${html(k)}:</strong> ${html(v)}</li>`).join("");
  const body = `
    <h2>${html(bedrijf)}: ${ronde === 3 ? "akkoord, zet de website live" : "feedback ronde " + ronde}</h2>
    ${ronde === 3 ? "<p>Volgende stap: in Mijn previews de overdracht versturen (app-link en document) en het appje Live sturen.</p>" : ""}
    <ul>${regels}</ul>
    <p><a href="https://team.studiobaris.nl/klanten">Naar Mijn previews</a></p>`;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject: ronde === 3 ? `Akkoord, zet live: ${bedrijf}` : `Feedback ronde ${ronde}: ${bedrijf}`, html: body }),
    });
  } catch {}
}

export async function POST(req) {
  try {
    const b = await req.json();
    const slug = String(b.slug || "");
    const ronde = Number(b.ronde) === 3 ? 3 : Number(b.ronde) === 2 ? 2 : 1;
    const site = schoonSite(b.site);
    if (!/^[a-z0-9-]{1,120}$/.test(slug)) {
      return NextResponse.json({ ok: false, error: HULP }, { status: 404 });
    }
    // Alleen tekst, ingekort.
    const antwoorden = {};
    for (const [k, v] of Object.entries(b.antwoorden || {}).slice(0, 12)) {
      antwoorden[String(k).slice(0, 40)] = String(v == null ? "" : v).slice(0, 3000);
    }
    const r = await nieuweRonde({ slug, ronde, site, antwoorden });
    if (!r || r === true || !r.ok) {
      const te = r && r.error === "te_vaak";
      return NextResponse.json({ ok: false, error: te ? "We hebben je feedback al binnen." : HULP }, { status: te ? 429 : 400 });
    }
    const info = await getBetaalinfo(slug);
    const bedrijf = (info && info.company_name) || slug;
    await Promise.all([
      mail({ slug, bedrijf, ronde, antwoorden }),
      log({ persoon: "Klant", soort: "feedback", slug, bedrijf, naar: ronde === 3 ? "akkoord" : "ronde " + ronde, details: ronde === 3 ? "Akkoord gegeven: website mag live" : `Feedback ronde ${ronde} ingestuurd` }).catch(() => {}),
    ]);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: HULP }, { status: 500 });
  }
}
