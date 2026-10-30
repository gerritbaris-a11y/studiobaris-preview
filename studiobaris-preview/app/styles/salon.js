// Salonsite (esthetiek): kappers, barbiers, nagelstudio's, beautysalons.
// Opbouw volgens het SEO-onderzoek (doc "Esthetiek-preview + online agenda"):
// kop met boekknop, hero met plaats + score, open vandaag + eerstvolgende plek,
// behandelingen met prijs en duur, de online agenda op de pagina, werk,
// over de salon, reviews, veelgestelde vragen, contact en route.
// Behandelingen en openingstijden komen uit de agenda (één bron, de salon
// beheert ze zelf in de app). Drie stijlen: zacht, modern, luxe.

import { googleFontsHref } from "../../lib/preview";
import { brandVars } from "../../lib/brand";
import { nicheFoto, nicheKey } from "../../lib/preview-assets";
import VoorproefLabel from "../[slug]/voorproef-label";
import ReviewBrug, { REVIEW_PLEK } from "../[slug]/review-brug";
import FaseFotos, { heeftFases } from "../[slug]/fase-fotos";
import AgendaWidget from "../agenda-widget";
import { hexNaarRgb, contrast } from "../../lib/huisstijl";
import { waLink, kopDelen } from "./gedeeld";

export { SALON_STIJLEN } from "../../lib/stijlen";

export function standaardSalonStijl(branche) {
  const k = nicheKey(branche);
  if (k === "barbier") return "luxe";
  if (k === "kapper") return "salonmodern";
  return "zacht";
}

