import { getOverview, getMijnLeads, getTeamLogin } from "../../lib/server-data";
import { stijlKort } from "../../lib/stijlen";
import { leesSessie, isBeheer } from "../../lib/auth";
import {
  FaseStepper, Contactpersoon, LinkChips,
  GeenInteresseKnop, TerugNaarActiefKnop,
  PublishToggle,
  // Beheerfuncties die eerst alleen op de oude /dashboard stonden. Die pagina
  // is samengevoegd met deze; zonder deze regel zou o.a. de akkoordlink - en
  // daarmee de hele betaalflow - onbereikbaar worden.
  KlantNaam, VerwijderKnop,
  HuisstijlKnop, HuisstijlAllesKnop,
  ProvincieKeuze,
} from "../dashboard/dashboard-actions";
// normFase() komt uit een apart, niet-"use client"-bestand: importeer je 'm
// vanuit dashboard-actions.js (wel "use client"), dan is het op de server
// geen aanroepbare functie meer maar een client-referentie — vandaar dit
// aparte pad, ook al staat dezelfde functie ook al in dashboard-actions.js.
import { normFase } from "../../lib/fase";
import WerkplekShell from "../werkplek-shell";
import DocumentenKaart from "../documenten-kaart";
import KlantenZoek from "./klanten-zoek";
import HostingCheck from "./hosting-check";
import DomeinCheck from "./domein-check";
import NaAkkoord from "./na-akkoord";
import { getRondes } from "../../lib/ronde";
import { KLEUR, HEAD } from "../werkplek-stijl";
import { getProefOverzicht } from "../../lib/proef";
import { getAanvragenOverzicht } from "../../lib/aanbod";
import AanvraagAf from "./aanvraag-af";
import ProefStatus from "./proef-status";
import BenaderdKnop from "./benaderd-knop";
import { getBenaderdLijst } from "../../lib/benaderd";
import { getRegio, magPreview } from "../../lib/regio";
import { isEsthetiekPreview, isEsthetiekLead } from "../../lib/segment";

// Gedeelde pagina voor "Mijn previews" (/klanten) en, als test, "Mijn previews
// esthetiek" (/esthetiek, alleen beheer). segment = "esthetiek" toont alleen
// previews en opgepakte leads van kappers, nagel- en beautysalons.

const REACTIE_LABEL = { intake: "klant-intake", feedback: "feedback" };

const card = { background: "#fff", border: `1px solid ${KLEUR.lijn}`, borderRadius: 16, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 };

// Wat de prospect met zijn preview en demo-app heeft gedaan (rechtsboven per preview).
function wanneer(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  // Altijd de echte datum + tijd (Nederlandse tijd), geen "vandaag"/"gisteren":
  // die woorden kloppen morgen niet meer.
  const dag = d.toLocaleDateString("nl-NL", { day: "numeric", month: "short", timeZone: "Europe/Amsterdam" });
  const tijd = d.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Amsterdam" });
  return dag + ", " + tijd;
}

