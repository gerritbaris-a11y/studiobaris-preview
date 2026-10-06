// Hostingcheck voor verkopers: waar staat het domein van een prospect?
//
// Alles komt uit openbare bronnen, er is geen API-sleutel nodig:
// - RDAP (het openbare domeinregister; voor .nl rechtstreeks bij SIDN)
//   → registrar, DNSSEC, verhuisblokkering, nameservers. Dit is FEIT.
// - DNS via DNS-over-HTTPS (Google) → nameservers, A-record, MX-records.
// - Reverse DNS + IP-register (RDAP) → van wie is de server van de website.
//
// Welke aanbieder erachter zit, leiden we af uit hostnamen (bv. *.rzone.de =
// Strato). Dat is een AFLEIDING, geen feit — vandaar de "zeker"/"waarschijnlijk"-
// labels in het resultaat. De registrar uit het register is vaak een
// groothandel (Openprovider, Realtime Register, team.blue …) waar de klant
// zelf geen contract mee heeft; dan is de nameserver-partij de betere gok voor
// wie de verhuiscode moet geven.

const TIMEOUT = 6000;

// Bekende partijen. `zoek` = stukjes die in een hostnaam of registrarnaam
// voorkomen (kleine letters). `soort` bepaalt hoe we hem behandelen:
//   hoster    — gewone hosting/domeinpartij: hier heeft de klant een contract
//   groothandel — registrar waar resellers op draaien, niet de contractpartij
//   dns       — alleen DNS/proxy (Cloudflare), zegt niets over het contract
//   bouwer    — websitebouwer (Wix e.d.), domein zit vaak in het abonnement
//   mail      — alleen mail (Google, Microsoft)
//   eigen     — StudioBaris zelf (Esmero)
const PARTIJEN = [
  { naam: "StudioBaris (Esmero)", soort: "eigen", zoek: ["esmero", "plesk19"] },
  { naam: "Strato", soort: "hoster", site: "strato.nl", zoek: ["strato", "rzone.de", "stratoserver"] },
  { naam: "TransIP", soort: "hoster", site: "transip.nl", zoek: ["transip"] },
  { naam: "Hostnet", soort: "hoster", site: "hostnet.nl", zoek: ["hostnet"] },
  { naam: "Mijndomein", soort: "hoster", site: "mijndomein.nl", zoek: ["mijndomein"] },
  { naam: "one.com", soort: "hoster", site: "one.com", zoek: ["one.com", "dn-s.nl", "one-mail"] },
  { naam: "Vimexx", soort: "hoster", site: "vimexx.nl", zoek: ["vimexx", "zxcs"] },
  { naam: "Antagonist", soort: "hoster", site: "antagonist.nl", zoek: ["antagonist", "g1-dns"] },
  { naam: "Versio", soort: "hoster", site: "versio.nl", zoek: ["versio", "cldin.eu"] },
  { naam: "Neostrada", soort: "hoster", site: "neostrada.nl", zoek: ["neostrada"] },
  { naam: "Yourhosting", soort: "hoster", site: "yourhosting.nl", zoek: ["yourhosting", "firstfind"] },
  { naam: "Argeweb", soort: "hoster", site: "argeweb.nl", zoek: ["argeweb"] },
  { naam: "Hostinger", soort: "hoster", site: "hostinger.nl", zoek: ["hostinger", "dns-parking"] },
  { naam: "GoDaddy", soort: "hoster", site: "godaddy.com", zoek: ["godaddy", "domaincontrol", "secureserver"] },
  { naam: "IONOS", soort: "hoster", site: "ionos.nl", zoek: ["ionos", "1and1", "ui-dns", "kundenserver"] },
  { naam: "Combell", soort: "hoster", site: "combell.com", zoek: ["combell"] },
  { naam: "Webreus", soort: "hoster", site: "webreus.nl", zoek: ["webreus"] },
  { naam: "Vevida", soort: "hoster", site: "vevida.com", zoek: ["vevida"] },
  { naam: "Hosting2GO", soort: "hoster", site: "hosting2go.nl", zoek: ["hosting2go"] },
  { naam: "Byte", soort: "hoster", site: "byte.nl", zoek: ["byte.nl", "hypernode"] },
  { naam: "Shockmedia", soort: "hoster", site: "shockmedia.nl", zoek: ["shockmedia"] },
  { naam: "Wix", soort: "bouwer", site: "wix.com", zoek: ["wix"] },
  { naam: "Squarespace", soort: "bouwer", site: "squarespace.com", zoek: ["squarespace"] },
  { naam: "Jimdo", soort: "bouwer", site: "jimdo.com", zoek: ["jimdo"] },
  { naam: "WordPress.com", soort: "bouwer", site: "wordpress.com", zoek: ["wordpress.com", "automattic"] },
  { naam: "Cloudflare", soort: "dns", zoek: ["cloudflare"] },
  { naam: "Google", soort: "mail", zoek: ["google", "googlemail"] },
  { naam: "Microsoft 365", soort: "mail", zoek: ["outlook.com", "microsoft"] },
  { naam: "Openprovider", soort: "groothandel", zoek: ["openprovider", "registrar.eu"] },
  { naam: "Realtime Register", soort: "groothandel", zoek: ["realtime register", "realtimeregister", "yoursrs"] },
  { naam: "Metaregistrar", soort: "groothandel", zoek: ["metaregistrar"] },
  { naam: "team.blue", soort: "groothandel", zoek: ["team.blue"] },
  { naam: "InterNetX", soort: "groothandel", zoek: ["internetx", "domain robot", "domainrobot"] },
  { naam: "Key-Systems", soort: "groothandel", zoek: ["key-systems", "rrpproxy"] },
  { naam: "Tucows", soort: "groothandel", zoek: ["tucows", "opensrs"] },
  { naam: "eNom", soort: "groothandel", zoek: ["enom", "e-nom"] },
  { naam: "Marcaria", soort: "groothandel", zoek: ["marcaria"] },
];

