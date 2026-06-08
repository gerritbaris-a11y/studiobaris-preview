// Gedeelde helpers voor de intake- en herzieningsverwerking.

export const CONTENT_SCHEMA = `{
  "bedrijf": {"naam":"","branche":"","telefoon":"","whatsapp":"","email":"","adres":"","kvk":"","regio":"","openingstijden":"","socials":{"facebook":"","instagram":"","linkedin":""}},
  "merk": {"primaire_kleur":"","secundaire_kleur":"","accent_kleur":"#F8F9FA","tekst_kleur":"#334155","koppen_font":"Montserrat","tekst_font":"Inter","toon":"","logo_url":""},
  "hero": {"kop":"","kop_accent":"","subkop":"","cta_tekst":"Offerte aanvragen"},
  "over_ons": "",
  "diensten": [{"titel":"","omschrijving":""}],
  "voordelen": [{"icoon":"","titel":"","tekst":""}],
  "projecten": [{"titel":"","plaats":""}],
  "usps": [],
  "reviews": [{"naam":"","tekst":"","score":5}],
  "cta_blok": {"kop":"","tekst":"","knop":""},
  "seo": {"titel":"","meta_omschrijving":"","noindex": true},
  "_review": {"ontbrekend": [], "afgeleid": [], "let_op": []}
}`;

export const SYSTEM_PROMPT_WF1 = `Je bent contentassistent voor StudioBaris, een bureau dat snelle previewwebsites voor zzp'ers maakt.
Je krijgt onderzoeksgegevens over een ondernemer en vertaalt die naar website-content volgens een vast JSON-schema.

GEEF UITSLUITEND GELDIGE JSON TERUG volgens exact dit schema (geen tekst eromheen, geen markdown):
${CONTENT_SCHEMA}

HARDE KADERS - hier wijk je nooit van af:
1. Verzin NIETS. Gebruik alleen informatie die is aangeleverd.
   - Geen verzonnen reviews, ervaringsjaren, certificeringen, KvK-nummers of garanties.
   - Staat iets er niet? Laat het veld leeg ("") of de lijst leeg ([]). Zet ontbrekende velden in "_review.ontbrekend".
2. Gebruik NOOIT placeholders zoals "[telefoonnummer]", "Lorem ipsum" of "voorbeeld".
3. Schrijf alle teksten in vlot, correct Nederlands.
4. Tone of voice: volg de aangeleverde tone-of-voice. Staat die er niet, gebruik professioneel en toegankelijk, en noteer dat in "_review.afgeleid".
5. Teksten die je WEL mag formuleren op basis van de feiten: hero.kop (kort en krachtig), hero.kop_accent (de laatste paar woorden van de kop voor de accentkleur), hero.subkop, over_ons (2-3 zinnen), dienstomschrijvingen, cta-teksten, usps (3 concrete punten), voordelen (3 stuks met een passend emoji-icoon). Baseer alles op de feiten; voeg geen claims toe.
6. Kleuren: primaire_kleur = een diepe donkere basiskleur (hero/header), secundaire_kleur = een warme actiekleur (knoppen). Geldige hex-codes. Is er een kleurvoorkeur of logo, gebruik die als basis en noteer in "_review.afgeleid".
7. reviews: alleen overnemen als ze expliciet zijn aangeleverd, anders [].
8. projecten: alleen als er projecten/foto's worden genoemd, anders []. Verzin geen plaatsnamen.
9. seo.noindex blijft altijd true.
10. Vul "_review.let_op" met punten die een mens moet controleren voor publicatie.`;

export const SYSTEM_PROMPT_REVISE = `Je werkt een bestaande previewwebsite van StudioBaris bij op basis van een ingevuld formulier.
Je krijgt: (A) de huidige website-JSON en (B) de antwoorden uit het formulier.

GEEF UITSLUITEND DE BIJGEWERKTE JSON TERUG volgens hetzelfde schema (geen tekst eromheen, geen markdown):
${CONTENT_SCHEMA}

HARDE KADERS:
1. Wijzig ALLEEN wat het formulier aanvult of corrigeert. Laat al het andere exact ongemoeid - je behoudt wat al goed was.
2. Verzin niets; gebruik alleen de aangeleverde antwoorden. Ontbreekt iets, dan blijft het bestaande veld staan.
3. Geen placeholders. Correct Nederlands. Respecteer de bestaande tone of voice, tenzij het formulier expliciet om een andere toon vraagt.
4. Behoud bestaande beeld-URL's (merk.logo_url, beeld_url's) tenzij het formulier nieuwe aanlevert.
5. seo.noindex blijft altijd true.
6. Vul "_review.let_op" met een korte lijst van wat je precies hebt gewijzigd, zodat een mens het kan controleren voor publicatie.`;

export function slugify(naam) {
  const s = String(naam || "bedrijf")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return s || "bedrijf";
}

export function extractJson(text) {
  if (!text) return null;
  let t = String(text).trim();
  t = t.replace(/^```(json)?/i, "").replace(/```$/i, "").trim();
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(t.slice(start, end + 1));
  } catch {
    return null;
  }
}

export function validateContent(content) {
  if (!content || typeof content !== "object") return "Geen geldige JSON ontvangen.";
  const b = content.bedrijf || {};
  if (!b.naam) return "Bedrijfsnaam ontbreekt in de gegenereerde content.";
  if (!b.branche) return "Branche ontbreekt in de gegenereerde content.";
  if (/lorem ipsum/i.test(JSON.stringify(content))) return "Output bevat placeholder-tekst (Lorem ipsum).";
  return null;
}
