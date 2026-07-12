import { getKosten } from "../../lib/server-data";
import { leesSessie } from "../../lib/auth";

export const dynamic = "force-dynamic";

const wrap = { maxWidth: 1180, margin: "4vh auto", padding: "0 20px", fontFamily: "system-ui, sans-serif", color: "#222" };
const kaart = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "16px 18px" };

// Standaardtarieven. Aan te passen via de adresbalk, bijvoorbeeld:
// /kosten?opslag=0.021&verkeer=0.09&weergaven=300&vast=45
const STANDAARD = {
  opslag: 0.021,    // euro per GB per maand (Supabase)
  verkeer: 0.09,    // euro per GB uitgaand verkeer
  weergaven: 300,   // geschat aantal keer per maand dat de projectfoto's worden geladen
  vast: 45,         // totale vaste infrastructuurkosten per maand, verdeeld over de klanten
  maandbedrag: 29.95, // wat de klant betaalt (excl. btw)
};

function euro(n, decimalen = 2) {
  return "€ " + Number(n || 0).toLocaleString("nl-NL", { minimumFractionDigits: decimalen, maximumFractionDigits: decimalen });
}

function Cijfer({ label, waarde, kleur, sub }) {
  return (
    <div style={{ ...kaart, flex: "1 1 165px", minWidth: 165 }}>
      <div style={{ fontSize: 11.5, letterSpacing: 0.6, textTransform: "uppercase", color: "#94a3b8", fontWeight: 700, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 25, fontWeight: 800, color: kleur || "#1A2E40", lineHeight: 1.15 }}>{waarde}</div>
      {sub && <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

export default async function KostenPage({ searchParams }) {
  const sessie = leesSessie();
  const sp = (await searchParams) || {};
  const t = {
    opslag: Number(sp.opslag) > 0 ? Number(sp.opslag) : STANDAARD.opslag,
    verkeer: Number(sp.verkeer) >= 0 ? Number(sp.verkeer) : STANDAARD.verkeer,
    weergaven: Number(sp.weergaven) >= 0 ? Number(sp.weergaven) : STANDAARD.weergaven,
    vast: Number(sp.vast) >= 0 ? Number(sp.vast) : STANDAARD.vast,
    maandbedrag: STANDAARD.maandbedrag,
  };

  const data = await getKosten();
  const klanten = data.klanten || [];
  const gem = data.gemiddelden || {};
  const aantal = Math.max(1, klanten.length);
  const vastPerKlant = t.vast / aantal;

  const rijen = klanten.map((k) => {
    const gb = Number(k.opslag_mb || 0) / 1024;
    const opslagKosten = gb * t.opslag;
    const verkeerGb = gb * t.weergaven;          // elke weergave laadt de foto's opnieuw
    const verkeerKosten = verkeerGb * t.verkeer;
    const ai = Number(k.ai_kosten_maand || 0);
    const totaal = opslagKosten + verkeerKosten + ai + vastPerKlant;
    return { ...k, gb, opslagKosten, verkeerGb, verkeerKosten, ai, totaal, marge: t.maandbedrag - totaal };
  }).sort((a, b) => b.totaal - a.totaal);

  const totaleKosten = rijen.reduce((s, r) => s + r.totaal, 0);
  const totaleOmzet = rijen.length * t.maandbedrag;
  const duurste = rijen[0];
  const gemFoto = Number(gem.foto_gem_mb || 0);

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

      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", margin: "6px 0 6px" }}>
        <h1 style={{ fontSize: 26, margin: 0 }}>Kosten per klant</h1>
        <a href="/dashboard" style={{ color: "#1d6fd1", fontSize: 14 }}>Dashboard</a>
        <a href="/overzicht" style={{ color: "#1d6fd1", fontSize: 14 }}>Overzicht</a>
        <a href="/vragen" style={{ color: "#1d6fd1", fontSize: 14 }}>Vragen</a>
        <a href="/beheer" style={{ color: "#1d6fd1", fontSize: 14 }}>Beheer</a>
      </div>
      <p style={{ color: "#777", fontSize: 14, marginBottom: 16 }}>
        Wat elke klant ons per maand kost. AI-verbruik en opslag zijn gemeten; verkeer en vaste kosten zijn een schatting
        op basis van de tarieven hieronder.
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
        <Cijfer label="Klanten" waarde={klanten.length} sub="in de app" />
        <Cijfer label="Kosten p/m" waarde={euro(totaleKosten)} kleur="#b45309" sub="alle klanten samen" />
        <Cijfer label="Omzet p/m" waarde={euro(totaleOmzet)} kleur="#0f6e56" sub={klanten.length + " × " + euro(t.maandbedrag)} />
        <Cijfer label="Marge p/m" waarde={euro(totaleOmzet - totaleKosten)} kleur={totaleOmzet - totaleKosten >= 0 ? "#0f6e56" : "#b91c1c"} sub={totaleOmzet > 0 ? Math.round(((totaleOmzet - totaleKosten) / totaleOmzet) * 100) + "% van de omzet" : ""} />
        <Cijfer label="AI per project" waarde={euro(Number(gem.ai_per_project || 0), 4)} sub="gemeten gemiddelde" />
        <Cijfer label="Foto gemiddeld" waarde={gemFoto.toFixed(1) + " MB"} kleur={gemFoto > 1 ? "#b91c1c" : "#1A2E40"} sub="per geüploade foto" />
      </div>

      {gemFoto > 1 && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", borderRadius: 12, padding: "14px 16px", marginBottom: 16, fontSize: 14, lineHeight: 1.6 }}>
          <strong>Je foto&apos;s zijn te groot.</strong> Gemiddeld {gemFoto.toFixed(1)} MB per stuk. Dat kost opslag én uitgaand
          verkeer bij elke websitebezoeker, en het maakt de site van de klant traag. Als we de foto&apos;s bij het uploaden
          verkleinen naar circa 300 kB, daalt deze rekening met ruim 90% en wordt de site een stuk sneller. Zeg het maar,
          dan bouw ik dat in.
        </div>
      )}

      {/* Tarieven */}
      <div style={{ ...kaart, marginBottom: 16 }}>
        <h2 style={{ fontSize: 15, margin: "0 0 6px" }}>Rekentarieven</h2>
        <p style={{ fontSize: 12.5, color: "#94a3b8", margin: "0 0 10px" }}>
          Aan te passen via de adresbalk, bijvoorbeeld <code>/kosten?weergaven=500&amp;vast=60</code>.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 24px", fontSize: 13.5, color: "#334155" }}>
          <span>Opslag: <strong>{euro(t.opslag, 3)}</strong> per GB p/m</span>
          <span>Verkeer: <strong>{euro(t.verkeer, 3)}</strong> per GB</span>
          <span>Weergaven: <strong>{t.weergaven}</strong> p/m per klant</span>
          <span>Vaste kosten: <strong>{euro(t.vast)}</strong> p/m ({euro(vastPerKlant)} per klant)</span>
          <span>Klant betaalt: <strong>{euro(t.maandbedrag)}</strong> excl. btw</span>
        </div>
      </div>

      {/* Tabel */}
      <div style={kaart}>
        <h2 style={{ fontSize: 15, margin: "0 0 4px" }}>Per klant</h2>
        <p style={{ fontSize: 12.5, color: "#94a3b8", margin: "0 0 12px" }}>
          Gesorteerd op wat ze ons kosten. {duurste ? <>De duurste is nu <strong>{duurste.naam}</strong> met {euro(duurste.totaal)} per maand.</> : null}
        </p>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5, minWidth: 860 }}>
            <thead>
              <tr style={{ textAlign: "left", color: "#94a3b8", fontSize: 11.5, textTransform: "uppercase", letterSpacing: 0.5 }}>
                <th style={{ padding: "6px 8px 8px 0" }}>Klant</th>
                <th style={{ padding: "6px 8px 8px" }}>Live</th>
                <th style={{ padding: "6px 8px 8px" }}>Reviews</th>
                <th style={{ padding: "6px 8px 8px" }}>Foto&apos;s</th>
                <th style={{ padding: "6px 8px 8px" }}>Opslag</th>
                <th style={{ padding: "6px 8px 8px", textAlign: "right" }}>AI p/m</th>
                <th style={{ padding: "6px 8px 8px", textAlign: "right" }}>Opslag p/m</th>
                <th style={{ padding: "6px 8px 8px", textAlign: "right" }}>Verkeer p/m</th>
                <th style={{ padding: "6px 8px 8px", textAlign: "right" }}>Totaal p/m</th>
                <th style={{ padding: "6px 0 8px 8px", textAlign: "right" }}>Marge</th>
              </tr>
            </thead>
            <tbody>
              {rijen.map((r) => (
                <tr key={r.id} style={{ borderTop: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "9px 8px 9px 0", fontWeight: 700, color: "#1A2E40" }}>{r.naam}</td>
                  <td style={{ padding: "9px 8px" }}>{r.live}</td>
                  <td style={{ padding: "9px 8px" }}>{r.reviews}</td>
                  <td style={{ padding: "9px 8px" }}>{r.fotos}</td>
                  <td style={{ padding: "9px 8px" }}>{Number(r.opslag_mb || 0).toFixed(1)} MB</td>
                  <td style={{ padding: "9px 8px", textAlign: "right", color: "#64748b" }}>{euro(r.ai, 3)}</td>
                  <td style={{ padding: "9px 8px", textAlign: "right", color: "#64748b" }}>{euro(r.opslagKosten, 3)}</td>
                  <td style={{ padding: "9px 8px", textAlign: "right", color: r.verkeerKosten > 2 ? "#b91c1c" : "#64748b" }}>{euro(r.verkeerKosten)}</td>
                  <td style={{ padding: "9px 8px", textAlign: "right", fontWeight: 700 }}>{euro(r.totaal)}</td>
                  <td style={{ padding: "9px 0 9px 8px", textAlign: "right", fontWeight: 700, color: r.marge >= 0 ? "#0f6e56" : "#b91c1c" }}>{euro(r.marge)}</td>
                </tr>
              ))}
              {rijen.length === 0 && (
                <tr><td colSpan={10} style={{ padding: 20, textAlign: "center", color: "#94a3b8" }}>Nog geen klanten in de app.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 12, lineHeight: 1.6 }}>
          <strong>Hoe dit is berekend.</strong> AI is echt gemeten verbruik (een projecttekst kost ongeveer{" "}
          {euro(Number(gem.ai_per_project || 0), 4)}; reviews gebruiken geen AI). Opslag is het werkelijke aantal
          megabytes aan foto&apos;s. Verkeer is een schatting: opslag × {t.weergaven} weergaven per maand × {euro(t.verkeer, 3)} per GB.
          De vaste kosten ({euro(t.vast)} p/m) zijn gelijk verdeeld over alle klanten.
        </p>
      </div>
    </main>
  );
}
