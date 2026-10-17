// Google Analytics (GA4) voor de publieke preview-aanvraag, met toestemming.
//
// De cookiebanner staat op studiobaris.nl (Complianz). Complianz zet zijn
// toestemmingscookies op het hoofddomein (instelling "cookies op het
// hoofddomein"), zodat we ze hier op preview.studiobaris.nl kunnen lezen.
// Alleen bij `cmplz_statistics=allow` laden we GA4. Zonder die cookie, of
// bij "deny", gebeurt er niets: geen script, geen cookies, geen meting.
//
// Alleen in gebruik op de publieke intake (niet intern, niet workflow 2).

const MEET_ID = "G-1PDL9DYJSD";

export function statistiekToegestaan() {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split(";")
    .some((c) => c.trim() === "cmplz_statistics=allow");
}

let geladen = false;

export function laadStatistiek() {
  if (geladen || !statistiekToegestaan()) return false;
  geladen = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() { window.dataLayer.push(arguments); };
  window.gtag("js", new Date());
  // cookie_domain "auto" zet de GA-cookie op studiobaris.nl, zodat een
  // bezoek dat op studiobaris.nl begint hier dezelfde sessie blijft.
  window.gtag("config", MEET_ID, { cookie_domain: "auto" });
  const s = document.createElement("script");
  s.async = true;
  s.src = "https://www.googletagmanager.com/gtag/js?id=" + MEET_ID;
  document.head.appendChild(s);
  return true;
}

export function meldPreviewAanvraag() {
  if (!statistiekToegestaan()) return;
  laadStatistiek();
  window.gtag("event", "preview_aanvraag");
}
