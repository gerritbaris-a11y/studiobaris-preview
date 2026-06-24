import { googleFontsHref } from "../../lib/preview";
import { brandVars } from "../../lib/brand";

function waLink(n) {
  if (!n) return null;
  let d = String(n).replace(/[^0-9]/g, "");
  if (d.startsWith("0")) d = "31" + d.slice(1);
  return "https://wa.me/" + d;
}

// Stijl "Warm & Persoonlijk": vakman centraal, verhaal + werkwijze in stappen.
export default function PersoonlijkSite({ content, isConcept, isReview }) {
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
  const socials = b.socials || {};
  const wa = waLink(b.whatsapp || b.telefoon);
  const naam = String(b.naam || "Bedrijf").split(" ");
  const vars = brandVars(m);
  const fontsHref = googleFontsHref(m.koppen_font, m.tekst_font);

  const css = `
    @import url('${fontsHref}');
    .pz *{box-sizing:border-box;margin:0;padding:0}
    .pz{font-family:var(--font-body);color:#3a3026;background:#fffdfb;line-height:1.6}
    .pz h1,.pz h2,.pz h3,.pz h4{font-family:var(--font-head);color:#2a2018;font-weight:800;line-height:1.18}
    .pz a{color:inherit;text-decoration:none}
    .pz .wrap{max-width:980px;margin:0 auto;padding:0 24px}
    .pz .hd{position:sticky;top:0;z-index:50;background:rgba(255,253,251,.92);backdrop-filter:blur(8px);border-bottom:1px solid #f0e7da}
    .pz .hd-in{max-width:980px;margin:0 auto;padding:.85rem 24px;display:flex;align-items:center;justify-content:space-between;gap:.6rem;flex-wrap:wrap}
    .pz .logo{font-weight:800;font-size:1.2rem;color:#2a2018}.pz .logo .o{color:var(--orange)}
    .pz .nav{display:flex;gap:1.2rem;font-size:.9rem;color:#6b5d4d}
    .pz .cta{background:var(--orange);color:#fff;padding:.55rem 1.1rem;border-radius:999px;font-weight:700;font-size:.88rem}
    .pz .hero{background:#fdf3e7;padding:3.4rem 0 3.6rem;text-align:center}
    .pz .pf{width:120px;height:120px;border-radius:50%;margin:0 auto 1.2rem;background:#e7d2b8 center/cover no-repeat;display:grid;place-items:center;color:#9a6b3a;font-size:.85rem;border:4px solid #fff;box-shadow:0 8px 24px rgba(0,0,0,.1)}
    .pz .eyebrow{color:var(--orange);font-weight:700;font-size:.78rem;letter-spacing:1.5px;text-transform:uppercase}
    .pz .hero h1{font-size:clamp(1.9rem,5vw,2.8rem);margin:.6rem 0}
    .pz .hero p{color:#6b5d4d;font-size:1.08rem;max-width:56ch;margin:0 auto 1.4rem}
    .pz .bp{background:var(--orange);color:#fff;font-weight:700;padding:.85rem 1.5rem;border-radius:999px;display:inline-block}
    .pz .trust{display:flex;flex-wrap:wrap;gap:.5rem 1.4rem;justify-content:center;margin-top:1.4rem;color:#6b5d4d;font-size:.9rem}
    .pz .trust span{display:flex;gap:.4rem;align-items:center}.pz .tick{color:var(--orange);font-weight:800}
    .pz .sec{padding:3.4rem 0}
    .pz .sec h2{font-size:clamp(1.5rem,3vw,2rem);text-align:center;margin-bottom:.4rem}
    .pz .lead{color:#6b5d4d;text-align:center;max-width:60ch;margin:0 auto 2rem}
    .pz .steps{max-width:640px;margin:0 auto}
    .pz .step{display:flex;gap:1rem;align-items:flex-start;margin-bottom:1.4rem}
    .pz .num{flex:none;width:38px;height:38px;border-radius:50%;background:var(--orange);color:#fff;font-weight:800;display:grid;place-items:center}
    .pz .step h3{font-size:1.1rem}.pz .step p{color:#6b5d4d;margin-top:.15rem}
    .pz .alt{background:#fdf3e7}
    .pz .grid{display:grid;grid-template-columns:1fr;gap:1.1rem}
    .pz .card{background:#fff;border:1px solid #f0e7da;border-radius:16px;padding:1.3rem}
    .pz .card h3{color:#2a2018;font-size:1.15rem;margin-bottom:.3rem}.pz .card p{color:#6b5d4d;font-size:.95rem}
    .pz .pcard{background:#fff;border:1px solid #f0e7da;border-radius:16px;overflow:hidden}
    .pz .pimg{height:180px;background:#efe4d4;background-size:cover;background-position:center;display:grid;place-items:center;color:#a98d6a;font-size:.88rem}
    .pz .pcard .pb{padding:.9rem 1.1rem}.pz .pcard h3{font-size:1rem}.pz .pcard .pm{color:#a98d6a;font-size:.84rem;margin-top:.15rem}
    .pz .rev{background:#fff;border:1px solid #f0e7da;border-radius:16px;padding:1.3rem}
    .pz .stars{color:var(--orange);letter-spacing:2px;margin-bottom:.5rem}
    .pz .rq{color:#4a3f33;font-size:.98rem;font-style:italic}.pz .rn{font-weight:700;color:#2a2018;margin-top:.6rem}
    .pz .phnote{text-align:center;color:#a98d6a;font-size:.9rem;margin-top:1rem}
    .pz .ctaband{text-align:center;padding:3rem 0}
    .pz .ft{background:#2a2018;color:rgba(255,255,255,.72);padding:2.4rem 0;font-size:.92rem}
    .pz .ftg{display:grid;grid-template-columns:1fr;gap:1.3rem}
    .pz .ft h4{color:#fff;font-size:1rem;margin-bottom:.5rem}.pz .ft a{display:block;color:rgba(255,255,255,.75);margin:.2rem 0}
    .pz .fbot{border-top:1px solid rgba(255,255,255,.12);margin-top:1.4rem;padding-top:1rem;text-align:center;font-size:.82rem;color:rgba(255,255,255,.55)}
    @media(min-width:760px){.pz .grid{grid-template-columns:1fr 1fr}.pz .ftg{grid-template-columns:1.5fr 1fr 1fr}}
  `;

  return (
    <div className="pz" style={vars}>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      {(isConcept || isReview) && (
        <div style={{ background: "#b45309", color: "#fff", textAlign: "center", padding: "8px 12px", fontSize: 14, fontFamily: "system-ui, sans-serif" }}>
          {isConcept ? "Conceptversie — nog niet gepubliceerd." : "Interne preview — nog niet online voor de klant."}
        </div>
      )}

      <header className="hd"><div className="hd-in">
        <div className="logo">{m.logo_url ? <img src={m.logo_url} alt={b.naam || "logo"} style={{ height: 38, width: "auto", display: "block" }} /> : <>{naam[0]} <span className="o">{naam.slice(1).join(" ")}</span></>}</div>
        <nav className="nav"><a href="#diensten">Diensten</a><a href="#werk">Projecten</a><a href="#contact">Contact</a></nav>
        <a className="cta" href="#contact">{hero.cta_tekst || "Contact"}</a>
      </div></header>

      <section className="hero"><div className="wrap">
        <div className="pf" style={m.logo_url ? { backgroundImage: `url(${m.logo_url})`, color: "transparent" } : undefined}>{m.logo_url ? "" : "foto"}</div>
        <div className="eyebrow">{b.branche || b.naam}</div>
        <h1>{b.naam}</h1>
        <p>{hero.subkop || c.over_ons || ""}</p>
        <a className="bp" href="#contact">{hero.cta_tekst || "Vraag een offerte aan"}</a>
        {usps.length > 0 && (
          <div className="trust">{usps.slice(0, 3).map((u, i) => <span key={i}><span className="tick">&#10003;</span> {u}</span>)}</div>
        )}
      </div></section>

      {voordelen.length > 0 && (
        <section className="sec"><div className="wrap">
          <h2>Zo werken we samen</h2>
          <p className="lead">Persoonlijk, eerlijk en zonder verrassingen — van eerste contact tot oplevering.</p>
          <div className="steps">
            {voordelen.map((v, i) => (
              <div className="step" key={i}><div className="num">{i + 1}</div><div><h3>{v.titel}</h3><p>{v.tekst}</p></div></div>
            ))}
          </div>
        </div></section>
      )}

      {diensten.length > 0 && (
        <section className="sec alt" id="diensten"><div className="wrap">
          <h2>Wat ik voor je doe</h2>
          <div className="grid" style={{ marginTop: "1.6rem" }}>
            {diensten.map((d, i) => (
              <div className="card" key={i}><h3>{d.titel}</h3><p>{d.omschrijving}</p></div>
            ))}
          </div>
        </div></section>
      )}

      <section className="sec" id="werk"><div className="wrap">
        <h2>Recent werk</h2>
        <div className="grid" style={{ marginTop: "1.6rem" }}>
          {projecten.length > 0
            ? projecten.map((p, i) => (
                <a className="pcard" key={i} href={`/${b.slug ? b.slug : ""}`} style={{ pointerEvents: "none" }}>
                  <div className="pimg" style={p.beeld_url ? { backgroundImage: `url(${p.beeld_url})`, color: "transparent" } : undefined}>{p.beeld_url ? "" : "📷 Projectfoto"}</div>
                  <div className="pb"><h3>{p.titel}</h3>{p.plaats && <div className="pm">{p.plaats}</div>}</div>
                </a>
              ))
            : [0, 1].map((i) => (
                <div className="pcard" key={i} style={{ opacity: 0.75 }}><div className="pimg">📷 Projectfoto</div><div className="pb"><h3>Jullie project hier</h3><div className="pm">Plaatsnaam</div></div></div>
              ))}
        </div>
        {projecten.length === 0 && <p className="phnote">Lever projectfoto's aan en dit vult zich met jullie eigen werk.</p>}
      </div></section>

      <section className="sec alt"><div className="wrap">
        <h2>Wat klanten zeggen</h2>
        <div className="grid" style={{ marginTop: "1.6rem" }}>
          {reviews.length > 0
            ? reviews.map((r, i) => (
                <div className="rev" key={i}><div className="stars">{"★".repeat(Math.max(0, Math.min(5, r.score || 5)))}</div><p className="rq">&ldquo;{r.tekst}&rdquo;</p><div className="rn">{r.naam}</div></div>
              ))
            : [0, 1].map((i) => (
                <div className="rev" key={i} style={{ opacity: 0.75 }}><div className="stars">★★★★★</div><p className="rq">&ldquo;Hier verschijnt straks een review van een tevreden klant.&rdquo;</p><div className="rn">Klantnaam</div></div>
              ))}
        </div>
        {b.google_business_url && <p className="phnote"><a href={b.google_business_url} style={{ color: "var(--orange-d)", fontWeight: 700 }}>Bekijk onze Google-reviews &rarr;</a></p>}
      </div></section>

      <section className="ctaband" id="contact"><div className="wrap">
        <h2>{cta.kop || "Klaar om te beginnen?"}</h2>
        <p className="lead">{cta.tekst || "Neem gerust contact op voor een vrijblijvende offerte."}</p>
        <div>
          {wa && <a className="bp" href={wa}>WhatsApp ons</a>}
          {b.telefoon && <a className="bp" href={`tel:${b.telefoon}`} style={{ marginLeft: 8, background: "#2a2018" }}>Bel {b.telefoon}</a>}
        </div>
      </div></section>

      <footer className="ft"><div className="wrap">
        <div className="ftg">
          <div><h4>{b.naam}</h4><p style={{ color: "rgba(255,255,255,.72)" }}>{b.adres}{b.kvk ? <><br />KvK {b.kvk}</> : null}{b.btw ? <><br />BTW {b.btw}</> : null}</p></div>
          <div><h4>Contact</h4>{b.telefoon && <a href={`tel:${b.telefoon}`}>{b.telefoon}</a>}{b.email && <a href={`mailto:${b.email}`}>{b.email}</a>}{b.regio && <p style={{ marginTop: ".4rem", color: "rgba(255,255,255,.6)" }}>Werkgebied: {b.regio}</p>}</div>
          <div><h4>Volg ons</h4>{socials.facebook && <a href={socials.facebook}>Facebook</a>}{socials.instagram && <a href={socials.instagram}>Instagram</a>}{socials.linkedin && <a href={socials.linkedin}>LinkedIn</a>}</div>
        </div>
        <div className="fbot">&copy; {new Date().getFullYear()} {b.naam} &middot; Website door StudioBaris</div>
      </div></footer>
    </div>
  );
}
