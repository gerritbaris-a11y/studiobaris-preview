// Spoed & Lead: site voor loodgieters, ontstoppers, elektriciens, slotenmakers
// en cv-monteurs. Doel: van een zoekopdracht in nood binnen een minuut een
// telefoontje of WhatsApp maken. Opbouw volgens het sectoronderzoek:
// belknop altijd in beeld, storingsknop, eerlijke tarieven (vertrouwen na de
// oplichtingszaken), werkgebied met een pagina per plaats, LocalBusiness-schema.
// Geen app, geen agenda. Vier stijlen: signaal, helder, vakman, fris.

import { googleFontsHref } from "../../lib/preview";
import { hexNaarRgb, contrast } from "../../lib/huisstijl";
import VoorproefLabel from "../[slug]/voorproef-label";
import ReviewBrug, { REVIEW_PLEK } from "../[slug]/review-brug";
import SpoedFormulier from "./spoed-formulier";
import { waLink, kopDelen } from "./gedeeld";

export { SPOED_STIJLEN } from "../../lib/stijlen";

const THEMA = {
  signaal: { bg: "#0E1116", fg: "#F5F7FA", zacht: "#A9B2BF", vlak: "#171C24", rand: "#262D38", accent: "#FFC400", donker: true },
  helder: { bg: "#FFFFFF", fg: "#0F172A", zacht: "#475569", vlak: "#F1F5F9", rand: "#E2E8F0", accent: "#0B63F6", donker: false },
  vakman: { bg: "#F6F3EE", fg: "#1A2B3D", zacht: "#4A5560", vlak: "#FFFFFF", rand: "#E6E0D5", accent: "#E8590C", donker: false },
  fris: { bg: "#F3FAF7", fg: "#10261D", zacht: "#3D5A4E", vlak: "#FFFFFF", rand: "#D5EBE2", accent: "#0E9F6E", donker: false },
};

// Veelvoorkomende storingen per vak, als de intake er geen gaf.
const STANDAARD_STORINGEN = [
  [/ontstop|riool/i, [["Verstopte wc", "Wij maken hem vandaag nog door, zonder hak- en breekwerk."], ["Verstopte afvoer", "Keuken, douche of wastafel: we spoelen en checken met een camera."], ["Rioolproblemen", "Stank of water dat terugkomt? We zoeken de oorzaak en lossen het op."]]],
  [/elektric/i, [["Stroomstoring", "Valt de groep steeds uit? We sporen de fout op en maken het veilig."], ["Kortsluiting", "Brandlucht of zwartgeblakerd stopcontact: zet de groep uit en bel ons."], ["Meterkast", "Aardlekschakelaar of groepenkast vervangen, keurig en volgens de norm."]]],
  [/sloten|sleutel/i, [["Buitengesloten", "We openen je deur zonder schade waar het kan."], ["Slot kapot", "Nieuw slot met keurmerk, direct geplaatst."], ["Na inbraak", "We maken je woning dezelfde dag weer veilig af."]]],
  [/cv|ketel/i, [["Geen warm water", "We komen kijken en hebben de meeste onderdelen bij ons."], ["Cv-ketel in storing", "Foutcode op het display? Bel, dan helpen we je verder."], ["Lekkende ketel", "Water onder de ketel: draai de kraan dicht en bel ons."]]],
  [/./, [["Lekkage", "We sporen het lek op en repareren het, ook achter tegels."], ["Verstopping", "Wc, afvoer of riool: we maken hem vandaag door."], ["Geen warm water", "Boiler of ketel: we komen kijken en lossen het op."]]],
];
function storingenVoor(branche, gegeven) {
  const lijst = (gegeven || []).filter((s) => s && s.titel);
  if (lijst.length) return lijst;
  const rij = STANDAARD_STORINGEN.find(([re]) => re.test(String(branche || ""))) || STANDAARD_STORINGEN[STANDAARD_STORINGEN.length - 1];
  return rij[1].map(([titel, tekst]) => ({ titel, tekst }));
}
const SCHEMA_TYPE = [[/loodgiet|ontstop|riool|cv|ketel/i, "Plumber"], [/elektric/i, "Electrician"], [/sloten|sleutel/i, "Locksmith"]];

