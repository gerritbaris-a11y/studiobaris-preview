// Vaste onderdelen van de brief die niet per prospect verschillen.
// Server-only.
//
// AFZENDER_FOTOS: kleine ronde portretfoto naast de ondertekening, per
// afzender (voornaam in kleine letters, zoals in de werkplek-login).
// Waarde: PNG als base64 (al rond uitgesneden, transparante hoeken,
// ca. 300×300 px). Staat er voor een afzender niets, dan komt er geen foto.
//
// BRIEF_REVIEW: één echte review van een bestaande klant, met toestemming,
// in de zijkolom onder de QR-code. null = geen review op de brief.
//   { tekst: "…", naam: "Voornaam Achternaam", plaats: "Plaats" }

export const AFZENDER_FOTOS = {
  // gerrit: "iVBORw0KGgo…",
  // levi: "iVBORw0KGgo…",
};

export const BRIEF_REVIEW = null;
