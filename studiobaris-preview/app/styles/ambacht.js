import { googleFontsHref } from "../../lib/preview";
import MobielMenu from "../[slug]/mobiel-menu";
import { brandVars } from "../../lib/brand";
import FaseFotos, { heeftFases } from "../[slug]/fase-fotos";
import { nicheFoto, heroFoto } from "../../lib/preview-assets";
import VoorproefLabel from "../[slug]/voorproef-label";
import ReviewBrug, { REVIEW_PLEK } from "../[slug]/review-brug";
import { waLink, kopDelen, sterren } from "./gedeeld";

// Stijl "Ambachtelijk & Klassiek": crème ondergrond, klassieke schreefletter
// (Fraunces) voor de koppen, genummerde dienstenlijst. Merkkleuren van de klant
// blijven: knoppen in de accentkleur, donkere blokken in de basiskleur.
export default function AmbachtSite({ content, slug = "", isConcept, isReview }) {
  const modeQuery = isConcept ? "?concept=1" : "";
  const c = content || {};
  const b = c.bedrijf || {};
  const m = c.merk || {};
  const hero = c.hero || {};
  const diensten = c.diensten || [];
  const voordelen = c.voordelen || [];
  const projecten = c.projecten || [];
  const reviews = c.reviews || [];
  const usps = c.usps || [];
  const cta = c.cta_blok || {};
  const wa = waLink(b.whatsapp || b.telefoon);
  const [kopBase, kopAcc] = kopDelen(c);
  const vars = brandVars(m);
  const fontsHref = googleFontsHref("Fraunces", m.tekst_font);
  const heroBeeld = hero.achtergrond || heroFoto(b.branche);

  const css = `
    @import url('${fontsHref}');
    .am *{box-sizing:border-box;margin:0;padding:0}
    .am{font-family:var(--font-body);color:#2A241D;background:#F4EEE3;line-height:1.6}
    .am h1,.am h2,.am h3,.am h4{font-family:'Fraunces',Georgia,serif;font-weight:500;color:#2A241D;line-height:1.1;letter-spacing:-.2px}
    .am a{color:inherit;text-decoration:none}
    .am{scroll-behavior:smooth}.am section[id]{scroll-margin-top:84px}
    .am .wrap{max-width:1140px;margin:0 auto;padding:0 22px}
    .am .hd{position:sticky;top:0;z-index:50;background:rgba(244,238,227,.94);backdrop-filter:blur(8px);border-bottom:1px solid #DDD2BF}
    .am .hd-in{max-width:1140px;margin:0 auto;padding:.85rem 22px;display:flex;align-items:center;justify-content:space-between;gap:1rem}
    .am .logo{display:flex;flex-direction:column;line-height:1.1}
    .am .logo b{font-family:'Fraunces',Georgia,serif;font-size:1.35rem;font-weight:700}
    .am .logo small{font-size:.68rem;letter-spacing:.14em;text-transform:uppercase;color:#6B5D49}
    .am .nav{display:flex;gap:1.6rem;font-size:.92rem}
    .am .nav a:hover{color:var(--orange-ink)}
    .am .cta{background:var(--orange);color:var(--on-orange);padding:.6rem 1.1rem;border-radius:4px;font-weight:600;font-size:.9rem;white-space:nowrap}
    .am .eyebrow{font-size:.74rem;letter-spacing:.16em;text-transform:uppercase;color:var(--orange-ink);font-weight:600}
    .am .hero{padding:3rem 0 3.4rem}
    .am .hero .wrap{display:grid;grid-template-columns:1fr;gap:2rem;align-items:center}
    .am .hero h1{font-size:clamp(2.4rem,7vw,4.2rem);margin:.9rem 0 1.1rem}
    .am .hero h1 em{font-style:italic;color:var(--orange-ink)}
    .am .hero p{font-size:1.1rem;color:#4E4434;max-width:52ch;margin-bottom:1.6rem}
    .am .btns{display:flex;flex-wrap:wrap;gap:.7rem}
    .am .bp{background:var(--orange);color:var(--on-orange);padding:.95rem 1.5rem;border-radius:4px;font-weight:600}
    .am .bs{border:1.5px solid #2A241D;padding:.9rem 1.45rem;border-radius:4px;font-weight:600}
    .am .hfoto{aspect-ratio:4/3;background:#D9CDB6 center/cover no-repeat;border-radius:2px}
    .am .band{background:var(--black);color:#F4EEE3}
    .am .band .wrap{padding-top:1.1rem;padding-bottom:1.1rem;display:flex;flex-wrap:wrap;gap:.5rem 2.2rem;justify-content:space-between;font-size:.95rem}
    .am .band span::before{content:"— ";opacity:.6}
    .am .sec{padding:4rem 0}
    .am .sec h2{font-size:clamp(1.9rem,4.5vw,2.8rem)}
    .am .kop{display:flex;flex-wrap:wrap;gap:1rem 3rem;justify-content:space-between;align-items:flex-end;margin-bottom:2.2rem}
    .am .kop p{max-width:40ch;color:#4E4434}
    .am .lijst{display:grid;grid-template-columns:1fr;border-top:1px solid #CFC2AA}
    .am .item{display:flex;gap:1rem;padding:1.3rem 0;border-bottom:1px solid #CFC2AA}
    .am .item .nr{font-family:'Fraunces',Georgia,serif;color:var(--orange-ink);font-size:.95rem;padding-top:.3rem;min-width:1.8rem}
    .am .item h3{font-size:1.4rem;margin-bottom:.25rem}
    .am .item p{color:#4E4434;font-size:.98rem}
    .am .item .ml{display:inline-block;margin-top:.4rem;font-size:.88rem;font-weight:600;color:var(--orange-ink)}
    .am a.item:hover h3{color:var(--orange-ink)}
    .am .zacht{background:#EAE1D1}
    .am .voord{display:grid;grid-template-columns:1fr;gap:1.6rem}
    .am .voord h3{font-size:1.3rem;margin-bottom:.35rem}
    .am .voord p{color:#4E4434}
    .am .werk{display:grid;grid-template-columns:1fr;gap:1.6rem}
    .am .werk figure{display:flex;flex-direction:column;gap:.7rem}
    .am .wimg{aspect-ratio:4/3;background:#D9CDB6 center/cover no-repeat}
    .am .werk figcaption{font-size:.95rem;color:#4E4434}
    .am .werk figcaption strong{color:#2A241D;font-weight:600}
    .am .nieuw{display:inline-block;background:#111827;color:#fff;font-size:.72rem;font-weight:700;padding:.2rem .55rem;border-radius:999px;margin-right:.4rem}
    .am .over{display:grid;grid-template-columns:1fr;gap:2.4rem}
    .am .over p{color:#4E4434;margin-top:1rem}
    .am .revs{display:grid;grid-template-columns:1fr;gap:1.1rem}
    .am .rev{background:#FFFDF8;border:1px solid #DDD2BF;padding:1.4rem;display:flex;flex-direction:column;gap:.8rem}
    .am .rev .st{color:var(--orange-ink);letter-spacing:.1em}
    .am .rev q{font-family:'Fraunces',Georgia,serif;font-size:1.2rem;line-height:1.4;quotes:"“" "”"}
    .am .rev .nm{font-size:.88rem;color:#6B5D49}
    .am .gr{margin-top:1rem;font-size:.92rem;font-weight:600;color:var(--orange-ink)}
    .am .slot{background:var(--black);color:#F4EEE3}
    .am .slot .wrap{padding-top:4rem;padding-bottom:4rem;display:flex;flex-wrap:wrap;gap:2rem;align-items:center;justify-content:space-between}
    .am .slot h2{color:#F4EEE3;font-size:clamp(1.9rem,4.5vw,2.8rem);max-width:18ch}
    .am .slot p{color:rgba(244,238,227,.8);margin-top:.7rem;max-width:46ch}
    .am .slot .bs{border-color:#F4EEE3;color:#F4EEE3}
    .am .ft{background:color-mix(in srgb,var(--black) 88%,black);color:rgba(244,238,227,.7);font-size:.9rem}
    .am .ft .wrap{padding-top:1.8rem;padding-bottom:1.8rem;display:flex;flex-wrap:wrap;gap:.6rem 2rem;justify-content:space-between}
    .am .ft a:hover{color:#fff}
    @media(max-width:760px){.am .nav{display:none}}
    @media(min-width:760px){
      .am .hero{padding:4.5rem 0 4.5rem}
      .am .hero .wrap{grid-template-columns:1.05fr 1fr;gap:3.5rem}
      .am .hfoto{aspect-ratio:4/5}
      .am .lijst{grid-template-columns:1fr 1fr;column-gap:3rem}
      .am .voord{grid-template-columns:repeat(3,1fr)}
      .am .werk{grid-template-columns:repeat(3,1fr)}
      .am .over{grid-template-columns:1fr 1.6fr}
      .am .revs{grid-template-columns:1fr 1fr}
    }
  `;

  const nr = (i) => String(i + 1).padStart(2, "0");

  return (
    <div className="am" style={vars}>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      {(isConcept || isReview) && <VoorproefLabel isConcept={isConcept} slug={slug} />}

      <header className="hd"><div className="hd-in">
        {m.logo_url
          ? <img src={m.logo_url} alt={b.naam || "logo"} style={{ height: 40, width: "auto", display: "block" }} />
          : <div className="logo"><b>{b.naam || "Bedrijf"}</b>{b.branche && <small>{b.branche}</small>}</div>}
        <nav className="nav">
          <a href="#diensten">Diensten</a>
          <a href="#werk">Projecten</a>
          <a href="#over">Over ons</a>
          <a href="#contact">Contact</a>
        </nav>
        <div className="sbm-rij" style={{ display: "flex", alignItems: "center", gap: 8 }}><a className="cta" href="#contact">{hero.cta_tekst || "Offerte aanvragen"}</a><MobielMenu tot={760} /></div>
      </div></header>

      <section className="hero" id="home"><div className="wrap">
        <div>
          <div className="eyebrow">{[b.branche, b.regio && "in " + String(b.regio).split(/,| en /)[0].trim()].filter(Boolean).join(" ") || b.naam}</div>
          <h1>{kopBase}{kopAcc ? <em>{kopAcc}</em> : null}</h1>
          {hero.subkop && <p>{hero.subkop}</p>}
          <div className="btns">
            <a className="bp" href="#contact">{hero.cta_tekst || "Offerte aanvragen"}</a>
            <a className="bs" href="#werk">Bekijk ons werk</a>
          </div>
        </div>
        <div className="hfoto" style={{ backgroundImage: `url(${JSON.stringify(heroBeeld)})` }} role="img" aria-label={`Werk van ${b.naam || "het bedrijf"}`} />
      </div></section>

      {usps.length > 0 && (
        <div className="band"><div className="wrap">
          {usps.slice(0, 3).map((u, i) => <span key={i}>{u}</span>)}
        </div></div>
      )}

      {diensten.length > 0 && (
        <section className="sec" id="diensten"><div className="wrap">
          <div className="kop">
            <h2>Werk waar we onze naam onder zetten</h2>
            <p>{diensten.length > 1 ? `${diensten.length} vakgebieden, één aanspreekpunt.` : ""} U weet vooraf wat er gebeurt en wat het kost.</p>
          </div>
          <div className="lijst">
            {diensten.map((d, i) => (
              <a className="item" key={i} href={`/${slug}/dienst/${i}${modeQuery}`}>
                <span className="nr">{nr(i)}</span>
                <span><h3>{d.titel}</h3><p>{d.omschrijving}</p><span className="ml">Lees meer &rarr;</span></span>
              </a>
            ))}
          </div>
        </div></section>
      )}

      {voordelen.length > 0 && (
        <section className="sec zacht"><div className="wrap">
          <h2 style={{ marginBottom: "2rem" }}>Wat u van ons mag verwachten</h2>
          <div className="voord">
            {voordelen.map((v, i) => (
              <div key={i}><div className="eyebrow" style={{ marginBottom: ".5rem" }}>{nr(i)}</div><h3>{v.titel}</h3><p>{v.tekst}</p></div>
            ))}
          </div>
        </div></section>
      )}

      <section className="sec" id="werk"><div className="wrap">
        <h2 style={{ marginBottom: "2rem" }}>Een greep uit recent werk</h2>
        <div className="werk">
          {(projecten.length > 0 ? projecten : [null, null, null]).map((p, i) => p ? (
            <a key={i} href={`/${slug}/project/${i}${modeQuery}`}>
              <figure>
                {heeftFases(p) ? <FaseFotos fases={p.fases} className="wimg" /> : <div className="wimg" style={{ backgroundImage: `url(${p.beeld_url || nicheFoto(b.branche, i + 2)})` }} />}
                <figcaption>{p.nieuw && <span className="nieuw">Net door jou geplaatst</span>}<strong>{p.titel}</strong>{p.plaats ? <> · {p.plaats}</> : null}</figcaption>
              </figure>
            </a>
          ) : (
            <figure key={i}><div className="wimg" style={{ backgroundImage: `url(${nicheFoto(b.branche, i + 2)})` }} /></figure>
          ))}
        </div>
      </div></section>

      <section className="sec zacht" id="over"><div className="wrap over">
        <div>
          <h2>Over {b.naam}</h2>
          {c.over_ons && <p>{c.over_ons}</p>}
          {b.regio && <p style={{ fontSize: ".92rem", color: "#6B5D49" }}>Werkgebied: {b.regio}</p>}
        </div>
        <div>
          <div className="revs">
            {(reviews.length > 0 ? reviews.slice(0, 4) : [null, null]).map((r, i) => (
              <blockquote className="rev" key={i} style={r ? undefined : { opacity: 0.7 }}>
                <span className="st">{sterren(r && r.score)}</span>
                <q>{r ? r.tekst : REVIEW_PLEK}</q>
                <span className="nm">{r ? r.naam : "Klantnaam"}</span>
              </blockquote>
            ))}
          </div>
          <ReviewBrug content={c} isReview={isReview} />
          {b.google_business_url && <p className="gr"><a href={b.google_business_url}>Bekijk onze Google-reviews &rarr;</a></p>}
        </div>
      </div></section>

      <section className="slot" id="contact"><div className="wrap">
        <div>
          <h2>{cta.kop || "Benieuwd wat wij voor u kunnen doen?"}</h2>
          <p>{cta.tekst || "Bel of app voor een vrijblijvende offerte."}</p>
        </div>
        <div className="btns">
          {wa && <a className="bp" href={wa}>WhatsApp ons</a>}
          {b.telefoon && <a className="bs" href={`tel:${b.telefoon}`}>Bel {b.telefoon}</a>}
        </div>
      </div></section>

      <footer className="ft"><div className="wrap">
        <span>{[b.naam, b.adres].filter(Boolean).join(" · ")}{b.kvk ? ` · KvK ${b.kvk}` : ""}</span>
        <span>{b.email && <a href={`mailto:${b.email}`}>{b.email}</a>}{b.email && " · "}&copy; {new Date().getFullYear()} · Website door StudioBaris</span>
      </div></footer>
    </div>
  );
}
