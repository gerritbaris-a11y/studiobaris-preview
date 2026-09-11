// Centrale bedrag- en sequenceType-berekening voor de vijf betaalopties.
// Bewust GEEN "use client": dit moet zowel vanuit servercomponenten/routes
// als vanuit client components (voor de live preview in het afspraakform)
// aangeroepen kunnen worden — zelfde reden als lib/fase.js.
//
// De aanbetaling zelf wordt door de database afgeleid (sb_abonnement_instellen)
// en komt hier binnen via `info.aanbetaling` — deze functie rekent 'm dus
// niet zelf opnieuw uit uit websiteprijs, dat zou op twee plekken dezelfde
// som kunnen laten ontstaan die uit elkaar gaat lopen.

// Optie 1-4: de eerste (machtigings)betaling — website(deel) + eerste maand,
// of bij "alleen_maandelijks" enkel de eerste maand. Altijd sequenceType
// "first": dit is de betaling die het SEPA-mandaat aanmaakt.
export function berekenEersteBetaling(info) {
  const naam = info.company_name || info.slug || "klant";
  const maand = Number(info.maandbedrag) || 0;

  if (info.betaalwijze === "alleen_maandelijks") {
    return {
      bedrag: Math.round(maand * 100) / 100,
      sequenceType: "first",
      omschrijving: `Eerste maand ${naam}`,
    };
  }

  // ineens, twee_termijnen, handmatig (en geen betaalwijze gekozen):
  // allemaal aanbetaling + eerste maand. Het verschil tussen deze wijzes
  // zit al verwerkt in `aanbetaling` zelf (door de database bepaald).
  const aanbetaling = Number(info.aanbetaling) || 0;
  const bedrag = Math.round((aanbetaling + maand) * 100) / 100;
  const omschrijving = aanbetaling > 0
    ? `Website + eerste maand ${naam}`
    : `Eerste maand website ${naam}`;
  return { bedrag, sequenceType: "first", omschrijving };
}

// Optie 5: de slottermijn. Geen "eerste" betaling — dit loopt tegen een
// mandaat dat er (meestal) al is. sequenceType "recurring" zolang er een
// bruikbaar mandaat is (het abonnement staat op "actief"); anders "first",
// voor het uitzonderingsgeval dat er nog geen mandaat is (bijv. bij
// optie 3/"alleen_maandelijks", waar nooit een websitedeel is afgerekend).
export function berekenSlottermijn(info) {
  const naam = info.company_name || info.slug || "klant";
  const websiteprijs = Number(info.websiteprijs) || 0;
  const aanbetaling = Number(info.aanbetaling) || 0;
  const heeftOverride = info.slottermijn_bedrag !== null && info.slottermijn_bedrag !== undefined;
  const bedrag = heeftOverride
    ? Number(info.slottermijn_bedrag)
    : Math.round((websiteprijs - aanbetaling) * 100) / 100;

  const heeftMandaat = Boolean(info.betaal_mandaat_id) && info.betaal_status === "actief";
  return {
    bedrag,
    sequenceType: heeftMandaat ? "recurring" : "first",
    omschrijving: `Slottermijn ${naam}`,
  };
}
