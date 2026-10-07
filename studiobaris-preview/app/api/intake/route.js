import { NextResponse } from "next/server";
import { controleerBestand, controleerBestanden } from "../../../lib/bestand-validatie";
import {
  SYSTEM_PROMPT_WF1,
  slugify,
  extractJson,
  validateContent,
} from "../../../lib/intake-helpers";
import { callClaude } from "../../../lib/anthropic";
import { sendPreviewEmail } from "../../../lib/email";
import { maakDemoApp } from "../../../lib/demo-app";
import { vakfotosVoor } from "../../../lib/vakfotos";
import { leesHuisstijl, borgContrast } from "../../../lib/huisstijl";
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

/**
 * Haal een al geüploade afbeelding op zodat het model ernaar kan kijken.
 * De browser heeft 'm rechtstreeks in de opslag gezet; wij halen 'm hier op.
 * Deze weg kent de omvangsgrens van een binnenkomend verzoek niet.
 */
async function uploadBuffer(buf, type, path) {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SERVICE_KEY}`,
      apikey: SERVICE_KEY,
      "Content-Type": type || "application/octet-stream",
      "x-upsert": "true",
    },
    body: buf,
  });
  if (!res.ok) throw new Error("Upload mislukt: " + (await res.text()));
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
}

// Sites waar we wél naar mogen linken, maar waarvan de kleuren niet van de
// ondernemer zijn (social media, klusplatforms): daar lezen we geen huisstijl.
const GEEN_EIGEN_SITE = /facebook\.|instagram\.|linkedin\.|werkspot\.|google\.|goo\.gl|maps\.app|marktplaats\.|tiktok\.|youtube\.|wa\.me|linktr\.ee|houzz\.|trustoo\.|homedeal\./i;

async function haalAfbeelding(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const type = (res.headers.get("content-type") || "").split(";")[0].toLowerCase();
    if (!/^image\/(jpeg|png|gif|webp)$/.test(type)) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return { data: buf.toString("base64"), media_type: type };
  } catch {
    return null;
  }
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
    // Nieuwe weg: de browser heeft de beelden al rechtstreeks in de opslag
    // gezet en stuurt alleen de links mee. Dat moet wel, want een verzoek met
    // foto's erin loopt boven ~4,5 MB stuk voordat deze code draait.
    const meegestuurdLogo = v("logo_url");
    let meegestuurdeFotos = [];
    try {
      const rauw = v("foto_urls");
      if (rauw) meegestuurdeFotos = JSON.parse(rauw).filter((u) => typeof u === "string" && u);
    } catch {
      meegestuurdeFotos = [];
    }

    // Alleen onze eigen opslag vertrouwen; geen willekeurige adressen van buiten.
    const vanOns = (u) => typeof u === "string" && u.startsWith(`${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`);

    if (meegestuurdLogo && vanOns(meegestuurdLogo)) {
      logoUrl = meegestuurdLogo;
      logoImage = await haalAfbeelding(meegestuurdLogo);
    }
    for (const u of meegestuurdeFotos) {
      if (vanOns(u)) fotoUrls.push(u);
    }

    const logo = form.get("logo");

    // Oude weg: kleine bestanden die tóch nog in het formulier zitten. We laten
    // die werken, maar controleren ze wel eerst op type en omvang.
    const bestandsFout =
      controleerBestand(logo, "logo") ||
      controleerBestanden(form.getAll("fotos"), "foto");
    if (bestandsFout) {
      return NextResponse.json({ ok: false, error: bestandsFout }, { status: 400 });
    }

    if (!logoUrl && logo && typeof logo === "object" && logo.size > 0) {
      const ext = (logo.name.split(".").pop() || "png").toLowerCase();
      logoUrl = await uploadImage(logo, `${slug}/logo.${ext}`);
      const buf = Buffer.from(await logo.arrayBuffer());
      // Het type eerlijk bepalen. Vroeger viel dit terug op "image/png" voor
      // alles wat we niet herkenden - een SVG werd dan als PNG aangeboden en
      // liep verderop stuk. Herkennen we het niet, dan laten we het logo
      // gewoon weg bij de beeldanalyse; de site wordt dan zonder gemaakt.
      const perExt = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif" };
      const mt = /^image\/(jpeg|png|gif|webp)$/.test(logo.type || "") ? logo.type : perExt[ext];
      logoImage = mt ? { data: buf.toString("base64"), media_type: mt } : null;
    }
    const fotos = form.getAll("fotos").filter((f) => f && typeof f === "object" && f.size > 0);
    for (let i = 0; i < fotos.length; i++) {
      const ext = (fotos[i].name.split(".").pop() || "jpg").toLowerCase();
      fotoUrls.push(await uploadImage(fotos[i], `${slug}/foto-${i + 1}.${ext}`));
    }

    // Huidige website: voor de link in het dashboard en om de huisstijl
    // (logo + kleuren) over te nemen. "website" is altijd de site van de
    // prospect; "oude_website" alleen als de inhoud ook bruikbaar is.
    const website = v("website") || v("oude_website");
    const huisstijlToegestaan = website && !GEEN_EIGEN_SITE.test(website) && v("huisstijl_lezen") !== "nee";
    let huisstijl = null;
    if (huisstijlToegestaan) {
      try {
        huisstijl = await Promise.race([
          leesHuisstijl(website, naam),
          new Promise((klaar) => setTimeout(() => klaar(null), 25000)),
        ]);
      } catch (e) {
        console.error("huisstijl lezen mislukt:", e && e.message);
      }
    }
    // Logo van de site naar onze eigen opslag (de preview linkt nooit naar
    // een plaatje op hun server), en laten meekijken door de AI.
    let siteLogoUrl = "";
    if (huisstijl && huisstijl.logo) {
      try {
        const ext = { "image/svg+xml": "svg", "image/jpeg": "jpg", "image/jpg": "jpg", "image/webp": "webp", "image/gif": "gif" }[huisstijl.logo.type] || "png";
        siteLogoUrl = await uploadBuffer(huisstijl.logo.buf, huisstijl.logo.type, `${slug}/logo-site.${ext}`);
        if (!logoImage && /^image\/(jpeg|png|gif|webp)$/.test(huisstijl.logo.type)) {
          logoImage = { data: huisstijl.logo.buf.toString("base64"), media_type: huisstijl.logo.type };
        }
      } catch (e) {
        console.error("logo van site opslaan mislukt:", e && e.message);
      }
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
      logoUrl ? `Logo aanwezig (url): ${logoUrl}` : siteLogoUrl ? "Logo: overgenomen van hun huidige website (zie meegestuurde afbeelding)" : "Logo: niet aangeleverd",
      huisstijl && huisstijl.primaire_kleur ? `Huisstijlkleuren van hun huidige website: basis ${huisstijl.primaire_kleur}, accent ${huisstijl.secundaire_kleur} (bron: ${huisstijl.bron}). Gebruik precies deze.` : "",
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
    else if (siteLogoUrl && huisstijl && huisstijl.logoTonen) content.merk.logo_url = siteLogoUrl;

    // Kleuren: wat we zelf van logo/site hebben gemeten gaat vóór wat de AI
    // ervan maakt. Daarna altijd een contrastcontrole.
    let kleurBron = "gegokt";
    if (huisstijl && huisstijl.primaire_kleur) {
      content.merk.primaire_kleur = huisstijl.primaire_kleur;
      content.merk.secundaire_kleur = huisstijl.secundaire_kleur;
      kleurBron = huisstijl.bron;
    } else if (logoImage) {
      kleurBron = "logo (AI)";
    } else if (v("kleurvoorkeur")) {
      kleurBron = "kleurvoorkeur";
    }
    const geborgd = borgContrast(content.merk);
    content.merk = geborgd.merk;
    if (fotoUrls.length) {
      content.projecten = Array.isArray(content.projecten) ? content.projecten : [];
      fotoUrls.forEach((url, i) => {
        if (content.projecten[i]) content.projecten[i].beeld_url = url;
        else content.projecten.push({ titel: "Project", plaats: "", beeld_url: url });
      });
    }

    // Eigen beeldbank per vakgebied (/vakfotos): een achtergrondfoto achter de
    // tekst bovenaan, en - als de klant zelf geen foto's aanleverde - twee
    // projectfoto's. Lukt dit niet of is er niets voor dit vakgebied, dan blijft
    // de preview zoals hij was (stockfoto's als terugval). Nooit een harde fout.
    try {
      const vak = await vakfotosVoor(v("branche") || (content.bedrijf && content.bedrijf.branche) || naam, slug);
      content.hero = content.hero || {};
      if (!content.hero.achtergrond && vak.hero) content.hero.achtergrond = vak.hero;
      if (!fotoUrls.length && vak.projecten.length) {
        content.projecten = Array.isArray(content.projecten) ? content.projecten : [];
        if (content.projecten.length === 0) {
          // Geen projecten genoemd: zelf tegels maken met een vakfoto en de
          // naam van een dienst, anders toont de site alleen stockfoto's.
          const diensten = Array.isArray(content.diensten) ? content.diensten : [];
          vak.projecten.forEach((url, i) => {
            const d = diensten[i] || {};
            content.projecten.push({ titel: d.titel || d.naam || "Recent werk", plaats: "", beeld_url: url });
          });
        } else {
          vak.projecten.forEach((url, i) => {
            if (content.projecten[i] && !content.projecten[i].beeld_url) content.projecten[i].beeld_url = url;
          });
        }
      }
    } catch (e) {
      console.error("vakfoto's kiezen mislukt:", e && e.message);
    }
    if (content.seo) content.seo.noindex = true;

    // Contactgegevens op de preview. Vraagt de publieke intake niet meer om een
    // telefoonnummer, dan zou het contactblok onderaan zonder knoppen komen te
    // staan en de footerkolom leeg blijven - de preview oogt dan half af.
    // Daarom vullen we hier onze eigen gegevens in als terugval. Bewust die van
    // StudioBaris en geen verzonnen nummer: een preview staat op een openbare
    // URL en die knoppen worden echte bel- en WhatsApp-links. Belt iemand toch,
    // dan komt hij bij ons uit in plaats van bij een willekeurige vreemde.
    // Na akkoord komen de echte gegevens van de klant hiervoor in de plaats.
    const SB_TELEFOON = "06 16 73 21 05";
    const SB_EMAIL = "info@studiobaris.nl";
    content.bedrijf = content.bedrijf || {};
    const leeg = (x) => !x || !String(x).trim();
    const terugval = [];
    if (leeg(content.bedrijf.telefoon)) { content.bedrijf.telefoon = SB_TELEFOON; terugval.push("telefoonnummer"); }
    if (leeg(content.bedrijf.whatsapp)) { content.bedrijf.whatsapp = SB_TELEFOON; terugval.push("WhatsApp"); }
    if (leeg(content.bedrijf.email)) { content.bedrijf.email = SB_EMAIL; terugval.push("e-mailadres"); }

    // _review apart bewaren (interne notitie), niet in de publiek leesbare content
    const review = content._review || {};
    delete content._review;
    // Lead-herkomst (intern, niet op de website): bewaren bij de controlepunten.
    if (v("bron")) review.bron = v("bron");
    if (v("interesse")) review.interesse = v("interesse");
    // Toestemming om het logo op studiobaris.nl te tonen na oplevering (backlink).
    review.logo_toestemming = v("logo_toestemming") === "ja";
    // Bestaande website (voor de vergelijk-link in het dashboard) en waar de
    // kleuren vandaan komen, zodat je ziet welke previews extra controle nodig hebben.
    if (website) review.website = /^https?:\/\//i.test(website) ? website : "https://" + website;
    review.kleur_bron = kleurBron;
    if (geborgd.notities.length || kleurBron === "gegokt") {
      review.let_op = Array.isArray(review.let_op) ? review.let_op : [];
      if (kleurBron === "gegokt") review.let_op.push("Kleuren zijn afgeleid uit de branche (geen logo of website gevonden). Controleer de huisstijl.");
      review.let_op.push(...geborgd.notities);
    }
    if (terugval.length) {
      review.let_op = Array.isArray(review.let_op) ? review.let_op : [];
      review.let_op.push(
        `Op de preview staan onze eigen contactgegevens als ${terugval.join(", ")} - ` +
        `de klant heeft die niet aangeleverd. Vervangen door de echte gegevens voordat de site live gaat.`
      );
    }

    // Wie heeft deze preview gemaakt? Een collega vult het formulier ingelogd in,
    // dus dan staat zijn naam in "verzamelaar". Een prospect die vanaf
    // studiobaris.nl op "Gratis preview" klikt is niet ingelogd en heeft die niet.
    // Dat onderscheid leggen we hieronder expliciet vast, zodat het in het
    // dashboard te zien is en niet als een leeg veld hoeft te worden geraden.
    const verzamelaar = v("verzamelaar");
    const herkomst = verzamelaar ? "intakeformulier" : "website";

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
        p_source: herkomst,
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

    // De preview in de pipeline zetten. Is hij door een collega gemaakt, dan ook
    // op zijn naam: daar hangt zijn omzet aan vast, en hierdoor verschijnt de
    // klant bij "Mijn klanten".
    //
    // Bij een aanvraag via de website blijft "verzamelaar" bewust leeg - er is
    // niemand die er omzet aan mag ontlenen, en niemand mag hem per ongeluk in
    // zijn commissie terugzien. De pipeline-status wordt wel gezet, anders komt
    // zo'n aanvraag helemaal niet in je overzicht terecht. update_klant negeert
    // null-waarden, dus de lege verzamelaar overschrijft niets.
    try {
      await updateKlant(slug, { verzamelaar: verzamelaar || null, status: "Preview" });
    } catch (e) {
      console.error("pipeline-status zetten mislukt:", e && e.message);
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
    // Alleen mailen bij een aanvraag via studiobaris.nl (een prospect). Previews
    // die het team zelf maakt (intake, leadlijst, voorstellen) staan al in het
    // dashboard en hoeven geen mail.
    if (herkomst === "website") {
      await sendPreviewEmail({ naam, url, review }).catch(() => {});
    }
    return NextResponse.json({ ok: true, slug, url, review, demo });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
