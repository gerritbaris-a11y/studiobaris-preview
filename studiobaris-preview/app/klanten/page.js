import { getOverview } from "../../lib/server-data";
import { leesSessie, isBeheer } from "../../lib/auth";
import { FaseStepper, Contactpersoon, AppjeKnop, LinkChips } from "../dashboard/dashboard-actions";

export const dynamic = "force-dynamic";

const wrap = { maxWidth: 1040, margin: "4vh auto", padding: "0 18px", fontFamily: "system-ui, sans-serif", color: "#222" };
const card = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 };

function BetaalBadge({ status }) {
  const map = {
    actief: ["#0f6e56", "Aanbetaling voldaan"],
    akkoord: ["#854f0b", "Akkoord - aanbetaling nog niet binnen"],
    mislukt: ["#b91c1c", "Betaling mislukt"],
  };
  const [kleur, label] = map[status] || ["#94a3b8", "Nog geen akkoord"];
  return <span style={{ fontSize: 12.5, fontWeight: 600, color: kleur }}>{label}</span>;
}

// Mijn klanten: het werkoverzicht voor iedereen.
// Verkopers zien hun eigen klanten, beheer ziet alles.
export default async function KlantenPage() {
  const sessie = leesSessie();
  const alles = await getOverview();
  const beheer = isBeheer(sessie);
  const naam = sessie ? sessie.naam : "";

  const rows = beheer
    ? alles
    : alles.filter((r) => {
        let review = {};
        try { review = r.internal_notes ? JSON.parse(r.internal_notes) : {}; } catch {}
        return r.verzamelaar === naam || review.bron === naam;
      });

  return (
    <main style={wrap}>
      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <p style={{ fontSize: 13, letterSpacing: 2, textTransform: "uppercase", color: "#888", margin: 0 }}>StudioBaris</p>
        {sessie && (
          <span style={{ marginLeft: "auto", fontSize: 13, color: "#64748b" }}>
            Ingelogd als <strong style={{ color: "#1A2E40" }}>{sessie.naam}</strong>
            {" · "}
            <a href="/api/auth/logout" style={{ color: "#1d6fd1" }}>Uitloggen</a>
          </span>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", margin: "6px 0 8px" }}>
        <h1 style={{ fontSize: 26, margin: 0 }}>{beheer ? "Alle klanten" : "Mijn klanten"}</h1>
        <a href="/leads" style={{ background: "#1A2E40", color: "#fff", padding: "8px 14px", borderRadius: 9, fontWeight: 700, fontSize: 14, textDecoration: "none" }}>Leadlijst openen</a>
        {beheer && (
          <a href="/dashboard" style={{ background: "#fff", color: "#1A2E40", border: "1px solid #1A2E40", padding: "8px 14px", borderRadius: 9, fontWeight: 700, fontSize: 14, textDecoration: "none" }}>Volledig dashboard</a>
        )}
        <span style={{ marginLeft: "auto", fontSize: 13, color: "#888" }}>{rows.length} {rows.length === 1 ? "klant" : "klanten"}</span>
      </div>

      <p style={{ color: "#777", marginBottom: 18, fontSize: 14 }}>
        Per klant zie je in welke fase hij zit en heb je alle links bij de hand. Vul de voornaam in en klik op
        &quot;Appje versturen&quot;: WhatsApp opent met de complete verkooptekst, de juiste aanhef en de juiste links erin.
      </p>

      {rows.length === 0 && (
        <div style={{ background: "#fff7ed", border: "1px solid #fcd9a8", borderRadius: 12, padding: "16px 18px", color: "#7c4a03" }}>
          Je hebt nog geen klanten. Pak een lead op in de <a href="/leads" style={{ color: "#7c4a03", fontWeight: 700 }}>leadlijst</a> en vraag een preview aan.
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
        {rows.map((r) => (
          <div key={r.slug} style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>{r.company_name || r.slug}</div>
                <div style={{ fontSize: 13, color: "#64748b" }}>
                  {[r.lead_phone, r.lead_email].filter(Boolean).join(" · ") || "—"}
                </div>
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: r.gepubliceerd ? "#0f6e56" : "#94a3b8", whiteSpace: "nowrap" }}>
                {r.gepubliceerd ? "Online" : "Offline"}
              </span>
            </div>

            <FaseStepper slug={r.slug} huidige={r.pipeline_status} />

            <BetaalBadge status={r.betaal_status} />

            <LinkChips slug={r.slug} gepubliceerd={r.gepubliceerd} heeftDemo={r.heeft_demo} demoGevuld={r.demo_gevuld} magMaken={beheer} volledig={beheer} />

            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
              <Contactpersoon slug={r.slug} value={r.contactpersoon} />
              <AppjeKnop
                slug={r.slug}
                bedrijf={r.company_name}
                contact={r.contactpersoon}
                afzender={r.verzamelaar || naam}
                telefoon={r.lead_phone}
                demoGevuld={r.demo_gevuld}
              />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
