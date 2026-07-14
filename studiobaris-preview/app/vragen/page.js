import { getVragen } from "../../lib/server-data";
import { leesSessie } from "../../lib/auth";
import VraagKnop from "./vraag-knop";

export const dynamic = "force-dynamic";

const wrap = { maxWidth: 1100, margin: "4vh auto", padding: "0 20px", fontFamily: "system-ui, sans-serif", color: "#222" };
const kaart = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "16px 18px" };

const URG_KLEUR = { hoog: "#b91c1c", normaal: "#64748b", laag: "#94a3b8" };

export default async function VragenPage({ searchParams }) {
  const sessie = leesSessie();
  const sp = (await searchParams) || {};
  const status = sp.status === "afgehandeld" ? "afgehandeld" : sp.status === "alles" ? "" : "open";
  const categorie = sp.categorie || "";

  const data = await getVragen({ status, categorie });
  const rijen = data.rijen || [];
  const perCat = data.per_categorie || [];

  const link = (st, cat) => {
    const q = new URLSearchParams();
    if (st && st !== "open") q.set("status", st);
    if (cat) q.set("categorie", cat);
    const s = q.toString();
    return "/vragen" + (s ? "?" + s : "");
  };

  const knop = (aan) => ({
    padding: "7px 13px", borderRadius: 9, fontSize: 13.5, fontWeight: 700, textDecoration: "none",
    border: "1px solid " + (aan ? "#1A2E40" : "#d8dde3"),
    background: aan ? "#1A2E40" : "#fff",
    color: aan ? "#fff" : "#475569",
  });

  const huidigeStatus = sp.status === "afgehandeld" ? "afgehandeld" : sp.status === "alles" ? "alles" : "open";

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
        <h1 style={{ fontSize: 26, margin: 0 }}>Vragen van klanten</h1>
        <a href="/dashboard" style={{ color: "#1d6fd1", fontSize: 14 }}>Dashboard</a>
        <a href="/overzicht" style={{ color: "#1d6fd1", fontSize: 14 }}>Overzicht</a>
        <a href="/kosten" style={{ color: "#1d6fd1", fontSize: 14 }}>Kosten</a>
        <a href="/storingen" style={{ color: "#1d6fd1", fontSize: 14 }}>Storingen</a>
        <span style={{ marginLeft: "auto", fontSize: 13, color: "#888" }}>
          {data.open} open · {data.totaal} totaal
        </span>
      </div>
      <p style={{ color: "#777", fontSize: 14, marginBottom: 16 }}>
        Alles wat klanten via de Hulp-knop in de app sturen, komt hier binnen en wordt automatisch ingedeeld.
        Zo zie je waar het vaakst over gaat — en dus wat we moeten verbeteren.
      </p>

      {/* Waar gaat het over */}
      <div style={{ ...kaart, marginBottom: 16 }}>
        <h2 style={{ fontSize: 15, margin: "0 0 10px" }}>Waar gaat het over</h2>
        {perCat.length === 0 ? (
          <p style={{ fontSize: 13.5, color: "#94a3b8", margin: 0 }}>
            Nog geen vragen binnengekomen. Zodra een klant de Hulp-knop gebruikt, verschijnt het hier.
          </p>
        ) : (
          perCat.map((c) => {
            const max = Math.max(...perCat.map((x) => Number(x.aantal)));
            const pct = Math.round((Number(c.aantal) / max) * 100);
            return (
              <div key={c.categorie} style={{ marginBottom: 9 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 3 }}>
                  <a href={link(huidigeStatus === "open" ? "" : huidigeStatus, c.categorie)}
                    style={{ fontWeight: 600, color: categorie === c.categorie ? "#FF8300" : "#334155", textDecoration: "none" }}>
                    {c.categorie}
                  </a>
                  <span style={{ color: "#64748b" }}>
                    <strong style={{ color: "#1A2E40" }}>{c.aantal}</strong>
                    {Number(c.open) > 0 && <span style={{ color: "#b45309", marginLeft: 6 }}>{c.open} open</span>}
                  </span>
                </div>
                <div style={{ background: "#f1f5f9", borderRadius: 999, height: 8 }}>
                  <div style={{ width: pct + "%", height: "100%", background: "#1A2E40", borderRadius: 999 }} />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
        <a href={link("", categorie)} style={knop(huidigeStatus === "open")}>Open</a>
        <a href={link("afgehandeld", categorie)} style={knop(huidigeStatus === "afgehandeld")}>Afgehandeld</a>
        <a href={link("alles", categorie)} style={knop(huidigeStatus === "alles")}>Alles</a>
        {categorie && (
          <a href={link(huidigeStatus === "open" ? "" : huidigeStatus, "")}
            style={{ ...knop(false), borderColor: "#FF8300", color: "#a35400" }}>
            {categorie} ✕
          </a>
        )}
      </div>

      {/* Lijst */}
      <div style={{ display: "grid", gap: 10 }}>
        {rijen.length === 0 && (
          <div style={{ ...kaart, textAlign: "center", color: "#94a3b8" }}>Niets gevonden met deze filters.</div>
        )}
        {rijen.map((v) => (
          <div key={v.id} style={{ ...kaart, borderLeft: "4px solid " + (v.status === "open" ? (URG_KLEUR[v.urgentie] || "#64748b") : "#e2e8f0") }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
              <div>
                <strong style={{ fontSize: 15 }}>{v.bedrijf || "Onbekende klant"}</strong>
                <span style={{ fontSize: 12.5, color: "#94a3b8", marginLeft: 8 }}>
                  {new Date(v.created_at).toLocaleString("nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                {v.categorie && (
                  <span style={{ fontSize: 11.5, fontWeight: 700, background: "#f1f5f9", color: "#334155", padding: "4px 9px", borderRadius: 999 }}>
                    {v.categorie}
                  </span>
                )}
                {v.urgentie === "hoog" && (
                  <span style={{ fontSize: 11.5, fontWeight: 700, background: "#fee2e2", color: "#b91c1c", padding: "4px 9px", borderRadius: 999 }}>
                    urgent
                  </span>
                )}
                {v.onderwerp && (
                  <span style={{ fontSize: 11.5, color: "#94a3b8" }}>koos: {v.onderwerp}</span>
                )}
              </div>
            </div>
            <p style={{ margin: "0 0 10px", fontSize: 14.5, lineHeight: 1.55, color: "#334155" }}>{v.tekst}</p>
            <VraagKnop id={v.id} status={v.status} />
          </div>
        ))}
      </div>
    </main>
  );
}
