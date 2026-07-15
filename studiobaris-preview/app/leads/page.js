import { zoekLeads, getLeadFacetten, getOmzet } from "../../lib/server-data";
import { leesSessie, isBeheer } from "../../lib/auth";
import WerkplekShell from "../werkplek-shell";
import LeadsClient from "./leads-client";
import { KLEUR, HEAD } from "../werkplek-stijl";

export const dynamic = "force-dynamic";

function euro(n) {
  const v = Number(n || 0);
  return "€ " + v.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Kleine omzetkaart in de nieuwe stijl (warm, klei-accent).
function OmzetBalk({ naam, cijfers }) {
  const c = cijfers || { aantal: 0, verkoopbedrag: 0, commissie: 0, verdiend: 0, openstaand: 0 };
  const vak = (label, waarde, kleur) => (
    <div style={{ flex: "1 1 130px", minWidth: 120 }}>
      <div style={{ fontSize: 12, color: KLEUR.brand?.faint || "#B6C2CF", marginBottom: 2 }}>{label}</div>
      <div style={{ fontFamily: HEAD, fontSize: 22, fontWeight: 800, color: kleur || "#fff", lineHeight: 1.1 }}>{waarde}</div>
    </div>
  );
  return (
    <div style={{ background: KLEUR.inkt, color: "#fff", borderRadius: 16, padding: "16px 20px", marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
        <span style={{ fontFamily: HEAD, fontSize: 15, fontWeight: 800 }}>Jouw omzet</span>
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
  const beheer = isBeheer(sessie);
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

  const onbekeken = Math.max(Number(resultaat.totaal || 0), 0);

  return (
    <WerkplekShell
      naam={naam || "collega"}
      beheer={beheer}
      actief="/leads"
      titel="Leads"
      sub="Pak een lead op, zoek info op en vraag een preview aan. Alles wat je doet zien je collega's live."
    >
      {sessie && <OmzetBalk naam={naam} cijfers={mijn} />}

      {naam === "Gerrit" && facetten.socials > 0 && (
        <div style={{ background: KLEUR.kleiZacht, border: `1px solid ${KLEUR.baanRand}`, borderRadius: 12, padding: "12px 16px", marginBottom: 16, fontSize: 14, color: KLEUR.kleiDonker }}>
          <strong>{facetten.socials}</strong> bedrijven hebben wél social media maar géén website — de hoogste kans op conversie. Die staan alleen bij jou, bovenaan.
        </div>
      )}

      <LeadsClient
        leads={resultaat.rijen || []}
        totaal={resultaat.totaal || 0}
        facetten={facetten}
        mij={naam}
        filters={filters}
        beheer={beheer}
      />
    </WerkplekShell>
  );
}
