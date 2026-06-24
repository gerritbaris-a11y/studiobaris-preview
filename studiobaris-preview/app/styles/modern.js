import { googleFontsHref } from "../../lib/preview";
import { brandVars } from "../../lib/brand";

function waLink(n) {
  if (!n) return null;
  let d = String(n).replace(/[^0-9]/g, "");
  if (d.startsWith("0")) d = "31" + d.slice(1);
  return "https://wa.me/" + d;
}

// Stijl "Strak & Modern": licht, typografisch, rustige accordion-diensten.
export default function ModernSite({ content, isConcept, isReview }) {
  const c = content || {};
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
  const VDI = [
    <svg key="a" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l7 3v5c0 4.6-3.1 7.6-7 9-3.9-1.4-7-4.4-7-9V6l7-3z"/><path d="M9 12l2 2 4-4"/></svg>,
    <svg key="b" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="9" r="5"/><path d="M8.5 13.2 7 21l5-2.8L17 21l-1.5-7.8"/></svg>,
    <svg key="c" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.4 8.4 0 0 1-3.8-.9L3 21l2-5.2A8.4 8.4 0 1 1 21 11.5z"/></svg>,
  ];
  const projecten = c.projecten || [];
  const reviews = c.reviews || [];
  const usps = c.usps || [];
  const cta = c.cta_blok || {};
  const socials = b.socials || {};
  const wa = waLink(b.whatsapp || b.telefoon);
  const naam = String(b.naam || "Bedrijf").split(" ");
  const acc = hero.kop_accent || "";
  const kop = hero.kop || b.naam || "";
  const kopBase = acc && kop.toLowerCase().trim().endsWith(acc.toLowerCase().trim())
    ? kop.slice(0, kop.toLowerCase().lastIndexOf(acc.toLowerCase())).trim() : kop;
  const vars = brandVars(m);
  const fontsHref = googleFontsHref(m.koppen_font, m.tekst_font);

  const css = `
    @import url('${fontsHref}');
    .md *{box-sizing:border-box;margin:0;padding:0}
    .md{font-family:var(--font-body);color:#243040;background:#fff;line-height:1.6}
    .md h1,.md h2,.md h3,.md h4{font-family:var(--font-head);color:#10151f;font-weight:800;letter-spacing:-.4px;line-height:1.15}
    .md a{color:inherit;text-decoration:none}
    .md .wrap{max-width:1000px;margin:0 auto;padding:0 24px}
    .md .hd{position:sticky;top:0;z-index:50;background:rgba(255,255,255,.92);backdrop-filter:blur(8px);border-bottom:1px solid #eef0f3}
    .md .hd-in{max-width:1000px;margin:0 auto;padding:.9rem 24px;display:flex;align-items:center;justify-content:space-between;gap:.6rem;flex-wrap:wrap}
    .md .logo{font-weight:800;font-size:1.2rem;color:#10151f}
    .md .logo .o{color:var(--orange)}
    .md .logo small{display:block;font-size:.68rem;font-weight:500;color:#9aa3b0;letter-spacing:.3px}
    .md .nav{display:flex;gap:1.3rem;font-size:.9rem;color:#55606e}
    .md .cta{background:var(--orange);color:#fff;padding:.55rem 1.1rem;border-radius:8px;font-weight:700;font-size:.88rem}
    .md .hero{padding:4.5rem 0 4rem;background:linear-gradient(180deg,#ffffff,var(--bg))}
    .md .hero .wrap{max-width:820px}
    .md .eyebrow{color:var(--orange);font-weight:700;font-size:.78rem;letter-spacing:2px;text-transform:uppercase}
    .md .hero h1{font-size:clamp(2.1rem,6vw,3.4rem);margin:.7rem 0}
    .md .hero h1 .ac{color:var(--orange)}
    .md .hero p{font-size:1.12rem;color:#55606e;max-width:58ch;margin-bottom:1.6rem}
    .md .btns{display:flex;gap:.8rem;flex-wrap:wrap}
    .md .bp{background:var(--orange);color:#fff;font-weight:700;padding:.9rem 1.4rem;border-radius:10px}
    .md .bs{border:1.5px solid #10151f;color:#10151f;font-weight:600;padding:.9rem 1.4rem;border-radius:10px}
    .md .trust{display:flex;flex-wrap:wrap;gap:.6rem 1.6rem;margin-top:1.8rem;color:#55606e;font-size:.92rem}
    .md .trust span{display:flex;gap:.4rem;align-items:center}
    .md .tick{color:var(--orange);font-weight:800}
    .md .sec{padding:3.6rem 0;border-top:1px solid #eef0f3}
    .md .sec h2{font-size:clamp(1.5rem,3vw,2.1rem);margin-bottom:.4rem}
    .md .lead{color:#55606e;margin-bottom:1.8rem;max-width:60ch}
    .md details.acd{border-bottom:1px solid #e7eaee;padding:1.05rem 0}
    .md details.acd summary{display:flex;justify-content:space-between;align-items:center;cursor:pointer;font-weight:700;font-size:1.12rem;color:#10151f;list-style:none}
    .md details.acd summary::-webkit-details-marker{display:none}
    .md details.acd .pl{color:var(--orange);font-size:1.5rem;line-height:1}
    .md details.acd p{color:#55606e;margin-top:.7rem;max-width:66ch}
    .md .voord{display:grid;grid-template-columns:1fr;gap:1.5rem}
    .md .vd{display:flex;gap:.9rem;align-items:flex-start}
    .md .vd .ic{flex:none;width:36px;height:36px;border-radius:10px;background:var(--bg);display:grid;place-items:center;font-size:1.1rem}
    .md .vd h3{font-size:1.08rem}
    .md .vd p{color:#55606e;margin-top:.15rem;font-size:.95rem}
    .md .grid{display:grid;grid-template-columns:1fr;gap:1.2rem}
    .md .pcard{border-radius:14px;overflow:hidden;border:1px solid #eef0f3;background:#fff}
    .md .pimg{height:190px;background:#eef1f5;background-size:cover;background-position:center;display:grid;place-items:center;color:#9aa3b0;font-size:.88rem}
    .md .pcard .pb{padding:.9rem 1.1rem}
    .md .pcard h3{font-size:1.02rem}
    .md .pcard .pm{color:#9aa3b0;font-size:.84rem;margin-top:.15rem}
    .md .rev{border-left:3px solid var(--orange);padding:.3rem 0 .3rem 1.2rem;margin-bottom:1.6rem}
    .md .rev .q{font-size:1.12rem;color:#2a3340;font-style:italic}
    .md .rev .nm{font-weight:700;margin-top:.5rem;color:#10151f;font-style:normal}
    .md .stars{color:var(--orange);letter-spacing:2px;margin-bottom:.4rem}
    .md .ctaband{background:var(--bg);border-radius:18px;padding:3rem 1.6rem;text-align:center;margin:1rem 0}
    .md .ctaband h2{font-size:clamp(1.5rem,3vw,2.1rem)}
    .md .ctaband p{color:#55606e;margin:.6rem auto 1.4rem;max-width:52ch}
    .md .phnote{color:#9aa3b0;font-size:.9rem;margin-top:1rem}
    .md .ft{border-top:1px solid #eef0f3;padding:2.4rem 0;color:#55606e;font-size:.92rem}
    .md .ftg{display:grid;grid-template-columns:1fr;gap:1.3rem}
    .md .ft h4{color:#10151f;font-size:1rem;margin-bottom:.5rem}
    .md .ft a{display:block;color:#55606e;margin:.2rem 0}
    .md .fsoc{display:flex;gap:.6rem;margin-top:.3rem}
    .md .sb{width:36px;height:36px;border-radius:50%;background:var(--bg);color:#55606e;display:inline-grid;place-items:center}
    .md .fbot{border-top:1px solid #eef0f3;margin-top:1.5rem;padding-top:1rem;font-size:.82rem;color:#9aa3b0;text-align:center}
    @media(min-width:760px){.md .voord{grid-template-columns:1fr 1fr 1fr}.md .grid{grid-template-columns:1fr 1fr}.md .ftg{grid-template-columns:1.5fr 1fr 1fr}}
  `;

  return (
    <div className="md" style={vars}>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      {(isConcept || isReview) && (
        <div style={{ background: "#b45309", color: "#fff", textAlign: "center", padding: "8px 12px", fontSize: 14, fontFamily: "system-ui, sans-serif" }}>
          {isConcept ? "Conceptversie — nog niet gepubliceerd." : "Interne preview — nog niet online voor de klant."}
        </div>
      )}

      <header className="hd"><div className="hd-in">
        <div className="logo">{m.logo_url ? <img src={m.logo_url} alt={b.naam || "logo"} style={{ height: 38, width: "auto", display: "block" }} /> : <>{naam[0]} <span className="o">{naam.slice(1).join(" ")}</span></>}</div>
        <nav className="nav">
          {diensten.length > 0 && <a href="#diensten">Diensten</a>}
          <a href="#werk">Projecten</a>
          <a href="#contact">Contact</a>
        </nav>
        <a className="cta" href="#contact">{hero.cta_tekst || "Offerte"}</a>
      </div></header>

      <section className="hero"><div className="wrap">
        <div className="eyebrow">{b.branche || b.naam}</div>
        <h1>{sloganAcc ? <>{sloganAcc[0]}{sloganAcc[1] ? <span style={{ color: "var(--orange)" }}>{sloganAcc[1]}</span> : null}</> : <>{kopBase}{acc ? <> <span className="ac">{acc}</span></> : null}</>}</h1>
        {hero.subkop && <p>{hero.subkop}</p>}
        <div className="btns">
          <a className="bp" href="#contact">{hero.cta_tekst || "Offerte aanvragen"}</a>
          <a className="bs" href="#werk">Bekijk ons werk</a>
        </div>
        {usps.length > 0 && (
          <div className="trust">{usps.slice(0, 3).map((u, i) => <span key={i}><span className="tick">&#10003;</span> {u}</span>)}</div>
        )}
      </div></section>

      {diensten.length > 0 && (
        <section className="sec" id="diensten"><div className="wrap">
          <h2>Onze diensten</h2>
          <p className="lead">{c.over_ons || "Werk waar we onze naam onder zetten."}</p>
          {diensten.map((d, i) => (
            <details className="acd" key={i}>
              <summary>{d.titel}<span className="pl">+</span></summary>
              <p>{d.omschrijving}</p>
            </details>
          ))}
        </div></section>
      )}

      {voordelen.length > 0 && (
        <section className="sec"><div className="wrap">
          <h2>Wat u van ons mag verwachten</h2>
          <div className="voord" style={{ marginTop: "1.8rem" }}>
            {voordelen.map((v, i) => (
              <div className="vd" key={i}><div className="ic">{VDI[i % 3]}</div><div><h3>{v.titel}</h3><p>{v.tekst}</p></div></div>
            ))}
          </div>
        </div></section>
      )}

      <section className="sec" id="werk"><div className="wrap">
        <h2>Recent werk</h2>
        <div className="grid" style={{ marginTop: "1.8rem" }}>
          {projecten.length > 0
            ? projecten.map((p, i) => (
                <div className="pcard" key={i}>
                  <div className="pimg" style={p.beeld_url ? { backgroundImage: `url(${p.beeld_url})`, color: "transparent" } : undefined}>{p.beeld_url ? "" : "📷 Projectfoto"}</div>
                  <div className="pb"><h3>{p.titel}</h3>{p.plaats && <div className="pm">{p.plaats}</div>}</div>
                </div>
              ))
            : [0, 1].map((i) => (
                <div className="pcard" key={i} style={{ opacity: 0.7 }}>
                  <div className="pimg">📷 Projectfoto</div>
                  <div className="pb"><h3>Jullie project hier</h3><div className="pm">Plaatsnaam</div></div>
                </div>
              ))}
        </div>
        {projecten.length === 0 && <p className="phnote">Lever projectfoto's aan en dit vult zich met jullie eigen werk.</p>}
      </div></section>

      <section className="sec"><div className="wrap">
        <h2>Wat klanten zeggen</h2>
        <div style={{ marginTop: "1.8rem" }}>
          {reviews.length > 0
            ? reviews.map((r, i) => (
                <div className="rev" key={i}><div className="stars">{"★".repeat(Math.max(0, Math.min(5, r.score || 5)))}</div><div className="q">&ldquo;{r.tekst}&rdquo;</div><div className="nm">{r.naam}</div></div>
              ))
            : [0, 1].map((i) => (
                <div className="rev" key={i} style={{ opacity: 0.7 }}><div className="stars">★★★★★</div><div className="q">&ldquo;Hier verschijnt straks een review van een tevreden klant.&rdquo;</div><div className="nm">Klantnaam</div></div>
              ))}
        </div>
        {b.google_business_url
          ? <p className="phnote"><a href={b.google_business_url} style={{ color: "var(--orange-d)", fontWeight: 700 }}>Bekijk onze Google-reviews &rarr;</a></p>
          : (reviews.length === 0 && <p className="phnote">Lever jullie (Google-)reviews aan en ze verschijnen hier.</p>)}
      </div></section>

      <section className="sec" id="contact"><div className="wrap">
        <div className="ctaband">
          <h2>{cta.kop || "Klaar om te beginnen?"}</h2>
          <p>{cta.tekst || "Neem contact op voor een vrijblijvende offerte."}</p>
          <div className="btns" style={{ justifyContent: "center" }}>
            {wa && <a className="bp" href={wa}>WhatsApp ons</a>}
            {b.telefoon && <a className="bs" href={`tel:${b.telefoon}`}>Bel {b.telefoon}</a>}
          </div>
        </div>
      </div></section>

      <footer className="ft"><div className="wrap">
        <div className="ftg">
          <div><h4>{b.naam}</h4><p>{b.adres}{b.kvk ? <><br />KvK {b.kvk}</> : null}{b.btw ? <><br />BTW {b.btw}</> : null}</p></div>
          <div>
            <h4>Contact</h4>
            {b.telefoon && <a href={`tel:${b.telefoon}`}>{b.telefoon}</a>}
            {b.email && <a href={`mailto:${b.email}`}>{b.email}</a>}
            {b.regio && <p style={{ marginTop: ".4rem" }}>Werkgebied: {b.regio}</p>}
          </div>
          <div><h4>Volg ons</h4><div className="fsoc">
            {socials.facebook && <a className="sb" href={socials.facebook} aria-label="Facebook">f</a>}
            {socials.instagram && <a className="sb" href={socials.instagram} aria-label="Instagram">ig</a>}
            {socials.linkedin && <a className="sb" href={socials.linkedin} aria-label="LinkedIn">in</a>}
          </div></div>
        </div>
        <div className="fbot">&copy; {new Date().getFullYear()} {b.naam} &middot; Website door StudioBaris</div>
      </div></footer>
    </div>
  );
}
