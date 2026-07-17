import { getOverview, getMijnLeads } from "../../lib/server-data";
import { leesSessie, isBeheer } from "../../lib/auth";
import { FaseStepper, Contactpersoon, AppjeKnop, LinkChips, VerkoopBedrag, AppLinkKnop, PersoonlijkeZin, PublishToggle } from "../dashboard/dashboard-actions";
import WerkplekShell from "../werkplek-shell";
import { KLEUR, HEAD } from "../werkplek-stijl";

export const dynamic = "force-dynamic";

const card = { background: "#fff", border: `1px solid ${KLEUR.lijn}`, borderRadius: 16, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 };

function BetaalBadge({ status }) {
  const map = {
    actief: ["#0f6e56", "Aanbetaling voldaan"],
    akkoord: ["#854f0b", "Akkoord - aanbetaling nog niet binnen"],
    mislukt: ["#b91c1c", "Betaling mislukt"],
  };
  const [kleur, label] = map[status] || ["#9A9084", "Nog geen akkoord"];
  return <span style={{ fontSize: 12.5, fontWeight: 600, color: kleur }}>{label}</span>;
}

// Checklist: wat moet er nog voordat je het appje kunt versturen?
function Checklist({ r }) {
  const items = [
    ["Voornaam contactpersoon", Boolean((r.contactpersoon || "").trim())],
    ["Telefoonnummer", Boolean((r.lead_phone || "").trim())],
    ["Persoonlijke zin", Boolean((r.persoonlijk || "").trim())],
    ["Verkoopbedrag", Number(r.websiteprijs) > 0],
  ];
  const klaar = items.every((i) => i[1]);
  return (
    <div style={{ background: KLEUR.papier, border: `1px solid ${KLEUR.lijn}`, borderRadius: 12, padding: "12px 14px" }}>
      <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.5, color: klaar ? KLEUR.sage.tekst : KLEUR.amber.tekst, marginBottom: 8 }}>
        {klaar ? "Klaar om te versturen" : "Nog te doen voor versturen"}
      </div>
      <div style={{ display: "grid", gap: 6 }}>
        {items.map(([label, ok]) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, color: ok ? KLEUR.gedempt : KLEUR.inkt }}>
            <span style={{ width: 18, height: 18, borderRadius: 999, display: "grid", placeItems: "center", flex: "0 0 auto",
              background: ok ? KLEUR.sage.bg : KLEUR.rust.bg, color: ok ? KLEUR.sage.tekst : KLEUR.rust.tekst, fontSize: 12, fontWeight: 800 }}>
              {ok ? "✓" : "✗"}
            </span>
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function KlantenPage() {
  const sessie = leesSessie();
  const naam = sessie ? sessie.naam : "";
  const beheer = isBeheer(sessie);
  const [alles, mijnLeads] = await Promise.all([getOverview(), getMijnLeads(naam)]);

  const rows = beheer
    ? alles
    : alles.filter((r) => {
        let review = {};
        try { review = r.internal_notes ? JSON.parse(r.internal_notes) : {}; } catch {}
        return r.verzamelaar === naam || review.bron === naam;
      });

  return (
    <WerkplekShell
      naam={naam || "collega"}
      beheer={beheer}
      actief="/klanten"
      titel={beheer ? "Alle klanten" : "Mijn klanten"}
      sub="Hier haal je de sale binnen: vul de gegevens in, verstuur het appje, en zet de fase op Akkoord zodra hij ja zegt."
    >
      {mijnLeads.length > 0 && (
        <div style={{ ...card, marginBottom: 16, background: KLEUR.papier }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
            <h2 style={{ fontFamily: HEAD, fontSize: 16, margin: 0, fontWeight: 800 }}>Opgepakt, nog geen preview</h2>
            <span style={{ fontSize: 13, color: "#9A9084" }}>{mijnLeads.length} {mijnLeads.length === 1 ? "lead staat" : "leads staan"} op jouw naam</span>
            <a href="/leads?wie=mij" style={{ marginLeft: "auto", fontSize: 13, color: KLEUR.klei }}>Naar de leadlijst</a>
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {mijnLeads.map((l) => (
              <div key={l.id} style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", background: "#fff", border: `1px solid ${KLEUR.lijn}`, borderRadius: 10, padding: "10px 12px" }}>
                <div style={{ flex: "1 1 200px", minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14.5 }}>{l.bedrijfsnaam}</div>
                  <div style={{ fontSize: 12.5, color: "#6B6258" }}>
                    {[l.vakgebied, l.plaats].filter(Boolean).join(" · ")}
                    {l.status === "benaderd" && <span style={{ color: "#9E3B2E", fontWeight: 600 }}> · benaderd</span>}
                    {l.alleen_socials && <span style={{ color: "#9E3B2E", fontWeight: 600 }}> · geen website</span>}
                  </div>
                </div>
                {l.telefoon && <a href={`tel:${String(l.telefoon).replace(/\s/g, "")}`} style={{ fontSize: 13, fontWeight: 600, color: "#2B2724", textDecoration: "none" }}>{l.telefoon}</a>}
                <a href={`/intake?lead=${l.id}`} target="_blank" rel="noreferrer"
                  style={{ background: KLEUR.klei, color: "#fff", padding: "8px 13px", borderRadius: 9, fontWeight: 700, fontSize: 13, textDecoration: "none", whiteSpace: "nowrap" }}>
                  Preview maken
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {rows.length === 0 && mijnLeads.length === 0 && (
        <div style={{ background: KLEUR.amber.bg, border: `1px solid ${KLEUR.baanRand}`, borderRadius: 12, padding: "16px 18px", color: KLEUR.amber.tekst }}>
          Je hebt nog geen klanten. Pak een lead op in de <a href="/leads" style={{ color: KLEUR.amber.tekst, fontWeight: 700 }}>leadlijst</a> en maak een preview.
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
        {rows.map((r) => (
          <div key={r.slug} style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontFamily: HEAD, fontSize: 17, fontWeight: 700 }}>{r.company_name || r.slug}</div>
                <div style={{ fontSize: 13, color: "#6B6258" }}>{[r.lead_phone, r.lead_email].filter(Boolean).join(" · ") || "—"}</div>
              </div>
              {beheer ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: r.gepubliceerd ? "#0f6e56" : "#9A9084", whiteSpace: "nowrap" }}>
                    {r.gepubliceerd ? "● Online" : "○ Offline"}
                  </span>
                  <PublishToggle slug={r.slug} gepubliceerd={r.gepubliceerd} />
                </div>
              ) : (
                <span style={{ fontSize: 12, fontWeight: 700, color: r.gepubliceerd ? "#0f6e56" : "#9A9084", whiteSpace: "nowrap" }}>
                  {r.gepubliceerd ? "Online" : "Offline"}
                </span>
              )}
            </div>

            <FaseStepper slug={r.slug} huidige={r.pipeline_status} bedrijf={r.company_name} />
            <BetaalBadge status={r.betaal_status} />

            <Checklist r={r} />

            <LinkChips slug={r.slug} gepubliceerd={r.gepubliceerd} heeftDemo={r.heeft_demo} demoGevuld={r.demo_gevuld} magMaken={beheer} volledig heeftRest={Number(r.restbedrag) > 0} restBetaald={r.rest_status === "betaald"} stijl={r.stijl} />
            <PersoonlijkeZin slug={r.slug} value={r.persoonlijk} />

            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
              <Contactpersoon slug={r.slug} value={r.contactpersoon} />
              <AppjeKnop slug={r.slug} bedrijf={r.company_name} contact={r.contactpersoon} afzender={r.verzamelaar || naam} telefoon={r.lead_phone} demoGevuld={r.demo_gevuld} persoonlijk={r.persoonlijk} />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
              <AppLinkKnop bedrijf={r.company_name} />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", borderTop: `1px solid ${KLEUR.baan}`, paddingTop: 12 }}>
              <VerkoopBedrag slug={r.slug} value={r.websiteprijs} />
              <span style={{ fontSize: 12.5, color: "#9A9084" }}>Vul in waarvoor je 'm hebt verkocht. Jouw commissie is 50% hiervan.</span>
            </div>
          </div>
        ))}
      </div>
    </WerkplekShell>
  );
}
