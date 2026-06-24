import { notFound } from "next/navigation";
import { getPreview, googleFontsHref } from "../../lib/preview";
import { getConcept, getFull } from "../../lib/server-data";
import ModernSite from "../styles/modern";
import PersoonlijkSite from "../styles/persoonlijk";

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
  let content;
  if (isConcept) {
    content = await getConcept(params.slug);
    if (!content) notFound();
  } else if (isReview) {
    content = await getFull(params.slug);
    if (!content) notFound();
  } else {
    const row = await getPreview(params.slug);
    if (!row) notFound();
    content = row.content;
  }

  const c = content || {};
  const stijl = searchParams?.stijl || (c.merk && c.merk.stijl) || "stoer";
  if (stijl === "modern") return <ModernSite content={c} isConcept={isConcept} isReview={isReview} />;
  if (stijl === "persoonlijk") return <PersoonlijkSite content={c} isConcept={isConcept} isReview={isReview} />;
  const b = c.bedrijf || {};
  const m = c.merk || {};
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

  const vars = {
    "--black": m.primaire_kleur || "#0F0F0F",
    "--soft": m.primaire_kleur || "#1a1a1a",
    "--orange": m.secundaire_kleur || "#FF8300",
    "--orange-d": "color-mix(in srgb, " + (m.secundaire_kleur || "#FF8300") + " 85%, black)",
    "--white": "#fff",
    "--bg": m.accent_kleur || "#F8F9FA",
    "--line": "#E5E7EB",
    "--gtext": "#334155",
    "--gsoft": "#94A3B8",
    "--font-head": m.koppen_font ? `'${m.koppen_font}', system-ui, sans-serif` : "system-ui, sans-serif",
    "--font-body": m.tekst_font ? `'${m.tekst_font}', system-ui, sans-serif` : "system-ui, sans-serif",
  };

  const css = `
    @import url('${fontsHref}');
    .vp *{box-sizing:border-box;margin:0;padding:0}
    .vp{font-family:var(--font-body);color:var(--gtext);background:var(--white);line-height:1.6}
    .vp h1,.vp h2,.vp h3,.vp h4{font-family:var(--font-head);color:var(--black);font-weight:800;line-height:1.2;letter-spacing:-.5px}
    .vp a{color:inherit;text-decoration:none}
    .vp .hd{position:sticky;top:0;z-index:50;background:var(--white);border-bottom:1px solid var(--line);padding:.9rem 1.2rem}
    .vp .hd-in{max-width:1100px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:.6rem .9rem;flex-wrap:wrap}
    .vp .logo{font-size:1.2rem;font-weight:800;color:var(--black)}
    .vp .logo .o{color:var(--orange)}
    .vp .nav{order:3;width:100%;display:flex;gap:1rem;flex-wrap:wrap;justify-content:center}
    .vp .nav a{font-size:.88rem;font-weight:500;color:var(--gtext);border-bottom:2px solid transparent;padding-bottom:2px}
    .vp .nav a:hover{color:var(--black);border-color:var(--orange)}
    .vp .cta{background:var(--orange);color:#fff;padding:.55rem 1rem;border-radius:8px;font-weight:700;font-size:.9rem}
    .vp .cta:hover{background:var(--orange-d)}
    .vp .hero{position:relative;background:var(--black);color:#fff;padding:3.4rem 1.3rem 3.8rem;text-align:center}
    .vp .eyebrow{display:inline-block;color:var(--orange);font-weight:700;font-size:.78rem;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:.9rem}
    .vp .hero h1{color:#fff;font-size:2rem;margin-bottom:.9rem}
    .vp .hero h1 .ac{color:var(--orange)}
    .vp .hero p{color:rgba(255,255,255,.82);max-width:620px;margin:0 auto 1.6rem;font-size:1.02rem}
    .vp .hbtns{display:flex;flex-wrap:wrap;gap:.7rem;justify-content:center;margin-bottom:1.8rem}
    .vp .bp{background:var(--orange);color:#fff;padding:.85rem 1.3rem;border-radius:10px;font-weight:700}
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
    .vp .dl{color:var(--orange);font-weight:700;font-size:.9rem}
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
    .vp .stars{color:var(--orange);letter-spacing:2px;margin-bottom:.6rem}
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
    @media(min-width:640px){.vp .grid2{grid-template-columns:1fr 1fr}.vp .nav{order:0;width:auto}.vp .ft-grid{grid-template-columns:1.4fr 1fr 1fr;text-align:left}.vp .fsoc{justify-content:flex-start}}
    @media(min-width:860px){.vp .grid3{grid-template-columns:1fr 1fr 1fr}.vp .hero h1{font-size:2.6rem}}
  `;

  return (
    <div className="vp" style={vars}>
      <style dangerouslySetInnerHTML={{ __html: css }} />

      {(isConcept || isReview) && (
        <div style={{ background: "#b45309", color: "#fff", textAlign: "center", padding: "8px 12px", fontSize: 14, fontFamily: "system-ui, sans-serif" }}>
          {isConcept
            ? "Conceptversie — nog niet gepubliceerd. Controleer en publiceer via het dashboard."
            : "Interne preview — deze site is nog niet online voor de klant. Zet hem online via het dashboard."}
        </div>
      )}

      <header className="hd"><div className="hd-in">
        <div className="logo">{m.logo_url ? <img src={m.logo_url} alt={b.naam || "logo"} style={{ height: 42, width: "auto", display: "block" }} /> : <>{naamDelen[0]} <span className="o">{naamDelen.slice(1).join(" ")}</span>{b.slogan ? <span style={{ display: "block", fontSize: ".72rem", fontWeight: 500, color: "var(--gsoft)", letterSpacing: ".3px" }}>{b.slogan}</span> : null}</>}</div>
        <nav className="nav">
          <a href="#diensten">Diensten</a>
          <a href="#werk">Projecten</a>
          <a href="#reviews">Reviews</a>
          <a href="#contact">Contact</a>
        </nav>
        <a className="cta" href="#contact">{hero.cta_tekst || "Offerte"}</a>
      </div></header>

      <section className="hero">
        <span className="eyebrow">{b.branche || b.naam}</span>
        <h1>{heroKopBase}{heroAcc ? <> <span className="ac">{heroAcc}</span></> : null}</h1>
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
          <div className="sh"><span className="eyebrow" style={{ color: "var(--orange-d)" }}>Wat we doen</span><h2>Onze specialiteiten</h2><p>Werk waar we onze naam onder zetten.</p></div>
          <div className="grid2">
            {diensten.map((d, i) => (
              <a className="dc" key={i} href={`/${params.slug}/dienst/${i}`}>
                <div className="dph" style={d.beeld_url ? { backgroundImage: `url(${d.beeld_url})`, color: "transparent" } : undefined}>{d.beeld_url ? "" : "📷 Foto bij dienst"}</div>
                <div className="db"><h3>{d.titel}</h3><p>{d.omschrijving}</p><span className="dl">Lees meer &rarr;</span></div>
              </a>
            ))}
          </div>
        </div></section>
      )}

      {voordelen.length > 0 && (
        <section className="sec alt"><div className="in">
          <div className="sh"><span className="eyebrow" style={{ color: "var(--orange-d)" }}>Wat u krijgt</span><h2>Wat u van ons mag verwachten</h2></div>
          <div className="grid3">
            {voordelen.map((v, i) => (
              <div className="bel" key={i}><div className="belic">{v.icoon || "✓"}</div><h3>{v.titel}</h3><p>{v.tekst}</p></div>
            ))}
          </div>
        </div></section>
      )}

      <section className="sec" id="werk"><div className="in">
        <div className="sh"><span className="eyebrow" style={{ color: "var(--orange-d)" }}>Portfolio</span><h2>Een greep uit recent werk</h2></div>
        <div className="grid3">
          {projecten.length > 0
            ? projecten.map((p, i) => (
                <a className="pc" key={i} href={`/${params.slug}/project/${i}`}>
                  <div className="pph" style={p.beeld_url ? { backgroundImage: `url(${p.beeld_url})`, color: "transparent" } : undefined}>{p.beeld_url ? "" : "📷 Projectfoto"}</div>
                  <div className="pb"><h3>{p.titel}</h3>{p.plaats && <div className="pm">{p.plaats}</div>}</div>
                </a>
              ))
            : [0, 1, 2].map((i) => (
                <div className="pc" key={i} style={{ opacity: 0.7 }}>
                  <div className="pph">📷 Projectfoto</div>
                  <div className="pb"><h3>Jullie project hier</h3><div className="pm">Plaatsnaam</div></div>
                </div>
              ))}
        </div>
        {projecten.length === 0 && <p className="phnote">Voeg projectfoto's toe en deze sectie vult zich met jullie eigen werk.</p>}
      </div></section>

      <section className="sec alt" id="reviews"><div className="in">
        <div className="sh"><span className="eyebrow" style={{ color: "var(--orange-d)" }}>Reviews</span><h2>Wat klanten zeggen</h2></div>
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
                  <p className="rq">&ldquo;Hier verschijnt straks een review van een tevreden klant.&rdquo;</p>
                  <div className="ra"><div className="av">?</div><div className="rn">Klantnaam</div></div>
                </div>
              ))}
        </div>
        {b.google_business_url
          ? <p className="phnote"><a href={b.google_business_url} style={{ color: "var(--orange-d)", fontWeight: 700 }}>Bekijk onze Google-reviews &rarr;</a></p>
          : (reviews.length === 0 && <p className="phnote">Lever jullie (Google-)reviews aan en ze verschijnen hier.</p>)}
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
  );
}