const DAGEN = ["", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag", "zondag"];
const SCHEMA_DAG = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const VAK = { kapper: "Kapper", barbier: "Barbier", nagels: "Nagelstudio", beauty: "Beautysalon" };
const SCHEMA_TYPE = { kapper: "HairSalon", barbier: "HairSalon", nagels: "NailSalon", beauty: "BeautySalon" };

function euro(n) {
  if (n == null) return "";
  return "€ " + Number(n).toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function duurTekst(min) {
  if (min < 60) return `${min} min`;
  const u = Math.floor(min / 60), r = min % 60;
  return r ? `${u} u ${r} min` : `${u} uur`;
}
function plaatsUit(adres, regio) {
  const m = String(adres || "").match(/\d{4}\s?[A-Z]{2}\s+([A-Za-zÀ-ÿ' .-]+)$/);
  if (m) return m[1].trim();
  const delen = String(adres || "").split(",").map((x) => x.trim()).filter(Boolean);
  if (delen.length > 1) return delen[delen.length - 1].replace(/^\d{4}\s?[A-Z]{2}\s*/, "");
  return String(regio || "").split(/[,/]/)[0].trim();
}
function tekstOp(hex) {
  const rgb = hexNaarRgb(hex);
  return rgb && contrast(rgb, [255, 255, 255]) < 2.2 ? "#111111" : "#fff";
}
// Openingstijden per dag uit het rooster: { 2: "09:00–12:30, 13:00–17:30", … }
function tijdenPerDag(rooster) {
  const uit = {};
  for (const r of rooster || []) {
    uit[r.weekdag] = (uit[r.weekdag] ? uit[r.weekdag] + ", " : "") + `${r.open}–${r.dicht}`;
  }
  return uit;
}
function nuInAmsterdam() {
  const d = new Date();
  const wd = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Amsterdam", weekday: "short" }).format(d);
  const dag = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(wd);
  const tijd = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Amsterdam", hour: "2-digit", minute: "2-digit", hour12: false }).format(d);
  return { dag, tijd };
}

export default function SalonSite({ content, slug = "", isConcept, isReview, agenda, stijl = "zacht", eerstePlek, metBalk = false }) {
  const c = content || {};
  const b = c.bedrijf || {};
  const m = c.merk || {};
  const hero = c.hero || {};
  const reviews = c.reviews || [];
  const projecten = c.projecten || [];
  const usps = c.usps || [];
  const cta = c.cta_blok || {};
  const socials = b.socials || {};
  const wa = waLink(b.whatsapp || b.telefoon);
  const vak = nicheKey(b.branche);
  const vakNaam = VAK[vak] || b.branche || "Salon";
  const plaats = plaatsUit(b.adres, b.regio);
  let [kop1, kop2] = kopDelen(c);
  // Zelfde als de andere stijlen: staat het accentwoord niet aan het eind van
  // de kop, dan komt het er alsnog achter (anders loopt de kop dood op "in").
  if (!kop2 && hero.kop_accent && !String(kop1).toLowerCase().includes(String(hero.kop_accent).toLowerCase())) {
    kop1 = String(kop1).trim() + " ";
    kop2 = hero.kop_accent;
  }
  const behandelingen = (agenda && agenda.behandelingen) || [];
  const categorieen = [...new Set(behandelingen.map((x) => x.categorie))];
  const perDag = tijdenPerDag(agenda && agenda.rooster);
  const nu = nuInAmsterdam();
  const vandaagTijden = perDag[nu.dag];
  const openNu = (agenda && agenda.rooster || []).some((r) => r.weekdag === nu.dag && r.open <= nu.tijd && nu.tijd < r.dicht);
  const scores = reviews.map((r) => Number(r.score) || 5);
  const gemiddeld = scores.length ? (scores.reduce((a, x) => a + x, 0) / scores.length) : null;
  const vars = brandVars(m);
  const accent = m.secundaire_kleur || m.primaire_kleur || "#B85C7A";
  const basis = m.primaire_kleur || "#1A2B3D";
  const fontsHref = googleFontsHref(m.koppen_font, m.tekst_font);
  const agendaKlaar = agenda && behandelingen.length > 0;
  const boekHref = agendaKlaar ? "#afspraak" : (wa || (b.telefoon ? `tel:${b.telefoon}` : "#contact"));
  const prijzen = behandelingen.map((x) => Number(x.prijs)).filter((n) => n > 0);

  const T = {
    zacht: { bg: "#FBF6F2", vlak: "#FFFFFF", vlak2: "#F4ECE6", inkt: "#2B2320", zacht: "#6E625C", lijn: "#EADFD7", r: 22, rk: 999, kopGewicht: 700, hoofdletters: "none", heroDonker: false },
    salonmodern: { bg: "#FFFFFF", vlak: "#F5F6F7", vlak2: "#ECEEF0", inkt: "#121417", zacht: "#5B6470", lijn: "#E4E7EB", r: 10, rk: 10, kopGewicht: 800, hoofdletters: "uppercase", heroDonker: true },
    natuurlijk: { bg: "#F2F0E8", vlak: "#FBFAF6", vlak2: "#E8E6DA", inkt: "#26302A", zacht: "#5F6A62", lijn: "#DDDBCD", r: 14, rk: 999, kopGewicht: 600, hoofdletters: "none", heroDonker: false },
    luxe: { bg: "#111111", vlak: "#1B1B1B", vlak2: "#242424", inkt: "#F3EFE8", zacht: "#B9B1A6", lijn: "#2E2E2E", r: 4, rk: 4, kopGewicht: 700, hoofdletters: "uppercase", heroDonker: true },
  }[stijl] || {};

  const heroUrl = (hero.achtergrond && String(hero.achtergrond)) || nicheFoto(b.branche, 0).replace("w=1000", "w=1800");
  // Galerij altijd minstens 3 tegels: eigen werk eerst, aangevuld met sfeerbeeld.
  const eigen = projecten.filter((p) => p && (p.beeld_url || heeftFases(p))).slice(0, 6);
  const fotos = [...eigen, ...[1, 2, 3, 4, 5].map((i) => ({ beeld_url: nicheFoto(b.branche, i), titel: "" }))]
    .slice(0, Math.max(3, eigen.length));

  // Gestructureerde gegevens voor Google (LocalBusiness). Alleen wat we weten.
  const schema = {
    "@context": "https://schema.org",
    "@type": SCHEMA_TYPE[vak] || "BeautySalon",
    name: b.naam,
    ...(b.adres ? { address: b.adres } : {}),
    ...(b.telefoon ? { telephone: b.telefoon } : {}),
    ...(b.email ? { email: b.email } : {}),
    ...(m.logo_url ? { logo: m.logo_url } : {}),
    ...(prijzen.length ? { priceRange: `${euro(Math.min(...prijzen))} – ${euro(Math.max(...prijzen))}` } : {}),
    ...(Object.keys(perDag).length ? {
      openingHoursSpecification: (agenda.rooster || []).map((r) => ({
        "@type": "OpeningHoursSpecification", dayOfWeek: SCHEMA_DAG[r.weekdag], opens: r.open, closes: r.dicht,
      })),
    } : {}),
    ...(gemiddeld && reviews.length >= 3 ? { aggregateRating: { "@type": "AggregateRating", ratingValue: gemiddeld.toFixed(1), reviewCount: reviews.length } } : {}),
    ...(behandelingen.length ? {
      makesOffer: behandelingen.slice(0, 30).map((x) => ({
        "@type": "Offer", itemOffered: { "@type": "Service", name: x.naam },
        ...(x.prijs != null ? { price: Number(x.prijs).toFixed(2), priceCurrency: "EUR" } : {}),
      })),
    } : {}),
    sameAs: [socials.facebook, socials.instagram, b.google_business_url].filter(Boolean),
  };

  const css = `
    @import url('${fontsHref}');
    .sl *{box-sizing:border-box;margin:0;padding:0}
    .sl{--sbg:${T.bg};--vlak:${T.vlak};--vlak2:${T.vlak2};--inkt:${T.inkt};--zacht:${T.zacht};--lijn:${T.lijn};--r:${T.r}px;--rk:${T.rk}px;
      --ac:${accent};--act:${stijl === "luxe" ? "var(--orange-zwart)" : "var(--orange-ink)"};--opac:${tekstOp(accent)};--basis:${basis};
      font-family:var(--font-body);background:var(--sbg);color:var(--inkt);line-height:1.6;font-size:16px}
    .sl a{color:inherit;text-decoration:none}
    .sl h1,.sl h2,.sl h3{font-family:var(--font-head);font-weight:${T.kopGewicht};letter-spacing:-.3px;line-height:1.15}
    .sl .w{max-width:1040px;margin:0 auto;padding:0 20px}
    .sl .eb{font-size:.78rem;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:var(--act)}
    .sl .hd{position:sticky;top:0;z-index:50;background:color-mix(in srgb,var(--sbg) 92%,transparent);backdrop-filter:blur(8px);border-bottom:1px solid var(--lijn)}
    .sl .hd-in{max-width:1040px;margin:0 auto;padding:.8rem 20px;display:flex;align-items:center;justify-content:space-between;gap:12px}
    .sl .logo{font-family:var(--font-head);font-weight:800;font-size:1.15rem}
    .sl .nav{display:flex;gap:1.3rem;font-size:.92rem;color:var(--zacht)}
    .sl .nav a:hover{color:var(--inkt)}
    .sl .knop{display:inline-flex;align-items:center;justify-content:center;gap:8px;background:var(--ac);color:var(--opac);font-weight:700;
      padding:.85rem 1.4rem;border-radius:var(--rk);text-transform:${T.hoofdletters};letter-spacing:${T.hoofdletters === "uppercase" ? ".6px" : "0"};font-size:${T.hoofdletters === "uppercase" ? ".85rem" : ".98rem"}}
    .sl .knop2{display:inline-flex;align-items:center;justify-content:center;gap:8px;border:1.5px solid currentColor;font-weight:700;padding:.8rem 1.3rem;border-radius:var(--rk)}
    .sl .knop.klein{padding:.55rem 1rem;font-size:.85rem;white-space:nowrap;flex:none}
    .sl .hero{position:relative;color:${T.heroDonker ? "#fff" : "var(--inkt)"};padding:4.5rem 0 4rem;overflow:hidden}
    .sl .hero .w{position:relative;z-index:1}
    .sl .hero h1{font-size:clamp(2.2rem,6vw,3.6rem);margin:.6rem 0 .8rem;max-width:16ch}
    .sl .hero h1 em{font-style:normal;color:${T.heroDonker ? "var(--orange-zwart)" : "var(--act)"}}
    .sl .hero p.sub{font-size:1.12rem;max-width:52ch;opacity:.9;margin-bottom:1.5rem}
    .sl .hero .rij{display:flex;flex-wrap:wrap;gap:10px;align-items:center}
    .sl .score{display:inline-flex;gap:8px;align-items:center;margin-top:1.4rem;font-size:.95rem;opacity:.95}
    .sl .score b{color:var(--act);letter-spacing:2px}
    .sl .zacht-hero{display:grid;gap:2rem;align-items:center}
    .sl .zacht-hero .foto{border-radius:calc(var(--r) * 1.4);aspect-ratio:16/11;background-size:cover;background-position:center;box-shadow:0 30px 60px -30px rgba(60,30,20,.35)}
    @media(min-width:860px){.sl .zacht-hero{grid-template-columns:1.1fr .9fr}.sl .zacht-hero .foto{aspect-ratio:4/5}}
    .sl .vandaag{display:flex;flex-wrap:wrap;gap:10px 22px;align-items:center;background:var(--vlak);border:1px solid var(--lijn);border-radius:var(--r);padding:14px 18px;margin-top:-28px;position:relative;z-index:2;font-size:.95rem}
    .sl .stip{width:9px;height:9px;border-radius:99px;display:inline-block;margin-right:6px;vertical-align:middle}
    .sl .sec{padding:4rem 0}
    .sl .sec h2{font-size:clamp(1.6rem,3.4vw,2.3rem);margin:.4rem 0 .5rem}
    .sl .lead{color:var(--zacht);max-width:58ch;margin-bottom:1.8rem}
    .sl .cats{display:grid;gap:18px}
    @media(min-width:760px){.sl .cats{grid-template-columns:1fr 1fr}}
    .sl .cat{background:var(--vlak);border:1px solid var(--lijn);border-radius:var(--r);padding:18px 20px}
    .sl .cat h3{font-size:1.15rem;margin-bottom:.6rem}
    .sl .beh{display:flex;justify-content:space-between;gap:12px;padding:.7rem 0;border-top:1px solid var(--lijn)}
    .sl .beh:first-of-type{border-top:0}
    .sl .beh small{display:block;color:var(--zacht);font-size:.85rem}
    .sl .beh .pr{font-weight:700;white-space:nowrap}
    .sl .afspraak{background:var(--vlak2)}
    .sl .afs-grid{display:grid;gap:28px;align-items:start}
    @media(min-width:900px){.sl .afs-grid{grid-template-columns:.8fr 1.2fr}}
    .sl .tijden{width:100%;border-collapse:collapse;font-size:.95rem}
    .sl .tijden td{padding:.35rem 0;border-bottom:1px dashed var(--lijn)}
    .sl .tijden td:last-child{text-align:right;color:var(--zacht)}
    .sl .tijden tr.nu td{font-weight:700;color:var(--inkt)}
    .sl .galerij{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}
    @media(min-width:760px){.sl .galerij{grid-template-columns:repeat(3,1fr)}}
    .sl .gfoto{aspect-ratio:1/1;border-radius:var(--r);background-size:cover;background-position:center;background-color:var(--vlak2);overflow:hidden;position:relative}
    .sl .gfoto span{position:absolute;left:10px;bottom:10px;background:rgba(0,0,0,.55);color:#fff;font-size:.8rem;padding:3px 9px;border-radius:99px}
    .sl .over{display:grid;gap:28px;align-items:center}
    @media(min-width:860px){.sl .over{grid-template-columns:1fr 1fr}}
    .sl .over .foto{border-radius:var(--r);aspect-ratio:4/3;background-size:cover;background-position:center}
    .sl .usps{display:grid;gap:10px;margin-top:1.2rem}
    .sl .usps li{list-style:none;display:flex;gap:10px}
    .sl .usps li:before{content:"✓";color:var(--act);font-weight:800}
    .sl .revs{display:grid;gap:16px}
    @media(min-width:760px){.sl .revs{grid-template-columns:repeat(3,1fr)}}
    .sl .rev{background:var(--vlak);border:1px solid var(--lijn);border-radius:var(--r);padding:18px}
    .sl .rev .st{color:var(--act);letter-spacing:2px}
    .sl .rev .q{margin:.5rem 0;font-size:1.02rem}
    .sl .rev .nm{font-weight:700;font-size:.92rem}
    .sl details.faq{border-bottom:1px solid var(--lijn);padding:1rem 0}
    .sl details.faq summary{cursor:pointer;font-weight:700;list-style:none;display:flex;justify-content:space-between;gap:12px}
    .sl details.faq summary::-webkit-details-marker{display:none}
    .sl details.faq summary:after{content:"+";color:var(--act);font-size:1.3rem;line-height:1}
    .sl details.faq[open] summary:after{content:"–"}
    .sl details.faq p{color:var(--zacht);margin-top:.5rem;max-width:66ch}
    .sl .contact{display:grid;gap:24px}
    @media(min-width:860px){.sl .contact{grid-template-columns:1fr 1fr}}
    .sl .ckaart{background:var(--vlak);border:1px solid var(--lijn);border-radius:var(--r);padding:20px}
    .sl .ckaart a{display:block;margin:.3rem 0;font-weight:600}
    .sl .ft{border-top:1px solid var(--lijn);padding:2rem 0 6rem;color:var(--zacht);font-size:.88rem;text-align:center}
    .sl .mobiel{position:fixed;left:0;right:0;bottom:0;z-index:60;display:flex;gap:8px;padding:10px 12px calc(10px + env(safe-area-inset-bottom));background:var(--sbg);border-top:1px solid var(--lijn)}
    .sl .mobiel a{flex:1}
    @media(min-width:760px){.sl .mobiel{display:none}.sl .ft{padding-bottom:2rem}}
    @media(max-width:759px){.sl .nav{display:none}}
  `;

  const heroStijl = T.heroDonker ? {
    backgroundColor: basis,
    backgroundImage: `linear-gradient(90deg, rgba(0,0,0,.72), rgba(0,0,0,.35)), url(${JSON.stringify(heroUrl)})`,
    backgroundSize: "cover", backgroundPosition: "center",
  } : {};

  return (
    <div className="sl" style={vars}>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      {(isConcept || isReview) && <VoorproefLabel isConcept={isConcept} slug={slug} />}

      <header className="hd"><div className="hd-in">
        <a className="logo" href="#home">{m.logo_url ? <img src={m.logo_url} alt={b.naam || "logo"} style={{ height: 36, width: "auto", display: "block" }} /> : b.naam}</a>
        <nav className="nav">
          {behandelingen.length > 0 && <a href="#behandelingen">Behandelingen</a>}
          <a href="#werk">Werk</a>
          <a href="#over">Over ons</a>
          <a href="#contact">Contact</a>
        </nav>
        <a className="knop klein" href={boekHref}>Afspraak maken</a>
      </div></header>

      <section className="hero" id="home" style={heroStijl}><div className="w">
        {T.heroDonker ? (
          <>
            <div className="eb">{vakNaam}{plaats ? ` in ${plaats}` : ""}</div>
            <h1>{kop1}{kop2 ? <em>{kop2}</em> : null}</h1>
            {hero.subkop && <p className="sub">{hero.subkop}</p>}
            <div className="rij">
              <a className="knop" href={boekHref}>Boek online</a>
              {b.telefoon && <a className="knop2" href={`tel:${b.telefoon}`}>Bel {b.telefoon}</a>}
            </div>
            {gemiddeld && <div className="score"><b>{"★".repeat(Math.round(gemiddeld))}</b> {gemiddeld.toFixed(1).replace(".", ",")} uit {reviews.length} {reviews.length === 1 ? "review" : "reviews"}</div>}
          </>
        ) : (
          <div className="zacht-hero">
            <div>
              <div className="eb">{vakNaam}{plaats ? ` in ${plaats}` : ""}</div>
              <h1>{kop1}{kop2 ? <em>{kop2}</em> : null}</h1>
              {hero.subkop && <p className="sub">{hero.subkop}</p>}
              <div className="rij">
                <a className="knop" href={boekHref}>Boek online</a>
                {b.telefoon && <a className="knop2" href={`tel:${b.telefoon}`}>Bel {b.telefoon}</a>}
              </div>
              {gemiddeld && <div className="score"><b>{"★".repeat(Math.round(gemiddeld))}</b> {gemiddeld.toFixed(1).replace(".", ",")} uit {reviews.length} {reviews.length === 1 ? "review" : "reviews"}</div>}
            </div>
            <div className="foto" style={{ backgroundImage: `url(${JSON.stringify(heroUrl)})` }} role="img" aria-label={`Sfeerbeeld ${vakNaam.toLowerCase()}`} />
          </div>
        )}
      </div></section>

      {(Object.keys(perDag).length > 0 || eerstePlek) && (
        <div className="w"><div className="vandaag">
          {Object.keys(perDag).length > 0 && (
            <span><span className="stip" style={{ background: openNu ? "#3D9A5B" : "#B9B1A6" }} />
              {openNu ? "Nu geopend" : "Nu gesloten"}{vandaagTijden ? ` · vandaag ${vandaagTijden}` : " · vandaag gesloten"}</span>
          )}
          {eerstePlek && <span>Eerstvolgende vrije plek: <strong>{eerstePlek}</strong></span>}
          {agendaKlaar && <a href="#afspraak" style={{ marginLeft: "auto", fontWeight: 700, color: "var(--act)" }}>Direct boeken →</a>}
        </div></div>
      )}

      {behandelingen.length > 0 && (
        <section className="sec" id="behandelingen"><div className="w">
          <div className="eb">Behandelingen en prijzen</div>
          <h2>Wat we voor je doen</h2>
          <p className="lead">Alle prijzen inclusief btw. De tijd erachter is hoe lang je ongeveer in de stoel zit.</p>
          {agenda && agenda.instellingen && agenda.instellingen.test_modus && (
            <p style={{ background: "var(--vlak2)", border: "1px dashed var(--lijn)", borderRadius: "var(--r)", padding: "10px 14px", fontSize: ".9rem", marginBottom: "1.4rem", color: "var(--zacht)" }}>
              Voorbeeld: dit zijn veelvoorkomende behandelingen met gangbare prijzen. Je zet hier straks je eigen behandelingen, tijden en prijzen neer, in de app.
            </p>
          )}
          <div className="cats">
            {categorieen.map((cat) => (
              <div className="cat" key={cat}>
                <h3>{cat}</h3>
                {behandelingen.filter((x) => x.categorie === cat).map((x) => (
                  <div className="beh" key={x.id}>
                    <span>{x.naam}<small>{duurTekst(x.duur_min)}{x.omschrijving ? ` · ${x.omschrijving}` : ""}</small></span>
                    <span className="pr">{x.prijs_vanaf ? "v.a. " : ""}{euro(x.prijs)}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div></section>
      )}

      {agendaKlaar && (
        <section className="sec afspraak" id="afspraak"><div className="w afs-grid">
          <div>
            <div className="eb">Online afspraak maken</div>
            <h2>Kies je moment</h2>
            <p className="lead">Je ziet alleen tijden die echt vrij zijn. Je krijgt direct een bevestiging, en de dag ervoor een herinnering.</p>
            {Object.keys(perDag).length > 0 && (
              <table className="tijden"><tbody>
                {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                  <tr key={d} className={d === nu.dag ? "nu" : ""}><td style={{ textTransform: "capitalize" }}>{DAGEN[d]}</td><td>{perDag[d] || "gesloten"}</td></tr>
                ))}
              </tbody></table>
            )}
          </div>
          <AgendaWidget agenda={agenda} test={agenda.instellingen ? agenda.instellingen.test_modus : true}
            kleur={accent} tekstOpKleur={tekstOp(accent)} bron="preview" />
        </div></section>
      )}

      <section className="sec" id="werk"><div className="w">
        <div className="eb">Ons werk</div>
        <h2>{vak === "nagels" ? "Recente sets" : vak === "beauty" ? "Uit de salon" : "Recente looks"}</h2>
        <p className="lead">Nieuw werk zet de salon er zelf op, met de StudioBaris-app, vanaf de telefoon.</p>
        <div className="galerij">
          {fotos.map((p, i) => heeftFases(p)
            ? <div className="gfoto" key={i}><FaseFotos fases={p.fases} className="gfoto" /></div>
            : <div className="gfoto" key={i} style={{ backgroundImage: `url(${JSON.stringify(p.beeld_url || nicheFoto(b.branche, i + 1))})` }}>
                {p.titel ? <span>{p.titel}</span> : null}
              </div>)}
        </div>
      </div></section>

      <section className="sec" id="over" style={{ background: "var(--vlak)" }}><div className="w over">
        <div>
          <div className="eb">Over {b.naam}</div>
          <h2>{plaats ? `Jouw ${vakNaam.toLowerCase()} in ${plaats}` : `Over ${b.naam}`}</h2>
          {c.over_ons && <p className="lead" style={{ marginTop: ".6rem" }}>{c.over_ons}</p>}
          {usps.length > 0 && <ul className="usps">{usps.slice(0, 4).map((u, i) => <li key={i}>{u}</li>)}</ul>}
        </div>
        <div className="foto" style={{ backgroundImage: `url(${JSON.stringify(nicheFoto(b.branche, 3))})` }} role="img" aria-label="Sfeerbeeld salon" />
      </div></section>

      <section className="sec" id="reviews"><div className="w">
        <div className="eb">Reviews</div>
        <h2>Wat klanten zeggen</h2>
        <div className="revs" style={{ marginTop: "1.4rem" }}>
          {(reviews.length ? reviews.slice(0, 6) : [{ tekst: REVIEW_PLEK, naam: "Klantnaam", score: 5 }]).map((r, i) => (
            <div className="rev" key={i} style={reviews.length ? undefined : { opacity: 0.7 }}>
              <div className="st">{"★".repeat(Math.max(1, Math.min(5, Number(r.score) || 5)))}</div>
              <p className="q">&ldquo;{r.tekst}&rdquo;</p>
              <div className="nm">{r.naam}</div>
            </div>
          ))}
        </div>
        <ReviewBrug content={c} isReview={isReview} />
        {b.google_business_url && <p style={{ marginTop: "1rem" }}><a href={b.google_business_url} style={{ color: "var(--act)", fontWeight: 700 }}>Alle Google-reviews →</a></p>}
      </div></section>

      <section className="sec" id="vragen" style={{ background: "var(--vlak)" }}><div className="w" style={{ maxWidth: 780 }}>
        <div className="eb">Goed om te weten</div>
        <h2>Veelgestelde vragen</h2>
        <div style={{ marginTop: "1rem" }}>
          <details className="faq"><summary>Hoe maak ik een afspraak?</summary>
            <p>{agendaKlaar ? "Online via de agenda op deze pagina: kies je behandeling, een dag en een tijd. Je krijgt direct een bevestiging per e-mail." : "Bel of app ons, dan plannen we samen een moment."}{b.telefoon ? ` Bellen kan ook: ${b.telefoon}.` : ""}</p></details>
          {agendaKlaar && (
            <details className="faq"><summary>Kan ik mijn afspraak verzetten of annuleren?</summary>
              <p>Ja, tot {(agenda.instellingen && agenda.instellingen.annuleren_tot_uur) || 24} uur van tevoren via de link in je bevestigingsmail. Daarna graag even bellen.</p></details>
          )}
          {agendaKlaar && (
            <details className="faq"><summary>Krijg ik een herinnering?</summary>
              <p>Ja, de dag voor je afspraak sturen we je een herinnering, zodat je hem niet vergeet.</p></details>
          )}
          {b.adres && (
            <details className="faq"><summary>Waar zitten jullie?</summary>
              <p>{b.adres}. <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${b.naam} ${b.adres}`)}`} style={{ color: "var(--act)", fontWeight: 700 }}>Route plannen →</a></p></details>
          )}
        </div>
      </div></section>

      <section className="sec" id="contact"><div className="w">
        <div className="eb">Contact</div>
        <h2>{cta.kop || "Tot snel in de salon"}</h2>
        {cta.tekst && <p className="lead">{cta.tekst}</p>}
        <div className="contact">
          <div className="ckaart">
            <strong>{b.naam}</strong>
            {b.adres && <p style={{ color: "var(--zacht)", margin: ".3rem 0 .6rem" }}>{b.adres}</p>}
            {b.telefoon && <a href={`tel:${b.telefoon}`}>Bel {b.telefoon}</a>}
            {wa && <a href={wa}>WhatsApp</a>}
            {b.email && <a href={`mailto:${b.email}`}>{b.email}</a>}
            {b.adres && <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${b.naam} ${b.adres}`)}`} style={{ color: "var(--act)" }}>Route plannen →</a>}
            <div style={{ display: "flex", gap: 12, marginTop: ".6rem" }}>
              {socials.instagram && <a href={socials.instagram}>Instagram</a>}
              {socials.facebook && <a href={socials.facebook}>Facebook</a>}
            </div>
          </div>
          <div className="ckaart">
            <strong>Openingstijden</strong>
            {Object.keys(perDag).length > 0 ? (
              <table className="tijden" style={{ marginTop: ".5rem" }}><tbody>
                {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                  <tr key={d} className={d === nu.dag ? "nu" : ""}><td style={{ textTransform: "capitalize" }}>{DAGEN[d]}</td><td>{perDag[d] || "gesloten"}</td></tr>
                ))}
              </tbody></table>
            ) : <p style={{ color: "var(--zacht)", marginTop: ".4rem" }}>{b.openingstijden || "Op afspraak"}</p>}
            {agendaKlaar && <a className="knop" href="#afspraak" style={{ marginTop: "1rem", display: "flex" }}>Afspraak maken</a>}
          </div>
        </div>
      </div></section>

      <footer className="ft"><div className="w">
        &copy; {new Date().getFullYear()} {b.naam}{b.kvk ? ` · KvK ${b.kvk}` : ""} · Website en online agenda door StudioBaris
      </div></footer>

      {!metBalk && <div className="mobiel">
        <a className="knop" href={boekHref}>Afspraak maken</a>
        {b.telefoon && <a className="knop2" href={`tel:${b.telefoon}`} style={{ color: "var(--inkt)" }}>Bel</a>}
      </div>}
    </div>
  );
}
