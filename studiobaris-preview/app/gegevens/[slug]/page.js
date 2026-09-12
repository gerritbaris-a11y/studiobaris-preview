import { getBetaalinfo } from "../../../lib/server-data";
import GegevensForm from "./gegevens-form";

export const dynamic = "force-dynamic";

const wrap = { maxWidth: 640, margin: "6vh auto", padding: "0 24px", fontFamily: "system-ui, sans-serif", color: "#222" };

// Statussen waarin iemand akkoord heeft gegeven op de preview.
const NA_AKKOORD = ["akkoord", "actief"];

/**
 * Stap 2 van de intake. Bewust een eigen pagina en bewust pas ná akkoord:
 * adres, KvK en BTW zijn gegevens waar iemand even voor moet opzoeken, en
 * die vraag je niet aan iemand die nog niets van je heeft toegezegd.
 */
export default async function GegevensPage({ params }) {
  const p = await params;
  const info = await getBetaalinfo(p.slug);

  if (!info) {
    return (
      <main style={wrap}>
        <h1 style={{ fontSize: 26 }}>Niet gevonden</h1>
        <p style={{ color: "#555" }}>Deze link lijkt niet (meer) te kloppen. Neem even contact met ons op.</p>
      </main>
    );
  }

  if (!NA_AKKOORD.includes(String(info.betaal_status || ""))) {
    return (
      <main style={wrap}>
        <p style={{ fontSize: 13, letterSpacing: 2, textTransform: "uppercase", color: "#888" }}>StudioBaris</p>
        <h1 style={{ fontSize: 26, margin: "6px 0 10px" }}>Nog even geduld</h1>
        <p style={{ color: "#555", fontSize: 16, lineHeight: 1.6 }}>
          Deze gegevens vragen we pas als je akkoord hebt gegeven op je preview. Zo hoef je niets op te
          zoeken zolang je nog aan het kijken bent.
        </p>
        <p style={{ marginTop: 16 }}>
          <a href={`/akkoord/${p.slug}`} style={{ color: "#1d6fd1" }}>Naar je akkoordpagina</a>
        </p>
      </main>
    );
  }

  return <GegevensForm slug={p.slug} bedrijf={info.company_name || p.slug} />;
}
