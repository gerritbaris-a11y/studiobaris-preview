import { notFound } from "next/navigation";
import MobielMenu from "./mobiel-menu";
import { getPreview, googleFontsHref } from "../../lib/preview";
import { getConcept, getFull } from "../../lib/server-data";
import { nicheFoto, voordeelIcon, heroAchtergrond, heroFoto, MERK_OVERLAY } from "../../lib/preview-assets";
import { vulVoorbeeld } from "../../lib/preview-voorbeeld";
import { getWerk } from "../../lib/aanpassen";
import { brandVars } from "../../lib/brand";
import ModernSite from "../styles/modern";
import PersoonlijkSite from "../styles/persoonlijk";
import AmbachtSite from "../styles/ambacht";
import StrakSite from "../styles/strak";
import VoorproefLabel from "./voorproef-label";
import ReviewBrug, { REVIEW_PLEK } from "./review-brug";
import StijlWissel from "./stijl-wissel";
import { geldigeStijl } from "../../lib/stijlen";
import { getProef, metProefProjecten, proefDatum, DEMO_BASIS, telBezoek } from "../../lib/proef";
import { cookies, headers } from "next/headers";
import ProefBalk from "./proef-balk";
import FaseFotos, { heeftFases } from "./fase-fotos";
import SalonSite, { SALON_STIJLEN, standaardSalonStijl } from "../styles/salon";
import { isEsthetiekBranche } from "../../lib/segment";
import { agendaVoorPreview, eerstePlekLabel } from "../../lib/agenda";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const row = await getPreview(params.slug);
  const seo = (row && row.content && row.content.seo) || {};
  const naam = row && row.content && row.content.bedrijf && row.content.bedrijf.naam;
  const magIndexeren = seo.noindex === false;
  return {
    title: seo.titel || naam || "Preview",
    description: seo.meta_omschrijving || "",
    robots: magIndexeren ? undefined : { index: false, follow: false },
  };
}

function waLink(nummer) {
  if (!nummer) return null;
  let d = String(nummer).replace(/[^0-9]/g, "");
  if (d.startsWith("0")) d = "31" + d.slice(1);
  return "https://wa.me/" + d;
}

