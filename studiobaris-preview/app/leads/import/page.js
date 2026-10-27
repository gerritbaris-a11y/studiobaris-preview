import { leesSessie } from "../../../lib/auth";
import ImportClient from "./import-client";

export const dynamic = "force-dynamic";

export default function LeadsImportPage() {
  const sessie = leesSessie();
  return (
    <main style={{ maxWidth: 760, margin: "5vh auto", padding: "0 20px", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", color: "#1A2B3D" }}>
      <p style={{ fontSize: 13, letterSpacing: 2, textTransform: "uppercase", color: "#6F7A85" }}>StudioBaris</p>
      <h1 style={{ fontSize: 28, margin: "6px 0 6px" }}>Leads importeren</h1>
      <p style={{ color: "#4A5560", fontSize: 14, lineHeight: 1.6 }}>
        Kies een CSV-bestand met leads. Bedrijven die al in de lijst staan (zelfde naam en adres) worden
        bijgewerkt met de nieuwe gegevens — hun status en eigenaar blijven gewoon staan. Er ontstaan dus
        geen dubbelingen.
      </p>
      <ImportClient />
      <p style={{ marginTop: 28 }}>
        <a href="/leads" style={{ color: "#1A2B3D", fontSize: 14 }}>&larr; Terug naar de leadlijst</a>
      </p>
    </main>
  );
}
