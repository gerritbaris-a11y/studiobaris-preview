import { NextResponse } from "next/server";
import {
  SYSTEM_PROMPT_WF1,
  slugify,
  extractJson,
  validateContent,
} from "../../../lib/intake-helpers";
import { callClaude } from "../../../lib/anthropic";
import { sendPreviewEmail } from "../../../lib/email";
import { maakDemoApp } from "../../../lib/demo-app";
import { log, updateKlant, updateLead, getLead } from "../../../lib/server-data";

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

async function fetchSiteText(url) {
  try {
    let u = String(url).trim();
    if (!/^https?:\/\//i.test(u)) u = "https://" + u;
    const res = await fetch(u, { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(8000) });
    if (!res.ok) return "";
    let html = await res.text();
    html = html
      .replace(/<(script|style|noscript)[^>]*>[\s\S]*?<\/\1>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&[a-z]+;/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
    return html.slice(0, 5000);
  } catch {
    return "";
  }
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
    let logoImage = null;
    const fotoUrls = [];
    const logo = form.get("logo");
    if (logo && typeof logo === "object" && logo.size > 0) {
      const ext = (logo.name.split(".").pop() || "png").toLowerCase();
      logoUrl = await uploadImage(logo, `${slug}/logo.${ext}`);
      const buf = Buffer.from(await logo.arrayBuffer());
      const mt = /^image\/(jpeg|png|gif|webp)$/.test(logo.type || "")
        ? logo.type
        : ext === "jpg" || ext === "jpeg" ? "image/jpeg" : ext === "webp" ? "image/webp" : ext === "gif" ? "image/gif" : "image/png";
      logoImage = { data: buf.toString("base64"), media_type: mt };
    }
    const fotos = form.getAll("fotos").filter((f) => f && typeof f === "object" && f.size > 0);
    for (let i = 0; i < fotos.length; i++) {
      const ext = (fotos[i].name.split(".").pop() || "jpg").toLowerCase();
      fotoUrls.push(await uploadImage(fotos[i], `${slug}/foto-${i + 1}.${ext}`));
    }

    // Onderzoekstekst opbouwen voor Claude (incl. tekst van hun huidige website, indien opgegeven)
    const oudeSite = v("oude_website") ? await fetchSiteText(v("oude_website")) : "";
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
      `BTW-nummer: ${v("btw")}`,
      `Sociale media: ${v("socials")}`,
      `Google Bedrijfsprofiel: ${v("google_business") ? "ja" + (v("google_url") ? " (" + v("google_url") + ")" : "") : "niet aangegeven"}`,
      `Tone of voice: ${v("tone_of_voice")}`,
      `Kleurvoorkeur: ${v("kleurvoorkeur")}`,
      logoUrl ? `Logo aanwezig (url): ${logoUrl}` : "Logo: niet aangeleverd",
      fotoUrls.length ? `Aantal foto's aangeleverd: ${fotoUrls.length}` : "Foto's: niet aangeleverd",
      "",
      "Vrije onderzoeksnotities:",
      v("notities"),
      v("oude_website") ? `Huidige website: ${v("oude_website")}` : "Huidige website: niet aangeleverd",
      oudeSite ? `Tekst van hun huidige website (ter referentie — haal hier bruikbare feiten uit zoals diensten, regio en omschrijvingen; verzin niets):\n${oudeSite}` : "",
    ].join("\n");

    // Claude aanroepen + valideren
    const raw = await callClaude(SYSTEM_PROMPT_WF1, docText, logoImage);
    const content = extractJson(raw);
    const fout = validateContent(content);
    if (fout) return NextResponse.json({ ok: false, error: fout, raw }, { status: 422 });

    // Gekozen stijl + echte afbeeldings-URL's injecteren
    content.merk = content.merk || {};
    content.merk.stijl = v("stijl") || "stoer";
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
    // Lead-herkomst (intern, niet op de website): bewaren bij de controlepunten.
    if (v("bron")) review.bron = v("bron");
    if (v("interesse")) review.interesse = v("interesse");

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

    // Persoonlijke demo-app klaarzetten: de klant-app in het jasje van deze klant,
    // gevuld met zijn eigen naam, kleuren, projecten en reviews.
    // Mag de intake nooit laten mislukken.
    let demo = null;
    try {
      demo = await maakDemoApp(slug, content);
    } catch (e) {
      console.error("demo-app aanmaken mislukt:", e && e.message);
    }

    // De preview op naam zetten van de collega die hem maakte. Daar hangt zijn
    // omzet aan vast, en hierdoor verschijnt de klant bij "Mijn klanten".
    const verzamelaar = v("verzamelaar");
    if (verzamelaar) {
      try {
        await updateKlant(slug, { verzamelaar, status: "Preview" });
      } catch (e) {
        console.error("verzamelaar zetten mislukt:", e && e.message);
      }
    }

    // De lead afsluiten: status op preview en de koppeling met deze preview leggen.
    const leadId = v("lead_id");
    if (leadId) {
      try {
        const oudeLead = await getLead(leadId);
        await updateLead(leadId, {
          status: "preview",
          preview_slug: slug,
          owner: (oudeLead && oudeLead.owner) || verzamelaar || null,
        });
        await log({
          persoon: verzamelaar || null,
          soort: "lead_status",
          leadId,
          bedrijf: naam,
          van: oudeLead ? oudeLead.status || "nieuw" : null,
          naar: "preview",
        });
      } catch (e) {
        console.error("lead koppelen mislukt:", e && e.message);
      }
    }

    await log({
      persoon: verzamelaar || v("bron") || null,
      soort: "preview",
      slug,
      bedrijf: naam,
      naar: "Preview",
    });

    const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://preview.studiobaris.nl";
    const url = `${SITE_URL}/${slug}`;
    await sendPreviewEmail({ naam, url, review }).catch(() => {});
    return NextResponse.json({ ok: true, slug, url, review, demo });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
