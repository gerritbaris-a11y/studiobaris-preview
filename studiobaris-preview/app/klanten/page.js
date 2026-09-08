import { getOverview, getMijnLeads, getTeamLogin } from "../../lib/server-data";
import { leesSessie, isBeheer } from "../../lib/auth";
import {
  FaseStepper, Contactpersoon, AppjeKnop, LinkChips,
  GeenInteresseKnop, TerugNaarActiefKnop,
  PublishToggle,
  // Beheerfuncties die eerst alleen op de oude /dashboard stonden. Die pagina
  // is samengevoegd met deze; zonder deze regel zou o.a. de akkoordlink - en
  // daarmee de hele betaalflow - onbereikbaar worden.
  KlantNaam, VerwijderKnop,
} from "../dashboard/dashboard-actions";
// normFase() komt uit een apart, niet-"use client"-bestand: importeer je 'm
// vanuit dashboard-actions.js (wel "use client"), dan is het op de server
// geen aanroepbare functie meer maar een client-referentie — vandaar dit
// aparte pad, ook al staat dezelfde functie ook al in dashboard-actions.js.
import { normFase } from "../../lib/fase";
import WerkplekShell from "../werkplek-shell";
import DocumentenKaart from "../documenten-kaart";
import KlantenZoek from "./klanten-zoek";
import { KLEUR, HEAD } from "../werkplek-stijl";

export const dynamic = "force-dynamic";

const REACTIE_LABEL = { intake: "klant-intake", feedback: "feedback" };

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

