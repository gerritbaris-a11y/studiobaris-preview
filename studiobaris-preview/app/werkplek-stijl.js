// Gedeelde stijl + kop/navigatie voor de herontworpen werkplek.
// Kleuren en typografie volgen de huisstijl (design.md in Drive: navy, goud, crème).
// Bewust als los onderdeel: de klant-previewsites delen globals.css, die laten we met rust.

export const KLEUR = {
  // Huisstijl StudioBaris (design.md, okt 2026): navy, goud, crème.
  // De oude namen (papier, inkt, klei …) zijn bewust gebleven, zodat alle
  // schermen die ze gebruiken vanzelf meekleuren.
  papier: "#F7F4EE",      // crème — paginagrond
  kaart: "#FFFFFF",
  inkt: "#1A2B3D",        // navy — tekst
  gedempt: "#4A5560",     // lopende/kleine tekst op licht
  label: "#6F7A85",       // labels (vet of groot)
  labelDonker: "#4A5560",
  lijn: "#ECE8DF",
  lijn2: "#E3DED3",
  baan: "#EFEAE0",        // getinte vlakken
  baanRand: "#E3DED3",
  klei: "#1A2B3D",        // actiekleur = navy (knoppen, actieve tab, links)
  kleiDonker: "#2A3D52",
  kleiZacht: "#EFEAE0",
  navy: "#1A2B3D",
  goud: "#C79A56",        // alleen als vlak (gouden knop), nooit als tekst op licht
  goudTekst: "#7E5F28",   // goud als tekst op licht
  // redenkleuren
  rust: { dot: "#B24A3F", tekst: "#9E3B2E", bg: "#F6E1DB" },
  amber: { dot: "#C98A2B", tekst: "#8A6417", bg: "#F7EBD1" },
  sage: { dot: "#5E8C61", tekst: "#4A7A4D", bg: "#E7EFE3" },
  grijs: { dot: "#A3ACB5", tekst: "#4A5560", bg: "#EFEAE0" },
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

// De schermen van de werkplek.
// "Mijn klanten" heet bewust "Mijn previews": dit is de verkooppijplijn van
// vóór het tekenen (leads, previews, intake, feedback) — geen echte klanten.
// Die staan onder de "Klanten"-groep.
//
// Menu ingekort (okt 2026): beheer had 11 knoppen naast elkaar, waardoor de
// balk ging scrollen. Nu 7: losse knoppen voor wat dagelijks gebruikt wordt,
// de rest in uitklapmenu's. Verkopers houden hun 4 losse knoppen (die passen).

// Wat een verkoper ziet: losse knoppen.
export const NAV_VERKOPER = [
  { href: "/klanten", label: "Mijn previews" },
  // Benaderd: welke prospects je hebt benaderd en wat ze daarna deden.
  { href: "/benaderd", label: "Benaderd" },
  // Financieel overzicht: eigen commissie per klant.
  { href: "/verdiensten", label: "Financieel overzicht" },
  { href: "/leads", label: "Leads" },
];

// Wat beheer (Gerrit, Levi) ziet, in deze volgorde. Een item met `items` is
// een uitklapmenu, anders een losse knop.
export const NAV_BEHEER = [
  // "Vandaag": startscherm voor beheer (wekelijkse AI-update, meldingen).
  { href: "/vandaag", label: "Vandaag" },
  {
    label: "Previews",
    items: [
      { href: "/klanten", label: "Mijn previews" },
      { href: "/benaderd", label: "Benaderd" },
      { href: "/leads", label: "Leads" },
    ],
  },
  { href: "/bord", label: "Bord" },
  {
    label: "Cijfers",
    items: [
      { href: "/overzicht", label: "Overzicht" },
      { href: "/team", label: "Team & omzet" },
      { href: "/verdiensten", label: "Financieel overzicht" },
    ],
  },
  {
    label: "Klanten",
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
    items: [
      { href: "/facturen", label: "Facturen" },
      { href: "/offertes", label: "Offertes" },
      { href: "/marges", label: "Marges" },
      { href: "/kosten", label: "Kosten & resultaat" },
      { href: "/boekhouding", label: "Boekhouding" },
    ],
  },
];
