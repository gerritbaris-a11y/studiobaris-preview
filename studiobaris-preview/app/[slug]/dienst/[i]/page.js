import { notFound } from "next/navigation";
import { getPreview, googleFontsHref } from "../../../../lib/preview";
import { brandVars } from "../../../../lib/brand";
import { vulVoorbeeld } from "../../../../lib/preview-voorbeeld";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const row = await getPreview(params.slug);
  const d = row && row.content && (row.content.diensten || [])[parseInt(params.i, 10)];
  return { title: d ? d.titel : "Dienst", robots: { index: false, follow: false } };
}

export default async function DienstPage({ params }) {
  const row = await getPreview(params.slug);
  if (!row) notFound();
  const c = vulVoorbeeld(row.content || {});
  const b = c.bedrijf || {};
  const m = c.merk || {};
  const d = (c.diensten || [])[parseInt(params.i, 10)];
  if (!d) notFound();

  const vars = brandVars(m);
  const fontsHref = googleFontsHref(m.koppen_font, m.tekst_font);
  const naam = String(b.naam || "Bedrijf").split(" ");
  const css = `
    @import url('${fontsHref}');
    .dt{font-family:var(--font-body);color:var(--gtext);background:#fff;min-height:100vh}
    .dt h1{font-family:var(--font-head);color:#fff;font-weight:800;letter-spacing:-.5px}
    .dt a{color:inherit;text-decoration:none}
    .dt .hd{border-bottom:1px solid var(--line);padding:.9rem 1.3rem;display:flex;justify-content:space-between;align-items:center}
    .dt .logo{font-weight:800;color:var(--black)} .dt .logo .o{color:var(--orange)}
    .dt .back{color:var(--orange-d);font-weight:600;font-size:.9rem}
    .dt .top{background:var(--black);padding:3rem 1.3rem}
    .dt .wrap{max-width:780px;margin:0 auto}
    .dt .eyebrow{color:var(--orange);font-weight:700;font-size:.78rem;letter-spacing:1.5px;text-transform:uppercase}
    .dt .top h1{font-size:2rem;margin-top:.6rem}
    .dt .body{padding:2.5rem 1.3rem;font-size:1.05rem;line-height:1.75;color:var(--gtext)}
    .dt .img{height:240px;background:#ECEFF3;background-size:cover;background-position:center;border-radius:14px;display:grid;place-items:center;color:var(--gsoft);margin-bottom:1.6rem}
    .dt .cta{display:inline-block;background:var(--orange);color:#fff;font-weight:700;padding:.9rem 1.4rem;border-radius:10px;margin-top:1.6rem}
  `;
  return (
    <div className="dt" style={vars}>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <header className="hd">
        <a className="logo" href={`/${params.slug}`}>{m.logo_url ? <img src={m.logo_url} alt={b.naam || "logo"} style={{ height: 36, width: "auto", display: "block" }} /> : <>{naam[0]} <span className="o">{naam.slice(1).join(" ")}</span></>}</a>
        <a className="back" href={`/${params.slug}`}>← Terug naar de site</a>
      </header>
      <section className="top"><div className="wrap"><div className="eyebrow">Dienst</div><h1>{d.titel}</h1></div></section>
      <section className="body"><div className="wrap">
        <div className="img" style={d.beeld_url ? { backgroundImage: `url(${d.beeld_url})`, color: "transparent" } : undefined}>{d.beeld_url ? "" : "📷 Foto bij deze dienst"}</div>
        <p>{d.omschrijving}</p>
        <a className="cta" href={b.telefoon ? `tel:${b.telefoon}` : `/${params.slug}`}>Offerte aanvragen</a>
      </div></section>
    </div>
  );
}
