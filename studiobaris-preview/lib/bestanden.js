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

// 10 MB per bestand. Een telefoonfoto is 2-5 MB, dus dit is ruim; maar het
// voorkomt dat iemand een RAW-bestand of een scan van 40 MB probeert te sturen.
export const MAX_BYTES = 10 * 1024 * 1024;

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
    return `"${naam}" is ${leesbaar(bestand.size)} en daarmee te groot. Maximaal 10 MB per bestand.`;
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