function herken(...teksten) {
  const t = teksten.filter(Boolean).join(" ").toLowerCase();
  if (!t) return null;
  return PARTIJEN.find((p) => p.zoek.some((z) => t.includes(z))) || null;
}

// --- Invoer opschonen -------------------------------------------------------

const TWEEDELIGE_TLD = ["co.uk", "org.uk", "com.au", "co.za", "com.br", "com.tr"];

export function domeinUitInvoer(invoer) {
  let s = String(invoer || "").trim().toLowerCase();
  if (!s) return null;
  if (s.includes("@")) s = s.split("@").pop(); // e-mailadres geplakt
  s = s.replace(/^[a-z]+:\/\//, "").split(/[/?#:\s]/)[0].replace(/\.$/, "");
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(s)) return null;
  const delen = s.split(".");
  const n = TWEEDELIGE_TLD.some((t) => s.endsWith("." + t)) ? 3 : 2;
  return delen.slice(-n).join(".");
}

// --- Bronnen ----------------------------------------------------------------

async function haalJson(url, accept = "application/json") {
  try {
    const res = await fetch(url, {
      headers: { accept, "user-agent": "StudioBaris-hostingcheck/1.0 (+https://studiobaris.nl)" },
      signal: AbortSignal.timeout(TIMEOUT),
      cache: "no-store",
      redirect: "follow",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function dns(naam, type) {
  const d = await haalJson(
    `https://dns.google/resolve?name=${encodeURIComponent(naam)}&type=${type}`,
    "application/dns-json"
  );
  if (!d || !Array.isArray(d.Answer)) return [];
  const code = { A: 1, CNAME: 5, NS: 2, MX: 15, PTR: 12 }[type];
  return d.Answer.filter((a) => a.type === code)
    .map((a) => String(a.data).trim().split(/\s+/).pop().replace(/\.$/, "").toLowerCase()); // MX: prioriteit eraf
}

function vcardNaam(e) {
  try {
    const f = e.vcardArray[1].find((x) => x[0] === "fn");
    return f ? String(f[3]) : null;
  } catch {
    return null;
  }
}

async function register(domein) {
  const url = domein.endsWith(".nl")
    ? `https://rdap.sidn.nl/domain/${domein}`
    : `https://rdap.org/domain/${domein}`;
  let d = await haalJson(url, "application/rdap+json, application/json");
  if (!d) d = await haalJson(url, "application/rdap+json, application/json"); // één keer opnieuw
  if (!d) return null;
  const reg = (d.entities || []).find((e) => (e.roles || []).includes("registrar"));
  const status = (d.status || []).map((s) => String(s).toLowerCase());
  const verlopen = (d.events || []).find((e) => e.eventAction === "expiration");
  const geregistreerd = (d.events || []).find((e) => e.eventAction === "registration");
  return {
    registrar: reg ? vcardNaam(reg) : null,
    dnssec: d.secureDNS ? !!d.secureDNS.delegationSigned : null,
    slot: status.some((s) => s.replace(/\s/g, "").includes("transferprohibited")),
    status,
    nameservers: (d.nameservers || []).map((n) => String(n.ldhName || "").toLowerCase()),
    verloopt: verlopen ? verlopen.eventDate : null,
    geregistreerd: geregistreerd ? geregistreerd.eventDate : null,
  };
}

async function ipEigenaar(ip) {
  const rev = ip.split(".").reverse().join(".") + ".in-addr.arpa";
  const [ptr, rdap] = await Promise.all([
    dns(rev, "PTR"),
    haalJson(`https://rdap.org/ip/${ip}`, "application/rdap+json, application/json"),
  ]);
  let org = null;
  if (rdap) {
    const e = (rdap.entities || []).find((x) => {
      const n = vcardNaam(x);
      return (x.roles || []).includes("registrant") && n && !/-MNT$/i.test(n);
    });
    org = (e && vcardNaam(e)) || rdap.name || null;
  }
  return { ip, ptr: ptr[0] || null, org };
}

// --- Hoofdfunctie -----------------------------------------------------------

export async function hostingCheck(invoer) {
  const domein = domeinUitInvoer(invoer);
  if (!domein) return { ok: false, error: "Dat lijkt geen websiteadres. Plak bijvoorbeeld www.bedrijfsnaam.nl." };

  const [reg, ns, aKaal, aWww, cnameWww, mx] = await Promise.all([
    register(domein),
    dns(domein, "NS"),
    dns(domein, "A"),
    dns("www." + domein, "A"),
    dns("www." + domein, "CNAME"),
    dns(domein, "MX"),
  ]);

  const nameservers = ns.length ? ns : (reg && reg.nameservers) || [];
  if (!reg && !nameservers.length && !aKaal.length && !aWww.length) {
    return { ok: false, error: `Over ${domein} is niets te vinden. Klopt het adres?` };
  }

  // Website: liefst het www-adres, anders het kale domein.
  const ip = (aWww[0] || aKaal[0]) || null;
  const server = ip ? await ipEigenaar(ip) : null;

  const nsPartij = herken(nameservers.join(" "));
  const regPartij = herken(reg && reg.registrar);
  const mxPartij = herken(mx.join(" "));
  const webPartij = herken(cnameWww.join(" "), server && server.ptr, server && server.org);

  // --- Waar staat het domein (= wie geeft de verhuiscode)? ---
  let domeinBij;
  if ((regPartij && regPartij.soort === "eigen") || (nsPartij && nsPartij.soort === "eigen")) {
    domeinBij = { naam: "StudioBaris (Esmero)", zeker: true, eigen: true, waarom: "Dit domein staat al bij ons." };
  } else if (regPartij && (regPartij.soort === "hoster" || regPartij.soort === "bouwer")) {
    domeinBij = { naam: regPartij.naam, site: regPartij.site, zeker: true, waarom: "Staat zo in het domeinregister." };
  } else if (nsPartij && (nsPartij.soort === "hoster" || nsPartij.soort === "bouwer")) {
    domeinBij = {
      naam: nsPartij.naam, site: nsPartij.site, zeker: false,
      waarom: `Afgeleid uit de nameservers. ${reg && reg.registrar ? `In het register staat ${reg.registrar}, een groothandel waar hosters op draaien.` : "Het domeinregister gaf geen antwoord."}`,
    };
  } else {
    domeinBij = {
      naam: (reg && reg.registrar) || "Onbekend", zeker: false, onbekend: true,
      waarom: regPartij && regPartij.soort === "groothandel"
        ? `${reg.registrar} is een groothandel; de klant heeft zijn contract bij een tussenpartij (vaak zijn huidige webbouwer). Vraag bij wie hij de factuur voor zijn domein betaalt.`
        : "Niet te herleiden tot een bekende partij. Vraag de klant bij wie hij de factuur voor zijn domein betaalt.",
    };
  }

  // --- Website ---
  let website;
  if (!ip && !cnameWww.length) website = { naam: "Geen website gevonden", zeker: true };
  else if (webPartij && webPartij.soort === "dns")
    website = { naam: "Verborgen achter Cloudflare", zeker: true, waarom: "Cloudflare schermt de echte server af; de hosting is zo niet te zien." };
  else if (webPartij && webPartij.soort !== "mail")
    website = { naam: webPartij.naam, zeker: false, waarom: "Afgeleid uit de server waar de site op draait." };
  else
    website = { naam: (server && server.org) || "Onbekend", zeker: false, waarom: "Eigenaar van het IP-adres van de server." };

  // --- Mail ---
  let mail;
  if (!mx.length) mail = { naam: "Geen mail op dit domein", zeker: true };
  else if (mxPartij) mail = { naam: mxPartij.naam, zeker: false, waarom: "Afgeleid uit de MX-records." };
  else mail = { naam: mx[0], zeker: false, waarom: "Mailserver uit de MX-records, geen bekende partij." };

  return {
    ok: true,
    domein,
    domeinBij,
    website,
    mail,
    dnssec: reg ? reg.dnssec : null,
    slot: reg ? reg.slot : null,
    registrar: reg ? reg.registrar : null,
    geregistreerd: reg ? reg.geregistreerd : null,
    technisch: { nameservers, mx, ip, ptr: server && server.ptr, ipEigenaar: server && server.org, cname: cnameWww[0] || null },
  };
}