function ProspectActiviteit({ p, a }) {
  if (!p && !a) return null;
  const regel = { fontSize: 12.5, color: "#4A5560", whiteSpace: "nowrap" };
  const uit = { ...regel, color: "#6F7A85" };
  const aan = (b) => ({ ...regel, fontWeight: 700, color: b ? "#0f6e56" : "#4A5560" });
  const geplaatst = p ? Number(p.geplaatst) || 0 : 0;
  // Eerste keer dat de demo-app geopend werd (sinds 22 okt een eigen kolom,
  // omdat de proef nu al bij "Benaderd" start, vóór het openen).
  const appOpenOp = p ? p.app_geopend_op || (p.gestart_via === "app" ? p.gestart_op : null) : null;
  return (
    <div style={{ display: "grid", gap: 3, textAlign: "right", marginTop: 6, padding: "8px 10px", background: "#F7F4EE", border: "1px solid #ECE8DF", borderRadius: 10 }}>
      {a && a.aanvraag_id && (
        <span style={{ ...regel, whiteSpace: "normal", fontWeight: 800, color: "#9E3B2E", display: "flex", gap: 8, alignItems: "center", justifyContent: "flex-end", flexWrap: "wrap" }}>
          ● {a.soort === "starten" ? "Wil starten" : "Heeft een vraag"}: bel {a.telefoon}{a.moment ? ` (${a.moment.toLowerCase()})` : ""} · {wanneer(a.aanvraag_op)}
          <AanvraagAf id={a.aanvraag_id} klein />
        </span>
      )}
      {p && (p.bekeken_aantal > 0
        ? <span style={aan(true)}>● Preview bekeken {p.bekeken_aantal}× · laatst {wanneer(p.bekeken_laatst)}</span>
        : <span style={uit}>○ Preview nog niet bekeken</span>)}
      {p && (appOpenOp
        ? <span style={aan(true)}>● App geopend {wanneer(appOpenOp)}</span>
        : <span style={uit}>○ App nog niet geopend</span>)}
      {p && (geplaatst > 0
        ? <span style={aan(true)}>● {geplaatst} van 3 projecten geplaatst · laatst {wanneer(p.laatst_geplaatst_op)}</span>
        : <span style={uit}>○ Nog geen project geplaatst</span>)}
      {a && a.aanbod_aantal > 0
        ? <span style={aan(true)}>● &quot;Dit wil ik&quot; bekeken {a.aanbod_aantal}× · laatst {wanneer(a.aanbod_laatst)}</span>
        : <span style={uit}>○ &quot;Dit wil ik&quot; nog niet bekeken</span>}
    </div>
  );
}

function BetaalBadge({ status }) {
  const map = {
    actief: ["#0f6e56", "Aanbetaling voldaan"],
    akkoord: ["#854f0b", "Akkoord - aanbetaling nog niet binnen"],
    mislukt: ["#b91c1c", "Betaling mislukt"],
  };
  const [kleur, label] = map[status] || ["#6F7A85", "Nog geen akkoord"];
  return <span style={{ fontSize: 12.5, fontWeight: 600, color: kleur }}>{label}</span>;
}

