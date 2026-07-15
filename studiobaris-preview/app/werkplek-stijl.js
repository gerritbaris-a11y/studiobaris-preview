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

// De acht schermen van de werkplek. beheer=alles, verkoper=eerste drie.
export const NAV = [
  { href: "/vandaag", label: "Vandaag" },
  { href: "/leads", label: "Leads" },
  { href: "/klanten", label: "Mijn klanten" },
  { href: "/overzicht", label: "Overzicht", beheer: true },
  { href: "/storingen", label: "Storingen", beheer: true },
  { href: "/vragen", label: "Vragen", beheer: true },
  { href: "/kosten", label: "Kosten", beheer: true },
  { href: "/restbetalingen", label: "Restbetalingen", beheer: true },
  { href: "/team", label: "Team & omzet", beheer: true },
];
