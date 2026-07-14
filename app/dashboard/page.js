import { getOverview } from "../../lib/server-data";
import { leesSessie } from "../../lib/auth";
import {
  PublishButton, PublishToggle, KlantNaam, KlantBedrag,
  AkkoordLink, VerwijderKnop, GegevensEditor, LinkChips, VerkoopBedrag,
  FaseStepper, InzendingenKnop, Contactpersoon, AppjeKnop, AppLinkKnop, PersoonlijkeZin,
} from "./dashboard-actions";

export const dynamic = "force-dynamic";

const wrap = { maxWidth: 1040, margin: "4vh auto", padding: "0 18px", fontFamily: "system-ui, sans-serif", color: "#222" };
const card = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 };

const REACTIE_LABEL = { intake: "klant-intake", feedback: "feedback" };

function BetaalBadge({ status }) {
  const map = {
    actief: ["#0f6e56", "● Aanbetaling voldaan · incasso loopt"],
    akkoord: ["#854f0b", "○ Akkoord — aanbetaling nog niet binnen"],
    mislukt: ["#b91c1c", "● Betaling mislukt"],
  };
  const [kleur, label] = map[status] || ["#94a3b8", "○ Nog geen akkoord"];
  return <span style={{ fontSize: 12.5, fontWeight: 600, color: kleur }}>{label}</span>;
}

export default async function Dashboard() {
  const rows = await getOverview();
  const sessie = leesSessie();

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
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", margin: "6px 0 16px" }}>
        <h1 style={{ fontSize: 26, margin: 0 }}>Klanten en sites</h1>
        <a href="/intake" style={{ background: "#FF8300", color: "#fff", padding: "8px 14px", borderRadius: 9, fontWeight: 700, fontSize: 14, textDecoration: "none" }}>+ Nieuwe intake</a>
        <a href="/leads" style={{ background: "#1A2E40", color: "#fff", padding: "8px 14px", borderRadius: 9, fontWeight: 700, fontSize: 14, textDecoration: "none" }}>Leadlijst openen</a>
        <a href="/overzicht" style={{ background: "#fff", color: "#1A2E40", border: "1px solid #1A2E40", padding: "8px 14px", borderRadius: 9, fontWeight: 700, fontSize: 14, textDecoration: "none" }}>Overzicht</a>
        <a href="/storingen" style={{ background: "#fff", color: "#1A2E40", border: "1px solid #1A2E40", padding: "8px 14px", borderRadius: 9, fontWeight: 700, fontSize: 14, textDecoration: "none" }}>Storingen</a>
        <a href="/team" style={{ background: "#fff", color: "#1A2E40", border: "1px solid #1A2E40", padding: "8px 14px", borderRadius: 9, fontWeight: 700, fontSize: 14, textDecoration: "none" }}>Team &amp; omzet</a>
        <span style={{ marginLeft: "auto", fontSize: 13, color: "#888" }}>{rows.length} klanten</span>
      </div>

      {rows.length === 0 && (
        <p style={{ color: "#777" }}>
          Nog geen klanten, of de server-key ontbreekt. Voeg een prospect toe via <a href="/intake" style={{ color: "#1d6fd1" }}>/intake</a>.
        </p>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
        {rows.map((r) => {
          let review = {};
          try { review = r.internal_notes ? JSON.parse(r.internal_notes) : {}; } catch {}
          const reactieOp = r.laatste_feedback_op ? new Date(r.laatste_feedback_op).toLocaleDateString("nl-NL", { day: "numeric", month: "short" }) : null;
          return (
            <div key={r.slug} style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>{r.company_name || r.slug}</div>
                  <div style={{ fontSize: 13, color: "#64748b" }}>{[r.lead_phone, r.lead_email].filter(Boolean).join(" · ") || "—"}</div>
                  {review.bron && <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>Via: {review.bron}</div>}
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: r.gepubliceerd ? "#0f6e56" : "#94a3b8", whiteSpace: "nowrap" }}>{r.gepubliceerd ? "● Online" : "○ Offline"}</span>
              </div>

              <FaseStepper slug={r.slug} huidige={r.pipeline_status} bedrijf={r.company_name} />

              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 16px", alignItems: "center" }}>
                <BetaalBadge status={r.betaal_status} />
                {reactieOp && (
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: "#0c447c" }}>
                    ● Klant reageerde ({REACTIE_LABEL[r.laatste_feedback_type] || r.laatste_feedback_type || "reactie"}) op {reactieOp}
                  </span>
                )}
              </div>

              <LinkChips slug={r.slug} gepubliceerd={r.gepubliceerd} heeftDemo={r.heeft_demo} demoGevuld={r.demo_gevuld} magMaken volledig heeftRest={Number(r.restbedrag) > 0} restBetaald={r.rest_status === "betaald"} stijl={r.stijl} />

              <PersoonlijkeZin slug={r.slug} value={r.persoonlijk} />

              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
                <Contactpersoon slug={r.slug} value={r.contactpersoon} />
                <AppjeKnop
                  slug={r.slug}
                  bedrijf={r.company_name}
                  contact={r.contactpersoon}
                  afzender={r.verzamelaar || (sessie ? sessie.naam : "")}
                  telefoon={r.lead_phone}
                  demoGevuld={r.demo_gevuld}
                  persoonlijk={r.persoonlijk}
                />
              </div>

              <InzendingenKnop slug={r.slug} />

              <AppLinkKnop bedrijf={r.company_name} />

              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", borderTop: "1px solid #f0f0f0", paddingTop: 12 }}>
                <PublishToggle slug={r.slug} gepubliceerd={r.gepubliceerd} />
                <KlantBedrag slug={r.slug} value={r.maandbedrag} />
                <VerkoopBedrag slug={r.slug} value={r.websiteprijs} />
                <AkkoordLink slug={r.slug} />
                <div style={{ marginLeft: "auto" }}><VerwijderKnop slug={r.slug} naam={r.company_name} /></div>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
                <KlantNaam slug={r.slug} value={r.verzamelaar} />
                <GegevensEditor slug={r.slug} data={r} />
                {r.heeft_concept && (
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <a href={`/${r.slug}?concept=1`} target="_blank" rel="noreferrer" style={{ color: "#1d6fd1", fontSize: 13 }}>Bekijk concept</a>
                    <PublishButton slug={r.slug} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
