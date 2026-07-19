import { getVragen } from "../../lib/server-data";
import { leesSessie, isBeheer } from "../../lib/auth";
import WerkplekShell from "../werkplek-shell";
import VraagKnop from "./vraag-knop";

export const dynamic = "force-dynamic";

const wrap = { maxWidth: 1100, margin: "4vh auto", padding: "0 20px", fontFamily: "system-ui, sans-serif", color: "#2B2724" };
const kaart = { background: "#fff", border: "1px solid #ECE4D7", borderRadius: 14, padding: "16px 18px" };

const URG_KLEUR = { hoog: "#b91c1c", normaal: "#6B6258", laag: "#9A9084" };

export default async function VragenPage({ searchParams }) {
  const sessie = leesSessie();
  const beheer = isBeheer(sessie);
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
    border: "1px solid " + (aan ? "#2B2724" : "#E3DACB"),
    background: aan ? "#2B2724" : "#fff",
    color: aan ? "#fff" : "#524A40",
  });

  const huidigeStatus = sp.status === "afgehandeld" ? "afgehandeld" : sp.status === "alles" ? "alles" : "open";

  return (
    <WerkplekShell
      naam={sessie?.naam || "collega"}
      beheer={beheer}
      actief="/vragen"
      titel="Vragen van klanten"
      sub="Alles wat klanten via de Hulp-knop in de app sturen, komt hier binnen en wordt automatisch ingedeeld. Zo zie je waar het vaakst over gaat — en dus wat we moeten verbeteren."
      rechts={<span style={{ fontSize: 13, color: "#B0A697" }}>{data.open} open · {data.totaal} totaal</span>}
    >
      {/* Waar gaat het over */}
      <div style={{ ...kaart, marginBottom: 16 }}>
        <h2 style={{ fontSize: 15, margin: "0 0 10px" }}>Waar gaat het over</h2>
        {perCat.length === 0 ? (
          <p style={{ fontSize: 13.5, color: "#9A9084", margin: 0 }}>
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
                    style={{ fontWeight: 600, color: categorie === c.categorie ? "#C05A38" : "#524A40", textDecoration: "none" }}>
                    {c.categorie}
                  </a>
                  <span style={{ color: "#6B6258" }}>
                    <strong style={{ color: "#2B2724" }}>{c.aantal}</strong>
                    {Number(c.open) > 0 && <span style={{ color: "#b45309", marginLeft: 6 }}>{c.open} open</span>}
                  </span>
                </div>
                <div style={{ background: "#F4EEE3", borderRadius: 999, height: 8 }}>
                  <div style={{ width: pct + "%", height: "100%", background: "#2B2724", borderRadius: 999 }} />
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
            style={{ ...knop(false), borderColor: "#C05A38", color: "#a35400" }}>
            {categorie} ✕
          </a>
        )}
      </div>

      {/* Lijst */}
      <div style={{ display: "grid", gap: 10 }}>
        {rijen.length === 0 && (
          <div style={{ ...kaart, textAlign: "center", color: "#9A9084" }}>Niets gevonden met deze filters.</div>
        )}
        {rijen.map((v) => (
          <div key={v.id} style={{ ...kaart, borderLeft: "4px solid " + (v.status === "open" ? (URG_KLEUR[v.urgentie] || "#6B6258") : "#ECE4D7") }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
              <div>
                <strong style={{ fontSize: 15 }}>{v.bedrijf || "Onbekende klant"}</strong>
                <span style={{ fontSize: 12.5, color: "#9A9084", marginLeft: 8 }}>
                  {new Date(v.created_at).toLocaleString("nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                {v.categorie && (
                  <span style={{ fontSize: 11.5, fontWeight: 700, background: "#F4EEE3", color: "#524A40", padding: "4px 9px", borderRadius: 999 }}>
                    {v.categorie}
                  </span>
                )}
                {v.urgentie === "hoog" && (
                  <span style={{ fontSize: 11.5, fontWeight: 700, background: "#fee2e2", color: "#b91c1c", padding: "4px 9px", borderRadius: 999 }}>
                    urgent
                  </span>
                )}
                {v.onderwerp && (
                  <span style={{ fontSize: 11.5, color: "#9A9084" }}>koos: {v.onderwerp}</span>
                )}
              </div>
            </div>
            <p style={{ margin: "0 0 10px", fontSize: 14.5, lineHeight: 1.55, color: "#524A40" }}>{v.tekst}</p>
            <VraagKnop id={v.id} status={v.status} />
          </div>
        ))}
      </div>
    </WerkplekShell>
  );
}
