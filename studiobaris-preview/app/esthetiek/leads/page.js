import { zoekLeads, getLeadFacetten } from "../../../lib/server-data";
import { leesSessie, isBeheer } from "../../../lib/auth";
import { esthetiekSheetUrl } from "../../../lib/leads-sheet";
import WerkplekShell from "../../werkplek-shell";
import LeadsClient from "../../leads/leads-client";
import { KLEUR } from "../../werkplek-stijl";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// Previews test → Leads: dezelfde leadlijst als voor vakmannen, maar dan voor
// kappers, nagel- en beautysalons (leads.lijst = 'esthetiek', eigen Sheet).
// Alleen beheer (ook afgedwongen in middleware.js).
export default async function EsthetiekLeadsPage({ searchParams }) {
  const sessie = leesSessie();
  if (!isBeheer(sessie)) redirect("/klanten");
  const naam = sessie.naam;
  const sp = (await searchParams) || {};
  const lijst = "esthetiek";

  const filters = {
    lijst,
    tab: sp.tab === "afgerond" ? "afgerond" : sp.tab === "archief" ? "archief" : "werk",
    zoek: sp.zoek || "",
    provincie: sp.provincie || "",
    vakgebied: sp.vakgebied || "",
    potentie: "",
    site: sp.site || "",
    wie: sp.wie || "alles",
    limiet: Number(sp.limiet) > 0 ? Math.min(Number(sp.limiet), 300) : 30,
    reden: sp.reden || "",
  };

  const [resultaat, facetten] = await Promise.all([
    zoekLeads({ naam, ...filters }),
    getLeadFacetten(naam, lijst, null),
  ]);
  const geenSheet = !esthetiekSheetUrl();

  return (
    <WerkplekShell
      naam={naam}
      beheer
      actief="/esthetiek/leads"
      titel="Leads · esthetiek"
      sub="Test: kappers, nagel- en beautysalons. Werkt precies zoals de leadlijst voor vakmannen."
    >
      {geenSheet && (
        <div style={{ background: KLEUR.amber.bg, border: `1px solid ${KLEUR.baanRand}`, borderRadius: 12, padding: "12px 16px", marginBottom: 16, fontSize: 14, color: KLEUR.amber.tekst }}>
          Er is nog geen Sheet gekoppeld voor deze lijst. Zet in Vercel <strong>LEADS_ESTHETIEK_SHEET_CSV_URL</strong> op de CSV-link van een Sheet met dezelfde kolommen als de vakmannenlijst (bedrijfsnaam, vakgebied, plaats, provincie, telefoon, website_status, gevonden_url, opmerking, scan_datum, bron).
        </div>
      )}
      <LeadsClient
        leads={resultaat.rijen || []}
        totaal={resultaat.totaal || 0}
        facetten={facetten}
        mij={naam}
        filters={filters}
        beheer
        vasteProvincie={null}
        pad="/esthetiek/leads"
        syncPad="/api/leads/sync-esthetiek"
        vakLabel="Alle soorten salons"
      />
    </WerkplekShell>
  );
}
