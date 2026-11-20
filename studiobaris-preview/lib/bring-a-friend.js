// Bring a friend — server-only hulpjes voor de dagelijkse cron.
//
// Een gratis maand werkt zo:
//  1. Bij Mollie de volgende incasso van het abonnement één maand opschuiven
//     (startDate van de subscription = incassodatum + 1 maand). Daarmee wordt
//     déze maand niet afgeschreven. Het mandaat blijft precies zoals het was.
//  2. Pas als dat gelukt is: de maandfactuur maken met een kortingsregel ter
//     grootte van het maandbedrag (totaal € 0,00), mailen als vooraankondiging
//     en meteen op 'betaald' zetten.
//  3. Het tegoed op 'verrekend' zetten.
//
// Lukt stap 1 niet, dan loopt de maand gewoon normaal (gewone factuur, gewone
// incasso), blijft het tegoed staan voor de maand erna, en komt er een taak op
// het Bord. Zo wordt er nooit iets "gratis" gefactureerd terwijl Mollie toch
// afschrijft.
//
// Meerdere vrienden aangebracht = meerdere tegoeden: elke maand wordt er één
// verrekend, dus die gratis maanden komen vanzelf achter elkaar.

export const OMSCHRIJVING_GRATIS = "Gratis maand — Bring a friend";

// "2026-12-05" -> "2027-01-05". De incassodag is bij StudioBaris altijd ≤ 27
// (zie incassodagVoor in lib/mollie.js), dus de dag bestaat in elke maand.
export function maandLater(iso) {
  const [j, m, d] = String(iso).slice(0, 10).split("-").map(Number);
  let jaar = j;
  let maand = m + 1;
  if (maand > 12) { maand = 1; jaar += 1; }
  const laatste = new Date(Date.UTC(jaar, maand, 0)).getUTCDate();
  const dag = Math.min(d, laatste);
  return `${jaar}-${String(maand).padStart(2, "0")}-${String(dag).padStart(2, "0")}`;
}

export function regelsGratisMaand(maandbedrag, periode, tegoed, omschrijvingMaand) {
  const bedrag = Number(maandbedrag) || 0;
  const naam = tegoed && tegoed.gekoppeld_aan_naam ? ` (${tegoed.gekoppeld_aan_naam})` : "";
  return [
    { omschrijving: omschrijvingMaand, bedrag_excl: bedrag, periode },
    { omschrijving: OMSCHRIJVING_GRATIS + naam, bedrag_excl: -bedrag, periode, bring_a_friend: true },
  ];
}

export function isGratisMaand(f) {
  if (!f || f.soort !== "maandelijks") return false;
  if (Number(f.bedrag_incl) !== 0) return false;
  const regels = (f.snapshot && Array.isArray(f.snapshot.regels)) ? f.snapshot.regels : [];
  return regels.some((r) => r && r.bring_a_friend);
}
