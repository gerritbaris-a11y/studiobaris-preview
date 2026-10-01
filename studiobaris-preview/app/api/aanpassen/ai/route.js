import { NextResponse } from "next/server";
import { leesSessie } from "../../../../lib/auth";
import { CONTENT_SCHEMA, NATUURLIJK_NL, extractJson, validateContent } from "../../../../lib/intake-helpers";
import { laadVoorAanpassen, magAanpassen, schoonInhoud, behoudMedia, FONTS } from "../../../../lib/aanpassen";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const SYSTEEM = `Je past een bestaande previewwebsite van StudioBaris aan op basis van één opdracht van een collega.
Je krijgt (A) de huidige website-JSON en (B) de opdracht.

GEEF UITSLUITEND DE VOLLEDIGE BIJGEWERKTE JSON TERUG (geen tekst eromheen, geen markdown), in hetzelfde schema:
${CONTENT_SCHEMA}

Plus deze velden die je ongewijzigd laat tenzij de opdracht erom vraagt: merk.stijl ("stoer", "modern" of "persoonlijk"), merk.persoon_foto, hero.achtergrond, en beeld_url bij diensten en projecten.

HARDE KADERS:
1. Voer ALLEEN de opdracht uit. Laat al het andere exact zoals het is, inclusief volgorde.
2. Verzin geen feiten: geen reviews, jaartallen, certificaten, garanties, prijzen of plaatsnamen die niet al in de JSON of de opdracht staan.
3. Behoud alle beeld-URL's (logo_url, persoon_foto, hero.achtergrond, beeld_url). Verwijder of verander ze alleen als de opdracht dat expliciet vraagt.
4. Kleuren altijd als #RRGGBB. Is er een logo-afbeelding meegestuurd en vraagt de opdracht om kleuren uit het logo, leid ze daaruit af.
5. Lettertypes alleen uit deze lijst: ${FONTS.join(", ")}.
6. Correct, natuurlijk Nederlands. Geen lange gedachtestreepjes (— of –).
7. seo.noindex blijft true.
8. Zet in "_review.let_op" een korte lijst van wat je precies hebt veranderd.

${NATUURLIJK_NL}`;

async function haalLogo(u) {
  try {
    if (!u) return null;
    const res = await fetch(u, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const type = (res.headers.get("content-type") || "").split(";")[0].toLowerCase();
    if (!/^image\/(jpeg|png|gif|webp)$/.test(type)) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > 4 * 1024 * 1024) return null;
    return { data: buf.toString("base64"), media_type: type };
  } catch {
    return null;
  }
}

async function vraagClaude(system, tekst, beeld) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY ontbreekt.");
  const content = beeld
    ? [{ type: "image", source: { type: "base64", media_type: beeld.media_type, data: beeld.data } }, { type: "text", text: tekst }]
    : tekst;
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
      max_tokens: 12000,
      system,
      messages: [{ role: "user", content }],
    }),
  });
  if (!res.ok) throw new Error("AI-fout: " + (await res.text()).slice(0, 200));
  const data = await res.json();
  if (data.stop_reason === "max_tokens") throw new Error("Het antwoord van de AI was te lang. Maak de opdracht kleiner.");
  return (data.content || []).map((c) => c.text || "").join("");
}

// Voert een opdracht in gewone taal uit op de (nog niet opgeslagen) inhoud uit
// het aanpasscherm en geeft de nieuwe inhoud terug. Er wordt hier niets
// opgeslagen: dat doet het scherm daarna zelf, zodat je het eerst kunt bekijken.
export async function POST(req) {
  const sessie = leesSessie();
  if (!sessie) return NextResponse.json({ ok: false, error: "Niet ingelogd." }, { status: 401 });
  const body = await req.json().catch(() => null);
  const slug = body && typeof body.slug === "string" ? body.slug : "";
  const opdracht = body && typeof body.opdracht === "string" ? body.opdracht.trim().slice(0, 2000) : "";
  if (!slug || !opdracht) return NextResponse.json({ ok: false, error: "Geef een opdracht op." }, { status: 400 });

  try {
    const rij = await laadVoorAanpassen(slug);
    if (!rij) return NextResponse.json({ ok: false, error: "Preview niet gevonden." }, { status: 404 });
    if (!magAanpassen(sessie, rij)) return NextResponse.json({ ok: false, error: "Geen toegang tot deze preview." }, { status: 403 });

    const huidig = schoonInhoud(body.content || rij.werk || rij.content, rij.content);
    const beeld = /logo/i.test(opdracht) ? await haalLogo(huidig.merk && huidig.merk.logo_url) : null;
    const raw = await vraagClaude(
      SYSTEEM,
      `(A) Huidige website-JSON:\n"""\n${JSON.stringify(huidig)}\n"""\n\n(B) Opdracht:\n"""\n${opdracht}\n"""`,
      beeld
    );
    const uit = extractJson(raw);
    const fout = validateContent(uit);
    if (fout) return NextResponse.json({ ok: false, error: "De AI gaf geen bruikbaar resultaat: " + fout }, { status: 422 });
    const wijzigingen = (uit._review && Array.isArray(uit._review.let_op) ? uit._review.let_op : []).slice(0, 10);
    const content = schoonInhoud(behoudMedia(huidig, uit), huidig);
    return NextResponse.json({ ok: true, content, wijzigingen });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String((e && e.message) || e).slice(0, 300) }, { status: 500 });
  }
}
