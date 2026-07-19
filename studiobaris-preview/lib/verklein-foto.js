// Foto's klein maken vóór ze de deur uit gaan.
//
// Waarom dit er is: iemand kiest een foto rechtstreeks van zijn telefoon of
// camera. Die kan tientallen megabytes zijn. Dat geeft drie problemen:
//   1. Uploaden duurt eindeloos op 4G, en het lijkt of het formulier hangt.
//   2. De opslag weigert bestanden boven een bepaalde grens.
//   3. Erger nog: zo'n foto komt daarna op de website van de klant terecht.
//      Een bezoeker op zijn telefoon zit dan te wachten op een beeld van 40 MB
//      terwijl 300 KB er precies hetzelfde uitziet.
//
// Daarom verkleinen we in de browser: de langste zijde naar maximaal 2400
// pixels (ruim voor elk scherm, ook een 4K-monitor) en opslaan als JPG. Een
// foto van 80 MB wordt zo meestal een halve MB, zonder zichtbaar verschil.
//
// Het origineel raken we niet aan; we maken een kopie om te versturen.

export const MAX_ZIJDE = 2400;
export const KWALITEIT = 0.85;

/** Logo's blijven PNG (doorzichtige achtergrond) en mogen kleiner blijven. */
const LOGO_MAX_ZIJDE = 1200;

function laadAfbeelding(bestand) {
  return new Promise((klaar, mislukt) => {
    const url = URL.createObjectURL(bestand);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); klaar(img); };
    img.onerror = () => { URL.revokeObjectURL(url); mislukt(new Error("kon de afbeelding niet lezen")); };
    img.src = url;
  });
}

/**
 * Geeft een verkleinde kopie terug, of het origineel als verkleinen niet lukt
 * of niet nodig is. Faalt nooit hard: bij twijfel sturen we gewoon het origineel.
 */
export async function verkleinFoto(bestand, rol) {
  if (typeof document === "undefined" || !bestand || !bestand.type) return bestand;

  // GIF kan geanimeerd zijn; die zouden we stukmaken. Laten we met rust.
  if (bestand.type === "image/gif") return bestand;

  const isLogo = rol === "logo";
  const maxZijde = isLogo ? LOGO_MAX_ZIJDE : MAX_ZIJDE;

  try {
    const img = await laadAfbeelding(bestand);
    const langste = Math.max(img.width, img.height);

    // Al klein genoeg én al een bescheiden bestand? Dan niets doen.
    if (langste <= maxZijde && bestand.size < 1.5 * 1024 * 1024) return bestand;

    const factor = Math.min(1, maxZijde / langste);
    const doek = document.createElement("canvas");
    doek.width = Math.round(img.width * factor);
    doek.height = Math.round(img.height * factor);

    const ctx = doek.getContext("2d");
    if (!ctx) return bestand;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, doek.width, doek.height);

    // Logo's als PNG, zodat een doorzichtige achtergrond doorzichtig blijft.
    // Foto's als JPG; dat scheelt enorm in omvang.
    const naarType = isLogo && bestand.type === "image/png" ? "image/png" : "image/jpeg";

    const blob = await new Promise((r) => doek.toBlob(r, naarType, KWALITEIT));
    if (!blob || blob.size >= bestand.size) return bestand;

    const nieuweNaam = bestand.name.replace(/\.[^.]+$/, "") + (naarType === "image/png" ? ".png" : ".jpg");
    return new File([blob], nieuweNaam, { type: naarType, lastModified: Date.now() });
  } catch {
    return bestand;
  }
}
