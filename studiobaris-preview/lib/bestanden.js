// Welke afbeeldingen we aankunnen, en waarom.
//
// Het previewformulier stuurt logo en foto's door naar de AI die de site
// opbouwt. Die kan maar vier formaten lezen: JPG, PNG, WEBP en GIF. Alles
// daarbuiten liep vroeger stuk met een vage "Er ging iets mis" - terwijl de
// twee meestvoorkomende gevallen juist heel begrijpelijk zijn:
//
//   - SVG: veel bedrijven hebben hun logo alleen als SVG van hun ontwerper.
//   - HEIC: de standaard van een iPhone. Wie foto's rechtstreeks van zijn
//     telefoon pakt, levert dus bijna altijd HEIC aan.
//
// Daarom noemen we die twee bij naam, met een oplossing erbij.

export const TOEGESTANE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const TOEGESTANE_EXTENSIES = ["jpg", "jpeg", "png", "webp", "gif"];
export const ACCEPT_ATTRIBUUT = ".jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif";

// LET OP: de echte grens komt niet van ons maar van het platform. Vercel weigert
// elk verzoek boven ongeveer 4,5 MB met een kale "Request Entity Too Large" -
// en dat geldt voor het hele formulier bij elkaar: logo plus alle foto's plus
// de ingevulde tekst. Boven die grens draait onze code niet eens, dus dan kan
// de server ook geen nette melding meer teruggeven.
//
// Daarom bewaken we het TOTAAL, met marge voor de tekstvelden en de overhead
// van het formulier zelf. En daarom moet de controle in de browser gebeuren:
// dat is de enige plek die nog iets zinnigs kan zeggen.
export const MAX_TOTAAL_BYTES = 4 * 1024 * 1024;
export const MAX_BYTES = MAX_TOTAAL_BYTES;

export function extensieVan(naam) {
  const delen = String(naam || "").split(".");
  return delen.length > 1 ? delen.pop().toLowerCase() : "";
}

function leesbaar(bytes) {
  return (bytes / (1024 * 1024)).toFixed(1).replace(".", ",") + " MB";
}

/**
 * Controleer één bestand. Geeft null terug als het goed is, anders een zin
 * die de gebruiker rechtstreeks kan lezen: wat is er mis, met welk bestand,
 * en wat moet hij doen.
 */
export function controleerBestand(bestand, rol) {
  if (!bestand || !bestand.size) return null;
  const naam = bestand.name || "het bestand";
  const ext = extensieVan(naam);
  const type = String(bestand.type || "").toLowerCase();

  if (ext === "svg" || type === "image/svg+xml") {
    return `"${naam}" is een SVG. Die kunnen we niet gebruiken. Vraag om een PNG of JPG, of open de SVG en exporteer 'm als PNG.`;
  }
  if (ext === "heic" || ext === "heif" || type === "image/heic" || type === "image/heif") {
    return `"${naam}" is een HEIC-foto van een iPhone. Zet 'm om naar JPG: open de foto, kies Delen en dan Kopieer foto, of zet in je iPhone-instellingen Camera > Indelingen op "Meest compatibel".`;
  }
  if (ext === "pdf" || type === "application/pdf") {
    return `"${naam}" is een pdf, geen afbeelding. Maak er een schermafbeelding van, of vraag het ${rol === "logo" ? "logo" : "beeld"} als PNG.`;
  }

  const typeOk = TOEGESTANE_TYPES.includes(type);
  const extOk = TOEGESTANE_EXTENSIES.includes(ext);
  if (!typeOk && !extOk) {
    return `"${naam}" is een bestandstype dat we niet kunnen gebruiken. Het moet een JPG, PNG, WEBP of GIF zijn.`;
  }

  if (bestand.size > MAX_BYTES) {
    return `"${naam}" is ${leesbaar(bestand.size)}. Dat past niet: alles bij elkaar mag maximaal 4 MB zijn. Verklein de foto of kies een andere.`;
  }

  return null;
}

/** Controleer een lijst. Geeft de eerste fout terug, of null. */
export function controleerBestanden(bestanden, rol) {
  for (const b of Array.from(bestanden || [])) {
    const fout = controleerBestand(b, rol);
    if (fout) return fout;
  }
  return null;
}

/**
 * Bewaak het totaal van alles wat meegestuurd wordt. Dit is de controle die er
 * echt toe doet: drie foto's van 2 MB zijn los prima, maar samen te veel.
 */
export function controleerTotaal(lijsten) {
  let totaal = 0;
  let aantal = 0;
  for (const lijst of lijsten) {
    for (const b of Array.from(lijst || [])) {
      if (b && b.size) { totaal += b.size; aantal++; }
    }
  }
  if (totaal <= MAX_TOTAAL_BYTES) return null;

  const mb = (totaal / (1024 * 1024)).toFixed(1).replace(".", ",");
  return aantal > 1
    ? `Je verstuurt ${aantal} bestanden van samen ${mb} MB. Samen mag het maximaal 4 MB zijn. Stuur er een paar minder mee, of verklein ze eerst - de site wordt er niet minder van.`
    : `Het bestand is ${mb} MB. Dat mag maximaal 4 MB zijn. Verklein 'm eerst.`;
}
