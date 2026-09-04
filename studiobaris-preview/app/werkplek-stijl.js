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

export const FONT_LINK =
  "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=Hanken+Grotesk:wght@400;500;600;700;800&display=swap";

export const HEAD = "'Bricolage Grotesque', system-ui, sans-serif";
export const BODY = "'Hanken Grotesk', system-ui, sans-serif";

// De schermen van de werkplek. beheer=alles, verkoper=eerste drie.
// "Mijn klanten" heet bewust "Mijn previews": dit is de verkooppijplijn van
// vóór het tekenen (leads, previews, intake, feedback) — geen echte klanten.
// Die staan onder de "Klanten"-groep hieronder.
export const NAV = [
  { href: "/vandaag", label: "Vandaag" },
  { href: "/leads", label: "Leads" },
  { href: "/klanten", label: "Mijn previews" },
  { href: "/overzicht", label: "Overzicht", beheer: true },
  { href: "/bord", label: "Bord", beheer: true },
  { href: "/boekhouding", label: "Boekhouding", beheer: true },
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
      { href: "/btw-aangifte", label: "Omzet & btw" },
      { href: "/marges", label: "Marges" },
      { href: "/kosten", label: "Kosten & resultaat" },
    ],
  },
];
