import Link from "next/link";
import { leesSessie, isBeheer } from "../../lib/auth";
import WerkplekShell from "../werkplek-shell";
import { KLEUR, HEAD, redenKleur } from "../werkplek-stijl";
import { NieuweKlantKnop } from "../dashboard/dashboard-actions";
import FilterBalk from "./filter-balk";
import {
  laadRegister, tellers, leesFilters, filterEnPagineer, tabelRij, keuzes,
  STATUS_LABEL, SECTOR_LABEL, PAKKET_LABEL, PER_PAGINA,
} from "../../lib/klantenregister";

export const dynamic = "force-dynamic";

// Klantenregister, gebouwd voor 1000+ klanten:
// - tellers bovenaan (klikbaar = filter)
// - "Aandacht nodig": alleen de uitzonderingen, zodat je niet hoeft te zoeken
// - zoeken + filters in de URL, sorteren, 50 per pagina (server-side)
// - klik op een klant → eigen detailpagina met alles op één scherm
// Status blijft zoals het was: klant (klantnummer), toekomstig (kandidaat,
// nog geen nummer), oud-klant. Activeren gebeurt nooit automatisch.

const kaart = { background: KLEUR.kaart, border: `1px solid ${KLEUR.lijn}`, borderRadius: 14 };
const th = {
  textAlign: "left", fontSize: 11, letterSpacing: 1, textTransform: "uppercase",
  color: KLEUR.label, fontWeight: 700, padding: "10px 12px",
  background: KLEUR.baan, borderBottom: `1px solid ${KLEUR.baanRand}`, whiteSpace: "nowrap",
};
const td = { padding: "9px 12px", fontSize: 13.5, verticalAlign: "top" };

