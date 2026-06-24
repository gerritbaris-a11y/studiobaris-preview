import { NextResponse } from "next/server";
import { SYSTEM_PROMPT_REVISE, extractJson, validateContent } from "../../../lib/intake-helpers";
import { callClaude } from "../../../lib/anthropic";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ipiqrsxbsgylxhgzlhsd.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = "klant-media";

async function getHuidigeContent(slug) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/preview_public?slug=eq.${encodeURIComponent(slug)}&select=content`,
    { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` }, cache: "no-store" }
  );
  const rows = await res.json();
  return Array.isArray(rows) && rows[0] ? rows[0].content : null;
}

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

// Labels voor de velden van het uitgebreide aanpasformulier (Workflow 2).
const VELD_LABELS = {
  wijzigingen: "Wat moet er anders (in eigen woorden)",
  naam: "Bedrijfsnaam",
  branche: "Branche",
  slogan: "Slogan",
  diensten: "Diensten",
  kernwaarden: "Kernwaarden",
  regio: "Regio('s)",
  email: "E-mail",
  telefoon: "Telefoonnummer",
  adres: "Adres",
  kvk: "KVK",
  btw: "BTW-nummer",
  socials: "Sociale media",
  google_business: "Google Bedrijfsprofiel",
  google_url: "Google-profiel link",
  tone_of_voice: "Tone of voice",
  kleurvoorkeur: "Kleurvoorkeur",
  notities: "Extra toelichting",
};

export async function POST(req) {
  try {
    if (!SERVICE_KEY || !process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ ok: false, error: "Server niet geconfigureerd." }, { status: 500 });
    }

    const ct = req.headers.get("content-type") || "";
    const isForm = ct.includes("multipart/form-data") || ct.includes("application/x-www-form-urlencoded");

    let slug = "";
    let type = "intake";
    let antwoorden = {};
    let stijl = "";
    let logoUrl = "";
    let logoImage = null;
    const fotoUrls = [];
    let oudeSite = "";

    if (isForm) {
      // Workflow 2: uitgebreid aanpasformulier (met evt. foto/logo-upload en stijlwissel).
      const form = await req.formData();
      const v = (k) => (form.get(k) ? String(form.get(k)).trim() : "");
      slug = v("slug");
      type = v("type") === "feedback" ? "feedback" : "intake";
      stijl = v("stijl");

      // Tekstuele antwoorden verzamelen (alleen wat is ingevuld).
      for (const k of Object.keys(VELD_LABELS)) {
        const val = v(k);
        if (val) antwoorden[VELD_LABELS[k]] = val;
      }
      if (v("oude_website")) {
        antwoorden["Huidige / oude website"] = v("oude_website");
        oudeSite = await fetchSiteText(v("oude_website"));
      }

      if (!slug) return NextResponse.json({ ok: false, error: "slug ontbreekt." }, { status: 400 });

      // Afbeeldingen uploaden (uniek pad zodat ze bestaande niet overschrijven).
      const stamp = Date.now();
      const logo = form.get("logo");
      if (logo && typeof logo === "object" && logo.size > 0) {
        const ext = (logo.name.split(".").pop() || "png").toLowerCase();
        logoUrl = await uploadImage(logo, `${slug}/logo-${stamp}.${ext}`);
        const buf = Buffer.from(await logo.arrayBuffer());
        const mt = /^image\/(jpeg|png|gif|webp)$/.test(logo.type || "")
          ? logo.type
          : ext === "jpg" || ext === "jpeg" ? "image/jpeg" : ext === "webp" ? "image/webp" : ext === "gif" ? "image/gif" : "image/png";
        logoImage = { data: buf.toString("base64"), media_type: mt };
      }
      const fotos = form.getAll("fotos").filter((f) => f && typeof f === "object" && f.size > 0);
      for (let i = 0; i < fotos.length; i++) {
        const ext = (fotos[i].name.split(".").pop() || "jpg").toLowerCase();
        fotoUrls.push(await uploadImage(fotos[i], `${slug}/foto-${stamp}-${i + 1}.${ext}`));
      }
    } else {
      // Workflow 3: feedbackformulier (JSON met losse antwoorden).
      const body = await req.json();
      slug = body.slug;
      type = body.type === "feedback" ? "feedback" : "intake";
      antwoorden = body.antwoorden || {};
      if (!slug) return NextResponse.json({ ok: false, error: "slug ontbreekt." }, { status: 400 });
    }

    const huidig = await getHuidigeContent(slug);
    if (!huidig) return NextResponse.json({ ok: false, error: "Preview niet gevonden." }, { status: 404 });

    const mediaNotes = [
      logoUrl ? `Nieuw logo aangeleverd (url): ${logoUrl}` : "",
      fotoUrls.length ? `Nieuwe foto's aangeleverd (${fotoUrls.length} stuks) — worden in het portfolio/dienstblokken geplaatst.` : "",
      stijl ? `De klant kiest een andere stijl: ${stijl}.` : "",
    ].filter(Boolean).join("\n");

    const docText =
      `(A) Huidige website-JSON:\n"""\n${JSON.stringify(huidig)}\n"""\n\n` +
      `(B) De klant heeft het aanpasformulier ingevuld. Dit zijn de gewenste wijzigingen en aanvullingen. ` +
      `Pas ALLEEN deze toe en laat al het overige op de site ongemoeid. Verzin niets; gebruik alleen wat hieronder staat:\n"""\n${JSON.stringify(antwoorden, null, 2)}\n"""` +
      (mediaNotes ? `\n\n(C) Aangeleverde media / stijl:\n"""\n${mediaNotes}\n"""` : "") +
      (oudeSite ? `\n\n(D) Tekst van hun huidige/oude website (ter referentie — haal er bruikbare feiten uit, verzin niets):\n"""\n${oudeSite}\n"""` : "");

    const raw = await callClaude(SYSTEM_PROMPT_REVISE, docText, logoImage);
    const content = extractJson(raw);
    const fout = validateContent(content);
    if (fout) return NextResponse.json({ ok: false, error: fout, raw }, { status: 422 });

    const review = content._review || {};
    delete content._review;

    // Gekozen stijl + nieuwe media injecteren in het concept.
    content.merk = content.merk || {};
    if (stijl) content.merk.stijl = stijl;
    if (logoUrl) content.merk.logo_url = logoUrl;
    if (fotoUrls.length) {
      content.projecten = Array.isArray(content.projecten) ? content.projecten : [];
      fotoUrls.forEach((url, i) => {
        if (content.projecten[i]) content.projecten[i].beeld_url = url;
        else content.projecten.push({ titel: "Project", plaats: "", beeld_url: url });
      });
    }
    if (content.seo) content.seo.noindex = true;

    const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/save_concept`, {
      method: "POST",
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ p_slug: slug, p_type: type, p_antwoorden: antwoorden, p_concept: content }),
    });
    if (!r.ok) return NextResponse.json({ ok: false, error: "Opslaan mislukt: " + (await r.text()) }, { status: 500 });

    const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://studiobaris-preview.vercel.app";
    return NextResponse.json({ ok: true, slug, conceptUrl: `${SITE_URL}/${slug}?concept=1`, review });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
