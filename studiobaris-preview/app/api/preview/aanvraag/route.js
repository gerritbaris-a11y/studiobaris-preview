import { NextResponse } from "next/server";
import { nieuweAanvraag, getAanbodInfo } from "../../../../lib/aanbod";
import { log } from "../../../../lib/server-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Publiek: de prospect laat op de aanbodpagina (/<slug>/aanbod) zijn nummer
// achter. "starten" = "Ja, ik wil deze website", "vraag" = eerst een vraag.
// De database remt (max 3 per preview per uur) en checkt of de preview
// bestaat. Daarna een mail naar StudioBaris, zodat we snel terugbellen.
// Niets gevoeligs: alleen een telefoonnummer en een voorkeursmoment.

const MOMENTEN = ["Zo snel mogelijk", "Ochtend", "Middag", "Na 18:00"];
const FOUT = {
  telefoon: "Dat telefoonnummer klopt niet helemaal. Kijk je het even na?",
  te_vaak: "We hebben je verzoek al binnen. We bellen je zo snel mogelijk.",
};

function html(s) {
  return String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

async function mail({ slug, bedrijf, soort, telefoon, moment }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  const to = process.env.NOTIFY_EMAIL || "gerritbaris@gmail.com";
  const from = process.env.EMAIL_FROM || "StudioBaris <onboarding@resend.dev>";
  const wat = soort === "starten" ? "wil starten" : "heeft eerst een vraag";
  const body = `
    <h2>${html(bedrijf)} ${wat}</h2>
    <p><strong>Bel:</strong> <a href="tel:${html(telefoon)}">${html(telefoon)}</a><br>
    <strong>Liefst:</strong> ${html(moment || "geen voorkeur")}</p>
    <p><a href="https://preview.studiobaris.nl/${html(slug)}">Preview openen</a> ·
    <a href="https://team.studiobaris.nl/vandaag">Naar Vandaag</a></p>
    <p style="color:#888">Afgehandeld? Vink hem af op Vandaag, dan verdwijnt hij uit de lijst.</p>`;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject: `Bel terug: ${bedrijf} ${wat}`, html: body }),
    });
  } catch {}
}

export async function POST(req) {
  try {
    const b = await req.json();
    const slug = String(b.slug || "");
    const soort = b.soort === "vraag" ? "vraag" : "starten";
    const telefoon = String(b.telefoon || "").slice(0, 30);
    const moment = MOMENTEN.includes(b.moment) ? b.moment : "";
    if (!/^[a-z0-9-]{1,120}$/.test(slug)) {
      return NextResponse.json({ ok: false, error: "Preview niet gevonden." }, { status: 404 });
    }
    const r = await nieuweAanvraag({ slug, soort, telefoon, moment });
    if (!r || r === true) {
      return NextResponse.json({ ok: false, error: "Versturen lukte niet. Bel of app ons op 06 16 73 21 05." }, { status: 500 });
    }
    if (!r.ok) {
      const status = r.error === "te_vaak" ? 429 : 400;
      return NextResponse.json({ ok: false, error: FOUT[r.error] || "Versturen lukte niet. Bel of app ons op 06 16 73 21 05.", code: r.error }, { status });
    }
    const info = await getAanbodInfo(slug);
    const bedrijf = (info && info.bedrijf) || slug;
    await Promise.all([
      mail({ slug, bedrijf, soort, telefoon, moment }),
      log({ persoon: "Klant", soort: "aanvraag", slug, bedrijf, naar: soort, details: `Wil teruggebeld worden (${soort === "starten" ? "wil starten" : "vraag"}) op ${telefoon}${moment ? ", " + moment.toLowerCase() : ""}` }).catch(() => {}),
    ]);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Versturen lukte niet. Bel of app ons op 06 16 73 21 05." }, { status: 500 });
  }
}