const WaIcon = ({ s = 20 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.693.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884" />
  </svg>
);

export default async function Page({ params, searchParams }) {
  const isConcept = searchParams?.concept === "1";
  const isReview = searchParams?.review === "1";
  // Werkversie uit het Aanpassen-scherm: nog niet live, alleen via deze link.
  const isWerk = searchParams?.werk === "1";
  let content;
  if (isWerk) {
    content = await getWerk(params.slug);
    if (!content) {
      const row = await getPreview(params.slug);
      content = row ? row.content : (await getFull(params.slug));
    }
    if (!content) notFound();
  } else if (isConcept) {
    content = await getConcept(params.slug);
    if (!content) notFound();
  } else if (isReview) {
    content = await getFull(params.slug);
    if (!content) notFound();
  } else {
    const row = await getPreview(params.slug);
    content = row ? row.content : await getFull(params.slug);
    if (!content) notFound();
  }

  // De voorproef-balk ("Dit is een eerste voorproefje…") staat op elke link die
  // een prospect krijgt: de gewone preview.studiobaris.nl/<slug> én oude links
  // met ?review=1. Niet in concept- of werkversie.
  const isVoorproef = isReview || (!isConcept && !isWerk);

  // Proefperiode demo-app: op de links die de prospect krijgt (gewoon en
  // oude links met ?review=1). Niet in concept,
  // werkversie of de stijlvergelijking (?stijl=). Zelf geplaatste projecten bovenaan.
  const isGewoon = !isWerk && !isConcept && !searchParams?.stijl;
  const proef = isGewoon ? await getProef(params.slug) : { actief: false };
  if (isGewoon) {
    await telBezoek(params.slug, {
      ingelogd: Boolean(cookies().get("sb_sessie") || cookies().get("sb_team")),
      userAgent: headers().get("user-agent") || "",
    });
  }
  if (proef.actief) content = metProefProjecten(content, proef);
  const balk = proef.actief ? (
    <div style={brandVars((content && content.merk) || {})}>
      <ProefBalk slug={params.slug} url={DEMO_BASIS + params.slug} aanbodUrl={`/${params.slug}/aanbod`} datum={proefDatum(proef.tot)} geplaatst={proef.geplaatst} />
    </div>
  ) : null;

  // Vul lege velden met duidelijk-neppe voorbeelden, zodat de verkoop-preview
  // nooit kaal oogt. Alleen hier (preview) — de echte klantsite krijgt dit niet.
  const c = vulVoorbeeld(content || {});
  // Concept/review-previews staan nog niet op "gepubliceerd" — dienst- en
  // projectpagina's kijken daar wél naar (via getPreview), dus zonder deze
  // query-param zouden ze "niet gevonden" tonen zodra iemand doorklikt.
  const modeQuery = isConcept ? "?concept=1" : "";
  // Welke stijl tonen we? 1) ?stijl= (team: Stijl kiezen-vergelijking),
  // 2) de stijl waar de klant zelf naar aan het kijken is (stijlwisselaar,
  // cookie voor deze sessie), 3) de stijl van de preview (merk.stijl).
  const onzeStijl = geldigeStijl(c.merk && c.merk.stijl) || "stoer";
  const magWisselen = isGewoon && isVoorproef;
  const kijkStijl = magWisselen ? geldigeStijl(cookies().get("sbk_" + params.slug)?.value) : null;
  const stijl = geldigeStijl(searchParams?.stijl) || kijkStijl || onzeStijl;
  const wissel = magWisselen ? <StijlWissel slug={params.slug} huidige={stijl} onze={onzeStijl} merk={c.merk || {}} metBalk={proef.actief} /> : null;
  const props = { content: c, slug: params.slug, isConcept, isReview: isVoorproef };
  // Salons (esthetiek): eigen salonsite met de online agenda op de pagina.
  // ?stijl=zacht|salonmodern|luxe voor de vergelijking door het team.
  if (isEsthetiekBranche((c.bedrijf || {}).branche)) {
    const ids = SALON_STIJLEN.map((x) => x.id);
    const salonStijl = ids.includes(searchParams?.stijl) ? searchParams.stijl
      : ids.includes(c.merk && c.merk.stijl) ? c.merk.stijl : standaardSalonStijl((c.bedrijf || {}).branche);
    let agenda = null, eerstePlek = null;
    try {
      agenda = await agendaVoorPreview(params.slug, content); // zonder voorbeeldvulling: geen nep-e-mailadres
      eerstePlek = agenda ? await eerstePlekLabel(agenda) : null;
    } catch {}
    return <><SalonSite {...props} agenda={agenda} stijl={salonStijl} eerstePlek={eerstePlek} metBalk={proef.actief} />{balk}</>;
  }
  if (stijl === "modern") return <><ModernSite {...props} />{balk}{wissel}</>;
  if (stijl === "persoonlijk") return <><PersoonlijkSite {...props} />{balk}{wissel}</>;
  if (stijl === "ambacht") return <><AmbachtSite {...props} />{balk}{wissel}</>;
  if (stijl === "strak") return <><StrakSite {...props} />{balk}{wissel}</>;
  const b = c.bedrijf || {};
  const m = c.merk || {};
  let sloganAcc = null;
  if (b.slogan) {
    const t = String(b.slogan).trim();
    const ci = t.lastIndexOf(",");
    if (ci > 0 && ci < t.length - 2) {
      sloganAcc = [t.slice(0, ci + 1) + " ", t.slice(ci + 1).trim()];
    } else {
      const w = t.split(/\s+/);
      const n = w.length >= 6 ? 3 : w.length >= 4 ? 2 : w.length >= 2 ? 1 : 0;
      sloganAcc = n ? [w.slice(0, w.length - n).join(" ") + " ", w.slice(w.length - n).join(" ")] : [t, ""];
    }
  }
  const hero = c.hero || {};
  const diensten = c.diensten || [];
  const voordelen = c.voordelen || [];
  const projecten = c.projecten || [];
  const reviews = c.reviews || [];
  const usps = c.usps || [];
  const cta = c.cta_blok || {};
  const socials = b.socials || {};
  const fontsHref = googleFontsHref(m.koppen_font, m.tekst_font);

  const wa = waLink(b.whatsapp || b.telefoon);
  const naamDelen = String(b.naam || "Bedrijf").split(" ");
  const heroAcc = hero.kop_accent || "";
  const heroKop = hero.kop || b.naam || "";
  const heroKopBase = heroAcc && heroKop.toLowerCase().trim().endsWith(heroAcc.toLowerCase().trim())
    ? heroKop.slice(0, heroKop.toLowerCase().lastIndexOf(heroAcc.toLowerCase())).trim()
    : heroKop;

  const vars = { ...brandVars(m), "--white": "#fff" };

  const css = `
    @import url('${fontsHref}');
    .vp *{box-sizing:border-box;margin:0;padding:0}
    .vp{font-family:var(--font-body);color:var(--gtext);background:var(--white);line-height:1.6}
    .vp h1,.vp h2,.vp h3,.vp h4{font-family:var(--font-head);color:var(--black);font-weight:800;line-height:1.2;letter-spacing:-.5px}
    .vp a{color:inherit;text-decoration:none}
    .vp .hd{position:sticky;top:0;z-index:50;background:var(--white);border-bottom:1px solid var(--line);padding:.9rem 1.2rem}
    .vp .hd-in{max-width:1100px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:.6rem .9rem;flex-wrap:wrap}
    .vp .logo{font-size:1.2rem;font-weight:800;color:var(--black)}
    .vp .logo .o{color:var(--orange-ink)}
    .vp .nav{order:3;width:100%;display:flex;gap:1rem;flex-wrap:wrap;justify-content:center}
    .vp .nav a{font-size:.88rem;font-weight:500;color:var(--gtext);border-bottom:2px solid transparent;padding-bottom:2px}
    .vp .nav a:hover{color:var(--black);border-color:var(--orange)}
    .vp .cta{background:var(--orange);color:var(--on-orange);padding:.55rem 1rem;border-radius:8px;font-weight:700;font-size:.9rem}
    .vp .cta:hover{background:var(--orange-d)}
    .vp{scroll-behavior:smooth}.vp section[id]{scroll-margin-top:80px}
    .vp .hero{position:relative;background:var(--black);color:#fff;padding:3.4rem 1.3rem 3.8rem;text-align:center}
    .vp .eyebrow{display:inline-block;color:var(--orange);font-weight:700;font-size:.78rem;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:.9rem}
    .vp .hero h1{color:#fff;font-size:2rem;margin-bottom:.9rem}
    .vp .hero h1 .ac{color:var(--orange-hero)}
    .vp .hero h1{text-shadow:0 2px 18px rgba(0,0,0,.25)}
    .vp .hero .eyebrow,.vp .hero .tick{color:var(--orange-hero)}
    .vp .hero p{color:rgba(255,255,255,.82);max-width:620px;margin:0 auto 1.6rem;font-size:1.02rem}
    .vp .hbtns{display:flex;flex-wrap:wrap;gap:.7rem;justify-content:center;margin-bottom:1.8rem}
    .vp .bp{background:var(--orange);color:var(--on-orange);padding:.85rem 1.3rem;border-radius:10px;font-weight:700}
    .vp .bp:hover{background:var(--orange-d)}
    .vp .bs{border:1.5px solid rgba(255,255,255,.4);color:#fff;padding:.85rem 1.3rem;border-radius:10px;font-weight:600}
    .vp .bs:hover{border-color:var(--orange)}
    .vp .trust{display:flex;flex-wrap:wrap;gap:.7rem 1.4rem;justify-content:center;color:rgba(255,255,255,.78);font-size:.9rem}
    .vp .trust span{display:flex;align-items:center;gap:.4rem}
    .vp .tick{color:var(--orange);font-weight:800}
    .vp .sec{padding:3rem 1.3rem}
    .vp .in{max-width:1100px;margin:0 auto}
    .vp .sh{text-align:center;max-width:680px;margin:0 auto 2rem}
    .vp .sh h2{font-size:1.55rem;margin-bottom:.6rem}
    .vp .sh p{color:var(--gtext)}
    .vp .alt{background:var(--bg)}
    .vp .grid2,.vp .grid3{display:grid;gap:1.1rem;grid-template-columns:1fr}
    .vp .dc{background:var(--white);border:1px solid var(--line);border-radius:14px;overflow:hidden;display:block;color:inherit}
    .vp a.dc:hover,.vp a.pc:hover{border-color:var(--orange)}
    .vp .dph{background:#ECEFF3;color:var(--gsoft);height:120px;display:grid;place-items:center;font-size:.85rem;background-size:cover;background-position:center}
    .vp .db{padding:1.2rem}
    .vp .db h3{font-size:1.2rem;margin-bottom:.4rem}
    .vp .db p{font-size:.95rem;color:var(--gtext);margin-bottom:.5rem}
    .vp .dl{color:var(--orange-ink);font-weight:700;font-size:.9rem}
    .vp .bel{background:var(--white);border:1px solid var(--line);border-radius:14px;padding:1.4rem;text-align:center}
    .vp .belic{width:52px;height:52px;border-radius:12px;background:var(--black);color:var(--orange);display:grid;place-items:center;margin:0 auto 1rem;font-size:1.4rem}
    .vp .bel h3{font-size:1.1rem;margin-bottom:.4rem}
    .vp .bel p{font-size:.93rem;color:var(--gtext)}
    .vp .pc{background:var(--white);border:1px solid var(--line);border-radius:14px;overflow:hidden;display:block;color:inherit}
    .vp .pph{background:#ECEFF3;color:var(--gsoft);height:130px;display:grid;place-items:center;font-size:.85rem;background-size:cover;background-position:center}
    .vp .pb{padding:1rem 1.2rem}
    .vp .pb h3{font-size:1.05rem}
    .vp .pm{color:var(--gsoft);font-size:.85rem;margin-top:.2rem}
    .vp .phnote{text-align:center;color:var(--gsoft);font-size:.9rem;margin-top:1rem}
    .vp .rev{background:var(--white);border:1px solid var(--line);border-radius:14px;padding:1.3rem}
    .vp .stars{color:var(--orange-ink);letter-spacing:2px;margin-bottom:.6rem}
    .vp .rq{font-size:.95rem;color:var(--gtext);margin-bottom:.9rem}
    .vp .ra{display:flex;align-items:center;gap:.6rem}
    .vp .av{width:38px;height:38px;border-radius:50%;background:var(--black);color:var(--orange);display:grid;place-items:center;font-weight:800}
    .vp .rn{font-weight:700;color:var(--black);font-size:.92rem}
    .vp .fcta{background:var(--black);color:#fff;padding:3rem 1.3rem;text-align:center}
    .vp .fcta h2{color:#fff;font-size:1.5rem;margin-bottom:.6rem}
    .vp .fcta p{color:rgba(255,255,255,.8);max-width:540px;margin:0 auto 1.4rem}
    .vp .fbtns{display:flex;flex-wrap:wrap;gap:.7rem;justify-content:center}
    .vp .wa{display:inline-flex;align-items:center;gap:.5rem;background:#25D366;color:#fff;padding:.85rem 1.3rem;border-radius:10px;font-weight:700}
    .vp .wa:hover{background:#1ebe5b}
    .vp .bo{border:1.5px solid rgba(255,255,255,.4);color:#fff;padding:.85rem 1.3rem;border-radius:10px;font-weight:600}
    .vp .ft{background:var(--soft);color:rgba(255,255,255,.7);padding:2rem 1.3rem;font-size:.9rem}
    .vp .ft-grid{max-width:1100px;margin:0 auto;display:grid;grid-template-columns:1fr;gap:1.4rem;text-align:center}
    .vp .ft h4{color:#fff;font-size:1rem;margin-bottom:.6rem}
    .vp .ft a{display:block;color:rgba(255,255,255,.75);margin:.25rem 0}
    .vp .ft a:hover{color:var(--orange)}
    .vp .fsoc{display:flex;gap:.6rem;justify-content:center;margin-top:.3rem}
    .vp .sb2{width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,.1);color:#fff;display:inline-grid;place-items:center}
    .vp .sb2:hover{background:var(--orange);color:var(--black)}
    .vp .sb2.wa2:hover{background:#25D366;color:#fff}
    .vp .fbottom{max-width:1100px;margin:1.4rem auto 0;padding-top:1rem;border-top:1px solid rgba(255,255,255,.12);text-align:center;font-size:.82rem;color:rgba(255,255,255,.55)}
    @media(max-width:639px){
      .vp .nav{display:none}
      .vp .grid2{gap:0;border:1px solid var(--line);border-radius:14px;overflow:hidden}
      .vp .grid2 .dc{display:flex;align-items:center;border:0;border-bottom:1px solid var(--line);border-radius:0}
      .vp .grid2 .dc:last-child{border-bottom:0}
      .vp .grid2 .dph{flex:none;width:76px;height:76px;margin:12px 0 12px 12px;border-radius:10px}
      .vp .grid2 .db{padding:.8rem 1rem}
      .vp .grid2 .db h3{font-size:1.02rem;margin-bottom:.15rem}
      .vp .grid2 .db p{font-size:.88rem;margin-bottom:.2rem;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
      .vp .grid2 .dl{font-size:.84rem}
    }
    @media(min-width:640px){.vp .grid2{grid-template-columns:1fr 1fr}.vp .nav{order:0;width:auto}.vp .ft-grid{grid-template-columns:1.4fr 1fr 1fr;text-align:left}.vp .fsoc{justify-content:flex-start}}
    @media(min-width:860px){.vp .grid3{grid-template-columns:1fr 1fr 1fr}.vp .hero h1{font-size:2.6rem}}
  `;

  return (<>
    <div className="vp" style={vars}>
      <style dangerouslySetInnerHTML={{ __html: css }} />

      {(isConcept || isVoorproef) && <VoorproefLabel isConcept={isConcept} slug={params.slug} />}

      <header className="hd"><div className="hd-in">
        <div className="logo">{m.logo_url ? <img src={m.logo_url} alt={b.naam || "logo"} style={{ height: 42, width: "auto", display: "block" }} /> : <>{naamDelen[0]} <span className="o">{naamDelen.slice(1).join(" ")}</span></>}</div>
        <nav className="nav">
          <a href="#home">Home</a>
          <a href="#diensten">Diensten</a>
          <a href="#werk">Projecten</a>
          <a href="#over">Over</a>
          <a href="#contact">Contact</a>
        </nav>
        <div className="sbm-rij" style={{ display: "flex", alignItems: "center", gap: 8 }}><a className="cta" href="#contact">{hero.cta_tekst || "Offerte"}</a><MobielMenu tot={639} /></div>
      </div></header>

      <section className="hero" id="home" style={heroAchtergrond(hero.achtergrond || heroFoto(b.branche), MERK_OVERLAY)}>
        <span className="eyebrow">{b.branche || b.naam}</span>
        <h1>{sloganAcc ? <>{sloganAcc[0]}{sloganAcc[1] ? <span className="ac">{sloganAcc[1]}</span> : null}</> : <>{heroKopBase}{heroAcc ? <> <span className="ac">{heroAcc}</span></> : null}</>}</h1>
        {hero.subkop && <p>{hero.subkop}</p>}
        <div className="hbtns">
          <a className="bp" href="#contact">{hero.cta_tekst || "Offerte aanvragen"} &rarr;</a>
          <a className="bs" href="#werk">Bekijk ons werk</a>
        </div>
        {usps.length > 0 && (
          <div className="trust">
            {usps.slice(0, 3).map((u, i) => (
              <span key={i}><span className="tick">&#10003;</span> {u}</span>
            ))}
          </div>
        )}
      </section>

      {diensten.length > 0 && (
        <section className="sec" id="diensten"><div className="in">
          <div className="sh"><span className="eyebrow" style={{ color: "var(--orange-ink)" }}>Wat we doen</span><h2>Onze specialiteiten</h2><p>Werk waar we onze naam onder zetten.</p></div>
          <div className="grid2">
            {diensten.map((d, i) => (
              <a className="dc" key={i} href={`/${params.slug}/dienst/${i}${modeQuery}`}>
                <div className="dph" style={{ backgroundImage: `url(${d.beeld_url || nicheFoto(b.branche, i + 1)})`, color: "transparent" }}></div>
                <div className="db"><h3>{d.titel}</h3><p>{d.omschrijving}</p><span className="dl">Lees meer &rarr;</span></div>
              </a>
            ))}
          </div>
        </div></section>
      )}

      {voordelen.length > 0 && (
        <section className="sec alt"><div className="in">
          <div className="sh"><span className="eyebrow" style={{ color: "var(--orange-ink)" }}>Wat u krijgt</span><h2>Wat u van ons mag verwachten</h2></div>
          <div className="grid3">
            {voordelen.map((v, i) => (
              <div className="bel" key={i}><div className="belic">{voordeelIcon(v.titel, v.tekst)}</div><h3>{v.titel}</h3><p>{v.tekst}</p></div>
            ))}
          </div>
        </div></section>
      )}

      <section className="sec" id="werk"><div className="in">
        <div className="sh"><span className="eyebrow" style={{ color: "var(--orange-ink)" }}>Portfolio</span><h2>Een greep uit recent werk</h2></div>
        <div className="grid3">
          {projecten.length > 0
            ? projecten.map((p, i) => (
                <a className="pc" key={i} href={`/${params.slug}/project/${i}${modeQuery}`}>
                  {heeftFases(p) ? <FaseFotos fases={p.fases} className="pph" /> : <div className="pph" style={{ backgroundImage: `url(${p.beeld_url || nicheFoto(b.branche, i + 1)})`, color: "transparent" }}></div>}
                  <div className="pb">{p.nieuw && <span style={{ display: "inline-block", background: "#111827", color: "#fff", fontSize: ".72rem", fontWeight: 700, padding: ".2rem .55rem", borderRadius: 999, marginBottom: ".35rem" }}>Net door jou geplaatst</span>}<h3>{p.titel}</h3>{p.plaats && <div className="pm">{p.plaats}</div>}</div>
                </a>
              ))
            : [0, 1, 2].map((i) => (
                <div className="pc" key={i}>
                  <div className="pph" style={{ backgroundImage: `url(${nicheFoto(b.branche, i + 2)})`, color: "transparent" }}></div>
                </div>
              ))}
        </div>
      </div></section>

      <section className="sec" id="over"><div className="in">
        <div className="sh"><span className="eyebrow" style={{ color: "var(--orange-ink)" }}>Over ons</span><h2>Over {b.naam}</h2><p>{c.over_ons}</p></div>
        {b.regio && <p className="phnote">Werkgebied: {b.regio}</p>}
      </div></section>

      <section className="sec alt" id="reviews"><div className="in">
        <div className="sh"><span className="eyebrow" style={{ color: "var(--orange-ink)" }}>Reviews</span><h2>Wat klanten zeggen</h2></div>
        <div className="grid3">
          {reviews.length > 0
            ? reviews.map((r, i) => (
                <div className="rev" key={i}>
                  <div className="stars">{"★".repeat(Math.max(0, Math.min(5, r.score || 5)))}</div>
                  <p className="rq">&ldquo;{r.tekst}&rdquo;</p>
                  <div className="ra"><div className="av">{(r.naam || "?").charAt(0)}</div><div className="rn">{r.naam}</div></div>
                </div>
              ))
            : [0, 1, 2].map((i) => (
                <div className="rev" key={i} style={{ opacity: 0.7 }}>
                  <div className="stars">★★★★★</div>
                  <p className="rq">&ldquo;{REVIEW_PLEK}&rdquo;</p>
                  <div className="ra"><div className="av">?</div><div className="rn">Klantnaam</div></div>
                </div>
              ))}
        </div>
        <ReviewBrug content={c} isReview={isVoorproef} />
        {b.google_business_url
          ? <p className="phnote"><a href={b.google_business_url} style={{ color: "var(--orange-ink)", fontWeight: 700 }}>Bekijk onze Google-reviews &rarr;</a></p>
          : (reviews.length === 0 && <p className="phnote">Met je app vraag je reviews op. Ze verschijnen dan hier.</p>)}
      </div></section>

      <section className="fcta" id="contact">
        <h2>{cta.kop || "Klus in gedachten? Stuur 'm gewoon door."}</h2>
        <p>{cta.tekst || "Een foto via WhatsApp is vaak sneller dan een formulier. Of bel direct, we nemen zelf op."}</p>
        <div className="fbtns">
          {wa && <a className="wa" href={wa}><WaIcon /> WhatsApp ons</a>}
          {b.telefoon && <a className="bo" href={`tel:${b.telefoon}`}>&#128222; Direct bellen</a>}
        </div>
      </section>

      <footer className="ft">
        <div className="ft-grid">
          <div><h4>{b.naam}</h4><p style={{ color: "rgba(255,255,255,.7)" }}>{b.adres}{b.kvk ? <><br />KvK {b.kvk}</> : null}{b.btw ? <><br />BTW {b.btw}</> : null}</p></div>
          <div>
            <h4>Contact</h4>
            {b.telefoon && <a href={`tel:${b.telefoon}`}>&#128222; {b.telefoon}</a>}
            {b.email && <a href={`mailto:${b.email}`}>&#9993; {b.email}</a>}
            {b.openingstijden && <p style={{ color: "rgba(255,255,255,.6)", marginTop: ".4rem" }}>{b.openingstijden}</p>}
            {b.regio && <p style={{ color: "rgba(255,255,255,.6)", marginTop: ".4rem" }}>Werkgebied: {b.regio}</p>}
          </div>
          <div><h4>Volg ons</h4><div className="fsoc">
            {wa && <a className="sb2 wa2" href={wa} aria-label="WhatsApp"><WaIcon s={18} /></a>}
            {socials.facebook && <a className="sb2" href={socials.facebook} aria-label="Facebook"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg></a>}
            {socials.instagram && <a className="sb2" href={socials.instagram} aria-label="Instagram"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8z" /></svg></a>}
          </div></div>
        </div>
        <div className="fbottom">&copy; {new Date().getFullYear()} {b.naam} &middot; Website door StudioBaris</div>
      </footer>
    </div>
    {balk}{wissel}
  </>);
}
