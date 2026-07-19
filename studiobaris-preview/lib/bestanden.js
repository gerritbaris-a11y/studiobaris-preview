// Welke afbeeldingen we aankunnen, en hoe ze bij ons terechtkomen.
//
// TYPE. De site wordt opgebouwd door een tekst- en beeldmodel dat maar vier
// formaten leest: JPG, PNG, WEBP en GIF. Twee gevallen komen in de praktijk
// steeds terug en verdienen een eigen uitleg:
//   - SVG: veel bedrijven hebben hun logo alleen als SVG van hun ontwerper.
//   - HEIC: de standaard van een iPhone. Wie foto's rechtstreeks van zijn
//     telefoon pakt, levert dus bijna altijd HEIC aan.
//
// GROOTTE. Foto's gaan NIET door het formulier heen. Het platform kapt elk
// verzoek boven ~4,5 MB af met een kale "Request Entity Too Large", en dat
// geldt voor het hele formulier bij elkaar. Drie telefoonfoto's zitten daar
// zo overheen. Daarom uploadt de browser elk bestand rechtstreeks naar onze
// opslag en stuurt het formulier alleen de links mee. Die weg kent die grens
// niet, dus mag een bestand hier flink groter zijn.

export const TOEGESTANE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const TOEGESTANE_EXTENSIES = ["jpg", "jpeg", "png", "webp", "gif"];
export const ACCEPT_ATTRIBUUT = ".jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif";

export const MAX_BESTAND_BYTES = 15 * 1024 * 1024;
export const MAX_AANTAL_FOTOS = 12;

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

  if (bestand.size > MAX_BESTAND_BYTES) {
    return `"${naam}" is ${leesbaar(bestand.size)} en daarmee te groot. Maximaal 15 MB per foto.`;
  }

  return null;
}

/** Controleer een lijst. Geeft de eerste fout terug, of null. */
export function controleerBestanden(bestanden, rol) {
  const lijst = Array.from(bestanden || []);
  if (rol === "foto" && lijst.length > MAX_AANTAL_FOTOS) {
    return `Je hebt ${lijst.length} foto's gekozen. Maximaal ${MAX_AANTAL_FOTOS} per keer - meer heeft de site niet nodig.`;
  }
  for (const b of lijst) {
    const fout = controleerBestand(b, rol);
    if (fout) return fout;
  }
  return null;
}
