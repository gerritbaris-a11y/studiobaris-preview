import { getKlantOverzicht } from "../../lib/server-data";
import BeheerActies from "./beheer-acties";

export const dynamic = "force-dynamic";

function euro(n) {
  return "€ " + Number(n || 0).toFixed(2).replace(".", ",");
}
function dt(s) {
  if (!s || String(s).startsWith("1970")) return "—";
  return new Date(s).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" });
}

const wrap = { maxWidth: 1100, margin: "5vh auto", padding: "0 24px", fontFamily: "system-ui, sans-serif", color: "#222" };
const th = { textAlign: "left", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "#888", padding: "8px 10px", borderBottom: "2px solid #eee", whiteSpace: "nowrap" };
const td = { padding: "12px 10px", borderBottom: "1px solid #f0f0f0", fontSize: 13, verticalAlign: "top" };
const card = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "14px 18px", minWidth: 150 };

export default async function BeheerPage() {
  const klanten = await getKlantOverzicht();
  const totMaand = klanten.reduce((s, k) => s + Number(k.ai_kosten_maand || 0), 0);
  const totTotaal = klanten.reduce((s, k) => s + Number(k.ai_kosten_totaal || 0), 0);
  const totTokens = klanten.reduce((s, k) => s + Number(k.ai_tokens || 0), 0);

  return (
    <main style={wrap}>
      <p style={{ fontSize: 13, letterSpacing: 2, textTransform: "uppercase", color: "#888" }}>StudioBaris · Beheer</p>
      <h1 style={{ fontSize: 28, margin: "6px 0 4px" }}>Klantoverzicht</h1>
      <p style={{ color: "#555", marginBottom: 20 }}>Verbruik, activiteit en instellingen per klant-app.</p>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 24 }}>
        <div style={card}>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "#888" }}>Klanten</div>
          <div style={{ fontSize: 26, fontWeight: 800 }}>{klanten.length}</div>
        </div>
        <div style={card}>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "#888" }}>AI-kosten deze maand</div>
          <div style={{ fontSize: 26, fontWeight: 800 }}>{euro(totMaand)}</div>
        </div>
        <div style={card}>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "#888" }}>AI-kosten totaal</div>
          <div style={{ fontSize: 26, fontWeight: 800 }}>{euro(totTotaal)}</div>
        </div>
        <div style={card}>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "#888" }}>AI-tokens totaal</div>
          <div style={{ fontSize: 26, fontWeight: 800 }}>{Number(totTokens).toLocaleString("nl-NL")}</div>
        </div>
      </div>

      <p style={{ fontSize: 12, color: "#999", marginBottom: 8 }}>
        Let op: Vercel, Supabase en GitHub rekenen op accountniveau af — die staan hierboven niet per klant. AI is wél per klant gemeten.
      </p>

      <div style={{ overflowX: "auto", border: "1px solid #eee", borderRadius: 12 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff" }}>
          <thead>
            <tr>
              <th style={th}>Bedrijf</th>
              <th style={th}>Abonnement</th>
              <th style={th}>Projecten</th>
              <th style={th}>Reviews</th>
              <th style={th}>Laatste activiteit</th>
              <th style={th}>AI deze maand</th>
              <th style={th}>AI totaal</th>
              <th style={th}>Instellingen & inlog</th>
            </tr>
          </thead>
          <tbody>
            {klanten.length === 0 ? (
              <tr><td style={td} colSpan={8}>Nog geen klanten.</td></tr>
            ) : (
              klanten.map((k) => (
                <tr key={k.id}>
                  <td style={td}>
                    <div style={{ fontWeight: 700 }}>{k.naam}</div>
                    <div style={{ color: "#999", fontSize: 11 }}>{k.slug}</div>
                  </td>
                  <td style={td}>{k.abonnementsvorm || <span style={{ color: "#bbb" }}>—</span>}</td>
                  <td style={td}>{k.projecten}</td>
                  <td style={td}>{k.reviews}</td>
                  <td style={td}>{dt(k.laatste_activiteit)}</td>
                  <td style={td}>{euro(k.ai_kosten_maand)}</td>
                  <td style={td}>{euro(k.ai_kosten_totaal)}<div style={{ color: "#999", fontSize: 11 }}>{Number(k.ai_tokens).toLocaleString("nl-NL")} tok.</div></td>
                  <td style={{ ...td, minWidth: 320 }}><BeheerActies klant={k} /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
