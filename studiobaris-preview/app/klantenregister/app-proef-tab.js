import Link from "next/link";
import { KLEUR, HEAD } from "../werkplek-stijl";
import {
  getProeven, getInstelling, controleFaseB, proefStatus, dagenOver, conversie,
} from "../../lib/app-proef";
import { AppProefFilters, Schakelaar, ProefActies } from "./app-proef-acties";

// Tabblad "App-proef" in het Klantenregister (alleen beheer).
// Bron: app-accounts met een proefperiode (sb_app_proef_lijst). Telt NIET mee
// in Actief/Toekomstig/Alle; wie betaalt staat daarnaast gewoon onder Actief.

const kaart = { background: KLEUR.kaart, border: `1px solid ${KLEUR.lijn}`, borderRadius: 14 };
const th = {
  textAlign: "left", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: KLEUR.label,
  fontWeight: 700, padding: "10px 12px", background: KLEUR.baan, borderBottom: `1px solid ${KLEUR.baanRand}`, whiteSpace: "nowrap",
};
const td = { padding: "9px 12px", fontSize: 13.5, verticalAlign: "top" };
const STATUS = {
  loopt: { label: "Loopt", k: KLEUR.amber },
  verlopen: { label: "Verlopen", k: KLEUR.rust },
  pro: { label: "Naar Pro", k: KLEUR.sage },
};

function Pil({ k, children }) {
  return <span style={{ fontSize: 11.5, fontWeight: 700, padding: "2px 9px", borderRadius: 999, background: k.bg, color: k.tekst, whiteSpace: "nowrap" }}>{children}</span>;
}

function Kpi({ label, waarde, sub, kleur }) {
  return (
    <div style={{ ...kaart, padding: "12px 14px", flex: "1 1 130px", background: kleur ? kleur.bg : KLEUR.kaart }}>
      <div style={{ fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: kleur ? kleur.tekst : KLEUR.label, fontWeight: 700 }}>{label}</div>
      <div style={{ fontFamily: HEAD, fontSize: 24, fontWeight: 800, color: kleur ? kleur.tekst : KLEUR.inkt }}>{waarde}</div>
      {sub && <div style={{ fontSize: 12, color: kleur ? kleur.tekst : KLEUR.label }}>{sub}</div>}
    </div>
  );
}

function datum(iso) {
  return iso ? new Date(iso).toLocaleDateString("nl-NL", { day: "numeric", month: "short", timeZone: "Europe/Amsterdam" }) : "—";
}

function geleden(iso) {
  if (!iso) return null;
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  return d <= 0 ? "vandaag" : d === 1 ? "gisteren" : `${d} dagen geleden`;
}

export function telLopend(proeven) {
  return proeven.filter((p) => proefStatus(p) === "loopt").length;
}

