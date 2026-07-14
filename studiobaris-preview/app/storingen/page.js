import { leesSessie } from "../../lib/auth";
import { getKlantOverzicht } from "../../lib/server-data";
import StoringenClient from "./storingen-client";

export const dynamic = "force-dynamic";

// De versie die iedereen hoort te draaien. Bij elke nieuwe plugin één keer bijwerken.
export const NIEUWSTE_PLUGIN = "1.1.2";

export default async function Storingen() {
  const sessie = leesSessie();
  const klanten = await getKlantOverzicht();

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px 64px", fontFamily: "system-ui, -apple-system, sans-serif", color: "#2B2724" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <p style={{ fontSize: 13, letterSpacing: 2, textTransform: "uppercase", color: "#B0A697", margin: 0 }}>StudioBaris</p>
        {sessie && (
          <span style={{ marginLeft: "auto", fontSize: 13, color: "#6B6258" }}>
            Ingelogd als <strong style={{ color: "#2B2724" }}>{sessie.naam}</strong>
            {" · "}
            <a href="/api/auth/logout" style={{ color: "#C05A38" }}>Uitloggen</a>
          </span>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", margin: "6px 0 6px" }}>
        <h1 style={{ fontSize: 26, margin: 0 }}>Storingen</h1>
        <a href="/dashboard" style={{ color: "#C05A38", fontSize: 14 }}>Dashboard</a>
        <a href="/overzicht" style={{ color: "#C05A38", fontSize: 14 }}>Overzicht</a>
        <a href="/klanten" style={{ color: "#C05A38", fontSize: 14 }}>Klanten</a>
        <a href="/vragen" style={{ color: "#C05A38", fontSize: 14 }}>Vragen</a>
        <a href="/kosten" style={{ color: "#C05A38", fontSize: 14 }}>Kosten</a>
        <a href="/beheer" style={{ color: "#C05A38", fontSize: 14 }}>Beheer</a>
      </div>
      <p style={{ color: "#6B6258", fontSize: 14, marginBottom: 16 }}>
        Werkt de site van elke klant nog? Hier zie je in één oogopslag wie achterloopt, en herstel je het van hieruit.
      </p>

      <StoringenClient klanten={klanten} nieuwste={NIEUWSTE_PLUGIN} />
    </main>
  );
}
