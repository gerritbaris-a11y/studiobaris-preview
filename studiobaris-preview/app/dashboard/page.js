import { getOverview } from "../../lib/server-data";
import PublishButton from "./dashboard-actions";

export const dynamic = "force-dynamic";

const th = { textAlign: "left", padding: "10px 12px", fontSize: 12, textTransform: "uppercase", letterSpacing: 1, color: "#888", borderBottom: "1px solid #e5e7eb" };
const td = { padding: "12px", fontSize: 14, borderBottom: "1px solid #f0f0f0", verticalAlign: "top" };
const link = { color: "#1d6fd1", marginRight: 10, fontSize: 13 };

function statusKleur(s) {
  if (s === "preview") return "#b45309";
  if (s === "herzien") return "#1d7a46";
  return "#555";
}

export default async function Dashboard() {
  const rows = await getOverview();

  return (
    <main style={{ maxWidth: 1100, margin: "4vh auto", padding: "0 24px", fontFamily: "system-ui, sans-serif", color: "#222" }}>
      <p style={{ fontSize: 13, letterSpacing: 2, textTransform: "uppercase", color: "#888" }}>StudioBaris</p>
      <h1 style={{ fontSize: 28, margin: "6px 0 16px" }}>Dashboard — klanten & previews</h1>

      {rows.length === 0 && (
        <p style={{ color: "#777" }}>
          Nog geen klanten, of de server-key is niet ingesteld. Voeg een prospect toe via <a href="/intake" style={{ color: "#1d6fd1" }}>/intake</a>.
        </p>
      )}

      {rows.length > 0 && (
        <div style={{ overflowX: "auto", border: "1px solid #e5e7eb", borderRadius: 12 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th}>Bedrijf</th>
                <th style={th}>Status</th>
                <th style={th}>Versie</th>
                <th style={th}>Contact</th>
                <th style={th}>Links</th>
                <th style={th}>Concept</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                let review = {};
                try { review = r.internal_notes ? JSON.parse(r.internal_notes) : {}; } catch {}
                const letOp = (review.let_op || []).concat(review.ontbrekend || []);
                return (
                  <tr key={r.slug}>
                    <td style={td}>
                      <strong>{r.company_name || r.slug}</strong>
                      {letOp.length > 0 && (
                        <span title={letOp.join(" • ")} style={{ marginLeft: 6, cursor: "help", color: "#b45309" }}>ⓘ</span>
                      )}
                    </td>
                    <td style={{ ...td, color: statusKleur(r.status), fontWeight: 600 }}>{r.status}</td>
                    <td style={td}>{r.version}.0</td>
                    <td style={td}>
                      <div>{r.lead_phone || "—"}</div>
                      <div style={{ color: "#777", fontSize: 13 }}>{r.lead_email || ""}</div>
                    </td>
                    <td style={td}>
                      <a style={link} href={`/${r.slug}`} target="_blank" rel="noreferrer">Live ↗</a>
                      <a style={link} href={`/intake/${r.slug}`} target="_blank" rel="noreferrer">Intake</a>
                      <a style={link} href={`/feedback/${r.slug}`} target="_blank" rel="noreferrer">Feedback</a>
                    </td>
                    <td style={td}>
                      {r.heeft_concept ? (
                        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                          <a style={link} href={`/${r.slug}?concept=1`} target="_blank" rel="noreferrer">Bekijk concept ↗</a>
                          <PublishButton slug={r.slug} />
                        </div>
                      ) : (
                        <span style={{ color: "#aaa", fontSize: 13 }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p style={{ marginTop: 18 }}>
        <a href="/intake" style={{ display: "inline-block", background: "#FF8300", color: "#fff", padding: "11px 20px", borderRadius: 10, fontWeight: 700 }}>+ Nieuwe prospect</a>
      </p>
    </main>
  );
}
