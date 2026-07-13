import { getKosten } from "../../lib/server-data";
import { leesSessie } from "../../lib/auth";

export const dynamic = "force-dynamic";

const wrap = { maxWidth: 1180, margin: "4vh auto", padding: "0 20px", fontFamily: "system-ui, sans-serif", color: "#222" };
const kaart = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "16px 18px" };

// Rekentarieven. Alleen dingen die we echt betalen.
// Aan te passen via de adresbalk, bijvoorbeeld: /kosten?vast=25&weergaven=500
const STANDAARD = {
  opslag: 0.021,      // euro per GB per maand (Supabase)
  verkeer: 0.09,      // euro per GB uitgaand verkeer
  weergaven: 300,     // geschat aantal keer per maand dat de projectfoto's geladen worden
  domein: 0.92,       // 11 euro per jaar / 12
  vast: 45,           // vaste platformkosten p/m (Supabase Pro + Vercel Pro). Pas aan wat je echt betaalt.
  maandbedrag: 29.95, // wat de klant betaalt, excl. btw
};

function euro(n, d = 2) {
  return "€ " + Number(n || 0).toLocaleString("nl-NL", { minimumFractionDigits: d, maximumFractionDigits: d });
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
    opslag: sp.opslag !== undefined ? Number(sp.opslag) : STANDAARD.opslag,
    verkeer: sp.verkeer !== undefined ? Number(sp.verkeer) : STANDAARD.verkeer,
    weergaven: sp.weergaven !== undefined ? Number(sp.weergaven) : STANDAARD.weergaven,
    domein: sp.domein !== undefined ? Number(sp.domein) : STANDAARD.domein,
    vast: sp.vast !== undefined ? Number(sp.vast) : STANDAARD.vast,
    maandbedrag: STANDAARD.maandbedrag,
  };

  const data = await getKosten();
  const klanten = data.klanten || [];
  const gem = data.gemiddelden || {};

  const rijen = klanten.map((k) => {
    const gb = Number(k.opslag_mb || 0) / 1024;
    const opslagKosten = gb * t.opslag;
    const verkeerKosten = gb * t.weergaven * t.verkeer;
    const ai = Number(k.ai_kosten_maand || 0);
    const totaal = ai + opslagKosten + verkeerKosten + t.domein;
    return { ...k, gb, opslagKosten, verkeerKosten, ai, totaal, marge: t.maandbedrag - totaal };
  }).sort((a, b) => b.totaal - a.totaal);

  const variabel = rijen.reduce((s, r) => s + r.totaal, 0);
  const omzet = rijen.length * t.maandbedrag;
  const brutomarge = omzet - variabel;
  const resultaat = brutomarge - t.vast;
  const gemPerKlant = rijen.length ? variabel / rijen.length : 0;
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
        Wat één klant ons per maand écht kost. Alleen kosten die met die klant meebewegen: zijn AI-verbruik,
        zijn foto-opslag, het verkeer naar zijn site en zijn domeinnaam. Vaste platformkosten staan apart —
        die verdelen we niet over de klanten, want ze bestaan ook zonder hen.
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
        <Cijfer label="Klanten" waarde={rijen.length} sub="in de app" />
        <Cijfer label="Kost per klant" waarde={euro(gemPerKlant)} kleur="#b45309" sub="gemiddeld p/m" />
        <Cijfer label="Omzet p/m" waarde={euro(omzet)} kleur="#0f6e56" sub={rijen.length + " × " + euro(t.maandbedrag)} />
        <Cijfer label="Brutomarge" waarde={euro(brutomarge)} kleur={brutomarge >= 0 ? "#0f6e56" : "#b91c1c"}
          sub={omzet > 0 ? Math.round((brutomarge / omzet) * 100) + "% van de omzet" : ""} />
        <Cijfer label="Vaste kosten" waarde={euro(t.vast)} sub="platform, p/m" />
        <Cijfer label="Resultaat" waarde={euro(resultaat)} kleur={resultaat >= 0 ? "#0f6e56" : "#b91c1c"} sub="na vaste kosten" />
      </div>

      {gemFoto > 1 && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", borderRadius: 12, padding: "14px 16px", marginBottom: 16, fontSize: 14, lineHeight: 1.6 }}>
          <strong>Let op de fotogrootte:</strong> gemiddeld {gemFoto.toFixed(1)} MB per foto. Boven de 1 MB kost het
          merkbaar opslag én verkeer, en wordt de site van de klant traag.
        </div>
      )}

      <div style={{ ...kaart, marginBottom: 16 }}>
        <h2 style={{ fontSize: 15, margin: "0 0 6px" }}>Rekentarieven</h2>
        <p style={{ fontSize: 12.5, color: "#94a3b8", margin: "0 0 10px" }}>
          Aan te passen via de adresbalk, bijvoorbeeld <code>/kosten?vast=25&amp;weergaven=500</code>.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 24px", fontSize: 13.5, color: "#334155" }}>
          <span>AI: <strong>gemeten</strong> ({euro(Number(gem.ai_per_project || 0), 4)} per project)</span>
          <span>Opslag: <strong>{euro(t.opslag, 3)}</strong> per GB p/m</span>
          <span>Verkeer: <strong>{euro(t.verkeer, 3)}</strong> per GB × <strong>{t.weergaven}</strong> weergaven p/m</span>
          <span>Domein: <strong>{euro(t.domein)}</strong> p/m (€11 per jaar)</span>
          <span>Vaste platformkosten: <strong>{euro(t.vast)}</strong> p/m</span>
        </div>
      </div>

      <div style={kaart}>
        <h2 style={{ fontSize: 15, margin: "0 0 12px" }}>Per klant</h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5, minWidth: 820 }}>
            <thead>
              <tr style={{ textAlign: "left", color: "#94a3b8", fontSize: 11.5, textTransform: "uppercase", letterSpacing: 0.5 }}>
                <th style={{ padding: "6px 8px 8px 0" }}>Klant</th>
                <th style={{ padding: "6px 8px 8px" }}>Live</th>
                <th style={{ padding: "6px 8px 8px" }}>Foto&apos;s</th>
                <th style={{ padding: "6px 8px 8px" }}>Opslag</th>
                <th style={{ padding: "6px 8px 8px", textAlign: "right" }}>AI</th>
                <th style={{ padding: "6px 8px 8px", textAlign: "right" }}>Opslag</th>
                <th style={{ padding: "6px 8px 8px", textAlign: "right" }}>Verkeer</th>
                <th style={{ padding: "6px 8px 8px", textAlign: "right" }}>Domein</th>
                <th style={{ padding: "6px 8px 8px", textAlign: "right" }}>Kost p/m</th>
                <th style={{ padding: "6px 0 8px 8px", textAlign: "right" }}>Marge</th>
              </tr>
            </thead>
            <tbody>
              {rijen.map((r) => (
                <tr key={r.id} style={{ borderTop: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "9px 8px 9px 0", fontWeight: 700, color: "#1A2E40" }}>{r.naam}</td>
                  <td style={{ padding: "9px 8px" }}>{r.live}</td>
                  <td style={{ padding: "9px 8px" }}>{r.fotos}</td>
                  <td style={{ padding: "9px 8px" }}>{Number(r.opslag_mb || 0).toFixed(1)} MB</td>
                  <td style={{ padding: "9px 8px", textAlign: "right", color: "#64748b" }}>{euro(r.ai, 3)}</td>
                  <td style={{ padding: "9px 8px", textAlign: "right", color: "#64748b" }}>{euro(r.opslagKosten, 3)}</td>
                  <td style={{ padding: "9px 8px", textAlign: "right", color: r.verkeerKosten > 2 ? "#b91c1c" : "#64748b" }}>{euro(r.verkeerKosten)}</td>
                  <td style={{ padding: "9px 8px", textAlign: "right", color: "#64748b" }}>{euro(t.domein)}</td>
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
          <strong>Waar komen deze cijfers vandaan.</strong> AI is echt gemeten verbruik uit de app (een projecttekst
          kost ongeveer {euro(Number(gem.ai_per_project || 0), 4)}; reviews gebruiken geen AI). Opslag is het werkelijke
          aantal megabytes aan foto&apos;s. Verkeer is een schatting: opslag × {t.weergaven} weergaven × {euro(t.verkeer, 3)} per GB.
          Domein is €11 per jaar. De vaste platformkosten ({euro(t.vast)} p/m voor Supabase en Vercel) worden bewust
          <strong> niet</strong> over de klanten verdeeld — ze bestaan ook zonder hen. Ze staan apart bij Resultaat.
          Klopt het bedrag niet, pas het aan via <code>/kosten?vast=…</code>.
        </p>
      </div>
    </main>
  );
}
