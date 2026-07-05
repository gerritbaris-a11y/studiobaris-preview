import { getLeads, getTeam } from "../../lib/server-data";
import LeadsClient from "./leads-client";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const [leads, team] = await Promise.all([getLeads(), getTeam()]);

  return (
    <main style={{ maxWidth: 1320, margin: "4vh auto", padding: "0 24px", fontFamily: "system-ui, sans-serif", color: "#222" }}>
      <p style={{ fontSize: 13, letterSpacing: 2, textTransform: "uppercase", color: "#888" }}>StudioBaris</p>
      <div style={{ display: "flex", alignItems: "baseline", gap: 16, flexWrap: "wrap", marginBottom: 4 }}>
        <h1 style={{ fontSize: 28, margin: "6px 0" }}>Leads</h1>
        <a href="/dashboard" style={{ color: "#1d6fd1", fontSize: 14 }}>→ naar Klanten &amp; previews</a>
      </div>
      <p style={{ color: "#777", marginBottom: 18, fontSize: 14 }}>
        Pak een lead op (zet 'm op je naam), zoek info op en vraag een preview aan. Alles wat je hier doet zien je collega's live.
      </p>

      {leads.length === 0 ? (
        <div style={{ background: "#fff7ed", border: "1px solid #fcd9a8", borderRadius: 12, padding: "16px 18px", color: "#7c4a03" }}>
          Nog geen leads ingeladen (of de server-key ontbreekt). Zodra de leadlijst is ingelezen verschijnen ze hier.
        </div>
      ) : (
        <LeadsClient leads={leads} team={team} />
      )}
    </main>
  );
}