export default async function KlantenPage() {
  const sessie = leesSessie();
  const naam = sessie ? sessie.naam : "";
  const beheer = isBeheer(sessie);
  const [alles, mijnLeads, teamleden] = await Promise.all([getOverview(), getMijnLeads(naam), getTeamLogin()]);
  // Welke handleiding hoort bij deze verkoper? Volgt uit zijn vergoedingsmodel.
  const ikzelf = (teamleden || []).find((t) => t.naam === naam);
  const mijnModel = ikzelf ? ikzelf.vergoeding_model : "50pct";

  const rows = beheer
    ? alles
    : alles.filter((r) => {
        let review = {};
        try { review = r.internal_notes ? JSON.parse(r.internal_notes) : {}; } catch {}
        return r.verzamelaar === naam || review.bron === naam;
      });

  // Klanten op "Geen interesse" (Afgewezen) apart houden: uit de actieve lijst,
  // maar wel terug te vinden en terug te zetten in een eigen sectie onderaan.
  const afgewezen = rows.filter((r) => (r.pipeline_status || "") === "Afgewezen");
  const actief = rows.filter((r) => (r.pipeline_status || "") !== "Afgewezen");

  return (
    <WerkplekShell
      naam={naam || "collega"}
      beheer={beheer}
      actief="/klanten"
      titel={beheer ? "Alle previews" : "Mijn previews"}
      sub="Hier haal je de sale binnen: vul de gegevens in, verstuur het appje, en zet de fase op Akkoord zodra hij ja zegt."
    >
      <DocumentenKaart beheer={beheer} model={mijnModel} />

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

      {actief.length === 0 && mijnLeads.length === 0 && (
        <div style={{ background: KLEUR.amber.bg, border: `1px solid ${KLEUR.baanRand}`, borderRadius: 12, padding: "16px 18px", color: KLEUR.amber.tekst }}>
          Je hebt nog geen klanten. Pak een lead op in de <a href="/leads" style={{ color: KLEUR.amber.tekst, fontWeight: 700 }}>leadlijst</a> en maak een preview.
        </div>
      )}

      {(actief.length > 1 || afgewezen.length > 0) && <KlantenZoek />}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
        {actief.map((r) => {
          let review = {};
          try { review = r.internal_notes ? JSON.parse(r.internal_notes) : {}; } catch {}
          const reactieOp = r.laatste_feedback_op
            ? new Date(r.laatste_feedback_op).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })
            : null;
          const zoektekst = [r.company_name, r.slug, r.lead_phone, r.lead_email, r.verzamelaar, review.bron]
            .filter(Boolean).join(" ").toLowerCase();
          const fase = normFase(r.pipeline_status);
          return (
          <div key={r.slug} style={card} data-klant={zoektekst} data-fase={fase} data-betaal={r.betaal_status || "geen"} data-reactie={r.laatste_feedback_op ? "ja" : "nee"}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontFamily: HEAD, fontSize: 17, fontWeight: 700 }}>{r.company_name || r.slug}</div>
                <div style={{ fontSize: 13, color: "#6B6258" }}>{[r.lead_phone, r.lead_email].filter(Boolean).join(" · ") || "—"}</div>
                {beheer && review.bron && <div style={{ fontSize: 12, color: "#9A9084", marginTop: 2 }}>Via: {review.bron}</div>}
                {review.logo_toestemming && (
                  <div style={{ display: "inline-block", marginTop: 6, fontSize: 12, fontWeight: 700, color: "#0f6e56", background: "#e7f3ea", padding: "2px 9px", borderRadius: 999 }}>
                    ✓ Logo mag op onze site
                  </div>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                {beheer ? (
                  <>
                    <span style={{ fontSize: 12, fontWeight: 700, color: r.gepubliceerd ? "#0f6e56" : "#9A9084", whiteSpace: "nowrap" }}>
                      {r.gepubliceerd ? "● Online" : "○ Offline"}
                    </span>
                    <PublishToggle slug={r.slug} gepubliceerd={r.gepubliceerd} />
                  </>
                ) : (
                  <span style={{ fontSize: 12, fontWeight: 700, color: r.gepubliceerd ? "#0f6e56" : "#9A9084", whiteSpace: "nowrap" }}>
                    {r.gepubliceerd ? "Online" : "Offline"}
                  </span>
                )}
                <GeenInteresseKnop slug={r.slug} bedrijf={r.company_name} huidige={r.pipeline_status} />
              </div>
            </div>

            <FaseStepper slug={r.slug} huidige={r.pipeline_status} bedrijf={r.company_name} />
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 16px", alignItems: "center" }}>
              <BetaalBadge status={r.betaal_status} />
              {reactieOp && (
                <span style={{ fontSize: 12.5, fontWeight: 600, color: "#9E3B2E" }}>
                  ● Klant reageerde ({REACTIE_LABEL[r.laatste_feedback_type] || r.laatste_feedback_type || "reactie"}) op {reactieOp}
                </span>
              )}
            </div>

            <LinkChips slug={r.slug} gepubliceerd={r.gepubliceerd} heeftDemo={r.heeft_demo} demoGevuld={r.demo_gevuld} magMaken={beheer} stijl={r.stijl} bedrijf={r.company_name} />

            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
              <Contactpersoon slug={r.slug} value={r.contactpersoon} />
              <AppjeKnop slug={r.slug} bedrijf={r.company_name} contact={r.contactpersoon} afzender={r.verzamelaar || naam} telefoon={r.lead_phone} demoGevuld={r.demo_gevuld} persoonlijk={r.persoonlijk} />
            </div>

            {beheer && (
              <div style={{ borderTop: `1px solid ${KLEUR.baan}`, paddingTop: 12, display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
                <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.5, color: KLEUR.gedempt }}>
                  Beheer
                </div>
                <KlantNaam slug={r.slug} value={r.verzamelaar} />
                {(naam === "Gerrit" || naam === "Levi") && (
                  <div style={{ marginLeft: "auto" }}><VerwijderKnop slug={r.slug} naam={r.company_name} /></div>
                )}
              </div>
            )}
          </div>
          );
        })}
      </div>

      {afgewezen.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 10 }}>
            <h2 style={{ fontFamily: HEAD, fontSize: 16, margin: 0, fontWeight: 800, color: "#9A9084" }}>Geen interesse</h2>
            <span style={{ fontSize: 13, color: "#9A9084" }}>{afgewezen.length} gearchiveerd &mdash; hier terug te zetten</span>
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {afgewezen.map((r) => {
              const zoektekst = [r.company_name, r.slug, r.lead_phone, r.lead_email, r.verzamelaar]
                .filter(Boolean).join(" ").toLowerCase();
              return (
              <div key={r.slug} data-klant={zoektekst} data-fase="archief" style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", background: "#fff", border: `1px solid ${KLEUR.lijn}`, borderRadius: 10, padding: "10px 12px", opacity: 0.9 }}>
                <div style={{ flex: "1 1 200px", minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14.5 }}>{r.company_name || r.slug}</div>
                  <div style={{ fontSize: 12.5, color: "#9A9084" }}>{[r.lead_phone, r.lead_email].filter(Boolean).join(" · ") || "—"}</div>
                </div>
                <TerugNaarActiefKnop slug={r.slug} bedrijf={r.company_name} />
              </div>
              );
            })}
          </div>
        </div>
      )}
    </WerkplekShell>
  );
}
