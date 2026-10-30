// De stijlen ("jassen") van een preview. Eén lijst voor de hele app: de
// preview zelf, de stijlwisselaar voor de klant, het dashboard (Stijl kiezen,
// Aanpassen) en de API-routes. Een nieuwe stijl hier toevoegen + een
// component in app/styles en hij is overal beschikbaar.
//
// Mag in client- én servercode gebruikt worden (geen server-imports).

export const STIJLEN = [
  {
    id: "stoer",
    naam: "Direct & Stoer",
    kort: "Stoer",
    uitleg: "Donkere hero, krachtig, grote bel-knoppen. Voor wie snel gebeld wil worden.",
    kortUitleg: "Donker, krachtig, grote koppen",
  },
  {
    id: "modern",
    naam: "Licht & Modern",
    kort: "Modern",
    uitleg: "Licht, rustig en typografisch, met uitklapbare diensten.",
    kortUitleg: "Licht, strak en zakelijk",
  },
  {
    id: "persoonlijk",
    naam: "Warm & Persoonlijk",
    kort: "Persoonlijk",
    uitleg: "De vakman centraal, met een persoonlijk verhaal en stappen.",
    kortUitleg: "Warm, met portretfoto",
  },
  {
    id: "ambacht",
    naam: "Ambachtelijk & Klassiek",
    kort: "Ambacht",
    uitleg: "Crème en warm, klassieke schreefletter. Vakmanschap met traditie.",
    kortUitleg: "Klassiek, warm, schreefletter",
  },
  {
    id: "strak",
    naam: "Donker & Strak",
    kort: "Strak",
    uitleg: "Donker, groot beeld en dikke koppen in hoofdletters. Stoer en modern tegelijk.",
    kortUitleg: "Donker, groot beeld, dikke koppen",
  },
];

export const STIJL_IDS = STIJLEN.map((s) => s.id);

export function geldigeStijl(id) {
  return STIJL_IDS.includes(id) ? id : null;
}

// Stijlen voor salons (esthetiek): eigen opzet in app/styles/salon.js.
export const SALON_STIJLEN = [
  { id: "zacht", naam: "Zacht & Licht", kort: "Zacht", uitleg: "Warm, licht en rond. Voor beauty en nagels.", kortUitleg: "Warm, licht, rond" },
  { id: "salonmodern", naam: "Strak & Modern", kort: "Modern", uitleg: "Wit, strak, met een grote foto bovenaan. Voor kappers.", kortUitleg: "Wit, strak, grote foto" },
  { id: "luxe", naam: "Luxe & Donker", kort: "Luxe", uitleg: "Donker met een sterke accentkleur. Voor barbiers en lash-studio's.", kortUitleg: "Donker, luxe" },
  { id: "natuurlijk", naam: "Natuurlijk & Rustig", kort: "Rustig", uitleg: "Zachte aardetinten en veel rust. Voor huidverzorging en wellness.", kortUitleg: "Aardetinten, rustig" },
];
export const SALON_STIJL_IDS = SALON_STIJLEN.map((s) => s.id);

export function geldigeSalonStijl(id) {
  return SALON_STIJL_IDS.includes(id) ? id : null;
}

export function stijlKort(id) {
  const s = STIJLEN.find((x) => x.id === id) || SALON_STIJLEN.find((x) => x.id === id);
  return s ? s.kort : id || "";
}
