import { getOverview, getMijnLeads, getTeamLogin } from "../../lib/server-data";
import { leesSessie, isBeheer } from "../../lib/auth";
import PublishButton, {
  FaseStepper, Contactpersoon, AppjeKnop, LinkChips, VerkoopBedrag, AppLinkKnop,
  GeenInteresseKnop, TerugNaarActiefKnop,
  PersoonlijkeZin, PublishToggle,
  // Beheerfuncties die eerst alleen op de oude /dashboard stonden. Die pagina
  // is samengevoegd met deze; zonder deze regel zou o.a. de akkoordlink - en
  // daarmee de hele betaalflow - onbereikbaar worden.
  GegevensEditor, InzendingenKnop, KlantNaam,
  VerwijderKnop, NieuweKlantKnop, MarkeerAlsKlantKnop,
} from "../dashboard/dashboard-actions";
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
  // Klantenregister: alleen wie al echt klant is (klantnummer toegekend).
  const klantenMetNummer = rows
    .filter((r) => r.klantnummer)
    .sort((a, b) => Number(a.klantnummer) - Number(b.klantnummer));

  return (
    <WerkplekShell
      naam={naam || "collega"}
      beheer={beheer}
      actief="/klanten"
      titel={beheer ? "Alle previews" : "Mijn previews"}
      sub="Hier haal je de sale binnen: vul de gegevens in, verstuur het appje, en zet de fase op Akkoord zodra hij ja zegt."
    >
      <DocumentenKaart beheer={beheer} model={mijnModel} />

      {beheer && (
        <div style={{ ...card, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <div>
              <h2 style={{ fontFamily: HEAD, fontSize: 16, margin: 0, fontWeight: 800 }}>Klantenregister</h2>
              <div style={{ fontSize: 13, color: "#9A9084" }}>Alle klanten met een klantnummer, op volgorde</div>
            </div>
            <NieuweKlantKnop />
          </div>
          {klantenMetNummer.length === 0 ? (
            <div style={{ fontSize: 13.5, color: "#9A9084" }}>Nog geen klanten met een klantnummer.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
                <thead>
                  <tr style={{ textAlign: "left", color: "#9A9084", fontSize: 11.5, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    <th style={{ padding: "6px 10px 6px 0" }}>Nr.</th>
                    <th style={{ padding: "6px 10px" }}>Bedrijf</th>
                    <th style={{ padding: "6px 10px" }}>Contactpersoon</th>
                    <th style={{ padding: "6px 10px" }}>E-mail</th>
                    <th style={{ padding: "6px 10px" }}>Pakket</th>
                    <th style={{ padding: "6px 10px" }}>Maandbedrag</th>
                  </tr>
                </thead>
                <tbody>
                  {klantenMetNummer.map((r) => (
                    <tr key={r.slug} style={{ borderTop: `1px solid ${KLEUR.baan}` }}>
                      <td style={{ padding: "8px 10px 8px 0", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{r.klantnummer}</td>
                      <td style={{ padding: "8px 10px" }}>
                        <a href={`/facturen?klant=${encodeURIComponent(r.slug)}`} style={{ color: KLEUR.klei, fontWeight: 700, textDecoration: "none" }}>{r.company_name || r.slug}</a>
                      </td>
                      <td style={{ padding: "8px 10px" }}>{r.contactpersoon || "—"}</td>
                      <td style={{ padding: "8px 10px" }}>{r.lead_email || r.b_email || "—"}</td>
                      <td style={{ padding: "8px 10px" }}>{r.pakket_type === "plugin" ? "Alleen plugin" : r.pakket_type === "vol" ? "Vol pakket" : "—"}</td>
                      <td style={{ padding: "8px 10px" }}>{r.maandbedrag ? `€ ${Number(r.maandbedrag).toFixed(2).replace(".", ",")} p/m` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

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

      {actief.length > 1 && <KlantenZoek />}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
        {actief.map((r) => {
          let review = {};
          try { review = r.internal_notes ? JSON.parse(r.internal_notes) : {}; } catch {}
          const reactieOp = r.laatste_feedback_op
            ? new Date(r.laatste_feedback_op).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })
            : null;
          const zoektekst = [r.company_name, r.slug, r.lead_phone, r.lead_email, r.verzamelaar, review.bron]
            .filter(Boolean).join(" ").toLowerCase();
          return (
          <div key={r.slug} style={card} data-klant={zoektekst} data-betaal={r.betaal_status || "geen"} data-reactie={r.laatste_feedback_op ? "ja" : "nee"}>
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

            {beheer && (
              <div style={{ borderTop: `1px solid ${KLEUR.baan}`, paddingTop: 12, display: "grid", gap: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.5, color: KLEUR.gedempt }}>
                  Beheer
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
                  <InzendingenKnop slug={r.slug} />
                  {/* Prijs, betaalwijze, akkoordlink en facturen staan sinds
                      kort allemaal onder Abonnementen. Twee plekken voor
                      hetzelfde bedrag ging een keer mis, dus het staat hier
                      alleen nog als verwijzing. */}
                  <a
                    href="/abonnementen"
                    style={{ fontSize: 13, color: KLEUR.klei, fontWeight: 700, textDecoration: "none" }}
                  >
                    {r.maandbedrag ? `€ ${Number(r.maandbedrag).toFixed(2).replace(".", ",")} p/m` : "Nog geen maandbedrag"} — regel het bij Abonnementen →
                  </a>
                  <a
                    href={`/facturen?klant=${encodeURIComponent(r.slug)}`}
                    style={{ fontSize: 13, color: KLEUR.klei, fontWeight: 700, textDecoration: "none" }}
                  >
                    Facturen bekijken →
                  </a>
                  {r.klantnummer ? (
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: "#0f6e56", background: "#e7f3ea", padding: "4px 10px", borderRadius: 999 }}>
                      Klantnr. {r.klantnummer}
                    </span>
                  ) : (
                    <MarkeerAlsKlantKnop slug={r.slug} bedrijf={r.company_name} />
                  )}
                  <div style={{ marginLeft: "auto" }}><VerwijderKnop slug={r.slug} naam={r.company_name} /></div>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
                  <KlantNaam slug={r.slug} value={r.verzamelaar} />
                  <GegevensEditor slug={r.slug} data={r} />
                  {r.heeft_concept && (
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <a href={`/${r.slug}?concept=1`} target="_blank" rel="noreferrer" style={{ color: KLEUR.klei, fontSize: 13 }}>Bekijk concept</a>
                      <PublishButton slug={r.slug} />
                    </div>
                  )}
                </div>
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
            {afgewezen.map((r) => (
              <div key={r.slug} style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", background: "#fff", border: `1px solid ${KLEUR.lijn}`, borderRadius: 10, padding: "10px 12px", opacity: 0.9 }}>
                <div style={{ flex: "1 1 200px", minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14.5 }}>{r.company_name || r.slug}</div>
                  <div style={{ fontSize: 12.5, color: "#9A9084" }}>{[r.lead_phone, r.lead_email].filter(Boolean).join(" · ") || "—"}</div>
                </div>
                <TerugNaarActiefKnop slug={r.slug} bedrijf={r.company_name} />
              </div>
            ))}
          </div>
        </div>
      )}
    </WerkplekShell>
  );
}
