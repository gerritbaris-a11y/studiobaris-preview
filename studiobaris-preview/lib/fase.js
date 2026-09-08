// Gedeelde fase-logica voor de klantreis (Preview → Akkoord → Klaar).
// Bewust GEEN "use client": dit bestand wordt zowel door de klikbare
// fasebalk (client component in dashboard-actions.js) als door de
// servercomponent op /klanten aangeroepen. Importeer je normFase() vanuit
// een "use client"-bestand in een servercomponent, dan krijg je op de
// server alleen een client-referentie terug (geen aanroepbare functie) —
// vandaar dit aparte, neutrale bestand.
export const FASES = ["Preview", "Akkoord", "Klaar"];

const OUD_NAAR_NIEUW = {
  "Gebeld": "Preview",
  "Preview klaar": "Preview",
  "Klant-intake": "Akkoord",
  "Feedback 1": "Akkoord",
  "Feedback 2": "Akkoord",
  "Wachten op feedback 1": "Akkoord",
  "Wachten op feedback 2": "Akkoord",
  "Wachten op feedback 3": "Akkoord",
};

// Vertaalt een pipeline_status (nieuw of nog oud, fijnmaziger) naar één van
// de 3 fases. Gebruikt door zowel de klikbare fasebalk als de filterknoppen
// op /klanten, zodat die twee altijd hetzelfde zeggen.
export function normFase(huidige) {
  const norm = OUD_NAAR_NIEUW[huidige] || huidige;
  return FASES.includes(norm) ? norm : "Preview";
}
