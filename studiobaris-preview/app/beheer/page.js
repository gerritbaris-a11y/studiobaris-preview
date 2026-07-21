import { getKlantOverzicht } from "../../lib/server-data";
import { leesSessie, isBeheer } from "../../lib/auth";
import WerkplekShell from "../werkplek-shell";
import BeheerActies from "./beheer-acties";

export const dynamic = "force-dynamic";

function euro(n) {
  return "€ " + Number(n || 0).toFixed(2).replace(".", ",");
}
function dt(s) {
  if (!s || String(s).startsWith("1970")) return "—";
  return new Date(s).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" });
}

// Terugval als het update-kanaal even niet te bereiken is.
const NIEUWSTE_PLUGIN_FALLBACK = "1.1.11";

// De nieuwste versie halen we uit het echte update-kanaal, zodat deze pagina
// niet elke release met de hand bijgewerkt hoeft te worden (dat gaf eerder
// valse "verouderd"-meldingen).
async function haalNieuwstePluginVersie() {
  try {
    const res = await fetch("https://app.studiobaris.nl/api/plugin/sb-embed", { cache: "no-store" });
    if (!res.ok) return NIEUWSTE_PLUGIN_FALLBACK;
    const data = await res.json();
    const v = data && typeof data.version === "string" ? data.version.trim() : "";
    return v || NIEUWSTE_PLUGIN_FALLBACK;
  } catch {
    return NIEUWSTE_PLUGIN_FALLBACK;
  }
}

// Numeriek vergelijken (1.1.11 is nieuwer dan 1.1.9), niet als tekst.
function vergelijkVersie(a, b) {
  const pa = String(a || "0").split(".").map((n) => parseInt(n, 10) || 0);
  const pb = String(b || "0").split(".").map((n) => parseInt(n, 10) || 0);
  const lengte = Math.max(pa.length, pb.length);
  for (let i = 0; i < lengte; i++) {
    const x = pa[i] || 0, y = pb[i] || 0;
    if (x !== y) return x < y ? -1 : 1;
  }
  return 0;
}
function isVerouderd(huidig, nieuwste) {
  if (!huidig) return false;
  return vergelijkVersie(huidig, nieuwste) < 0;
}

function PluginBadge({ versie, gezien, nieuwste }) {
  if (!versie) {
    return (
      <span style={{
        fontSize: 12, fontWeight: 600, padding: "3px 9px", borderRadius: 999,
        background: "#F4EEE3", color: "#9A9084", whiteSpace: "nowrap",
      }}>
        geen contact
      </span>
    );
  }
  const actueel = !isVerouderd(versie, nieuwste);
  return (
    <div style={{ whiteSpace: "nowrap" }}>
      <span style={{
        fontSize: 12.5, fontWeight: 700, padding: "3px 9px", borderRadius: 999,
        background: actueel ? "#e1f5ee" : "#faeeda",
        color: actueel ? "#0f6e56" : "#854f0b",
      }}>
        v{versie}
      </span>
      {!actueel && (
        <div style={{ color: "#854f0b", fontSize: 11, marginTop: 3 }}>verouderd</div>
      )}
      <div style={{ color: "#999", fontSize: 11, marginTop: 2 }}>{dt(gezien)}</div>
    </div>
  );
}

const wrap = { maxWidth: 1100, margin: "5vh auto", padding: "0 24px", fontFamily: "system-ui, sans-serif", color: "#2B2724" };
const th = { textAlign: "left", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "#B0A697", padding: "8px 10px", borderBottom: "2px solid #eee", whiteSpace: "nowrap" };
const td = { padding: "12px 10px", borderBottom: "1px solid #f0f0f0", fontSize: 13, verticalAlign: "top" };
const card = { background: "#fff", border: "1px solid #ECE4D7", borderRadius: 12, padding: "14px 18px", minWidth: 150 };

export default async function BeheerPage() {
  const klanten = await getKlantOverzicht();
  const nieuwstePlugin = await haalNieuwstePluginVersie();
  const totMaand = klanten.reduce((s, k) => s + Number(k.ai_kosten_maand || 0), 0);
  const totTotaal = klanten.reduce((s, k) => s + Number(k.ai_kosten_totaal || 0), 0);
  const totTokens = klanten.reduce((s, k) => s + Number(k.ai_tokens || 0), 0);

  const sessie = leesSessie();
  const beheer = isBeheer(sessie);

  return (
    <WerkplekShell
      naam={sessie?.naam || "collega"}
      beheer={beheer}
      actief="/beheer"
      titel="Klantoverzicht"
      sub="Verbruik, activiteit en instellingen per klant-app."
    >
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 24 }}>
        <div style={card}>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "#B0A697" }}>Klanten</div>
          <div style={{ fontSize: 26, fontWeight: 800 }}>{klanten.length}</div>
        </div>
        <div style={card}>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "#B0A697" }}>Verwerking deze maand</div>
          <div style={{ fontSize: 26, fontWeight: 800 }}>{euro(totMaand)}</div>
        </div>
        <div style={card}>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "#B0A697" }}>Verwerking totaal</div>
          <div style={{ fontSize: 26, fontWeight: 800 }}>{euro(totTotaal)}</div>
        </div>
        <div style={card}>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "#B0A697" }}>Verwerkte tekst totaal</div>
          <div style={{ fontSize: 26, fontWeight: 800 }}>{Number(totTokens).toLocaleString("nl-NL")}</div>
        </div>
      </div>

      <p style={{ fontSize: 12, color: "#999", marginBottom: 8 }}>
        Let op: Vercel, Supabase en GitHub rekenen op accountniveau af — die staan hierboven niet per klant. Verwerking is wél per klant gemeten.
      </p>

      <div style={{ overflowX: "auto", border: "1px solid #eee", borderRadius: 12 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff" }}>
          <thead>
            <tr>
              <th style={th}>Bedrijf</th>
              <th style={th}>Abonnement</th>
              <th style={th}>Projecten</th>
              <th style={th}>Reviews</th>
              <th style={th}>Plugin</th>
              <th style={th}>Laatste activiteit</th>
              <th style={th}>Verwerking deze maand</th>
              <th style={th}>Verwerking totaal</th>
              <th style={th}>Instellingen & inlog</th>
            </tr>
          </thead>
          <tbody>
            {klanten.length === 0 ? (
              <tr><td style={td} colSpan={9}>Nog geen klanten.</td></tr>
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
                  <td style={td}><PluginBadge versie={k.plugin_versie} gezien={k.plugin_gezien_op} nieuwste={nieuwstePlugin} /></td>
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
    </WerkplekShell>
  );
}
