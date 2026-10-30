import { notFound } from "next/navigation";
import { getPreview, googleFontsHref } from "../../../lib/preview";
import { getFull } from "../../../lib/server-data";
import { agendaVoorPreview } from "../../../lib/agenda";
import { hexNaarRgb, contrast } from "../../../lib/huisstijl";
import AgendaWidget from "../../agenda-widget";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const row = await getPreview(params.slug);
  const naam = row && row.content && row.content.bedrijf && row.content.bedrijf.naam;
  return { title: naam ? `Afspraak maken · ${naam}` : "Afspraak maken", robots: { index: false, follow: false } };
}

function tekstOp(hex) {
  const rgb = hexNaarRgb(hex);
  return rgb && contrast(rgb, [255, 255, 255]) < 2.2 ? "#111111" : "#fff";
}

// Online agenda van een (salon-)preview, in testmodus. De nieuwe salonsite
// toont dezelfde agenda straks op de pagina zelf; deze losse pagina is ook de
// plek waar de knop "Afspraak maken" naartoe linkt.
export default async function AfspraakMaken({ params }) {
  const row = await getPreview(params.slug);
  const content = row ? row.content : await getFull(params.slug);
  if (!content) notFound();
  const agenda = await agendaVoorPreview(params.slug, content);
  const b = content.bedrijf || {};
  const m = content.merk || {};
  const kleur = m.primaire_kleur || "#1A2B3D";
  const font = m.tekst_font || m.koppen_font || "Plus Jakarta Sans";

  return (
    <div style={{ minHeight: "100vh", background: "#F7F5F1", fontFamily: `'${font}', system-ui, sans-serif`, color: "#1A2B3D" }}>
      <link rel="stylesheet" href={googleFontsHref(m.koppen_font, m.tekst_font || font)} />
      <div style={{ background: kleur, color: tekstOp(kleur), padding: "18px 16px 64px" }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <a href={`/${params.slug}`} style={{ color: "inherit", opacity: 0.85, fontSize: 14, textDecoration: "none" }}>← Terug naar de website</a>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: "14px 0 4px" }}>Afspraak maken</h1>
          <div style={{ fontSize: 16, opacity: 0.9 }}>{b.naam}{b.adres ? ` · ${b.adres}` : ""}</div>
        </div>
      </div>
      <div style={{ maxWidth: 560, margin: "-44px auto 0", padding: "0 16px 40px" }}>
        {agenda && (agenda.behandelingen || []).length ? (
          <AgendaWidget agenda={agenda} test={agenda.instellingen ? agenda.instellingen.test_modus : true}
            kleur={kleur} tekstOpKleur={tekstOp(kleur)} bron="preview" />
        ) : (
          <div style={{ background: "#fff", borderRadius: 18, padding: 20 }}>
            De online agenda wordt nog klaargezet. Bel ons gerust{b.telefoon ? ` op ${b.telefoon}` : ""}.
          </div>
        )}
        <p style={{ textAlign: "center", fontSize: 12.5, color: "#6F7A85", marginTop: 18 }}>Online agenda door StudioBaris</p>
      </div>
    </div>
  );
}
