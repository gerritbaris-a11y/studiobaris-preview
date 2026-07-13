import { getOverview, getMijnLeads } from "../../lib/server-data";
import { leesSessie, isBeheer } from "../../lib/auth";
import { FaseStepper, Contactpersoon, AppjeKnop, LinkChips, VerkoopBedrag, AppLinkKnop } from "../dashboard/dashboard-actions";

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
  const naam = sessie ? sessie.naam : "";
  const [alles, mijnLeads] = await Promise.all([getOverview(), getMijnLeads(naam)]);
  const beheer = isBeheer(sessie);

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
        Hier haal je de sale binnen. Je ziet in welke fase de klant zit en hebt alle links bij de hand: zijn preview,
        zijn eigen demo-app en de betaallink. Vul de voornaam in en klik op &quot;Appje versturen&quot;: WhatsApp opent
        met de complete verkooptekst, de juiste aanhef en de juiste links erin. Zodra hij akkoord is, zet je de fase op
        Akkoord en vul je het verkoopbedrag in — daarna neemt Gerrit de bouw en de feedback over.
      </p>

      {/* Leads die je hebt opgepakt maar waar nog geen preview van is. */}
      {mijnLeads.length > 0 && (
        <div style={{ ...card, marginBottom: 16, background: "#f8fafc" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
            <h2 style={{ fontSize: 16, margin: 0 }}>Opgepakt, nog geen preview</h2>
            <span style={{ fontSize: 13, color: "#94a3b8" }}>{mijnLeads.length} {mijnLeads.length === 1 ? "lead" : "leads"} staan op jouw naam</span>
            <a href="/leads?wie=mij" style={{ marginLeft: "auto", fontSize: 13, color: "#1d6fd1" }}>Naar de leadlijst</a>
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {mijnLeads.map((l) => (
              <div key={l.id} style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "10px 12px" }}>
                <div style={{ flex: "1 1 200px", minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14.5 }}>{l.bedrijfsnaam}</div>
                  <div style={{ fontSize: 12.5, color: "#64748b" }}>
                    {[l.vakgebied, l.plaats].filter(Boolean).join(" · ")}
                    {l.status === "benaderd" && <span style={{ color: "#2563eb", fontWeight: 600 }}> · benaderd</span>}
                    {l.alleen_socials && <span style={{ color: "#0c447c", fontWeight: 600 }}> · geen website</span>}
                  </div>
                </div>
                {l.telefoon && (
                  <a href={`tel:${String(l.telefoon).replace(/\s/g, "")}`} style={{ fontSize: 13, fontWeight: 600, color: "#1A2E40", textDecoration: "none" }}>{l.telefoon}</a>
                )}
                <a href={`/intake?lead=${l.id}`} target="_blank" rel="noreferrer"
                  style={{ background: "#FF8300", color: "#fff", padding: "8px 13px", borderRadius: 9, fontWeight: 700, fontSize: 13, textDecoration: "none", whiteSpace: "nowrap" }}>
                  Preview maken
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {rows.length === 0 && mijnLeads.length === 0 && (
        <div style={{ background: "#fff7ed", border: "1px solid #fcd9a8", borderRadius: 12, padding: "16px 18px", color: "#7c4a03" }}>
          Je hebt nog geen klanten. Pak een lead op in de <a href="/leads" style={{ color: "#7c4a03", fontWeight: 700 }}>leadlijst</a> en maak een preview.
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

            <FaseStepper slug={r.slug} huidige={r.pipeline_status} bedrijf={r.company_name} />

            <BetaalBadge status={r.betaal_status} />

            <LinkChips slug={r.slug} gepubliceerd={r.gepubliceerd} heeftDemo={r.heeft_demo} demoGevuld={r.demo_gevuld} magMaken={beheer} volledig heeftRest={Number(r.restbedrag) > 0} restBetaald={r.rest_status === "betaald"} />

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

            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
              <AppLinkKnop bedrijf={r.company_name} />
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", borderTop: "1px solid #f0f0f0", paddingTop: 12 }}>
              <VerkoopBedrag slug={r.slug} value={r.websiteprijs} />
              <span style={{ fontSize: 12.5, color: "#94a3b8" }}>
                Vul in waarvoor je 'm hebt verkocht. Jouw commissie is 50% hiervan.
              </span>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
