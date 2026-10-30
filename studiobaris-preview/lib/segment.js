// Segment van een preview of lead: vakman (standaard) of esthetiek
// (kappers, barbiers, nagel-, beauty- en schoonheidssalons, wimpers/brows).
// Test sinds 30 okt 2026: het tabblad "Previews test" toont alleen esthetiek.
//
// Een preview heeft geen apart segment-veld: we herkennen het aan de branche
// die bij het maken is ingevuld (content.bedrijf.branche, via get_overview als
// b_branche). Een lead uit de esthetieklijst heeft lijst = 'esthetiek'.

const ESTHETIEK = /kap(per|sal|ster)|haar(studio|salon|stylist|werk)|barbier|barber|nagel|nail|beauty|schoonheid|wimper|lash|brow|wenkbrauw|visagie|make-?up|pedicure|manicure|huidverzorg|huidtherap|sal(on|ons)\b/i;

export function isEsthetiekBranche(tekst) {
  return ESTHETIEK.test(String(tekst || ""));
}

// Preview-rij uit get_overview.
export function isEsthetiekPreview(r) {
  return !!r && isEsthetiekBranche(r.b_branche);
}

// Lead-rij (sb_mijn_leads / sb_leads_zoek_v2).
export function isEsthetiekLead(l) {
  if (!l) return false;
  if (l.lijst) return l.lijst === "esthetiek";
  return isEsthetiekBranche(l.vakgebied);
}
