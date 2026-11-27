// Behandelingen voor de testagenda van een salonpreview.
//
// Vroeger kreeg elke salon een vaste standaardlijst op basis van de branche
// (sb_agenda_standaard). Viel de branche buiten de herkenning, dan kwam er een
// kapperslijst in (zo kreeg een pedicurepraktijk "Wassen en föhnen").
// Nu volgen de behandelingen de salon zelf:
//   1. content.behandelingen (door de intake geschreven, met duur en prijs);
//   2. anders de diensten op de preview (content.diensten), met een
//      realistische indicatie van duur en prijs per soort behandeling;
//   3. pas als beide ontbreken de standaardlijst per vak in de database.
// Prijzen en duur zijn een indicatie voor de demo; de salon past ze zelf aan.

// Volgorde telt: de eerste die past wint. [patroon, duur_min, prijs, vanaf]
const INDICATIE = [
  [/voetreflex|reflexzone/i, 60, 49.5, false],
  [/nagels? (knippen|bijwerken)/i, 20, 22.5, false],
  [/medisch.*pedicure|diabet|reuma|steunzool|orthese|podo/i, 45, 45, false],
  [/pedicure|voetverzorg|voetzorg|eelt|likdoorn/i, 45, 37.5, false],
  [/voetmassage|handmassage|stoelmassage/i, 30, 32.5, false],
  [/massage|ontspanning|hot ?stone/i, 60, 59, false],
  [/biab|acryl|gel ?nagels|nieuwe set/i, 75, 52.5, false],
  [/opvul/i, 60, 45, false],
  [/gellak|gelpolish|shellac/i, 45, 32.5, false],
  [/manicure|nagel|nail/i, 30, 25, false],
  [/kleur|verf|uitgroei|toning/i, 90, 55, true],
  [/balayage|highlight|ombr|blond/i, 150, 125, true],
  [/permanent|keratine|straighten/i, 120, 95, true],
  [/extension|hairextension/i, 120, 150, true],
  [/bruid|bruiloft|opsteek/i, 60, 65, true],
  [/skin ?fade|fade/i, 45, 30, false],
  [/baard|scheren|shave/i, 20, 15, false],
  [/kind/i, 20, 19.5, false],
  [/knip|kapsel|styl|föhn|fohn|haar/i, 45, 42.5, false],
  [/wimperextension|lash ?extension|volume ?lash/i, 120, 85, false],
  [/wimper|lash/i, 60, 55, false],
  [/brow|wenkbrauw/i, 45, 45, false],
  [/permanente make-?up|pmu|microblad/i, 120, 250, true],
  [/make-?up|visagie/i, 45, 45, false],
  [/laser|ipl|elektrisch ontharen|epileren/i, 30, 49, true],
  [/hars|wax|ontharen|suikeren|sugaring/i, 30, 29.5, true],
  [/peeling|microderm|needling|oxygen|huidverbeter|acne|huidanalyse|huidtherap/i, 60, 75, true],
  [/gezicht|facial|huid|schoonheid/i, 60, 59, false],
  [/zonnebank|zonnestudio|bruin|spray ?tan/i, 15, 9.5, true],
  [/tattoo|piercing/i, 60, 75, true],
  [/intake|consult|advies|kennismaking/i, 30, null, false],
];
const STANDAARD = [45, 45, true];

function indicatie(tekst) {
  for (const [re, duur, prijs, vanaf] of INDICATIE) if (re.test(tekst)) return [duur, prijs, vanaf];
  return STANDAARD;
}

const schoon = (s, max) => String(s || "").replace(/\s+/g, " ").trim().slice(0, max);

// Lijst die naar sb_agenda_behandelingen_zet gaat, of [] als er niets bruikbaars is.
export function behandelingenUitContent(content) {
  const c = content || {};
  const categorieStandaard = schoon((c.bedrijf && c.bedrijf.branche) || "Behandelingen", 40) || "Behandelingen";

  // 1. Door de intake geschreven behandelingen.
  const eigen = (Array.isArray(c.behandelingen) ? c.behandelingen : [])
    .map((b) => {
      const naam = schoon(b && b.naam, 80);
      if (!naam) return null;
      const [d, p, v] = indicatie(naam);
      const duur = Math.round(Number(b.duur_min));
      const prijs = Number(b.prijs);
      return {
        categorie: schoon(b.categorie, 40) || categorieStandaard,
        naam,
        omschrijving: schoon(b.omschrijving, 240) || null,
        duur_min: duur >= 5 && duur <= 480 ? duur : d,
        prijs: b.prijs !== "" && b.prijs != null && prijs >= 0 && prijs < 5000 ? prijs : p,
        prijs_vanaf: typeof b.prijs_vanaf === "boolean" ? b.prijs_vanaf : v,
      };
    })
    .filter(Boolean);
  if (eigen.length) return eigen.slice(0, 20);

  // 2. Diensten op de preview.
  const uitDiensten = (Array.isArray(c.diensten) ? c.diensten : [])
    .map((d) => {
      const naam = schoon(d && d.titel, 80);
      if (!naam) return null;
      const [duur, prijs, vanaf] = indicatie(`${naam} ${schoon(d.omschrijving, 300)}`);
      return { categorie: categorieStandaard, naam, omschrijving: schoon(d.omschrijving, 240) || null, duur_min: duur, prijs, prijs_vanaf: vanaf };
    })
    .filter(Boolean);
  return uitDiensten.slice(0, 20);
}

// Tekst voor de terugval in de database (sb_agenda_standaard): branche,
// bedrijfsnaam en diensten samen, zodat "Margareth's voetzorg" ook als
// voetzorg herkend wordt als de branche anders heet.
export function vakTekst(content) {
  const c = content || {};
  const b = c.bedrijf || {};
  const diensten = (Array.isArray(c.diensten) ? c.diensten : []).map((d) => d && d.titel).filter(Boolean);
  return [b.branche, b.naam, ...diensten].filter(Boolean).join(" ").slice(0, 500);
}
