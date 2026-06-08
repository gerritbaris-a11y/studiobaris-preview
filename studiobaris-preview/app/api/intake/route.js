import { NextResponse } from "next/server";
import {
  SYSTEM_PROMPT_WF1,
  slugify,
  extractJson,
  validateContent,
} from "../../../lib/intake-helpers";
import { callClaude } from "../../../lib/anthropic";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ipiqrsxbsgylxhgzlhsd.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const BUCKET = "klant-media";

async function uploadImage(file, path) {
  const buf = Buffer.from(await file.arrayBuffer());
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SERVICE_KEY}`,
      apikey: SERVICE_KEY,
      "Content-Type": file.type || "application/octet-stream",
      "x-upsert": "true",
    },
    body: buf,
  });
  if (!res.ok) throw new Error("Upload mislukt: " + (await res.text()));
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
}

async function slugBeschikbaar(slug) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/preview_public?slug=eq.${encodeURIComponent(slug)}&select=slug`,
    { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } }
  );
  const rows = await res.json();
  return !Array.isArray(rows) || rows.length === 0;
}

export async function POST(req) {
  try {
    if (!SERVICE_KEY || !ANTHROPIC_KEY) {
      return NextResponse.json(
        { ok: false, error: "Server niet geconfigureerd: zet SUPABASE_SERVICE_ROLE_KEY en ANTHROPIC_API_KEY." },
        { status: 500 }
      );
    }

    const form = await req.formData();
    const v = (k) => (form.get(k) ? String(form.get(k)).trim() : "");

    const naam = v("naam");
    if (!naam) return NextResponse.json({ ok: false, error: "Bedrijfsnaam is verplicht." }, { status: 400 });

    // Unieke slug bepalen
    let slug = slugify(naam);
    if (!(await slugBeschikbaar(slug))) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;

    // Afbeeldingen uploaden
    let logoUrl = "";
    const fotoUrls = [];
    const logo = form.get("logo");
    if (logo && typeof logo === "object" && logo.size > 0) {
      const ext = (logo.name.split(".").pop() || "png").toLowerCase();
      logoUrl = await uploadImage(logo, `${slug}/logo.${ext}`);
    }
    const fotos = form.getAll("fotos").filter((f) => f && typeof f === "object" && f.size > 0);
    for (let i = 0; i < fotos.length; i++) {
      const ext = (fotos[i].name.split(".").pop() || "jpg").toLowerCase();
      fotoUrls.push(await uploadImage(fotos[i], `${slug}/foto-${i + 1}.${ext}`));
    }

    // Onderzoekstekst opbouwen voor Claude
    const docText = [
      `Naam: ${naam}`,
      `Branche (kan meerdere zijn): ${v("branche")}`,
      `Slogan: ${v("slogan")}`,
      `Diensten: ${v("diensten")}`,
      `Kernwaarden: ${v("kernwaarden")}`,
      `E-mail: ${v("email")}`,
      `Telefoonnummer: ${v("telefoon")}`,
      `Regio('s) actief: ${v("regio")}`,
      `Adres: ${v("adres")}`,
      `KVK: ${v("kvk")}`,
      `Sociale media: ${v("socials")}`,
      `Google Bedrijfsprofiel: ${v("google_business") ? "ja" + (v("google_url") ? " (" + v("google_url") + ")" : "") : "niet aangegeven"}`,
      `Tone of voice: ${v("tone_of_voice")}`,
      `Kleurvoorkeur: ${v("kleurvoorkeur")}`,
      logoUrl ? `Logo aanwezig (url): ${logoUrl}` : "Logo: niet aangeleverd",
      fotoUrls.length ? `Aantal foto's aangeleverd: ${fotoUrls.length}` : "Foto's: niet aangeleverd",
      "",
      "Vrije onderzoeksnotities:",
      v("notities"),
    ].join("\n");

    // Claude aanroepen + valideren
    const raw = await callClaude(SYSTEM_PROMPT_WF1, docText);
    const content = extractJson(raw);
    const fout = validateContent(content);
    if (fout) return NextResponse.json({ ok: false, error: fout, raw }, { status: 422 });

    // Echte afbeeldings-URL's injecteren
    content.merk = content.merk || {};
    if (logoUrl) content.merk.logo_url = logoUrl;
    if (fotoUrls.length) {
      content.projecten = Array.isArray(content.projecten) ? content.projecten : [];
      fotoUrls.forEach((url, i) => {
        if (content.projecten[i]) content.projecten[i].beeld_url = url;
        else content.projecten.push({ titel: "Project", plaats: "", beeld_url: url });
      });
    }
    if (content.seo) content.seo.noindex = true;

    // _review apart bewaren (interne notitie), niet in de publiek leesbare content
    const review = content._review || {};
    delete content._review;

    // Wegschrijven naar Supabase via beveiligde RPC (workflow-schema staat niet open voor REST)
    const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/create_preview`, {
      method: "POST",
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        p_slug: slug,
        p_company: naam,
        p_content: content,
        p_phone: v("telefoon"),
        p_email: v("email"),
        p_source: "intakeformulier",
        p_notes: JSON.stringify(review),
      }),
    });
    if (!insertRes.ok) {
      return NextResponse.json({ ok: false, error: "Opslaan mislukt: " + (await insertRes.text()) }, { status: 500 });
    }

    const origin = new URL(req.url).origin;
    return NextResponse.json({
      ok: true,
      slug,
      url: `${origin}/${slug}`,
      review: content._review || {},
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
