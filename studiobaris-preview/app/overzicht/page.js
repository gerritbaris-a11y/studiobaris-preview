import { getRapport, getTeam } from "../../lib/server-data";
import { leesSessie } from "../../lib/auth";

export const dynamic = "force-dynamic";

const wrap = { maxWidth: 1180, margin: "4vh auto", padding: "0 20px", fontFamily: "system-ui, sans-serif", color: "#222" };
const kaart = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "16px 18px" };

const PERIODES = [
  { d: 7, label: "7 dagen" },
  { d: 30, label: "30 dagen" },
  { d: 90, label: "90 dagen" },
  { d: 0, label: "Sinds het begin" },
];

const SOORT_LABEL = {
  lead_status: "status gewijzigd",
  lead_owner: "lead opgepakt",
  preview: "preview gemaakt",
  klant_fase: "fase gewijzigd",
};

function euro(n) {
  return "€ " + Number(n || 0).toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function Cijfer({ label, waarde, kleur, sub }) {
  return (
    <div style={{ ...kaart, flex: "1 1 150px", minWidth: 150 }}>
      <div style={{ fontSize: 11.5, letterSpacing: 0.6, textTransform: "uppercase", color: "#94a3b8", fontWeight: 700, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 27, fontWeight: 800, color: kleur || "#1A2E40", lineHeight: 1.1 }}>{waarde}</div>
      {sub && <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

// De trechter: hoeveel leads zitten waar, en hoeveel procent komt door naar de volgende stap.
function Trechter({ t }) {
  const stappen = [
    { key: "totaal", label: "In de lijst", kleur: "#94a3b8" },
    { key: "opgepakt", label: "Opgepakt", kleur: "#b45309" },
    { key: "benaderd", label: "Benaderd", kleur: "#2563eb" },
    { key: "preview", label: "Preview aangevraagd", kleur: "#7c3aed" },
    { key: "klant", label: "Klant geworden", kleur: "#1d7a46" },
  ];
  const max = Math.max(1, Number(t.totaal || 0));
  return (
    <div style={{ ...kaart }}>
      <h2 style={{ fontSize: 16, margin: "0 0 4px" }}>De trechter</h2>
      <p style={{ fontSize: 12.5, color: "#94a3b8", margin: "0 0 14px" }}>
        Waar staat elke lead nu. Dit is een momentopname van de hele lijst, geen historie.
      </p>
      {stappen.map((s) => {
        const n = Number(t[s.key] || 0);
        const pct = Math.round((n / max) * 100);
        return (
          <div key={s.key} style={{ marginBottom: 11 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
              <span style={{ fontWeight: 600, color: "#334155" }}>{s.label}</span>
              <span style={{ color: "#64748b" }}>
                <strong style={{ color: "#1A2E40" }}>{n.toLocaleString("nl-NL")}</strong>
                {s.key !== "totaal" && <span style={{ marginLeft: 6, fontSize: 12 }}>{pct}%</span>}
              </span>
            </div>
            <div style={{ background: "#f1f5f9", borderRadius: 999, height: 9, overflow: "hidden" }}>
              <div style={{ width: Math.max(pct, n > 0 ? 1 : 0) + "%", height: "100%", background: s.kleur }} />
            </div>
          </div>
        );
      })}
      <div style={{ borderTop: "1px solid #f1f5f9", marginTop: 14, paddingTop: 12, display: "flex", justifyContent: "space-between", fontSize: 13 }}>
        <span style={{ color: "#b91c1c", fontWeight: 600 }}>Afgewezen</span>
        <strong style={{ color: "#b91c1c" }}>{Number(t.afgewezen || 0).toLocaleString("nl-NL")}</strong>
      </div>
    </div>
  );
}

export default async function OverzichtPage({ searchParams }) {
  const sessie = leesSessie();
  const sp = (await searchParams) || {};
  const dagen = sp.dagen !== undefined ? Number(sp.dagen) : 30;
  const persoon = sp.persoon || "";

  const [rap, team] = await Promise.all([getRapport(dagen, persoon), getTeam()]);
  const r = rap || {};
  const t = r.trechter || {};
  const personen = r.per_persoon || [];
  const recent = r.recent || [];
  const verbrand = r.verbrand_per_fase || [];
  const klantfases = r.klantfases || [];
  const betaling = r.betaling || {};

  const link = (d, p) => {
    const q = new URLSearchParams();
    if (d !== 30) q.set("dagen", String(d));
    if (p) q.set("persoon", p);
    const s = q.toString();
    return "/overzicht" + (s ? "?" + s : "");
  };

  const knop = (aan) => ({
    padding: "7px 13px", borderRadius: 9, fontSize: 13.5, fontWeight: 700, textDecoration: "none",
    border: "1px solid " + (aan ? "#1A2E40" : "#d8dde3"),
    background: aan ? "#1A2E40" : "#fff",
    color: aan ? "#fff" : "#475569",
  });

  const totaalVerkocht = personen.reduce((s, p) => s + Number(p.verkocht || 0), 0);
  const totaalOpen = personen.reduce((s, p) => s + Number(p.open_leads || 0), 0);

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
        <h1 style={{ fontSize: 26, margin: 0 }}>Overzicht</h1>
        <a href="/dashboard" style={{ color: "#1d6fd1", fontSize: 14 }}>Dashboard</a>
        <a href="/leads" style={{ color: "#1d6fd1", fontSize: 14 }}>Leads</a>
        <a href="/klanten" style={{ color: "#1d6fd1", fontSize: 14 }}>Klanten</a>
        <a href="/team" style={{ color: "#1d6fd1", fontSize: 14 }}>Team &amp; omzet</a>
        <a href="/vragen" style={{ color: "#1d6fd1", fontSize: 14 }}>Vragen</a>
        <a href="/kosten" style={{ color: "#1d6fd1", fontSize: 14 }}>Kosten</a>
        <a href="/storingen" style={{ color: "#1d6fd1", fontSize: 14 }}>Storingen</a>
        <a href="/beheer" style={{ color: "#1d6fd1", fontSize: 14 }}>Beheer</a>
      </div>
      <p style={{ color: "#777", fontSize: 14, marginBottom: 16 }}>
        Alles wat het team doet, op één plek. Kies een periode en eventueel een persoon.
      </p>

      {/* Filters */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
        {PERIODES.map((p) => (
          <a key={p.d} href={link(p.d, persoon)} style={knop(dagen === p.d)}>{p.label}</a>
        ))}
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
        <a href={link(dagen, "")} style={knop(!persoon)}>Iedereen</a>
        {team.map((u) => (
          <a key={u.naam} href={link(dagen, u.naam)} style={knop(persoon === u.naam)}>{u.naam}</a>
        ))}
      </div>

      {/* Kerncijfers */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
        <Cijfer label="Klanten" waarde={Number(t.klant || 0).toLocaleString("nl-NL")} kleur="#1d7a46" sub="uit de leadlijst gewonnen" />
        <Cijfer label="Previews" waarde={Number(t.preview || 0).toLocaleString("nl-NL")} kleur="#7c3aed" sub="lopen nu" />
        <Cijfer label="Open leads" waarde={totaalOpen.toLocaleString("nl-NL")} sub="opgepakt, nog niet afgerond" />
        <Cijfer label="Afgewezen" waarde={Number(t.afgewezen || 0).toLocaleString("nl-NL")} kleur="#b91c1c" sub="verbrand" />
        <Cijfer label="Verkocht" waarde={euro(totaalVerkocht)} kleur="#FF8300" sub="eenmalige websiteprijs" />
        <Cijfer label="Acties" waarde={Number(r.acties_totaal || 0).toLocaleString("nl-NL")} sub={"in deze periode"} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14, marginBottom: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))", gap: 14 }}>
          <Trechter t={t} />

          <div style={kaart}>
            <h2 style={{ fontSize: 16, margin: "0 0 4px" }}>Waar sneuvelen ze?</h2>
            <p style={{ fontSize: 12.5, color: "#94a3b8", margin: "0 0 14px" }}>
              In welke stap stond een lead toen hij werd afgewezen. Dit komt uit het logboek en telt alleen
              afwijzingen vanaf nu.
            </p>
            {verbrand.length === 0 ? (
              <p style={{ fontSize: 13.5, color: "#94a3b8", margin: 0 }}>
                Nog geen afwijzingen vastgelegd in deze periode.
              </p>
            ) : (
              verbrand.map((v) => {
                const max = Math.max(...verbrand.map((x) => Number(x.aantal)));
                const pct = Math.round((Number(v.aantal) / max) * 100);
                return (
                  <div key={v.fase} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, color: "#334155", textTransform: "capitalize" }}>{v.fase}</span>
                      <strong style={{ color: "#b91c1c" }}>{v.aantal}</strong>
                    </div>
                    <div style={{ background: "#f1f5f9", borderRadius: 999, height: 9 }}>
                      <div style={{ width: pct + "%", height: "100%", background: "#ef4444", borderRadius: 999 }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div style={kaart}>
            <h2 style={{ fontSize: 16, margin: "0 0 4px" }}>Klantreis</h2>
            <p style={{ fontSize: 12.5, color: "#94a3b8", margin: "0 0 14px" }}>
              Waar staan de klanten die al een preview hebben.
            </p>
            {klantfases.length === 0 ? (
              <p style={{ fontSize: 13.5, color: "#94a3b8", margin: 0 }}>Nog geen klanten.</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
                <tbody>
                  {klantfases.map((k) => (
                    <tr key={k.fase} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "7px 0", color: "#334155", fontWeight: 600 }}>{k.fase}</td>
                      <td style={{ padding: "7px 0", textAlign: "right", color: "#1A2E40", fontWeight: 700 }}>{k.aantal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div style={{ borderTop: "1px solid #e5e7eb", marginTop: 12, paddingTop: 10, fontSize: 13 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ color: "#0f6e56", fontWeight: 600 }}>Aanbetaling voldaan</span>
                <strong>{betaling.actief || 0}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ color: "#854f0b", fontWeight: 600 }}>Akkoord, nog niet betaald</span>
                <strong>{betaling.akkoord || 0}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#94a3b8", fontWeight: 600 }}>Nog geen akkoord</span>
                <strong>{betaling.geen || 0}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Wie doet wat */}
        <div style={kaart}>
          <h2 style={{ fontSize: 16, margin: "0 0 4px" }}>Wie doet wat</h2>
          <p style={{ fontSize: 12.5, color: "#94a3b8", margin: "0 0 12px" }}>
            Acties in de gekozen periode. &quot;Open&quot; en &quot;verkocht&quot; zijn de actuele stand.
          </p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5, minWidth: 640 }}>
              <thead>
                <tr style={{ textAlign: "left", color: "#94a3b8", fontSize: 11.5, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  <th style={{ padding: "6px 8px 8px 0" }}>Persoon</th>
                  <th style={{ padding: "6px 8px 8px" }}>Opgepakt</th>
                  <th style={{ padding: "6px 8px 8px" }}>Benaderd</th>
                  <th style={{ padding: "6px 8px 8px" }}>Previews</th>
                  <th style={{ padding: "6px 8px 8px" }}>Gewonnen</th>
                  <th style={{ padding: "6px 8px 8px" }}>Verloren</th>
                  <th style={{ padding: "6px 8px 8px" }}>Open</th>
                  <th style={{ padding: "6px 0 8px 8px", textAlign: "right" }}>Verkocht</th>
                </tr>
              </thead>
              <tbody>
                {personen.map((p) => (
                  <tr key={p.persoon} style={{ borderTop: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "9px 8px 9px 0", fontWeight: 700, color: "#1A2E40" }}>
                      {p.persoon}
                      <span style={{ fontWeight: 400, color: "#94a3b8", fontSize: 12 }}> · {p.rol}</span>
                    </td>
                    <td style={{ padding: "9px 8px" }}>{p.opgepakt}</td>
                    <td style={{ padding: "9px 8px" }}>{p.benaderd}</td>
                    <td style={{ padding: "9px 8px", color: "#7c3aed", fontWeight: 600 }}>{p.previews}</td>
                    <td style={{ padding: "9px 8px", color: "#1d7a46", fontWeight: 700 }}>{p.gewonnen}</td>
                    <td style={{ padding: "9px 8px", color: "#b91c1c" }}>{p.verloren}</td>
                    <td style={{ padding: "9px 8px" }}>{p.open_leads}</td>
                    <td style={{ padding: "9px 0 9px 8px", textAlign: "right", fontWeight: 700 }}>{euro(p.verkocht)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tijdlijn */}
        <div style={kaart}>
          <h2 style={{ fontSize: 16, margin: "0 0 4px" }}>Laatste acties</h2>
          <p style={{ fontSize: 12.5, color: "#94a3b8", margin: "0 0 12px" }}>
            Het logboek loopt vanaf vandaag. Wat er daarvoor gebeurde is niet vastgelegd.
          </p>
          {recent.length === 0 ? (
            <p style={{ fontSize: 13.5, color: "#94a3b8", margin: 0 }}>
              Nog geen acties in deze periode. Zodra iemand een lead oppakt of een status wijzigt, verschijnt het hier.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {recent.map((a, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "baseline", padding: "8px 0", borderTop: i ? "1px solid #f1f5f9" : "none", fontSize: 13.5 }}>
                  <span style={{ color: "#94a3b8", fontSize: 12, whiteSpace: "nowrap", minWidth: 92 }}>
                    {new Date(a.moment).toLocaleString("nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span style={{ fontWeight: 700, color: "#1A2E40", minWidth: 70 }}>{a.persoon || "—"}</span>
                  <span style={{ color: "#475569" }}>
                    {SOORT_LABEL[a.soort] || a.soort}
                    {a.wat && <> — <strong style={{ color: "#334155" }}>{a.wat}</strong></>}
                    {a.van && a.naar && <span style={{ color: "#94a3b8" }}> ({a.van} → {a.naar})</span>}
                    {!a.van && a.naar && <span style={{ color: "#94a3b8" }}> ({a.naar})</span>}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