function tekstOp(hex) {
  const rgb = hexNaarRgb(hex);
  return rgb && contrast(rgb, [255, 255, 255]) < 2.4 ? "#111111" : "#FFFFFF";
}
function telLink(t) {
  return "tel:" + String(t || "").replace(/[^0-9+]/g, "");
}
export function plaatsSlug(p) {
  return String(p || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
function regioPlaats(b) {
  const m = String(b.adres || "").match(/\d{4}\s?[A-Z]{2}\s+([A-Za-zÀ-ÿ' .-]+)$/);
  if (m) return m[1].trim();
  return String(b.regio || "").split(/[,/]/)[0].trim();
}

export default function SpoedSite({ content, slug = "", isConcept, isReview, stijl = "signaal", metBalk = false, plaats = null }) {
  const c = content || {};
  const b = c.bedrijf || {};
  const m = c.merk || {};
  const hero = c.hero || {};
  const sp = c.spoed || {};
  const reviews = (c.reviews || []).filter((r) => r && r.tekst);
  const usps = c.usps || [];
  const diensten = (c.diensten || []).filter((d) => d && d.titel);
  const t = THEMA[stijl] || THEMA.signaal;
  // Accentkleur: de huisstijl van de vakman, behalve bij Signaal (daar is het
  // felle geel juist het punt).
  const merkAccent = /^#[0-9a-f]{6}$/i.test(m.secundaire_kleur || "") ? m.secundaire_kleur : null;
  const accent = stijl === "signaal" || !merkAccent ? t.accent : merkAccent;
  const opAccent = tekstOp(accent);
  const wa = waLink(b.whatsapp || b.telefoon);
  const tel = b.telefoon || "";
  const branche = b.branche || "Vakman";
  const waar = plaats || regioPlaats(b);
  const storingen = storingenVoor(branche, sp.storingen);
  const werkgebied = (sp.werkgebied || []).filter(Boolean).slice(0, 12);
  const preview = isReview || isConcept;
  const tarieven = (sp.tarieven || []).filter((x) => x && x.omschrijving);
  const voorbeeldTarieven = !tarieven.length && preview;
  const toonTarieven = tarieven.length ? tarieven : voorbeeldTarieven
    ? [{ omschrijving: "Voorrijkosten", prijs: "€ 45" }, { omschrijving: "Uurtarief", prijs: "€ 65" }, { omschrijving: "Toeslag avond en weekend", prijs: "+ 50%" }]
    : [];
  // Kop + accent; staat het accent niet aan het eind van de kop, dan erachter.
  let [kop, acc] = kopDelen(c);
  if (!acc && hero.kop_accent && !String(kop).toLowerCase().includes(String(hero.kop_accent).toLowerCase())) {
    kop = String(kop).trim() + " "; acc = hero.kop_accent;
  }
  const fontsHref = googleFontsHref(m.koppen_font, m.tekst_font);
  const score = reviews.length ? (reviews.reduce((s, r) => s + (Number(r.score) || 5), 0) / reviews.length) : null;
  const basis = `/${slug}`;

  const schema = {
    "@context": "https://schema.org",
    "@type": (SCHEMA_TYPE.find(([re]) => re.test(branche)) || [null, "HomeAndConstructionBusiness"])[1],
    name: b.naam || "",
    telephone: tel || undefined,
    email: b.email || undefined,
    address: b.adres ? { "@type": "PostalAddress", streetAddress: b.adres, addressCountry: "NL" } : undefined,
    areaServed: (werkgebied.length ? werkgebied : [waar]).filter(Boolean).map((p) => ({ "@type": "City", name: p })),
    openingHours: /24\s*\/\s*7/.test(sp.bereikbaar || "") ? "Mo-Su 00:00-23:59" : undefined,
    aggregateRating: score && reviews.length >= 3 ? { "@type": "AggregateRating", ratingValue: score.toFixed(1), reviewCount: reviews.length } : undefined,
  };

  const css = `
  .sp{--bg:${t.bg};--fg:${t.fg};--zacht:${t.zacht};--vlak:${t.vlak};--rand:${t.rand};--acc:${accent};--opacc:${opAccent};
    background:var(--bg);color:var(--fg);font-family:'${m.tekst_font || "Inter"}',system-ui,-apple-system,sans-serif;line-height:1.55;font-size:16px;min-height:100vh}
  .sp *{box-sizing:border-box}
  .sp h1,.sp h2,.sp h3{font-family:'${m.koppen_font || "Montserrat"}',system-ui,sans-serif;line-height:1.12;margin:0;letter-spacing:-.3px}
  .sp a{color:inherit}
  .sp-in{max-width:1080px;margin:0 auto;padding:0 18px}
  .sp-top{position:sticky;top:0;z-index:30;background:var(--bg);border-bottom:1px solid var(--rand)}
  .sp-top .sp-in{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:64px}
  .sp-naam{font-weight:800;font-size:17px;text-decoration:none;display:flex;align-items:center;gap:10px}
  .sp-naam img{height:38px;width:auto;display:block}
  .sp-belklein{display:inline-flex;align-items:center;gap:8px;background:var(--acc);color:var(--opacc);font-weight:800;text-decoration:none;border-radius:999px;padding:10px 16px;white-space:nowrap}
  .sp-hero{padding:36px 0 30px}
  .sp-badge{display:inline-flex;align-items:center;gap:8px;font-size:13.5px;font-weight:700;border:1px solid var(--rand);background:var(--vlak);border-radius:999px;padding:6px 12px}
  .sp-puls{width:9px;height:9px;border-radius:99px;background:#22C55E;box-shadow:0 0 0 0 rgba(34,197,94,.6);animation:sppuls 1.8s infinite}
  @keyframes sppuls{70%{box-shadow:0 0 0 9px rgba(34,197,94,0)}100%{box-shadow:0 0 0 0 rgba(34,197,94,0)}}
  .sp-hero h1{font-size:36px;font-weight:900;margin:16px 0 12px}
  .sp-hero h1 em{font-style:normal;color:${t.donker ? "var(--acc)" : "inherit"};${t.donker ? "" : "background:linear-gradient(transparent 62%, color-mix(in srgb, var(--acc) 35%, transparent) 0)"}}
  .sp-sub{font-size:18px;color:var(--zacht);max-width:620px;margin:0 0 22px}
  .sp-knoppen{display:grid;gap:10px;max-width:560px}
  .sp-bel{display:flex;align-items:center;justify-content:center;gap:10px;min-height:62px;border-radius:16px;background:var(--acc);color:var(--opacc);font-weight:900;font-size:20px;text-decoration:none;box-shadow:0 10px 26px color-mix(in srgb, var(--acc) 35%, transparent)}
  .sp-wa{display:flex;align-items:center;justify-content:center;gap:10px;min-height:54px;border-radius:16px;background:#25D366;color:#0B2E17;font-weight:800;font-size:17px;text-decoration:none}
  .sp-vertrouwen{display:flex;flex-wrap:wrap;gap:8px 18px;margin-top:18px;color:var(--zacht);font-size:14.5px;font-weight:600}
  .sp-vertrouwen span::before{content:"✓ ";color:var(--acc);font-weight:900}
  .sp-sec{padding:40px 0;border-top:1px solid var(--rand)}
  .sp-sec h2{font-size:27px;font-weight:900;margin-bottom:8px}
  .sp-lead{color:var(--zacht);margin:0 0 20px;max-width:640px}
  .sp-grid{display:grid;gap:12px}
  .sp-kaart{background:var(--vlak);border:1px solid var(--rand);border-radius:16px;padding:16px 18px}
  .sp-kaart h3{font-size:17px;font-weight:800;margin-bottom:4px}
  .sp-kaart p{margin:0;color:var(--zacht);font-size:15px}
  .sp-form{background:var(--vlak);border:1px solid var(--rand);border-radius:18px;padding:16px;position:relative}
  .sp-keuzes{display:flex;flex-wrap:wrap;gap:8px}
  .sp-keuze{border:1.5px solid var(--rand);background:var(--bg);color:var(--fg);border-radius:999px;padding:10px 14px;font:inherit;font-weight:700;cursor:pointer}
  .sp-keuze.aan{background:var(--acc);border-color:var(--acc);color:var(--opacc)}
  .sp-velden{display:grid;gap:10px;margin-top:14px}
  .sp-velden input,.sp-velden textarea{width:100%;font:inherit;padding:13px 14px;border-radius:12px;border:1px solid var(--rand);background:var(--bg);color:var(--fg)}
  .sp-velden textarea{min-height:76px;resize:vertical}
  .sp-knop{min-height:54px;border-radius:14px;border:0;background:var(--acc);color:var(--opacc);font:inherit;font-weight:800;font-size:17px;cursor:pointer}
  .sp-klein{font-size:13px;color:var(--zacht);margin:0}
  .sp-fout{margin:0;color:#DC2626;font-weight:600}
  .sp-klaar{text-align:center}
  .sp-klaar p{color:var(--zacht);margin:6px 0 0}
  .sp-vink{width:46px;height:46px;border-radius:99px;margin:0 auto 8px;display:grid;place-items:center;background:var(--acc);color:var(--opacc);font-size:24px;font-weight:900}
  .sp-tarief{background:var(--vlak);border:1px solid var(--rand);border-radius:16px;overflow:hidden;max-width:620px}
  .sp-tarief div{display:flex;justify-content:space-between;gap:12px;padding:14px 16px}
  .sp-tarief div + div{border-top:1px solid var(--rand)}
  .sp-tarief strong{white-space:nowrap}
  .sp-voorbeeld{display:inline-block;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.6px;background:#FDE68A;color:#713F12;border-radius:6px;padding:2px 7px;margin-left:8px;vertical-align:middle}
  .sp-chips{display:flex;flex-wrap:wrap;gap:8px}
  .sp-chips a,.sp-chips span{border:1px solid var(--rand);background:var(--vlak);border-radius:999px;padding:8px 14px;text-decoration:none;font-weight:600;font-size:15px}
  .sp-chips a.aan{background:var(--acc);border-color:var(--acc);color:var(--opacc)}
  .sp-review{background:var(--vlak);border:1px solid var(--rand);border-radius:16px;padding:16px 18px}
  .sp-review .st{color:#F59E0B;letter-spacing:2px}
  .sp-review p{margin:6px 0 8px}
  .sp-review .wie{font-size:14px;color:var(--zacht);font-weight:600}
  .sp-faq details{border-bottom:1px solid var(--rand);padding:14px 0}
  .sp-faq summary{font-weight:800;cursor:pointer}
  .sp-faq p{color:var(--zacht);margin:8px 0 0}
  .sp-eind{background:var(--acc);color:var(--opacc);border-radius:22px;padding:26px 20px;text-align:center}
  .sp-eind h2{font-size:26px;margin-bottom:8px}
  .sp-eind a{display:inline-flex;align-items:center;gap:10px;margin-top:14px;background:var(--opacc);color:var(--acc);border-radius:14px;padding:14px 22px;font-weight:900;font-size:19px;text-decoration:none}
  .sp-voet{padding:28px 0 110px;color:var(--zacht);font-size:14px;border-top:1px solid var(--rand)}
  .sp-mobiel{position:fixed;left:0;right:0;bottom:0;z-index:40;display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:10px 12px calc(10px + env(safe-area-inset-bottom));background:var(--bg);border-top:1px solid var(--rand)}
  .sp-mobiel a{display:flex;align-items:center;justify-content:center;gap:8px;min-height:50px;border-radius:14px;font-weight:800;text-decoration:none}
  .sp-mobiel .b{background:var(--acc);color:var(--opacc)} .sp-mobiel .w{background:#25D366;color:#0B2E17}
  @media(min-width:760px){
    .sp-hero h1{font-size:54px}.sp-knoppen{grid-template-columns:1.3fr 1fr}
    .sp-grid.drie{grid-template-columns:repeat(3,1fr)} .sp-twee{display:grid;grid-template-columns:1.1fr 1fr;gap:28px;align-items:start}
    .sp-mobiel{display:none}.sp-voet{padding-bottom:40px}
  }
  @media(max-width:520px){.sp-belklein .tekst{display:none}}
  `;

  const BelIcoon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6.6 10.8a15.1 15.1 0 006.6 6.6l2.2-2.2a1 1 0 011-.25 11.4 11.4 0 003.6.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.25 1L6.6 10.8z" /></svg>
  );
  const WaIcoon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm5.3 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-3.3-.8-2.8-1.1-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9 0-1.4.7-2 1-2.3.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.3.5-.4.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.1.5.1.6-.1l.9-1.1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.3z" /></svg>
  );

  const faq = [
    sp.reactietijd && { v: "Hoe snel zijn jullie er?", a: `${sp.reactietijd[0].toUpperCase()}${sp.reactietijd.slice(1)}. Bel direct, dan weet je meteen waar je aan toe bent.` },
    sp.bereikbaar && { v: "Wanneer kan ik bellen?", a: `We zijn bereikbaar ${sp.bereikbaar}.` },
    tarieven.length && { v: "Wat kost het?", a: `Onze tarieven staan hierboven. Je hoort vooraf wat het kost, zonder verrassingen achteraf.` },
    werkgebied.length && { v: "In welke plaatsen werken jullie?", a: `Onder andere in ${werkgebied.slice(0, -1).join(", ")}${werkgebied.length > 1 ? " en " : ""}${werkgebied[werkgebied.length - 1]}.` },
  ].filter(Boolean);

  return (
    <div className="sp">
      <style dangerouslySetInnerHTML={{ __html: css }} />
      {fontsHref && <link rel="stylesheet" href={fontsHref} />}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      {(isConcept || isReview) && <VoorproefLabel isConcept={isConcept} slug={slug} />}

      <header className="sp-top">
        <div className="sp-in">
          <a className="sp-naam" href={basis}>{m.logo_url ? <img src={m.logo_url} alt={b.naam || ""} /> : b.naam}</a>
          {tel && <a className="sp-belklein" href={telLink(tel)}><BelIcoon /><span className="tekst">{tel}</span></a>}
        </div>
      </header>

      <main>
        <section className="sp-hero">
          <div className="sp-in">
            <span className="sp-badge"><span className="sp-puls" aria-hidden="true" />{sp.bereikbaar ? `Bereikbaar ${sp.bereikbaar}` : `${branche}${waar ? ` in ${waar}` : ""}`}</span>
            <h1>{plaats ? `${branche} in ${plaats}. ` : kop}{acc && <em>{acc}</em>}</h1>
            <p className="sp-sub">{hero.subkop || `Storing of lekkage? Bel ${b.naam || "ons"} direct, dan helpen we je snel verder.`}</p>
            <div className="sp-knoppen">
              {tel && <a className="sp-bel" href={telLink(tel)}><BelIcoon />Bel direct {tel}</a>}
              {wa && <a className="sp-wa" href={wa} target="_blank" rel="noreferrer"><WaIcoon />WhatsApp een foto</a>}
            </div>
            <div className="sp-vertrouwen">
              {sp.reactietijd && <span>{sp.reactietijd}</span>}
              {score && <span>{score.toFixed(1).replace(".", ",")} uit {reviews.length} reviews</span>}
              {(tarieven.length > 0 || voorbeeldTarieven) && <span>Vaste tarieven, vooraf bekend</span>}
              {b.kvk && <span>KvK {b.kvk}</span>}
              {usps.slice(0, 2).map((u, i) => <span key={i}>{u}</span>)}
            </div>
          </div>
        </section>

        <section className="sp-sec" id="storing">
          <div className="sp-in sp-twee">
            <div>
              <h2>Wat is er aan de hand?</h2>
              <p className="sp-lead">Kies je probleem en laat je nummer achter. Wij bellen je terug. Liever meteen iemand spreken? Bel {tel || "ons"}.</p>
              <div className="sp-grid">
                {storingen.map((s, i) => (
                  <div className="sp-kaart" key={i}><h3>{s.titel}</h3>{s.tekst && <p>{s.tekst}</p>}</div>
                ))}
              </div>
            </div>
            <SpoedFormulier slug={slug} storingen={storingen} test={preview} />
          </div>
        </section>

        {toonTarieven.length > 0 && (
          <section className="sp-sec" id="tarieven">
            <div className="sp-in">
              <h2>Tarieven{voorbeeldTarieven && <span className="sp-voorbeeld">voorbeeld</span>}</h2>
              <p className="sp-lead">Eerlijk vooraf, zodat je weet waar je aan toe bent. Alle bedragen inclusief btw.</p>
              <div className="sp-tarief">
                {toonTarieven.map((x, i) => <div key={i}><span>{x.omschrijving}</span><strong>{x.prijs}</strong></div>)}
              </div>
            </div>
          </section>
        )}

        {diensten.length > 0 && (
          <section className="sp-sec" id="diensten">
            <div className="sp-in">
              <h2>Waarvoor je ons belt</h2>
              <div className="sp-grid drie" style={{ marginTop: 14 }}>
                {diensten.slice(0, 6).map((d, i) => <div className="sp-kaart" key={i}><h3>{d.titel}</h3>{d.omschrijving && <p>{d.omschrijving}</p>}</div>)}
              </div>
            </div>
          </section>
        )}

        {(werkgebied.length > 0 || waar) && (
          <section className="sp-sec" id="werkgebied">
            <div className="sp-in">
              <h2>Werkgebied</h2>
              <p className="sp-lead">{waar ? `Vanuit ${waar} snel bij je in de buurt.` : "Snel bij je in de buurt."}</p>
              <div className="sp-chips">
                {(werkgebied.length ? werkgebied : [waar]).map((p) => (
                  <a key={p} href={`${basis}/in/${plaatsSlug(p)}${isConcept ? "?concept=1" : ""}`} className={plaats === p ? "aan" : ""}>{branche} {p}</a>
                ))}
              </div>
            </div>
          </section>
        )}

        {c.over_ons && (
          <section className="sp-sec" id="over">
            <div className="sp-in"><h2>Over {b.naam || "ons"}</h2><p className="sp-lead" style={{ marginTop: 8 }}>{c.over_ons}</p></div>
          </section>
        )}

        <section className="sp-sec" id="reviews">
          <div className="sp-in">
            <h2>Wat klanten zeggen</h2>
            <div className="sp-grid drie" style={{ marginTop: 14 }}>
              {(reviews.length ? reviews.slice(0, 6) : [{ tekst: REVIEW_PLEK, naam: "Klantnaam", score: 5 }]).map((r, i) => (
                <div className="sp-review" key={i}>
                  <div className="st" aria-label={`${r.score || 5} van 5`}>{"★".repeat(Math.max(1, Math.min(5, r.score || 5)))}</div>
                  <p>{r.tekst}</p>
                  <div className="wie">{r.naam}</div>
                </div>
              ))}
            </div>
            <ReviewBrug content={c} isReview={isReview} />
          </div>
        </section>

        {faq.length > 0 && (
          <section className="sp-sec sp-faq" id="vragen">
            <div className="sp-in">
              <h2>Veelgestelde vragen</h2>
              {faq.map((f, i) => <details key={i}><summary>{f.v}</summary><p>{f.a}</p></details>)}
            </div>
          </section>
        )}

        <section className="sp-sec">
          <div className="sp-in">
            <div className="sp-eind">
              <h2>{(c.cta_blok && c.cta_blok.kop) || "Nu een probleem? Bel ons direct."}</h2>
              <div>{(c.cta_blok && c.cta_blok.tekst) || "We nemen op, denken mee en zeggen eerlijk wat het kost."}</div>
              {tel && <a href={telLink(tel)}><BelIcoon />{tel}</a>}
            </div>
          </div>
        </section>
      </main>

      <footer className="sp-voet">
        <div className="sp-in">
          <strong style={{ color: "var(--fg)" }}>{b.naam}</strong>
          {b.adres && <> · {b.adres}</>}
          {b.kvk && <> · KvK {b.kvk}</>}
          {b.email && <> · <a href={`mailto:${b.email}`}>{b.email}</a></>}
        </div>
      </footer>

      {!metBalk && (tel || wa) && (
        <nav className="sp-mobiel" aria-label="Direct contact">
          {tel && <a className="b" href={telLink(tel)}><BelIcoon />Bellen</a>}
          {wa && <a className="w" href={wa} target="_blank" rel="noreferrer"><WaIcoon />WhatsApp</a>}
        </nav>
      )}
    </div>
  );
}
