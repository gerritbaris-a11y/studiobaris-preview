import { getBetaalinfo } from "../../../lib/server-data";
import { schoonSite } from "../../../lib/ronde";
import RondeForm from "./ronde-form";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

const wrap = { maxWidth: 560, margin: "8vh auto", padding: "0 20px", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", color: "#1A2B3D" };

/**
 * Feedbackronde op de gebouwde website. Publiek (de klant is niet ingelogd),
 * maar alleen voor klanten die akkoord hebben gegeven. Wat de klant invult,
 * verwerken wij met de hand op de WordPress-site.
 */
export default async function RondePage({ params, searchParams }) {
  const p = await params;
  const sp = (await searchParams) || {};
  const ronde = String(sp.r) === "2" ? 2 : 1;
  const site = schoonSite(sp.site);
  const info = await getBetaalinfo(p.slug);

  if (!info || !["akkoord", "actief"].includes(String(info.betaal_status || ""))) {
    return (
      <main style={wrap}>
        <h1 style={{ fontSize: 26 }}>Deze link klopt niet</h1>
        <p style={{ color: "#4A5560", fontSize: 17, lineHeight: 1.6 }}>
          Bel of app ons even op <a href="tel:+31616732105" style={{ color: "#1A2B3D", fontWeight: 700 }}>06 16 73 21 05</a>, dan helpen we je verder.
        </p>
      </main>
    );
  }

  return <RondeForm slug={p.slug} ronde={ronde} site={site} bedrijf={info.company_name || ""} />;
}
