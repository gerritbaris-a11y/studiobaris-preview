import { getOverview } from "../../lib/server-data";
import PublishButton, { PublishToggle, KlantNaam, KlantStatus, KlantBedrag, AkkoordLink, VerwijderKnop, GegevensEditor } from "./dashboard-actions";

export const dynamic = "force-dynamic";

const th = { textAlign: "left", padding: "10px 12px", fontSize: 12, textTransform: "uppercase", letterSpacing: 1, color: "#888", borderBottom: "1px solid #e5e7eb" };
const td = { padding: "12px", fontSize: 14, borderBottom: "1px solid #f0f0f0", verticalAlign: "top" };
const link = { color: "#1d6fd1", marginRight: 10, fontSize: 13 };

function statusKleur(s) {
  if (s === "preview") return "#b45309";
  if (s === "herzien") return "#1d7a46";
  return "#555";
}

function RevList({ titel, items }) {
  if (!items || items.length === 0) return null;
  return (
    <div style={{ marginTop: 4 }}>
      <strong>{titel}:</strong>
      <ul style={{ margin: "2px 0 0 16px" }}>{items.map((it, i) => <li key={i}>{it}</li>)}</ul>
    </div>
  );
}

// Toont wat de klant in WF2/WF3 heeft ingezonden, zodat je kunt controleren of het is toegepast.
function FeedbackBlok({ antwoorden, type, datum }) {
  if (!antwoorden || typeof antwoorden !== "object") return null;
  const entries = Object.entries(antwoorden).filter(([, val]) => val && String(val).trim());
  if (entries.length === 0) return null;
  const d = datum ? new Date(datum).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" }) : "";
  return (
    <details style={{ marginBottom: 8 }}>
      <summary style={{ cursor: "pointer", color: "#1d6fd1", fontSize: 13, fontWeight: 600 }}>
        Wat de klant vroeg{type === "feedback" ? " (feedback)" : ""}{d ? ` · ${d}` : ""}
      </summary>
      <div style={{ marginTop: 6, fontSize: 13, color: "#333", maxWidth: 340 }}>
        {entries.map(([k, val]) => (
          <div key={k} style={{ marginBottom: 6 }}>
            <strong>{k}:</strong> <span style={{ whiteSpace: "pre-wrap" }}>{String(val)}</span>
          </div>
        ))}
      </div>
    </details>
  );
}

function BetaalBadge({ status }) {
  const map = {
    actief: ["#1d7a46", "● Incasso actief"],
    akkoord: ["#b45309", "○ Akkoord gestart"],
    mislukt: ["#c0392b", "● Mislukt"],
  };
  const [kleur, label] = map[status] || ["#999", "○ Nog geen akkoord"];
  return <span style={{ fontSize: 12, fontWeight: 600, color: kleur }}>{label}</span>;
}

export default async function Dashboard() {
  const rows = await getOverview();

  return (
    <main style={{ maxWidth: 1280, margin: "4vh auto", padding: "0 24px", fontFamily: "system-ui, sans-serif", color: "#222" }}>
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
                <th style={th}>Fase</th>
                <th style={th}>Versie</th>
                <th style={th}>Contact</th>
                <th style={th}>Links</th>
                <th style={th}>Online</th>
                <th style={th}>Concept & feedback</th>
                <th style={th}>Betaling</th>
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
                      {review.bron && <div style={{ fontSize: 12, color: "#777", marginTop: 2 }}>Via: {review.bron}</div>}
                      {review.interesse && <div style={{ fontSize: 12, color: "#777", marginTop: 2 }}>Interesse: {review.interesse}</div>}
                      <div style={{ marginTop: 6 }}><KlantNaam slug={r.slug} value={r.verzamelaar} /></div>
                      <GegevensEditor slug={r.slug} data={r} />
                      {(letOp.length > 0 || (review.afgeleid || []).length > 0) && (
                        <details style={{ marginTop: 6 }}>
                          <summary style={{ cursor: "pointer", color: "#b45309", fontSize: 13 }}>Controlepunten</summary>
                          <div style={{ marginTop: 6, fontSize: 13, color: "#444" }}>
                            <RevList titel="Let op" items={review.let_op} />
                            <RevList titel="Ontbreekt" items={review.ontbrekend} />
                            <RevList titel="Afgeleid" items={review.afgeleid} />
                          </div>
                        </details>
                      )}
                    </td>
                    <td style={td}>
                      <KlantStatus slug={r.slug} value={r.pipeline_status} />
                      <div style={{ marginTop: 4, fontSize: 11, color: statusKleur(r.status) }}>{r.status}</div>
                    </td>
                    <td style={td}>{r.version}.0</td>
                    <td style={td}>
                      <div>{r.lead_phone || "—"}</div>
                      <div style={{ color: "#777", fontSize: 13 }}>{r.lead_email || ""}</div>
                    </td>
                    <td style={td}>
                      {r.gepubliceerd && <a style={link} href={`/${r.slug}`} target="_blank" rel="noreferrer">Live ↗</a>}
                      <a style={link} href={`/${r.slug}?review=1`} target="_blank" rel="noreferrer">Intern ↗</a>
                      <a style={link} href={`/intake/${r.slug}`} target="_blank" rel="noreferrer">Intake</a>
                      <a style={link} href={`/feedback/${r.slug}`} target="_blank" rel="noreferrer">Feedback</a>
                    </td>
                    <td style={td}>
                      <div style={{ marginBottom: 6, fontSize: 12, fontWeight: 600, color: r.gepubliceerd ? "#1d7a46" : "#999" }}>{r.gepubliceerd ? "● Online" : "○ Niet online"}</div>
                      <PublishToggle slug={r.slug} gepubliceerd={r.gepubliceerd} />
                      <div style={{ marginTop: 8 }}><VerwijderKnop slug={r.slug} naam={r.company_name} /></div>
                    </td>
                    <td style={td}>
                      <FeedbackBlok antwoorden={r.laatste_feedback} type={r.laatste_feedback_type} datum={r.laatste_feedback_op} />
                      {r.heeft_concept ? (
                        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                          <a style={link} href={`/${r.slug}?concept=1`} target="_blank" rel="noreferrer">Bekijk concept ↗</a>
                          <PublishButton slug={r.slug} />
                        </div>
                      ) : (
                        <span style={{ color: r.laatste_feedback ? "#777" : "#aaa", fontSize: 13 }}>{r.laatste_feedback ? "verwerkt" : "—"}</span>
                      )}
                    </td>
                    <td style={td}>
                      <div style={{ marginBottom: 6 }}><KlantBedrag slug={r.slug} value={r.maandbedrag} /></div>
                      <BetaalBadge status={r.betaal_status} />
                      <div style={{ marginTop: 6 }}><AkkoordLink slug={r.slug} /></div>
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
