// Voorbeeld-content voor de PREVIEW (verkoop-demo).
//
import { nicheKey } from "./preview-assets";

// Vult lege velden met bewust-neppe voorbeelden (bv. "06 12345678",
// "info@voorbeeld.nl") zodat een preview nooit kaal oogt en de maximale
// potentie laat zien. Wordt ALLEEN in de preview-render toegepast; de echte
// klantsite (WordPress) krijgt dit niet en blijft leeg tot de klant zijn
// eigen gegevens aanlevert. De waarden zijn expres herkenbaar als voorbeeld.

const VB = {
  telefoon: "06 12345678",
  email: "info@voorbeeld.nl",
  adres: "Voorbeeldstraat 12, 1234 AB Voorbeeldstad",
  regio: "Voorbeeldstad en omstreken",
  openingstijden: "ma–vr 08:00–17:00",
};

function leeg(v) {
  return v === undefined || v === null || (typeof v === "string" && v.trim() === "");
}

const VOORBEELD_DIENSTEN = [
  { titel: "Onze belangrijkste dienst", omschrijving: "Vertel hier kort wat je aanbiedt en waarom klanten voor je kiezen. Dit is voorbeeldtekst die je later vervangt." },
  { titel: "Tweede dienst", omschrijving: "Een heldere omschrijving in één of twee zinnen: wat je doet en voor wie. Voorbeeldtekst." },
  { titel: "Derde dienst", omschrijving: "Nog een dienst met een korte, duidelijke uitleg. Voorbeeldtekst." },
];

const VOORBEELD_VOORDELEN = [
  { titel: "Eerlijk", tekst: "Wat het kost en wat het wordt, u hoort het vooraf. Geen verrassingen halverwege." },
  { titel: "Betrouwbaar", tekst: "Afspraak is afspraak. Verandert er iets, dan hoort u dat direct." },
  { titel: "Vakwerk", tekst: "Het verschil zit in de afwerking. Daar maken we geen concessies." },
];

const VOORBEELD_REVIEWS = [
  { tekst: "Snel geregeld en keurig afgewerkt. Zeker een aanrader.", naam: "Jan (voorbeeld)", score: 5 },
  { tekst: "Netjes op tijd en een eerlijke prijs. Heel tevreden.", naam: "Petra (voorbeeld)", score: 5 },
  { tekst: "Meedenkend, vakkundig en alles goed opgeleverd.", naam: "Mark (voorbeeld)", score: 5 },
];

// Salons (esthetiek): voorbeeldreviews per vak, in de toon van salonklanten.
const SALON_REVIEWS = {
  kapper: [
    { tekst: "Eindelijk een kapper die echt luistert. Precies het kapsel dat ik in mijn hoofd had, en het zit nog steeds goed.", naam: "Sanne (voorbeeld)", score: 5 },
    { tekst: "Heerlijk ontspannen sfeer en een prachtige kleur. Ik krijg er overal complimenten over.", naam: "Lotte (voorbeeld)", score: 5 },
    { tekst: "Snel en makkelijk online geboekt. Mijn zoon en ik zijn allebei super blij met het resultaat.", naam: "Mariska (voorbeeld)", score: 5 },
  ],
  barbier: [
    { tekst: "Strakste fade van de stad. Online een plek geboekt en direct geholpen, zonder wachten.", naam: "Youssef (voorbeeld)", score: 5 },
    { tekst: "Baard netjes in model en een goed gesprek erbij. Elke drie weken vaste prik.", naam: "Daan (voorbeeld)", score: 5 },
    { tekst: "Relaxte sfeer, vakmensen en altijd hetzelfde goede resultaat.", naam: "Kevin (voorbeeld)", score: 5 },
  ],
  nagels: [
    { tekst: "Mijn BIAB zit na drie weken nog perfect. Super precies gewerkt en heel gezellig.", naam: "Esra (voorbeeld)", score: 5 },
    { tekst: "Prachtige nail art, precies zoals op mijn voorbeeldfoto. Ik kom zeker terug!", naam: "Kim (voorbeeld)", score: 5 },
    { tekst: "Schone, rustige salon en een heerlijke pedicure. Echt een uurtje voor mezelf.", naam: "Anouk (voorbeeld)", score: 5 },
  ],
  beauty: [
    { tekst: "Mijn huid voelt weer fris en rustig. Fijne behandeling met goed persoonlijk advies.", naam: "Fleur (voorbeeld)", score: 5 },
    { tekst: "Heerlijk ontspannen en een prachtige wimperlift. Ik word elke ochtend blij wakker.", naam: "Naomi (voorbeeld)", score: 5 },
    { tekst: "Je voelt je hier meteen welkom. Lieve, deskundige behandeling en een mooi resultaat.", naam: "Ilse (voorbeeld)", score: 5 },
  ],
};