export default async function PreviewsPagina({ segment = null } = {}) {
  const esth = segment === "esthetiek";
  const leadsPad = esth ? "/esthetiek/leads" : "/leads";
  const sessie = leesSessie();
  const naam = sessie ? sessie.naam : "";
  const beheer = isBeheer(sessie);
  const [allesRuw, mijnLeadsRuw, teamleden, proefLijst, benaderdLijst, regio, aanvraagLijst, rondeLijst] = await Promise.all([getOverview(), getMijnLeads(naam), getTeamLogin(), getProefOverzicht(), getBenaderdLijst(), beheer ? null : getRegio(naam), getAanvragenOverzicht(), beheer ? getRondes() : []]);
  const alles = esth ? (allesRuw || []).filter(isEsthetiekPreview) : allesRuw;
  const mijnLeads = esth ? (mijnLeadsRuw || []).filter(isEsthetiekLead) : mijnLeadsRuw;
  const aanvraagPerSlug = Object.fromEntries((aanvraagLijst || []).map((a) => [a.slug, a]));
  const benaderdPerSlug = Object.fromEntries((benaderdLijst || []).map((b) => [b.slug, b.benaderd_op]));
  const benaderdDoor = Object.fromEntries((benaderdLijst || []).map((b) => [b.slug, b.benaderd_door]));
  const proefPerSlug = Object.fromEntries((proefLijst || []).map((p) => [p.slug, p]));
  const magVerlengen = naam === "Gerrit" || naam === "Levi";
  // Welke handleiding hoort bij deze verkoper? Volgt uit zijn vergoedingsmodel.
  const ikzelf = (teamleden || []).find((t) => t.naam === naam);
  const mijnModel = ikzelf ? ikzelf.vergoeding_model : "50pct";

  // Verkoper: eigen previews + alle previews uit zijn regio (lib/regio.js).
  // Beheer ziet alles.
  const rows = beheer ? alles : alles.filter((r) => magPreview(r, naam, false, regio));

  // Klanten op "Geen interesse" (Afgewezen) apart houden: uit de actieve lijst,
  // maar wel terug te vinden en terug te zetten in een eigen sectie onderaan.
  const afgewezen = rows.filter((r) => (r.pipeline_status || "") === "Afgewezen");
  const actief = rows.filter((r) => (r.pipeline_status || "") !== "Afgewezen");

  return (
    <WerkplekShell
      naam={naam || "collega"}
      beheer={beheer}
      actief={esth ? "/esthetiek" : "/klanten"}
      titel={esth ? "Mijn previews esthetiek" : beheer ? "Alle previews" : regio ? `Mijn previews · ${regio}` : "Mijn previews"}
      sub={esth
        ? "Test: previews voor kappers, nagel- en beautysalons. Werkt precies zoals Mijn previews."
        : "Hier haal je de sale binnen: vul de gegevens in, verstuur het appje, en zet de fase op Akkoord zodra hij ja zegt."}
    >
      {regio && (
        <div style={{ background: KLEUR.kleiZacht, border: `1px solid ${KLEUR.baanRand}`, borderRadius: 12, padding: "12px 16px", marginBottom: 16, fontSize: 14, color: KLEUR.kleiDonker }}>
          Je ziet alle previews uit <strong>{regio}</strong>, ook die door collega's zijn gemaakt. Druk op <strong>Benaderd</strong> zodra je een bedrijf hebt benaderd, zodat het team ziet wat er loopt. Op <strong>Klaar</strong> zetten doen Gerrit of Levi.
        </div>
      )}
      <DomeinCheck />
      <HostingCheck verkoper={naam} />
      {beheer && (
        <HuisstijlAllesKnop slugs={actief.filter((r) => { try { return !!JSON.parse(r.internal_notes || "{}").website; } catch { return false; } }).map((r) => r.slug)} />
      )}
      <DocumentenKaart beheer={beheer} model={mijnModel} />

      {mijnLeads.length > 0 && (
        <div style={{ ...card, marginBottom: 16, background: KLEUR.papier }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
            <h2 style={{ fontFamily: HEAD, fontSize: 16, margin: 0, fontWeight: 800 }}>Opgepakt, nog geen preview</h2>
            <span style={{ fontSize: 13, color: "#6F7A85" }}>{mijnLeads.length} {mijnLeads.length === 1 ? "lead staat" : "leads staan"} op jouw naam</span>
            <a href={`${leadsPad}?wie=mij`} style={{ marginLeft: "auto", fontSize: 13, color: KLEUR.klei }}>Naar de leadlijst</a>
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {mijnLeads.map((l) => (
              <div key={l.id} style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", background: "#fff", border: `1px solid ${KLEUR.lijn}`, borderRadius: 10, padding: "10px 12px" }}>
                <div style={{ flex: "1 1 200px", minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14.5 }}>{l.bedrijfsnaam}</div>
                  <div style={{ fontSize: 12.5, color: "#4A5560" }}>
                    {[l.vakgebied, l.plaats].filter(Boolean).join(" · ")}
                    {l.status === "benaderd" && <span style={{ color: "#9E3B2E", fontWeight: 600 }}> · benaderd</span>}
                    {l.alleen_socials && <span style={{ color: "#9E3B2E", fontWeight: 600 }}> · geen website</span>}
                  </div>
                </div>
                {l.telefoon && <a href={`tel:${String(l.telefoon).replace(/\s/g, "")}`} style={{ fontSize: 13, fontWeight: 600, color: "#1A2B3D", textDecoration: "none" }}>{l.telefoon}</a>}
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
          Je hebt nog geen klanten. Pak een lead op in de <a href={leadsPad} style={{ color: KLEUR.amber.tekst, fontWeight: 700 }}>leadlijst</a> en maak een preview.
        </div>
      )}

      {/* Ook bij maar één preview tonen zodra er één op Klaar staat: die is
          onder Alle verborgen en alleen via de knop Klaar terug te vinden. */}
      {(actief.length > 1 || afgewezen.length > 0 || actief.some((r) => normFase(r.pipeline_status) === "Klaar")) && <KlantenZoek />}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
        {actief.map((r) => {
          let review = {};
          try { review = r.internal_notes ? JSON.parse(r.internal_notes) : {}; } catch {}
          const reactieOp = r.laatste_feedback_op
            ? new Date(r.laatste_feedback_op).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })
            : null;
          const zoektekst = [r.company_name, r.slug, r.lead_phone, r.lead_email, r.b_adres, r.verzamelaar, review.bron, r.provincie]
            .filter(Boolean).join(" ").toLowerCase();
          const fase = normFase(r.pipeline_status);
          return (
          <div key={r.slug} style={card} data-klant={zoektekst} data-fase={fase} data-betaal={r.betaal_status || "geen"} data-reactie={r.laatste_feedback_op ? "ja" : "nee"}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontFamily: HEAD, fontSize: 17, fontWeight: 700 }}>{r.company_name || r.slug}</div>
                <div style={{ fontSize: 13, color: "#4A5560" }}>{[r.lead_phone, r.lead_email].filter(Boolean).join(" · ") || "—"}</div>
                {r.b_adres && r.b_adres.trim() && <div style={{ fontSize: 13, color: "#4A5560", marginTop: 1 }}>{r.b_adres.trim()}</div>}
                {beheer && review.bron && <div style={{ fontSize: 12, color: "#6F7A85", marginTop: 2 }}>Via: {review.bron}</div>}
                {!beheer && r.verzamelaar && r.verzamelaar !== naam && <div style={{ fontSize: 12, color: "#6F7A85", marginTop: 2 }}>Gemaakt door {r.verzamelaar}</div>}
                {benaderdDoor[r.slug] && <div style={{ fontSize: 12, color: "#6F7A85", marginTop: 2 }}>Benaderd door {benaderdDoor[r.slug]}</div>}
                {review.kleur_bron && (
                  <div
                    title={review.kleur_bron === "gegokt" ? "Geen logo of website gevonden: kleuren zijn afgeleid uit de branche. Even nakijken." : "Kleuren overgenomen uit: " + review.kleur_bron}
                    style={{ display: "inline-block", marginTop: 6, marginRight: 6, fontSize: 12, fontWeight: 700, padding: "2px 9px", borderRadius: 999,
                      color: review.kleur_bron === "gegokt" ? "#854f0b" : "#0f6e56", background: review.kleur_bron === "gegokt" ? "#fdf1dc" : "#e7f3ea" }}>
                    {review.kleur_bron === "gegokt" ? "Kleuren geschat, check huisstijl" : "✓ Kleuren uit " + review.kleur_bron.replace("+", " + ")}
                  </div>
                )}
                {beheer && review.website && <div><HuisstijlKnop slug={r.slug} compact /></div>}
                {review.logo_toestemming && (
                  <div style={{ display: "inline-block", marginTop: 6, fontSize: 12, fontWeight: 700, color: "#0f6e56", background: "#e7f3ea", padding: "2px 9px", borderRadius: 999 }}>
                    ✓ Logo mag op onze site
                  </div>
                )}
                {/* Wat de klant na akkoord op de gegevenspagina invulde. */}
                {beheer && review.gegevens_aangevuld_op && (
                  <div style={{ fontSize: 12, color: "#4A5560", marginTop: 6, lineHeight: 1.5, wordBreak: "break-word" }}>
                    <strong>Gegevens na akkoord:</strong>{" "}
                    {[
                      review.adres && "Adres: " + review.adres,
                      review.kvk && "KvK " + review.kvk,
                      review.btw && "BTW " + review.btw,
                      review.socials && "Socials: " + review.socials,
                      review.google_url && "Google: " + review.google_url,
                    ].filter(Boolean).join(" · ") || "niets ingevuld"}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                {beheer ? (
                  <>
                    <span style={{ fontSize: 12, fontWeight: 700, color: r.gepubliceerd ? "#0f6e56" : "#6F7A85", whiteSpace: "nowrap" }}>
                      {r.gepubliceerd ? "● Online" : "○ Offline"}
                    </span>
                    <PublishToggle slug={r.slug} gepubliceerd={r.gepubliceerd} />
                  </>
                ) : (
                  <span style={{ fontSize: 12, fontWeight: 700, color: r.gepubliceerd ? "#0f6e56" : "#6F7A85", whiteSpace: "nowrap" }}>
                    {r.gepubliceerd ? "Online" : "Offline"}
                  </span>
                )}
                <BenaderdKnop slug={r.slug} benaderdOp={benaderdPerSlug[r.slug] || null} />
                <GeenInteresseKnop slug={r.slug} bedrijf={r.company_name} huidige={r.pipeline_status} />
                <div style={{ flexBasis: "100%", display: "flex", justifyContent: "flex-end" }}>
                  <ProspectActiviteit p={proefPerSlug[r.slug]} a={aanvraagPerSlug[r.slug]} />
                </div>
              </div>
            </div>

            <FaseStepper slug={r.slug} huidige={r.pipeline_status} bedrijf={r.company_name} magKlaar={beheer} />
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 16px", alignItems: "center" }}>
              <BetaalBadge status={r.betaal_status} />
              {r.klant_stijl && (
                <span
                  title="De klant heeft op zijn preview zelf deze stijl gekozen. Hij mag nog wisselen."
                  style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5, fontWeight: 700, color: "#5B3A9E", background: "#F1ECFB", padding: "2px 10px", borderRadius: 999 }}
                >
                  ★ Klant koos stijl: {stijlKort(r.klant_stijl)}
                  {r.klant_stijl_op && <span style={{ fontWeight: 500 }}>({new Date(r.klant_stijl_op).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })})</span>}
                </span>
              )}
              {reactieOp && (
                <span style={{ fontSize: 12.5, fontWeight: 600, color: "#9E3B2E" }}>
                  ● Klant reageerde ({REACTIE_LABEL[r.laatste_feedback_type] || r.laatste_feedback_type || "reactie"}) op {reactieOp}
                </span>
              )}
            </div>

            <LinkChips slug={r.slug} gepubliceerd={r.gepubliceerd} heeftDemo={r.heeft_demo} demoGevuld={r.demo_gevuld} magMaken={beheer} stijl={r.stijl} bedrijf={r.company_name} website={review.website} />
            <ProefStatus proef={proefPerSlug[r.slug]} magVerlengen={magVerlengen} />

            {/* Na akkoord: vervolgstappen en berichten voor de klant. Tot Klaar. */}
            {fase !== "Klaar" && (fase === "Akkoord" || ["akkoord", "actief"].includes(String(r.betaal_status || ""))) && (
              <NaAkkoord
                slug={r.slug}
                bedrijf={r.company_name}
                contact={r.contactpersoon}
                email={r.lead_email}
                telefoon={r.lead_phone}
                website={review.website}
                verkoper={naam}
                betaalStatus={r.betaal_status}
                gegevensIngevuld={!!review.gegevens_aangevuld_op}
                beheer={beheer}
                rondes={(rondeLijst || []).filter((f) => f.slug === r.slug)}
              />
            )}

            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
              <Contactpersoon slug={r.slug} value={r.contactpersoon} />
            </div>

            {beheer && (
              <div style={{ borderTop: `1px solid ${KLEUR.baan}`, paddingTop: 12, display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
                <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.5, color: KLEUR.gedempt }}>
                  Beheer
                </div>
                <KlantNaam slug={r.slug} value={r.verzamelaar} team={teamleden} />
                <ProvincieKeuze slug={r.slug} value={r.provincie} handmatig={r.provincie_handmatig} />
                {!r.verzamelaar && r.source_doc === "website" && (
                  <span
                    title="Deze preview is aangevraagd via het formulier op studiobaris.nl, niet gemaakt door iemand van het team"
                    style={{
                      fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 999,
                      background: "#FBF8F2", border: "1px solid #E3DED3", color: "#4A5560", whiteSpace: "nowrap",
                    }}
                  >
                    Via website
                  </span>
                )}
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
            <h2 style={{ fontFamily: HEAD, fontSize: 16, margin: 0, fontWeight: 800, color: "#6F7A85" }}>Geen interesse</h2>
            <span style={{ fontSize: 13, color: "#6F7A85" }}>{afgewezen.length} gearchiveerd &mdash; hier terug te zetten</span>
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {afgewezen.map((r) => {
              const zoektekst = [r.company_name, r.slug, r.lead_phone, r.lead_email, r.verzamelaar]
                .filter(Boolean).join(" ").toLowerCase();
              return (
              <div key={r.slug} data-klant={zoektekst} data-fase="archief" style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", background: "#fff", border: `1px solid ${KLEUR.lijn}`, borderRadius: 10, padding: "10px 12px", opacity: 0.9 }}>
                <div style={{ flex: "1 1 200px", minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14.5 }}>{r.company_name || r.slug}</div>
                  <div style={{ fontSize: 12.5, color: "#6F7A85" }}>{[r.lead_phone, r.lead_email].filter(Boolean).join(" · ") || "—"}</div>
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
