import { zoekLeads, getLeadFacetten } from "../../lib/server-data";
import { leesSessie, isBeheer } from "../../lib/auth";
import WerkplekShell from "../werkplek-shell";
import LeadsClient from "./leads-client";
import { KLEUR } from "../werkplek-stijl";

export const dynamic = "force-dynamic";

export default async function LeadsPage({ searchParams }) {
  const sessie = leesSessie();
  const naam = sessie ? sessie.naam : "";
  const beheer = isBeheer(sessie);
  const sp = (await searchParams) || {};

  // Alleen de actuele (gescande) lijst is zichtbaar. De oude import van 7.900
  // leads blijft op de achtergrond in de database staan, maar niet op het dashboard.
  const lijst = "actueel";

  const filters = {
    lijst,
    tab: sp.tab === "afgerond" ? "afgerond" : sp.tab === "archief" ? "archief" : "werk",
    zoek: sp.zoek || "",
    provincie: sp.provincie || "",
    vakgebied: sp.vakgebied || "",
    potentie: lijst === "oud" ? sp.potentie || "" : "",
    site: lijst === "actueel" ? sp.site || "" : "",
    wie: sp.wie || "alles",
    limiet: Number(sp.limiet) > 0 ? Math.min(Number(sp.limiet), 300) : 30,
    reden: sp.reden || "",
  };

  const [resultaat, facetten] = await Promise.all([
    zoekLeads({ naam, ...filters }),
    getLeadFacetten(naam, lijst),
  ]);

  const onbekeken = Math.max(Number(resultaat.totaal || 0), 0);

  return (
    <WerkplekShell
      naam={naam || "collega"}
      beheer={beheer}
      actief="/leads"
      titel="Leads"
      sub="Pak een lead op, zoek info op en vraag een preview aan. Alles wat je doet zien je collega's live."
    >
      {lijst === "oud" && naam === "Gerrit" && facetten.socials > 0 && (
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
