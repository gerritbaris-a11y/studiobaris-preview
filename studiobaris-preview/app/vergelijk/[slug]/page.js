import { getOverview } from "../../../lib/server-data";
import { leesSessie } from "../../../lib/auth";
import StijlKiezer from "./stijl-kiezer";

export const dynamic = "force-dynamic";

export default async function VergelijkPagina({ params }) {
  const p = await params;
  const sessie = leesSessie();
  const rijen = await getOverview();
  const klant = rijen.find((r) => r.slug === p.slug);

  if (!klant) {
    return (
      <main style={{ maxWidth: 600, margin: "12vh auto", padding: "0 24px", fontFamily: "system-ui, sans-serif", textAlign: "center" }}>
        <h1 style={{ fontSize: 26 }}>Niet gevonden</h1>
        <p style={{ color: "#666" }}>Deze klant bestaat niet (meer).</p>
        <p><a href="/klanten" style={{ color: "#1d6fd1" }}>Terug naar Mijn previews</a></p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 1500, margin: "3vh auto", padding: "0 20px 60px", fontFamily: "system-ui, sans-serif", color: "#222" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <p style={{ fontSize: 13, letterSpacing: 2, textTransform: "uppercase", color: "#888", margin: 0 }}>StudioBaris</p>
        {sessie && (
          <span style={{ marginLeft: "auto", fontSize: 13, color: "#64748b" }}>
            Ingelogd als <strong style={{ color: "#1A2E40" }}>{sessie.naam}</strong>
          </span>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", margin: "6px 0 4px" }}>
        <h1 style={{ fontSize: 26, margin: 0 }}>Kies de stijl voor {klant.company_name || p.slug}</h1>
        <a href="/klanten" style={{ color: "#1d6fd1", fontSize: 14 }}>Terug naar Mijn previews</a>
      </div>
      <p style={{ color: "#777", fontSize: 14, marginBottom: 18, maxWidth: 780, lineHeight: 1.6 }}>
        Dezelfde inhoud, drie jassen. Er wordt niets opnieuw gemaakt — je kiest alleen hoe het eruitziet.
        De stijl die je kiest is wat de klant te zien krijgt in zijn preview, zijn intakeformulier en uiteindelijk
        op zijn website.
      </p>

      <StijlKiezer slug={p.slug} bedrijf={klant.company_name} huidige={klant.stijl || "stoer"} />
    </main>
  );
}
