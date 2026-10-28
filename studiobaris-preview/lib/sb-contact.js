// Contactgegevens van StudioBaris zoals de prospect ze op de preview ziet
// (balk onderaan, aanbodpagina). Eén plek, zodat ze overal gelijk zijn.
export const SB_TEL = "+31616732105";
export const SB_TEL_TOON = "06 16 73 21 05";
export const SB_WA = "https://wa.me/31616732105";
export const SB_KVK = "42128377";

// Wie de prospect te spreken krijgt. Gelijk aan de ondertekenaar van de
// brieven (lib/brief-instellingen.js), zodat brief en preview één persoon tonen.
export const SB_PERSOON = { naam: "Gerrit", foto: "/sb/gerrit.webp" };

// WhatsApp-link met een vooraf ingevuld bericht.
export function waMet(tekst) {
  return SB_WA + "?text=" + encodeURIComponent(tekst);
}