function euro(n, dec = 2) {
  return "€ " + Number(n || 0).toLocaleString("nl-NL", { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

const ERNST_KLEUR = { hoog: "rust", midden: "amber", laag: "grijs" };

function SignaalPil({ s }) {
  const k = redenKleur(ERNST_KLEUR[s.ernst]);
  return (
    <span title={s.tekst} style={{
      display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 600,
      padding: "2px 8px", borderRadius: 999, background: k.bg, color: k.tekst, whiteSpace: "nowrap",
      maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis",
    }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: k.dot, flex: "0 0 auto" }} />
      {s.tekst}
    </span>
  );
}

function url(f, extra = {}) {
  const p = new URLSearchParams();
  const alles = { ...f, ...extra };
  for (const [k, v] of Object.entries(alles)) {
    if (k === "pagina" && Number(v) === 1) continue;
    if (k === "status" && v === "klant") continue;
    if (k === "sort" && v === "nummer") continue;
    if (v) p.set(k, String(v));
  }
  const s = p.toString();
  return "/klantenregister" + (s ? "?" + s : "");
}

function Teller({ label, waarde, sub, href, kleur }) {
  const inhoud = (
    <div style={{ ...kaart, padding: "12px 14px", minWidth: 150, flex: "1 1 150px", height: "100%" }}>
      <div style={{ fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: KLEUR.label, fontWeight: 700 }}>{label}</div>
      <div style={{ fontFamily: HEAD, fontSize: 24, fontWeight: 800, color: kleur || KLEUR.inkt, marginTop: 2 }}>{waarde}</div>
      {sub && <div style={{ fontSize: 12, color: KLEUR.label }}>{sub}</div>}
    </div>
  );
  return href ? <Link href={href} style={{ textDecoration: "none", color: "inherit", flex: "1 1 150px", display: "flex" }}>{inhoud}</Link> : inhoud;
}

export default async function KlantenregisterPage({ searchParams }) {
  const sessie = leesSessie();
  const naam = sessie && sessie.naam ? sessie.naam : "collega";
  const beheer = isBeheer(sessie);

  const f = leesFilters(searchParams || {});
  const { rijen, kandidaten } = await laadRegister();
  const t = tellers(rijen);
  const k = keuzes(rijen);
  const res = filterEnPagineer(rijen, f);
  const pagina = res.rijen.map(tabelRij);

  const filtersLeeg = !f.q && !f.sector && !f.pakket && !f.provincie && !f.verkoper && !f.signaal && f.status === "klant";
  const aandacht = rijen
    .filter((r) => r.status === "klant" && r.ernst >= 2)
    .sort((a, b) => b.ernst - a.ernst || b.signalen.length - a.signalen.length)
    .slice(0, 6);

  const tabs = [
    ["klant", `Actief (${t.klant})`],
    ["toekomstig", `Toekomstig (${t.toekomstig})`],
    ["oud", `Oud-klanten (${t.oud})`],
    ["alle", `Alle (${t.klant + t.toekomstig + t.oud})`],
  ];

  return (
    <WerkplekShell
      naam={naam}
      beheer={beheer}
      actief="/klantenregister"
      titel="Klantenregister"
      sub="Zoek, filter en klik door naar een klant voor het volledige plaatje. Activeren (een klantnummer geven) doe je zelf, met 'Markeer als klant'."
      rechts={<NieuweKlantKnop kandidaten={kandidaten} />}
    >
      {/* Tellers */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        <Teller label="Actieve klanten" waarde={t.klant} href={url({}, { status: "klant" })} sub={t.toekomstig ? `+ ${t.toekomstig} toekomstig` : null} />
        <Teller label="Maandomzet" waarde={euro(t.mrr, 0)} sub="excl. btw, actieve klanten" />
        <Teller label="Aandacht nodig" waarde={t.aandacht} href={url({}, { signaal: "aandacht", sort: "aandacht" })} kleur={t.aandacht ? KLEUR.amber.tekst : null} sub="hoog of midden" />
        <Teller label="Betaling" waarde={t.betaalprobleem} href={url({}, { signaal: "betaal" })} kleur={t.betaalprobleem ? KLEUR.rust.tekst : null} sub="abonnement of te late factuur" />
        <Teller label="Website" waarde={t.site} href={url({}, { signaal: "website" })} kleur={t.site ? KLEUR.rust.tekst : null} sub="onbereikbaar of fout" />
      </div>

      {/* Aandacht nodig */}
      {filtersLeeg && aandacht.length > 0 && (
        <div style={{ ...kaart, padding: "14px 16px", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 8 }}>
            <div style={{ fontFamily: HEAD, fontSize: 15, fontWeight: 800 }}>Aandacht nodig</div>
            {t.aandacht > aandacht.length && (
              <Link href={url({}, { signaal: "aandacht", sort: "aandacht" })} style={{ fontSize: 12.5, color: KLEUR.klei, fontWeight: 700, textDecoration: "none" }}>
                Alle {t.aandacht} bekijken →
              </Link>
            )}
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            {aandacht.map((r) => (
              <Link key={r.slug} href={`/klantenregister/${r.slug}`} style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", textDecoration: "none", color: "inherit", padding: "6px 8px", borderRadius: 8, background: KLEUR.papier }}>
                <span style={{ fontWeight: 700, minWidth: 160 }}>{r.klantnummer ? `${r.klantnummer} · ` : ""}{r.company_name || r.slug}</span>
                <span style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {r.signalen.filter((s) => s.ernst !== "laag").map((s) => <SignaalPil key={s.code} s={s} />)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Lijst */}
      <div style={{ ...kaart, padding: "14px 16px" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
          {tabs.map(([s, l]) => (
            <Link key={s} href={url({ ...f, pagina: 1 }, { status: s })} style={chip(f.status === s)}>{l}</Link>
          ))}
        </div>

        <FilterBalk keuzes={k} sectorLabel={SECTOR_LABEL} />

        <div style={{ fontSize: 12.5, color: KLEUR.label, marginBottom: 8 }}>
          {res.totaal === 0 ? "Geen klanten gevonden met deze filters." :
            `${res.totaal} gevonden · ${(res.pagina - 1) * PER_PAGINA + 1}–${Math.min(res.pagina * PER_PAGINA, res.totaal)}`}
        </div>

        {res.totaal > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 900 }}>
              <thead>
                <tr>
                  <th style={th}>Nr.</th>
                  <th style={th}>Bedrijf</th>
                  <th style={th}>Contact</th>
                  <th style={th}>Sector · pakket</th>
                  <th style={th}>Provincie</th>
                  <th style={th}>Verkoper</th>
                  <th style={{ ...th, textAlign: "right" }}>P/m</th>
                  <th style={th}>Signalen</th>
                </tr>
              </thead>
              <tbody>
                {pagina.map((r) => {
                  const link = `/klantenregister/${r.slug}`;
                  const cel = (inhoud, extra = {}) => (
                    <td style={{ ...td, ...extra }}>
                      <Link href={link} style={{ color: "inherit", textDecoration: "none", display: "block" }}>{inhoud}</Link>
                    </td>
                  );
                  return (
                    <tr key={r.slug} style={{ borderTop: `1px solid ${KLEUR.baanRand}` }}>
                      {cel(r.klantnummer || "—", { fontWeight: 700, fontVariantNumeric: "tabular-nums" })}
                      {cel(
                        <>
                          <div style={{ fontWeight: 700 }}>{r.naam}</div>
                          {f.status === "alle" && <div style={{ fontSize: 11.5, color: KLEUR.label }}>{STATUS_LABEL[r.status]}</div>}
                        </>
                      )}
                      {cel(
                        <>
                          <div>{r.contactpersoon || "—"}</div>
                          <div style={{ fontSize: 12, color: KLEUR.label }}>{r.telefoon || ""}{r.telefoon && r.email ? " · " : ""}{r.email || ""}</div>
                        </>
                      )}
                      {cel(`${SECTOR_LABEL[r.sector] || r.sector || "—"} · ${PAKKET_LABEL[r.pakket] || "—"}`, { whiteSpace: "nowrap" })}
                      {cel(r.provincie || "—")}
                      {cel(r.verkoper || <span style={{ color: KLEUR.label }}>—</span>)}
                      {cel(r.maandbedrag ? euro(r.maandbedrag) : "—", { textAlign: "right", whiteSpace: "nowrap" })}
                      {cel(
                        r.signalen.length === 0
                          ? <span style={{ fontSize: 12, color: KLEUR.sage.tekst, fontWeight: 600 }}>✓ In orde</span>
                          : <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                              {r.signalen.slice(0, 2).map((s) => <SignaalPil key={s.code} s={s} />)}
                              {r.signalen.length > 2 && <span style={{ fontSize: 11.5, color: KLEUR.label }}>+{r.signalen.length - 2}</span>}
                            </div>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {res.paginas > 1 && (
          <div style={{ display: "flex", gap: 6, alignItems: "center", justifyContent: "center", marginTop: 14, flexWrap: "wrap" }}>
            {res.pagina > 1 && <Link href={url(f, { pagina: res.pagina - 1 })} style={chip(false)}>← Vorige</Link>}
            <span style={{ fontSize: 13, color: KLEUR.label, padding: "0 6px" }}>Pagina {res.pagina} van {res.paginas}</span>
            {res.pagina < res.paginas && <Link href={url(f, { pagina: res.pagina + 1 })} style={chip(false)}>Volgende →</Link>}
          </div>
        )}
      </div>
    </WerkplekShell>
  );
}

function chip(aan) {
  return {
    padding: "7px 12px", borderRadius: 999, fontSize: 13, fontWeight: aan ? 700 : 600,
    textDecoration: "none", whiteSpace: "nowrap",
    border: `1px solid ${aan ? KLEUR.klei : KLEUR.lijn}`,
    background: aan ? KLEUR.klei : "#fff", color: aan ? "#fff" : "#4A5560",
  };
}
