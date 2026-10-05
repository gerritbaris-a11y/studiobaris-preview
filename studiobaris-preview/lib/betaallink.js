// Eén plek voor het adres van de akkoord-/betaalpagina die klanten zien.
// betalen.studiobaris.nl wijst naar dezelfde site als preview.studiobaris.nl;
// oude links op het preview-adres blijven dus ook gewoon werken.
export const BETAAL_BASIS = "https://betalen.studiobaris.nl";

export function betaallinkUrl(slug) {
  return BETAAL_BASIS + "/akkoord/" + slug;
}
