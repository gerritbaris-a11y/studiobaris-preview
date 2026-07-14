import { zoekLeads, getLeadFacetten, getOmzet } from "../../lib/server-data";
import { leesSessie, isBeheer } from "../../lib/auth";
import LeadsClient from "./leads-client";

export const dynamic = "force-dynamic";

function euro(n) {
  const v = Number(n || 0);
  return "€ " + v.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function OmzetBalk({ naam, cijfers }) {
  const c = cijfers || { aantal: 0, verkoopbedrag: 0, commissie: 0, verdiend: 0, openstaand: 0 };
  const vak = (label, waarde, kleur) => (
    <div style={{ flex: "1 1 120px", minWidth: 120 }}>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,.7)", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: kleur || "#fff", lineHeight: 1.1 }}>{waarde}</div>
    </div>
  );
  return (
    <div style={{
      background: "linear-gradient(135deg,#2B2724,#2B2724)", color: "#fff", borderRadius: 16,
      padding: "16px 20px", marginBottom: 20, boxShadow: "0 10px 30px -14px rgba(0,0,0,.5)",
    }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
        <span style={{ fontSize: 15, fontWeight: 700 }}>Jouw omzet</span>
        <span style={{ fontSize: 13, color: "rgba(255,255,255,.65)" }}>
          {naam} · {c.aantal} {Number(c.aantal) === 1 ? "klant" : "klanten"} · verkocht voor {euro(c.verkoopbedrag)}
        </span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
        {vak("Uitbetaald", euro(c.verdiend), "#7ee2b8")}
        {vak("Nog te verdienen", euro(c.openstaand), "#ffd18a")}
        {vak("Totaal (jouw 50%)", euro(c.commissie))}
      </div>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,.6)", marginTop: 12 }}>
        Je krijgt 50% van je verkoopbedrag — de helft bij akkoord, de andere helft bij oplevering.
      </div>
    </div>
  );
}

export default async function LeadsPage({ searchParams }) {
  const sessie = leesSessie();
  const naam = sessie ? sessie.naam : "";
  const sp = (await searchParams) || {};

  const filters = {
    tab: sp.tab === "afgerond" ? "afgerond" : sp.tab === "archief" ? "archief" : "werk",
    zoek: sp.zoek || "",
    provincie: sp.provincie || "",
    vakgebied: sp.vakgebied || "",
    potentie: sp.potentie || "",
    wie: sp.wie || "alles",
    limiet: Number(sp.limiet) > 0 ? Math.min(Number(sp.limiet), 300) : 30,
    reden: sp.reden || "",
  };

  const [resultaat, facetten, omzet] = await Promise.all([
    zoekLeads({ naam, ...filters }),
    getLeadFacetten(naam),
    getOmzet(),
  ]);
  const mijn = omzet.find((o) => o.persoon === naam) || null;

  return (
    <main style={{ maxWidth: 1320, margin: "4vh auto", padding: "0 24px", fontFamily: "system-ui, sans-serif", color: "#2B2724" }}>
      <p style={{ fontSize: 13, letterSpacing: 2, textTransform: "uppercase", color: "#B0A697" }}>StudioBaris</p>

      {sessie && <OmzetBalk naam={naam} cijfers={mijn} />}

      <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 4 }}>
        <h1 style={{ fontSize: 28, margin: "6px 0" }}>Leads</h1>
        <a href="/klanten" style={{ background: "#C05A38", color: "#fff", padding: "7px 13px", borderRadius: 9, fontWeight: 700, fontSize: 14, textDecoration: "none" }}>Mijn klanten</a>
        {isBeheer(sessie) && (
          <a href="/leads/import" style={{ color: "#C05A38", fontSize: 14 }}>Leads importeren</a>
        )}
        {sessie && (
          <span style={{ marginLeft: "auto", fontSize: 13, color: "#6B6258" }}>
            Ingelogd als <strong style={{ color: "#2B2724" }}>{naam}</strong>
            {" · "}
            <a href="/api/auth/logout" style={{ color: "#C05A38" }}>Uitloggen</a>
          </span>
        )}
      </div>
      <p style={{ color: "#6B6258", marginBottom: 18, fontSize: 14 }}>
        Pak een lead op (zet 'm op je naam), zoek info op en vraag een preview aan. Alles wat je hier doet zien je collega's live.
      </p>

      {naam === "Gerrit" && facetten.socials > 0 && (
        <div style={{ background: "#FBF7F0", border: "1px solid #E3DACB", borderRadius: 12, padding: "12px 16px", marginBottom: 16, fontSize: 14, color: "#9E3B2E" }}>
          <strong>{facetten.socials}</strong> bedrijven hebben wél social media maar géén website — de hoogste kans op conversie.
          Die staan alleen bij jou in de lijst, bovenaan, met een blauw label.
        </div>
      )}

      <LeadsClient
        leads={resultaat.rijen || []}
        totaal={resultaat.totaal || 0}
        facetten={facetten}
        mij={naam}
        filters={filters}
        beheer={isBeheer(sessie)}
      />
    </main>
  );
}
