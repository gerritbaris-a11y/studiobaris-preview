// Voorbeeld-content voor de PREVIEW (verkoop-demo).
//
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
    hero.subkop = `Vakwerk in ${b.regio}, netjes afgewerkt en op tijd opgeleverd. Vraag vrijblijvend een offerte aan.`;
  }

  const diensten = Array.isArray(c.diensten) && c.diensten.length ? c.diensten : VOORBEELD_DIENSTEN;
  const voordelen = Array.isArray(c.voordelen) && c.voordelen.length ? c.voordelen : VOORBEELD_VOORDELEN;
  const reviews = Array.isArray(c.reviews) && c.reviews.length ? c.reviews : VOORBEELD_REVIEWS;
  const usps = Array.isArray(c.usps) && c.usps.length ? c.usps : VOORBEELD_USPS;

  return { ...c, bedrijf: b, hero, cta_blok: cta, diensten, voordelen, reviews, usps };
}
