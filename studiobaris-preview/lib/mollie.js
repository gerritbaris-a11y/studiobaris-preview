// Mollie API-helper (server-only). Sleutel via env: MOLLIE_API_KEY (begint met test_ of live_).
const MOLLIE_API = "https://api.mollie.com/v2";

export function mollieConfigured() {
  return !!process.env.MOLLIE_API_KEY;
}

export async function mollie(path, method = "GET", body) {
  const key = process.env.MOLLIE_API_KEY;
  if (!key) throw new Error("MOLLIE_API_KEY ontbreekt in de serveromgeving.");
  const res = await fetch(`${MOLLIE_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data && data.detail ? data.detail : `Mollie-fout (${res.status})`);
  }
  return data;
}

// Btw (NL standaardtarief, 21%). Ingevoerde bedragen zijn EXCL. btw;
// de klant betaalt INCL. btw. Mollie schrijft altijd het incl.-bedrag af.
export const BTW_TARIEF = 0.21;
export function inclBtw(exclBedrag) {
  const n = Number(exclBedrag) || 0;
  return Math.round(n * (1 + BTW_TARIEF) * 100) / 100;
}
export function btwBedrag(exclBedrag) {
  const n = Number(exclBedrag) || 0;
  return Math.round(n * BTW_TARIEF * 100) / 100;
}

// Eerste maandincasso: één maand vooruit, op de dag die is afgesproken.
// Regel van StudioBaris: je houdt je eigen dag tot en met de 27e; valt de
// akkoorddatum daarna (28/29/30/31), dan schuift de incasso naar de 1e van
// de maand daarop. Zonder die regel bestaat "31 februari" niet en verspringt
// de incassodag elke maand.
export function incassodagVoor(dag) {
  const n = Number(dag);
  if (!n || n < 1) return 1;
  return n <= 27 ? n : 1;
}

// Geeft { datum: "YYYY-MM-DD", dag: n } voor de eerste incasso na vandaag.
export function eersteIncasso(vandaag) {
  const d = vandaag ? new Date(vandaag) : new Date();
  const dagVanAkkoord = d.getDate();
  const dag = incassodagVoor(dagVanAkkoord);

  // Eén maand later. Bij een verschoven dag (28+) wordt dat de 1e van de
  // maand DAARNA, zodat de klant nooit binnen een maand tweemaal betaalt.
  let jaar = d.getFullYear();
  let maand = d.getMonth() + 1;          // 0-based + 1 maand
  if (dagVanAkkoord > 27) maand += 1;    // 31 aug -> 1 okt, niet 1 sep
  while (maand > 11) { maand -= 12; jaar += 1; }

  const mm = String(maand + 1).padStart(2, "0");
  const dd = String(dag).padStart(2, "0");
  return { datum: `${jaar}-${mm}-${dd}`, dag };
}

// Behouden voor bestaande aanroepen: alleen de datum.
export function eenMaandVooruit() {
  return eersteIncasso().datum;
}

// "2026-09" -> "september 2026", voor op de factuur.
const MAANDNAAM = ["januari","februari","maart","april","mei","juni","juli",
                   "augustus","september","oktober","november","december"];
export function periodeInWoorden(periode) {
  if (!periode) return "";
  const [j, m] = String(periode).split("-");
  const i = Number(m) - 1;
  return MAANDNAAM[i] ? `${MAANDNAAM[i]} ${j}` : periode;
}

// Korte vorm voor in de factuurtabel: "sep 2026". De volledige maandnaam
// past daar niet naast de bedragen.
export function periodeKort(periode) {
  if (!periode) return "";
  const [j, m] = String(periode).split("-");
  const naam = MAANDNAAM[Number(m) - 1];
  return naam ? `${naam.slice(0, 3)} ${j}` : periode;
}

export function datumNL(iso) {
  if (!iso) return "";
  const [j, m, d] = String(iso).slice(0, 10).split("-");
  if (!d) return String(iso);
  return `${Number(d)} ${MAANDNAAM[Number(m) - 1] || m} ${j}`;
}