export default async function AppProefTab({ sp, verkopers }) {
  const [proeven, instelling, faseB] = await Promise.all([getProeven(), getInstelling(), controleFaseB()]);

  const periode = sp.periode === "alles" ? "alles" : "maand";
  const nu = new Date();
  const maandStart = new Date(Date.UTC(nu.getUTCFullYear(), nu.getUTCMonth(), 1)).toISOString();
  const t = conversie(proeven, periode === "maand" ? maandStart : null);

  const q = String(sp.q || "").toLowerCase().trim();
  const status = sp.pstatus || "open"; // open = loopt + verlopen
  const signaal = sp.psignaal || "";
  const sector = sp.sector || "";

  const lijst = proeven
    .map((p) => ({ ...p, st: proefStatus(p), gekoppeld: !!p.plugin_gezien_op }))
    .filter((p) => {
      if (status === "open" && p.st === "pro") return false;
      if (status !== "open" && status !== "alles" && p.st !== status) return false;
      if (sector && (p.soort || "vakman") !== sector) return false;
      if (signaal === "niet_gekoppeld" && p.gekoppeld) return false;
      if (signaal === "nul_klussen" && Number(p.klussen_proef) > 0) return false;
      if (signaal === "bestaande_lead" && !p.bestaande_lead) return false;
      if (q && ![p.name, p.email, p.domein, p.contact_naam].filter(Boolean).join(" ").toLowerCase().includes(q)) return false;
      return true;
    })
    .sort((a, b) => String(a.proef_eindigt_op).localeCompare(String(b.proef_eindigt_op)));

  return (
    <>
      <Schakelaar open={!!instelling.open} faseB={faseB} door={instelling.gewijzigd_door} />

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", margin: "12px 0" }}>
        <Kpi label="Gestart" waarde={t.gestart} sub={periode === "maand" ? "deze maand" : "totaal"} />
        <Kpi label="Loopt nu" waarde={t.loopt} sub="nog bezig" />
        <Kpi label="Naar Pro" waarde={t.pro} sub="betalen nu" />
        <Kpi label="Verlopen" waarde={t.verlopen} sub="niet betaald" />
        <Kpi label="Conversie" waarde={t.procent == null ? "—" : `${t.procent}%`} sub={t.afgerond ? `${t.pro} van ${t.afgerond} afgerond` : "nog geen afgeronde proeven"} kleur={KLEUR.sage} />
      </div>

      <AppProefFilters />

      <div style={{ fontSize: 12.5, color: KLEUR.label, margin: "4px 0 8px" }}>
        {lijst.length === 0 ? "Geen app-proeven gevonden met deze filters." : `${lijst.length} gevonden`}
      </div>

      {lijst.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 900 }}>
            <thead>
              <tr>
                <th style={th}>Bedrijf · website</th>
                <th style={th}>Proef t/m</th>
                <th style={th}>Plugin</th>
                <th style={{ ...th, textAlign: "right" }}>Klussen</th>
                <th style={th}>Status</th>
                <th style={th}></th>
              </tr>
            </thead>
            <tbody>
              {lijst.map((p) => {
                const over = dagenOver(p.proef_eindigt_op);
                const s = STATUS[p.st];
                return (
                  <tr key={p.id} style={{ borderTop: `1px solid ${KLEUR.baanRand}` }}>
                    <td style={td}>
                      <div style={{ fontWeight: 700 }}>
                        {p.register_slug && p.klant_kandidaat ? <Link href={`/klantenregister/${p.register_slug}`} style={{ color: "inherit" }}>{p.name}</Link> : p.name}
                        {p.bestaande_lead && <span style={{ marginLeft: 6 }}><Pil k={KLEUR.grijs}>Bestaande lead</Pil></span>}
                      </div>
                      <div style={{ fontSize: 12, color: KLEUR.label }}>{p.domein || "—"}{p.contact_naam ? ` · ${p.contact_naam}` : ""}</div>
                    </td>
                    <td style={td}>
                      <div>{datum(p.proef_eindigt_op)}</div>
                      <div style={{ fontSize: 12, color: KLEUR.label }}>
                        {p.st === "loopt" ? (over <= 0 ? "loopt vandaag af" : `nog ${over} dag${over === 1 ? "" : "en"}`) : p.st === "pro" ? "betaalt" : "verlopen"}
                      </div>
                    </td>
                    <td style={td}>
                      {p.gekoppeld
                        ? <><span style={{ color: KLEUR.sage.tekst, fontWeight: 700 }}>✓ gekoppeld</span><div style={{ fontSize: 12, color: KLEUR.label }}>{geleden(p.plugin_gezien_op)}</div></>
                        : <span style={{ color: KLEUR.rust.tekst, fontWeight: 700 }}>✗ niet gekoppeld</span>}
                    </td>
                    <td style={{ ...td, textAlign: "right", fontWeight: 700 }}>{Number(p.klussen_proef) || 0}</td>
                    <td style={td}><Pil k={s.k}>{s.label}</Pil>{p.klant_kandidaat && !p.klantnummer && <div style={{ fontSize: 12, color: KLEUR.label, marginTop: 4 }}>in opvolging{p.verzamelaar ? ` · ${p.verzamelaar}` : ""}</div>}</td>
                    <td style={td}>
                      <ProefActies id={p.id} status={p.st} inOpvolging={!!p.klant_kandidaat} verkopers={verkopers} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
