import Link from "next/link";
import { notFound } from "next/navigation";
import { leesSessie, isBeheer } from "../../../lib/auth";
import { getTeam, getActiviteitVoorSlug } from "../../../lib/server-data";
import WerkplekShell from "../../werkplek-shell";
import { KLEUR, HEAD, redenKleur } from "../../werkplek-stijl";
import { KlantNaam } from "../../dashboard/dashboard-actions";
import { KlantDetailActies } from "../klant-rij";
import { laadRegister, STATUS_LABEL, SECTOR_LABEL, PAKKET_LABEL, INACTIEF_DAGEN } from "../../../lib/klantenregister";

export const dynamic = "force-dynamic";

// Eén klant, alles op één scherm: status en signalen, gegevens, abonnement en
// facturen, website/plugin, app-gebruik en recente activiteit. Onderaan de
// bekende bewerk- en actieblokken uit het register.

const kaart = { background: KLEUR.kaart, border: `1px solid ${KLEUR.lijn}`, borderRadius: 14, padding: "14px 16px" };
const kop = { fontFamily: HEAD, fontSize: 14, fontWeight: 800, marginBottom: 8 };
const label = { color: KLEUR.label, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 };

const MAANDEN = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
function datum(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.getDate()} ${MAANDEN[d.getMonth()]} ${d.getFullYear()}`;
}
function euro(n) {
  return "€ " + Number(n || 0).toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function Veld({ l, children }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={label}>{l}</div>
      <div style={{ fontSize: 13.5, overflowWrap: "anywhere" }}>{children || "—"}</div>
    </div>
  );
}

const ERNST_KLEUR = { hoog: "rust", midden: "amber", laag: "grijs" };
const FACTUUR_KLEUR = { betaald: "sage", verstuurd: "amber", geannuleerd: "grijs" };

export default async function KlantDetail({ params }) {
  const sessie = leesSessie();
  const naam = sessie && sessie.naam ? sessie.naam : "collega";
  const beheer = isBeheer(sessie);

  const [{ rijen }, team, activiteit] = await Promise.all([
    laadRegister(),
    getTeam(),
    getActiviteitVoorSlug(params.slug, 12),
  ]);
  const r = rijen.find((x) => x.slug === params.slug);
  if (!r) notFound();

  const t = r.techniek;
  const openstaand = r.facturen.filter((f) => f.status === "verstuurd").reduce((s, f) => s + (Number(f.bedrag_incl) || 0), 0);
  // Alleen de oorspronkelijke registervelden naar de client-componenten.
  const { techniek, facturen, site, gebruik, signalen, ernst, app, ...basis } = r;

  return (
    <WerkplekShell
      naam={naam}
      beheer={beheer}
      actief="/klantenregister"
      titel={`${r.klantnummer ? r.klantnummer + " · " : ""}${r.company_name || r.slug}`}
      sub={`${STATUS_LABEL[r.status]} · ${SECTOR_LABEL[r.sector] || r.sector || "sector onbekend"} · ${PAKKET_LABEL[r.pakket_type] || "pakket onbekend"}`}
      rechts={<Link href="/klantenregister" style={{ color: KLEUR.klei, fontWeight: 700, fontSize: 13.5, textDecoration: "none" }}>← Klantenregister</Link>}
    >
      {/* Signalen */}
      <div style={{ ...kaart, marginBottom: 14, background: signalen.length ? KLEUR.kaart : KLEUR.sage.bg }}>
        {signalen.length === 0 ? (
          <div style={{ fontWeight: 700, color: KLEUR.sage.tekst }}>✓ Alles in orde bij deze klant</div>
        ) : (
          <>
            <div style={kop}>Aandacht nodig</div>
            <div style={{ display: "grid", gap: 6 }}>
              {signalen.map((s) => {
                const k = redenKleur(ERNST_KLEUR[s.ernst]);
                return (
                  <div key={s.code} style={{ display: "flex", gap: 8, alignItems: "center", padding: "6px 10px", borderRadius: 8, background: k.bg, color: k.tekst, fontSize: 13.5, fontWeight: 600 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 999, background: k.dot }} />
                    {s.tekst}
                    <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>{s.ernst}</span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", marginBottom: 14 }}>
        {/* Gegevens */}
        <div style={kaart}>
          <div style={kop}>Gegevens</div>
          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" }}>
            <Veld l="Contactpersoon">{r.contactpersoon}</Veld>
            <Veld l="Telefoon">{r.lead_phone || r.b_telefoon}</Veld>
            <Veld l="E-mail">{r.lead_email || r.b_email}</Veld>
            <Veld l="Factuur-e-mail">{r.factuur_email}</Veld>
            <Veld l="Adres">{r.b_adres}</Veld>
            <Veld l="Provincie">{r.provincie}</Veld>
            <Veld l="KvK">{r.b_kvk}</Veld>
            <Veld l="BTW">{r.b_btw}</Veld>
            <div style={{ gridColumn: "1 / -1" }}>
              <div style={label}>Verkoper</div>
              <KlantNaam slug={r.slug} value={r.verzamelaar} team={team} />
            </div>
          </div>
        </div>

        {/* Abonnement & facturen */}
        <div style={kaart}>
          <div style={kop}>Abonnement en facturen</div>
          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr", marginBottom: 10 }}>
            <Veld l="Maandbedrag">{r.maandbedrag ? euro(r.maandbedrag) + " excl." : null}</Veld>
            <Veld l="Websiteprijs">{r.websiteprijs ? euro(r.websiteprijs) : null}</Veld>
            <Veld l="Abonnement">{r.betaal_status === "actief" ? "Actief" : r.betaal_status || "Geen"}{r.betaalwijze ? ` · ${r.betaalwijze}` : ""}</Veld>
            <Veld l="Openstaand">{openstaand ? euro(openstaand) + " incl." : "Niets"}</Veld>
          </div>
          {facturen.length === 0 ? (
            <div style={{ fontSize: 13, color: KLEUR.label }}>Nog geen facturen.</div>
          ) : (
            <div style={{ display: "grid", gap: 4 }}>
              {facturen.slice(0, 6).map((f) => {
                const k = redenKleur(FACTUUR_KLEUR[f.status] || "grijs");
                return (
                  <div key={f.nummer} style={{ display: "flex", gap: 8, fontSize: 13, alignItems: "center" }}>
                    <span style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{f.nummer}</span>
                    <span style={{ color: KLEUR.label }}>{datum(f.factuurdatum)}</span>
                    <span style={{ marginLeft: "auto" }}>{euro(f.bedrag_incl)}</span>
                    <span style={{ fontSize: 11.5, fontWeight: 600, padding: "1px 7px", borderRadius: 999, background: k.bg, color: k.tekst }}>{f.status}</span>
                  </div>
                );
              })}
              <Link href={`/facturen?klant=${encodeURIComponent(r.slug)}`} style={{ fontSize: 12.5, color: KLEUR.klei, fontWeight: 700, textDecoration: "none", marginTop: 4 }}>
                Alle {facturen.length} facturen →
              </Link>
            </div>
          )}
        </div>

        {/* Website & plugin */}
        <div style={kaart}>
          <div style={kop}>Website en plugin</div>
          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" }}>
            <Veld l="Domein">{r.domein ? <a href={`https://${r.domein}`} target="_blank" rel="noreferrer" style={{ color: KLEUR.klei }}>{r.domein} ↗</a> : null}</Veld>
            <Veld l="Bereikbaarheid">
              {site ? `${site.status === "up" ? "Online" : site.status}${site.laatst_gecheckt ? ` · ${datum(site.laatst_gecheckt)}` : ""}` : "Niet in monitoring"}
            </Veld>
            <Veld l="Plugin">{t && t.plugin_versie ? `v${t.plugin_versie}` : null}</Veld>
            <Veld l="Plugin laatst gezien">{t ? datum(t.plugin_gezien_op) : null}</Veld>
            {t && (t.site_ververs_fout || t.plugin_bijwerk_fout) && (
              <div style={{ gridColumn: "1 / -1", fontSize: 12.5, color: KLEUR.rust.tekst }}>
                {t.site_ververs_fout || t.plugin_bijwerk_fout}
              </div>
            )}
          </div>
        </div>

        {/* App-gebruik */}
        <div style={kaart}>
          <div style={kop}>App-gebruik</div>
          {!t ? (
            <div style={{ fontSize: 13, color: KLEUR.label }}>Geen app-account gekoppeld.</div>
          ) : (
            <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" }}>
              <Veld l="Projecten">{String(gebruik.projecten)}</Veld>
              <Veld l="Reviews">{String(gebruik.reviews)}</Veld>
              <Veld l="Laatst iets toegevoegd">{datum(gebruik.laatst)}</Veld>
              <Veld l="App-link gebruikt">{t.login_token_used_at ? datum(t.login_token_used_at) : "Nog niet"}</Veld>
              <div style={{ gridColumn: "1 / -1", fontSize: 11.5, color: KLEUR.label }}>
                Signaal "inactief" na {INACTIEF_DAGEN} dagen zonder nieuw project of nieuwe review.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Activiteit */}
      <div style={{ ...kaart, marginBottom: 14 }}>
        <div style={kop}>Recente activiteit</div>
        {activiteit.length === 0 ? (
          <div style={{ fontSize: 13, color: KLEUR.label }}>Nog geen activiteit vastgelegd.</div>
        ) : (
          <div style={{ display: "grid", gap: 4 }}>
            {activiteit.map((a, i) => (
              <div key={i} style={{ display: "flex", gap: 10, fontSize: 13, flexWrap: "wrap" }}>
                <span style={{ color: KLEUR.label, minWidth: 92 }}>{datum(a.moment)}</span>
                <span style={{ fontWeight: 600 }}>{a.persoon || "—"}</span>
                <span>{a.soort}{a.van || a.naar ? `: ${a.van || "—"} → ${a.naar || "—"}` : ""}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bewerken en acties (zelfde als voorheen in de uitklaprij) */}
      <div style={kaart}>
        <div style={kop}>Bewerken en acties</div>
        <KlantDetailActies r={basis} variant={r.status} app={app} />
      </div>
    </WerkplekShell>
  );
}