const SALON_USPS = [
  "Online afspraak maken, ook 's avonds",
  "Persoonlijk advies bij elke behandeling",
  "Ontspannen sfeer in de salon",
];

const VOORBEELD_USPS = [
  "Gratis en vrijblijvende offerte",
  "Ruime ervaring in de regio",
  "Nette afwerking, op tijd klaar",
];

// Geeft een kopie van de content terug waarin lege velden zijn opgevuld met
// voorbeelden. Bestaande (echte) waarden worden nooit overschreven.
export function vulVoorbeeld(content) {
  const c = { ...(content || {}) };
  const b = { ...(c.bedrijf || {}) };
  const hero = { ...(c.hero || {}) };
  const cta = { ...(c.cta_blok || {}) };

  if (leeg(b.telefoon)) b.telefoon = VB.telefoon;
  if (leeg(b.whatsapp)) b.whatsapp = b.telefoon || VB.telefoon;
  if (leeg(b.email)) b.email = VB.email;
  if (leeg(b.adres)) b.adres = VB.adres;
  if (leeg(b.regio)) b.regio = VB.regio;
  if (leeg(b.openingstijden)) b.openingstijden = VB.openingstijden;

  if (leeg(hero.subkop)) {
    hero.subkop = SALON_REVIEWS[nicheKey(b.branche)]
      ? `Welkom in de salon in ${b.regio}. Kies je behandeling en boek direct online een tijd die jou past.`
      : `Vakwerk in ${b.regio}, netjes afgewerkt en op tijd opgeleverd. Vraag vrijblijvend een offerte aan.`;
  }

  // "Over"-sectie staat standaard in het menu; zonder eigen tekst een korte,
  // feitelijke zin uit wat we wél weten (geen verzonnen claims).
  const overOns = !leeg(c.over_ons)
    ? c.over_ons
    : `${b.naam || "Wij"} is ${b.branche ? "uw " + String(b.branche).toLowerCase() : "actief"} in ${b.regio}. Vertel hier straks in een paar zinnen wie je bent, hoe je werkt en waar je trots op bent.`;

  const diensten = Array.isArray(c.diensten) && c.diensten.length ? c.diensten : VOORBEELD_DIENSTEN;
  const voordelen = Array.isArray(c.voordelen) && c.voordelen.length ? c.voordelen : VOORBEELD_VOORDELEN;
  const echteReviews = Array.isArray(c.reviews) && c.reviews.length > 0;
  const salon = SALON_REVIEWS[nicheKey(b.branche)];
  const reviews = echteReviews ? c.reviews : salon || VOORBEELD_REVIEWS;
  const usps = Array.isArray(c.usps) && c.usps.length ? c.usps : salon ? SALON_USPS : VOORBEELD_USPS;

  // reviews_voorbeeld: de preview toont dan onder de reviews een regel over
  // reviews opvragen met de app (app/[slug]/review-brug.js).
  return { ...c, over_ons: overOns, bedrijf: b, hero, cta_blok: cta, diensten, voordelen, reviews, reviews_voorbeeld: !echteReviews, usps };
}
