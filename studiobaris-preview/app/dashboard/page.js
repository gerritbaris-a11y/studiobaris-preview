import { getOverview } from "../../lib/server-data";
import { leesSessie } from "../../lib/auth";
import {
  PublishButton, PublishToggle, KlantNaam, KlantStatus, KlantBedrag,
  AkkoordLink, VerwijderKnop, GegevensEditor, LinkChips, VerkoopBedrag,
} from "./dashboard-actions";

export const dynamic = "force-dynamic";

// Kleur per fase (achtergrond, tekst) — uit hetzelfde palet als de rest.
const FASE_KLEUR = {
  "Nieuw": ["#f1f5f9", "#475569"],
  "Gebeld": ["#e6f1fb", "#0c447c"],
  "Wachten op feedback 1": ["#faeeda", "#854f0b"],
  "Wachten op feedback 2": ["#faeeda", "#854f0b"],
  "Wachten op feedback 3": ["#faeeda", "#854f0b"],
  "Klaar": ["#e1f5ee", "#0f6e56"],
};

const wrap = { maxWidth: 1040, margin: "4vh auto", padding: "0 18px", fontFamily: "system-ui, sans-serif", color: "#222" };
const card = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 };

function BetaalBadge({ status }) {
  const map = {
    actief: ["#0f6e56", "● Incasso actief"],
    akkoord: ["#854f0b", "○ Akkoord gestart"],
    mislukt: ["#b91c1c", "● Mislukt"],
  };
  const [kleur, label] = map[status] || ["#94a3b8", "○ Nog geen akkoord"];
  return <span style={{ fontSize: 12, fontWeight: 600, color: kleur }}>{label}</span>;
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
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", margin: "6px 0 16px" }}>
        <h1 style={{ fontSize: 26, margin: 0 }}>Klanten en sites</h1>
        <a href="/leads" style={{ background: "#1A2E40", color: "#fff", padding: "8px 14px", borderRadius: 9, fontWeight: 700, fontSize: 14, textDecoration: "none" }}>📋 Leadlijst openen</a>
        <span style={{ marginLeft: "auto", fontSize: 13, color: "#888" }}>{rows.length} klanten</span>
      </div>

      {rows.length === 0 && (
        <p style={{ color: "#777" }}>
          Nog geen klanten, of de server-key ontbreekt. Voeg een prospect toe via <a href="/intake" style={{ color: "#1d6fd1" }}>/intake</a>.
        </p>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
        {rows.map((r) => {
          const fase = r.pipeline_status || "Nieuw";
          const [bg, fg] = FASE_KLEUR[fase] || ["#f1f5f9", "#475569"];
          let review = {};
          try { review = r.internal_notes ? JSON.parse(r.internal_notes) : {}; } catch {}
          return (
            <div key={r.slug} style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>{r.company_name || r.slug}</div>
                  <div style={{ fontSize: 13, color: "#64748b" }}>{[r.lead_phone, r.lead_email].filter(Boolean).join(" · ") || "—"}</div>
                  {review.bron && <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>Via: {review.bron}</div>}
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                  <span style={{ fontSize: 12, padding: "4px 11px", borderRadius: 999, background: bg, color: fg, whiteSpace: "nowrap" }}>{fase}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: r.gepubliceerd ? "#0f6e56" : "#94a3b8" }}>{r.gepubliceerd ? "● Online" : "○ Offline"}</span>
                </div>
              </div>

              <LinkChips slug={r.slug} gepubliceerd={r.gepubliceerd} />

              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", borderTop: "1px solid #f0f0f0", paddingTop: 12 }}>
                <KlantStatus slug={r.slug} value={r.pipeline_status} />
                <PublishToggle slug={r.slug} gepubliceerd={r.gepubliceerd} />
                <KlantBedrag slug={r.slug} value={r.maandbedrag} />
                <VerkoopBedrag slug={r.slug} value={r.websiteprijs} />
                <AkkoordLink slug={r.slug} />
                <BetaalBadge status={r.betaal_status} />
                <div style={{ marginLeft: "auto" }}><VerwijderKnop slug={r.slug} naam={r.company_name} /></div>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
                <KlantNaam slug={r.slug} value={r.verzamelaar} />
                <GegevensEditor slug={r.slug} data={r} />
                {r.heeft_concept && (
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <a href={`/${r.slug}?concept=1`} target="_blank" rel="noreferrer" style={{ color: "#1d6fd1", fontSize: 13 }}>Bekijk concept ↗</a>
                    <PublishButton slug={r.slug} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p style={{ marginTop: 18 }}>
        <a href="/intake" style={{ display: "inline-block", background: "#FF8300", color: "#fff", padding: "11px 20px", borderRadius: 10, fontWeight: 700, textDecoration: "none" }}>+ Nieuwe prospect</a>
      </p>
    </main>
  );
}
