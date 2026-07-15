import { redirect } from "next/navigation";
import { leesSessie } from "../../lib/auth";

export const dynamic = "force-dynamic";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ipiqrsxbsgylxhgzlhsd.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function getFeedback() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/team_feedback?select=*&order=created_at.desc&limit=200`,
    {
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
      cache: "no-store",
    }
  );
  if (!res.ok) return [];
  return res.json();
}

const KLEUR = {
  idee: "#2B6CB0",
  verbeterpunt: "#C05A38",
  bug: "#B02A2A",
  anders: "#6B6259",
};

function Chip({ type }) {
  const bg = KLEUR[type] || KLEUR.anders;
  return (
    <span style={{ background: bg, color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 999, textTransform: "capitalize" }}>
      {type}
    </span>
  );
}

export default async function TeamFeedbackPagina() {
  const sessie = leesSessie();
  if (!sessie) redirect("/login");

  const items = await getFeedback();

  return (
    <main style={{ maxWidth: 820, margin: "0 auto", padding: "28px 20px", fontFamily: "system-ui, sans-serif", color: "#2B2724" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 6 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Feedback van het team</h1>
        <a href="/dashboard" style={{ color: "#C05A38", fontWeight: 700, fontSize: 14 }}>← Naar dashboard</a>
      </div>
      <p style={{ color: "#7A7168", marginTop: 0, marginBottom: 20, fontSize: 14 }}>
        Alles wat het team via de Feedback-knop indient, komt hier binnen. Zo houden we zicht op wat er beter kan.
      </p>

      {items.length === 0 ? (
        <div style={{ background: "#fff", border: "1px solid #E7DED2", borderRadius: 14, padding: 28, textAlign: "center", color: "#7A7168" }}>
          Nog geen feedback binnengekomen.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {items.map((f) => (
            <div key={f.id} style={{ background: "#fff", border: "1px solid #E7DED2", borderRadius: 14, padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
                <Chip type={f.type} />
                <span style={{ fontWeight: 700, fontSize: 14 }}>{f.van || "Onbekend"}</span>
                {f.rol && <span style={{ fontSize: 12, color: "#9A9084" }}>({f.rol})</span>}
                <span style={{ fontSize: 12, color: "#9A9084", marginLeft: "auto" }}>
                  {new Date(f.created_at).toLocaleString("nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <div style={{ whiteSpace: "pre-wrap", fontSize: 15, lineHeight: 1.5 }}>{f.bericht}</div>
              {f.pad && <div style={{ marginTop: 8, fontSize: 12, color: "#9A9084" }}>Pagina: {f.pad}</div>}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
