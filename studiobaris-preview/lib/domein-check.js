// Domeincheck voor verkopers: is een domeinnaam nog vrij?
//
// Bron is RDAP, het openbare domeinregister (voor .nl rechtstreeks bij SIDN,
// de rest via rdap.org). Geen API-sleutel nodig.
//   404 van het register  → niet geregistreerd = vrij
//   200 van het register  → geregistreerd = bezet
//   iets anders / timeout → onbekend (we zeggen dan niet "vrij")

const TIMEOUT = 6000;

// Invoer opschonen. Zonder extensie gaan we uit van .nl.
export function domeinVoorCheck(invoer) {
  let s = String(invoer || "").trim().toLowerCase();
  if (!s) return null;
  if (s.includes("@")) s = s.split("@").pop();
  s = s.replace(/^[a-z]+:\/\//, "").split(/[/?#:]/)[0].replace(/^www\./, "").replace(/\.$/, "");
  s = s.replace(/\s+/g, ""); // "schilder jansen" → "schilderjansen"
  if (!s.includes(".")) s += ".nl";
  const delen = s.split(".");
  if (delen.length !== 2) return null; // geen subdomeinen of tweedelige extensies
  const [naam, ext] = delen;
  if (!/^[a-z]{2,}$/.test(ext)) return null;
  if (!/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/.test(naam) || naam.length < 2) return null;
  return s;
}

async function vraagRegister(url) {
  try {
    const res = await fetch(url, {
      headers: { accept: "application/rdap+json, application/json", "user-agent": "StudioBaris-domeincheck/1.0 (+https://studiobaris.nl)" },
      signal: AbortSignal.timeout(TIMEOUT),
      cache: "no-store",
      redirect: "follow",
    });
    return res.status;
  } catch {
    return null;
  }
}

export async function domeinCheck(invoer) {
  const domein = domeinVoorCheck(invoer);
  if (!domein) {
    return { ok: false, error: "Dat is geen geldige domeinnaam. Typ bijvoorbeeld schildersbedrijfjansen.nl (letters, cijfers en streepjes)." };
  }
  const url = domein.endsWith(".nl") ? `https://rdap.sidn.nl/domain/${domein}` : `https://rdap.org/domain/${domein}`;
  let status = await vraagRegister(url);
  if (status !== 200 && status !== 404) status = await vraagRegister(url); // één keer opnieuw

  if (status === 404) return { ok: true, domein, vrij: true };
  if (status === 200) return { ok: true, domein, vrij: false };
  return { ok: false, domein, error: `Het register gaf geen duidelijk antwoord over ${domein}. Probeer het zo nog eens.` };
}
