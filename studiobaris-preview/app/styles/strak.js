import { googleFontsHref } from "../../lib/preview";
import { brandVars } from "../../lib/brand";
import FaseFotos, { heeftFases } from "../[slug]/fase-fotos";
import { nicheFoto, heroFoto } from "../../lib/preview-assets";
import VoorproefLabel from "../[slug]/voorproef-label";
import { waLink, kopDelen, sterren } from "./gedeeld";

// Stijl "Donker & Strak": bijna-zwart, grote foto over de volle breedte, dikke
// koppen in hoofdletters (Archivo). De accentkleur van de klant wordt licht
// genoeg gemaakt om op zwart te lezen (--orange-zwart).
export default function StrakSite({ content, slug = "", isConcept, isReview }) {
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
  const fontsHref = googleFontsHref("Archivo", m.tekst_font);
  const heroBeeld = hero.achtergrond || heroFoto(b.branche);
  const naam = String(b.naam || "Bedrijf");

  const css = `
    @import url('${fontsHref}');
    .sk *{box-sizing:border-box;margin:0;padding:0}
    .sk{font-family:var(--font-body);color:#E9EBEC;background:#0F1214;line-height:1.6}
    .sk h1,.sk h2,.sk h3{font-family:'Archivo',system-ui,sans-serif;color:#fff;font-weight:800;line-height:1;letter-spacing:-.02em}
    .sk h1,.sk h2{text-transform:uppercase}
    .sk a{color:inherit;text-decoration:none}
    .sk{scroll-behavior:smooth}.sk section[id]{scroll-margin-top:80px}
    .sk .wrap{max-width:1220px;margin:0 auto;padding:0 22px}
    .sk .hd{position:absolute;left:0;right:0;z-index:5}
    .sk .hd-in{max-width:1220px;margin:0 auto;padding:1rem 22px;display:flex;align-items:center;justify-content:space-between;gap:1rem}
    .sk .logo{font-family:'Archivo',system-ui,sans-serif;font-weight:800;font-size:1.25rem;text-transform:uppercase;color:#fff}
    .sk .logo i{font-style:normal;color:var(--orange-zwart)}
    .sk .logochip{background:#fff;border-radius:8px;padding:6px 10px;display:inline-flex}
    .sk .nav{display:flex;gap:1.8rem;font-size:.92rem;font-weight:500}
    .sk .nav a:hover{color:var(--orange-zwart)}
    .sk .cta{background:var(--orange-zwart);color:#0F1214;padding:.65rem 1.1rem;font-weight:700;font-size:.9rem;white-space:nowrap}
    .sk .hero{position:relative;min-height:min(92vh,760px);display:flex;align-items:flex-end;background:#1C2125 center/cover no-repeat}
    .sk .hero::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(15,18,20,.55) 0%,rgba(15,18,20,.25) 35%,rgba(15,18,20,.95) 82%)}
    .sk .hero .wrap{position:relative;z-index:1;width:100%;padding-top:8rem;padding-bottom:3.2rem}
    .sk .eyebrow{display:inline-flex;align-items:center;gap:.6rem;font-size:.76rem;letter-spacing:.14em;text-transform:uppercase;font-weight:600;color:var(--orange-zwart)}
    .sk .eyebrow::before{content:"";width:26px;height:2px;background:var(--orange-zwart)}
    .sk .hero h1{font-size:clamp(2.7rem,10vw,6rem);margin:1rem 0 1.3rem;max-width:15ch;font-weight:800}
    .sk .hero h1 .ac{color:var(--orange-zwart)}
    .sk .hrij{display:flex;flex-wrap:wrap;gap:1.4rem 3rem;align-items:center}
    .sk .hero p{font-size:1.1rem;color:#C3C8CB;max-width:46ch}
    .sk .btns{display:flex;flex-wrap:wrap;gap:.7rem}
    .sk .bp{background:var(--orange-zwart);color:#0F1214;padding:1.05rem 1.6rem;font-weight:700}
    .sk .bs{border:1.5px solid #5A6368;color:#fff;padding:1rem 1.55rem;font-weight:600}
    .sk .bs:hover{border-color:#fff}
    .sk .usps{border-top:1px solid #262C30;border-bottom:1px solid #262C30}
    .sk .usps .wrap{display:grid;grid-template-columns:1fr}
    .sk .usp{padding:1.3rem 0;display:flex;gap:.9rem;align-items:baseline;border-bottom:1px solid #262C30;font-size:1rem}
    .sk .usp:last-child{border-bottom:0}
    .sk .usp b{font-family:'Archivo',system-ui,sans-serif;font-size:1.6rem;color:var(--orange-zwart);line-height:1}
    .sk .sec{padding:4.5rem 0}
    .sk .sec h2{font-size:clamp(2.1rem,6vw,3.6rem);margin-bottom:2.2rem}
    .sk .raster{display:grid;grid-template-columns:1fr;padding:1px 0 0 1px}
    .sk .tegel{background:#15191C;border:1px solid #262C30;margin:-1px 0 0 -1px;padding:1.7rem;display:flex;flex-direction:column;gap:.5rem}
    .sk a.tegel:hover{background:#1A1F23}
    .sk .tegel h3{font-size:1.35rem}
    .sk .tegel p{color:#A9B0B4;font-size:.97rem}
    .sk .tegel .ml{margin-top:.3rem;font-weight:600;font-size:.9rem;color:var(--orange-zwart)}
    .sk .voord{display:grid;grid-template-columns:1fr;gap:1.8rem}
    .sk .voord h3{font-size:1.25rem;margin-bottom:.4rem}
    .sk .voord p{color:#A9B0B4}
    .sk .voord .nr{font-family:'Archivo',system-ui,sans-serif;font-weight:800;font-size:.95rem;color:var(--orange-zwart);display:block;margin-bottom:.6rem}
    .sk .werk{display:grid;grid-template-columns:1fr;gap:14px}
    .sk .wkaart{position:relative;min-height:300px;background:#1C2125 center/cover no-repeat;display:flex;align-items:flex-end;padding:1.1rem}
    .sk .wkaart span{background:#0F1214;color:#fff;padding:.55rem .8rem;font-size:.9rem;font-weight:600}
    .sk .nieuw{display:inline-block;background:var(--orange-zwart);color:#0F1214;font-size:.72rem;font-weight:700;padding:.2rem .55rem;margin-right:.4rem}
    .sk .over p{color:#C3C8CB;max-width:62ch;font-size:1.05rem}
    .sk .reviews{background:var(--orange-zwart);color:#0F1214}
    .sk .reviews .wrap{padding-top:4rem;padding-bottom:4rem;display:grid;grid-template-columns:1fr;gap:2rem}
    .sk .rev q{display:block;font-family:'Archivo',system-ui,sans-serif;font-weight:700;font-size:1.3rem;line-height:1.3;quotes:"“" "”"}
    .sk .rev .nm{margin-top:.7rem;font-size:.9rem;font-weight:600}
    .sk .reviews a{font-weight:700;text-decoration:underline}
    .sk .slot .wrap{padding-top:5rem;padding-bottom:5rem;display:flex;flex-wrap:wrap;gap:2rem;align-items:flex-end;justify-content:space-between}
    .sk .slot h2{font-size:clamp(2.3rem,7vw,4.4rem);max-width:14ch;margin:0}
    .sk .slot p{color:#C3C8CB;margin-top:1rem;max-width:44ch}
    .sk .ft{border-top:1px solid #262C30;color:#8B9499;font-size:.9rem}
    .sk .ft .wrap{padding-top:1.8rem;padding-bottom:1.8rem;display:flex;flex-wrap:wrap;gap:.6rem 2rem;justify-content:space-between}
    .sk .ft a:hover{color:#fff}
    @media(max-width:760px){.sk .nav{display:none}.sk .cta{display:none}}
    @media(min-width:760px){
      .sk .usps .wrap{grid-template-columns:repeat(3,1fr)}
      .sk .usp{border-bottom:0;border-right:1px solid #262C30;padding:1.6rem 1.6rem 1.6rem 0}
      .sk .usp + .usp{padding-left:1.6rem}
      .sk .usp:last-child{border-right:0}
      .sk .raster{grid-template-columns:repeat(2,1fr)}
      .sk .voord{grid-template-columns:repeat(3,1fr)}
      .sk .werk{grid-template-columns:repeat(3,1fr)}
      .sk .reviews .wrap{grid-template-columns:repeat(3,1fr)}
    }
    @media(min-width:1040px){.sk .raster{grid-template-columns:repeat(3,1fr)}}
  `;

  return (
    <div className="sk" style={vars}>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      {(isConcept || isReview) && <VoorproefLabel isConcept={isConcept} />}

      <div style={{ position: "relative" }}>
        <header className="hd"><div className="hd-in">
          {m.logo_url
            ? <span className="logochip"><img src={m.logo_url} alt={naam} style={{ height: 32, width: "auto", display: "block" }} /></span>
            : <span className="logo">{naam}<i>.</i></span>}
          <nav className="nav">
            <a href="#diensten">Diensten</a>
            <a href="#werk">Projecten</a>
            <a href="#over">Over</a>
            <a href="#contact">Contact</a>
          </nav>
          <a className="cta" href="#contact">{hero.cta_tekst || "Offerte aanvragen"}</a>
        </div></header>

        <section className="hero" id="home" style={{ backgroundImage: `url(${JSON.stringify(heroBeeld)})` }}><div className="wrap">
          <div className="eyebrow">{[b.branche, b.regio && String(b.regio).split(/,| en /)[0].trim()].filter(Boolean).join(" · ") || naam}</div>
          <h1>{kopBase}{kopAcc ? <span className="ac">{kopAcc}</span> : null}</h1>
          <div className="hrij">
            {hero.subkop && <p>{hero.subkop}</p>}
            <div className="btns">
              <a className="bp" href="#contact">{hero.cta_tekst || "Offerte aanvragen"}</a>
              <a className="bs" href="#werk">Bekijk ons werk</a>
            </div>
          </div>
        </div></section>
      </div>

      {usps.length > 0 && (
        <div className="usps"><div className="wrap">
          {usps.slice(0, 3).map((u, i) => <div className="usp" key={i}><b>0{i + 1}</b><span>{u}</span></div>)}
        </div></div>
      )}

      {diensten.length > 0 && (
        <section className="sec" id="diensten"><div className="wrap">
          <h2>Wat we doen</h2>
          <div className="raster">
            {diensten.map((d, i) => (
              <a className="tegel" key={i} href={`/${slug}/dienst/${i}${modeQuery}`}>
                <h3>{d.titel}</h3>
                <p>{d.omschrijving}</p>
                <span className="ml">Lees meer &rarr;</span>
              </a>
            ))}
          </div>
        </div></section>
      )}

      <section className="sec" id="werk" style={{ paddingTop: diensten.length > 0 ? 0 : undefined }}><div className="wrap">
        <h2>Recent werk</h2>
        <div className="werk">
          {(projecten.length > 0 ? projecten : [null, null, null]).map((p, i) => p ? (
            heeftFases(p) ? (
              <a key={i} href={`/${slug}/project/${i}${modeQuery}`} style={{ display: "block" }}>
                <FaseFotos fases={p.fases} className="wkaart" />
                <div style={{ padding: ".6rem 0", fontWeight: 600 }}>{p.titel}{p.plaats ? ` · ${p.plaats}` : ""}</div>
              </a>
            ) : (
              <a key={i} className="wkaart" href={`/${slug}/project/${i}${modeQuery}`} style={{ backgroundImage: `url(${p.beeld_url || nicheFoto(b.branche, i + 2)})` }}>
                <span>{p.nieuw && <em className="nieuw">Net door jou geplaatst</em>}{p.titel}{p.plaats ? ` · ${p.plaats}` : ""}</span>
              </a>
            )
          ) : (
            <div key={i} className="wkaart" style={{ backgroundImage: `url(${nicheFoto(b.branche, i + 2)})` }} />
          ))}
        </div>
      </div></section>

      {voordelen.length > 0 && (
        <section className="sec" style={{ paddingTop: 0 }}><div className="wrap">
          <h2>Waarom {naam}</h2>
          <div className="voord">
            {voordelen.map((v, i) => (
              <div key={i}><span className="nr">0{i + 1}</span><h3>{v.titel}</h3><p>{v.tekst}</p></div>
            ))}
          </div>
        </div></section>
      )}

      <section className="sec over" id="over" style={{ paddingTop: 0 }}><div className="wrap">
        <h2>Over ons</h2>
        {c.over_ons && <p>{c.over_ons}</p>}
        {b.regio && <p style={{ marginTop: ".8rem", fontSize: ".92rem", color: "#8B9499" }}>Werkgebied: {b.regio}</p>}
      </div></section>

      <section className="reviews"><div className="wrap">
        {(reviews.length > 0 ? reviews.slice(0, 3) : [null, null, null]).map((r, i) => (
          <blockquote className="rev" key={i} style={r ? undefined : { opacity: 0.75 }}>
            <q>{r ? r.tekst : "Hier verschijnt straks een review van een tevreden klant."}</q>
            <div className="nm">{sterren(r && r.score)} · {r ? r.naam : "Klantnaam"}</div>
          </blockquote>
        ))}
        {b.google_business_url && <p><a href={b.google_business_url}>Bekijk onze Google-reviews &rarr;</a></p>}
      </div></section>

      <section className="slot" id="contact"><div className="wrap">
        <div>
          <h2>{cta.kop || "Klus in gedachten? Bel of app."}</h2>
          {cta.tekst && <p>{cta.tekst}</p>}
        </div>
        <div className="btns">
          {wa && <a className="bp" href={wa}>WhatsApp ons</a>}
          {b.telefoon && <a className="bs" href={`tel:${b.telefoon}`}>Bel {b.telefoon}</a>}
        </div>
      </div></section>

      <footer className="ft"><div className="wrap">
        <span>{[naam, b.adres].filter(Boolean).join(" · ")}{b.kvk ? ` · KvK ${b.kvk}` : ""}</span>
        <span>{b.email && <a href={`mailto:${b.email}`}>{b.email}</a>}{b.email && " · "}&copy; {new Date().getFullYear()} · Website door StudioBaris</span>
      </div></footer>
    </div>
  );
}
