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

// Datum één maand vooruit als YYYY-MM-DD (startdatum eerste maandincasso).
export function eenMaandVooruit() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 10);
}
