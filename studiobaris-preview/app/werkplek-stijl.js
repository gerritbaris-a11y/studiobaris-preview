// Gedeelde stijl + kop/navigatie voor de herontworpen werkplek.
// Kleuren en typografie komen uit de design-handoff (warme klei/papier-familie).
// Bewust als los onderdeel: de klant-previewsites delen globals.css, die laten we met rust.

export const KLEUR = {
  papier: "#FBF7F0",
  kaart: "#FFFFFF",
  inkt: "#2B2724",
  gedempt: "#524A40",
  label: "#B0A697",
  labelDonker: "#6B6258",
  lijn: "#ECE4D7",
  lijn2: "#E3DACB",
  baan: "#F4EEE3",
  baanRand: "#E7DFD1",
  klei: "#C05A38",
  kleiDonker: "#9E3B2E",
  kleiZacht: "#F5E2D9",
  // Huisstijl van het beeldmerk zelf (app-icoon, facturen/offertes) — bewust
  // los van de klei-kleuren hierboven, die blijven de actiekleur door de rest
  // van de werkplek (knoppen, actieve tab, links).
  navy: "#1A2B3D",
  goud: "#C79A56",
  // redenkleuren
  rust: { dot: "#B24A3F", tekst: "#9E3B2E", bg: "#F6E1DB" },
  amber: { dot: "#C98A2B", tekst: "#8A6417", bg: "#F7EBD1" },
  sage: { dot: "#5E8C61", tekst: "#4A7A4D", bg: "#E7EFE3" },
  grijs: { dot: "#A99F92", tekst: "#7A7168", bg: "#EFEAE0" },
  klei_r: { dot: "#C05A38", tekst: "#9E3B2E", bg: "#F5E2D9" },
};

export function redenKleur(kleur) {
  if (kleur === "rust") return KLEUR.rust;
  if (kleur === "amber") return KLEUR.amber;
  if (kleur === "sage") return KLEUR.sage;
  if (kleur === "klei") return KLEUR.klei_r;
  return KLEUR.grijs;
}

// Eén lettertype voor alles van StudioBaris: Plus Jakarta Sans (zelfde als
// studiobaris.nl, de preview-tool en de facturen/offertes/brieven). Zelf gehost
// via @font-face in app/globals.css — geen losse <link> naar Google meer nodig.
// Koppen gebruiken gewicht 800, lopende tekst 400–700.
export const FONT = "'Plus Jakarta Sans', system-ui, sans-serif";
export const HEAD = FONT;
export const BODY = FONT;

// De schermen van de werkplek. beheer=alles, verkoper=alleen Mijn previews.
// "Mijn klanten" heet bewust "Mijn previews": dit is de verkooppijplijn van
// vóór het tekenen (leads, previews, intake, feedback) — geen echte klanten.
// Die staan onder de "Klanten"-groep hieronder.
//
// "Leads" staat bewust niet meer in dit menu (verkopers vinden hun leads nu
// zelf, de automatische leadlijst leverde te veel irrelevante leads op) — de
// pagina, /api/leads en de database erachter bestaan nog gewoon, voor als dit
// later weer opgepakt wordt. Alleen uit de navigatie gehaald.
//
// "Vandaag" is terug als startscherm voor beheer, maar nu met de wekelijkse
// AI-update i.p.v. de oude takenlijst (die taken staan op het Bord).
export const NAV = [
  { href: "/vandaag", label: "Vandaag", beheer: true },
  { href: "/klanten", label: "Mijn previews" },
  // Benaderd: welke prospects je hebt benaderd en wat ze daarna deden (okt 2026).
  { href: "/benaderd", label: "Benaderd" },
  // Financieel overzicht: eigen commissie per klant (verkoper), iedereen (beheer).
  { href: "/verdiensten", label: "Financieel overzicht" },
  // Leads: voor iedereen met een login (verkopers én beheer).
  { href: "/leads", label: "Leads" },
  { href: "/overzicht", label: "Overzicht", beheer: true },
  { href: "/bord", label: "Bord", beheer: true },
  { href: "/team", label: "Team & omzet", beheer: true },
];

// Schermen gegroepeerd onder één knop in de navigatie (i.p.v. losse tabbladen)
// — scheelt drukte naarmate hier meer bij komt.
export const NAV_GROEPEN = [
  {
    label: "Klanten",
    beheer: true,
    items: [
      { href: "/klantenregister", label: "Klantenregister" },
      { href: "/adressenlijst", label: "Adressenlijst" },
      { href: "/vakfotos", label: "Vakfoto's" },
      { href: "/abonnementen", label: "Abonnementen" },
      { href: "/restbetalingen", label: "Restbetalingen" },
      { href: "/storingen", label: "Storingen" },
      { href: "/vragen", label: "Vragen" },
    ],
  },
  {
    label: "Financieel",
    beheer: true,
    items: [
      { href: "/facturen", label: "Facturen" },
      { href: "/offertes", label: "Offertes" },
      { href: "/marges", label: "Marges" },
      { href: "/kosten", label: "Kosten & resultaat" },
      { href: "/boekhouding", label: "Boekhouding" },
    ],
  },
];
