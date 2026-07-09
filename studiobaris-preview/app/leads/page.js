import { getLeads, getTeam, getOmzet } from "../../lib/server-data";
import { leesSessie } from "../../lib/auth";
import LeadsClient from "./leads-client";

export const dynamic = "force-dynamic";

function euro(n) {
  const v = Number(n || 0);
  return "€ " + v.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function OmzetBalk({ naam, cijfers }) {
  const c = cijfers || { aantal: 0, verkoopbedrag: 0, commissie: 0, verdiend: 0, openstaand: 0 };
  const vak = (label, waarde, kleur) => (
    <div style={{ flex: "1 1 120px", minWidth: 120 }}>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,.7)", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: kleur || "#fff", lineHeight: 1.1 }}>{waarde}</div>
    </div>
  );
  return (
    <div style={{
      background: "linear-gradient(135deg,#12283d,#1A2E40)", color: "#fff", borderRadius: 16,
      padding: "16px 20px", marginBottom: 20, boxShadow: "0 10px 30px -14px rgba(0,0,0,.5)",
    }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
        <span style={{ fontSize: 15, fontWeight: 700 }}>Jouw omzet</span>
        <span style={{ fontSize: 13, color: "rgba(255,255,255,.65)" }}>
          {naam} · {c.aantal} {Number(c.aantal) === 1 ? "klant" : "klanten"} · verkocht voor {euro(c.verkoopbedrag)}
        </span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
        {vak("Uitbetaald", euro(c.verdiend), "#7ee2b8")}
        {vak("Nog te verdienen", euro(c.openstaand), "#ffd18a")}
        {vak("Totaal (jouw 50%)", euro(c.commissie))}
      </div>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,.6)", marginTop: 12 }}>
        Je krijgt 50% van je verkoopbedrag — de helft bij akkoord, de andere helft bij oplevering.
      </div>
    </div>
  );
}

export default async function LeadsPage() {
  const sessie = leesSessie();
  const [leads, team, omzet] = await Promise.all([getLeads(), getTeam(), getOmzet()]);
  const mijn = sessie ? omzet.find((o) => o.persoon === sessie.naam) : null;

  return (
    <main style={{ maxWidth: 1320, margin: "4vh auto", padding: "0 24px", fontFamily: "system-ui, sans-serif", color: "#222" }}>
      <p style={{ fontSize: 13, letterSpacing: 2, textTransform: "uppercase", color: "#888" }}>StudioBaris</p>

      {sessie && <OmzetBalk naam={sessie.naam} cijfers={mijn} />}

      <div style={{ display: "flex", alignItems: "baseline", gap: 16, flexWrap: "wrap", marginBottom: 4 }}>
        <h1 style={{ fontSize: 28, margin: "6px 0" }}>Leads</h1>
        <a href="/dashboard" style={{ color: "#1d6fd1", fontSize: 14 }}>naar Klanten &amp; previews</a>
        {sessie && (
          <span style={{ marginLeft: "auto", fontSize: 13, color: "#64748b" }}>
            Ingelogd als <strong style={{ color: "#1A2E40" }}>{sessie.naam}</strong>
            {" · "}
            <a href="/api/auth/logout" style={{ color: "#1d6fd1" }}>Uitloggen</a>
          </span>
        )}
      </div>
      <p style={{ color: "#777", marginBottom: 18, fontSize: 14 }}>
        Pak een lead op (zet 'm op je naam), zoek info op en vraag een preview aan. Alles wat je hier doet zien je collega's live.
      </p>

      {leads.length === 0 ? (
        <div style={{ background: "#fff7ed", border: "1px solid #fcd9a8", borderRadius: 12, padding: "16px 18px", color: "#7c4a03" }}>
          Nog geen leads ingeladen (of de server-key ontbreekt). Zodra de leadlijst is ingelezen verschijnen ze hier.
        </div>
      ) : (
        <LeadsClient leads={leads} team={team} mij={sessie ? sessie.naam : ""} />
      )}
    </main>
  );
}
