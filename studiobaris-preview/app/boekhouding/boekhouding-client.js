"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { KLEUR, HEAD } from "../werkplek-stijl";
import { Knop, Chip } from "../werkplek-shell";

const kaart = { background: KLEUR.kaart, border: `1px solid ${KLEUR.lijn}`, borderRadius: 14 };
const th = {
  textAlign: "left", fontSize: 11, letterSpacing: 1, textTransform: "uppercase",
  color: KLEUR.label, fontWeight: 700, padding: "12px 14px",
  background: KLEUR.baan, borderBottom: `1px solid ${KLEUR.baanRand}`, whiteSpace: "nowrap",
};
const td = { padding: "12px 14px", fontSize: 14, borderBottom: `1px solid ${KLEUR.lijn}`, verticalAlign: "middle" };
const tdGetal = { ...td, textAlign: "right", fontVariantNumeric: "tabular-nums" };
const veldStijl = {
  width: "100%", padding: "9px 12px", border: `1px solid ${KLEUR.lijn2}`, borderRadius: 9,
  fontSize: 14, fontFamily: "inherit", background: "#fff", color: KLEUR.inkt,
};
const labelStijl = { fontSize: 12.5, fontWeight: 700, color: KLEUR.gedempt, display: "block", marginBottom: 5 };

const KWARTAAL_LABEL = { 1: "Q1 · jan–mrt", 2: "Q2 · apr–jun", 3: "Q3 · jul–sep", 4: "Q4 · okt–dec" };

// Plain-language labels — de code/het jargon staat nooit als eerste in beeld.
const BTW_TYPE_LABEL = {
  HOOG_21: "21% btw",
  LAAG_9: "9% btw",
  NUL_0: "0% btw",
  VRIJGESTELD: "Vrijgesteld van btw",
  REVERSE_CHARGE_EU: "Verlegd — leverancier binnen de EU",
  REVERSE_CHARGE_NON_EU: "Verlegd — leverancier buiten de EU (bijv. VS)",
  BUITEN_BTW: "Valt buiten de btw",
};
const BTW_TYPE_TARIEF = {
  HOOG_21: 0.21, LAAG_9: 0.09, NUL_0: 0, VRIJGESTELD: 0,
  REVERSE_CHARGE_EU: 0.21, REVERSE_CHARGE_NON_EU: 0.21, BUITEN_BTW: 0,
};

function euro(v) {
  const n = Number(v) || 0;
  return "€ " + n.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function getal(v) {
  if (v === "" || v === null || v === undefined) return 0;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}
function datumNL(d) {
  if (!d) return "—";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString("nl-NL", { day: "2-digit", month: "2-digit", year: "numeric" });
}
function vandaag() {
  return new Date().toISOString().slice(0, 10);
}

function Cijfer({ label, waarde, kleur, sub }) {
  return (
    <div style={{ ...kaart, flex: "1 1 180px", minWidth: 180, padding: "16px 18px" }}>
      <div style={{ fontSize: 11.5, letterSpacing: 0.6, textTransform: "uppercase", color: KLEUR.label, fontWeight: 700, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: kleur || KLEUR.inkt, lineHeight: 1.15 }}>{waarde}</div>
      {sub && <div style={{ fontSize: 12, color: KLEUR.label, marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

const LEGE_REGEL = {
  id: null, grootboekCode: "", omschrijving: "", leverancier: "",
  bedragExcl: "", btwType: "HOOG_21", datum: vandaag(), terugkerend: false, frequentie: "maandelijks",
};

const LEGE_UREN_REGEL = { id: null, datum: vandaag(), aantalUren: "", omschrijving: "" };

export default function BoekhoudingClient({ overzicht, rekeningen, kostenInitieel, jaar, kwartaal, urenOverzicht, urenInitieel, urenJaar, naam }) {
  const router = useRouter();
  const [kosten, setKosten] = useState(kostenInitieel);
  const [formOpen, setFormOpen] = useState(false);
  const [regel, setRegel] = useState(LEGE_REGEL);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState("");
  const [schemaOpen, setSchemaOpen] = useState(false);

  const [uren, setUren] = useState(urenInitieel);
  const [urenFormOpen, setUrenFormOpen] = useState(false);
  const [urenRegel, setUrenRegel] = useState(LEGE_UREN_REGEL);
  const [urenBezig, setUrenBezig] = useState(false);
  const [urenFout, setUrenFout] = useState("");

  // Alleen kosten-rekeningen aanbieden (geen omzet/balans) — dit formulier is
  // voor uitgaven, niet voor het hele rekeningschema.
  const kostenRekeningen = useMemo(
    () => rekeningen.filter((r) => r.rekeningtype === "kosten"),
    [rekeningen]
  );
  const gekozenRekening = useMemo(
    () => rekeningen.find((r) => r.code === regel.grootboekCode) || null,
    [rekeningen, regel.grootboekCode]
  );

  function periodeUrl(j, k) {
    return `/boekhouding?jaar=${j}&kwartaal=${k}&urenJaar=${urenJaar}`;
  }
  function vorigKwartaal() {
    return kwartaal === 1 ? { j: jaar - 1, k: 4 } : { j: jaar, k: kwartaal - 1 };
  }
  function volgendKwartaal() {
    return kwartaal === 4 ? { j: jaar + 1, k: 1 } : { j: jaar, k: kwartaal + 1 };
  }

  function urenJaarUrl(j) {
    return `/boekhouding?jaar=${jaar}&kwartaal=${kwartaal}&urenJaar=${j}`;
  }

  function nieuweUrenRegel() {
    setUrenRegel(LEGE_UREN_REGEL);
    setUrenFout("");
    setUrenFormOpen(true);
  }
  function bewerkUrenRegel(u) {
    setUrenRegel({ id: u.id, datum: u.datum, aantalUren: String(u.aantal_uren), omschrijving: u.omschrijving });
    setUrenFout("");
    setUrenFormOpen(true);
  }

  async function urenOpslaan() {
    setUrenFout("");
    if (!urenRegel.omschrijving.trim()) return setUrenFout("Vul een omschrijving in.");
    if (getal(urenRegel.aantalUren) <= 0) return setUrenFout("Vul een aantal uur groter dan 0 in.");

    setUrenBezig(true);
    try {
      const pad = urenRegel.id ? "/api/uren/bijwerken" : "/api/uren/toevoegen";
      const res = await fetch(pad, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: urenRegel.id || undefined,
          datum: urenRegel.datum,
          aantalUren: getal(urenRegel.aantalUren),
          omschrijving: urenRegel.omschrijving.trim(),
        }),
      });
      const d = await res.json();
      if (!d.ok) throw new Error(d.error || "Opslaan mislukte.");
      setUrenFormOpen(false);
      router.refresh();
    } catch (e) {
      setUrenFout(String(e.message || e));
    }
    setUrenBezig(false);
  }

  async function urenVerwijderenActie(id) {
    if (!confirm("Deze urenregel verwijderen?")) return;
    try {
      const res = await fetch("/api/uren/verwijderen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const d = await res.json();
      if (!d.ok) throw new Error(d.error || "Verwijderen mislukte.");
      setUren((v) => v.filter((u) => u.id !== id));
      router.refresh();
    } catch (e) {
      alert(String(e.message || e));
    }
  }

  function nieuweRegel() {
    setRegel(LEGE_REGEL);
    setFout("");
    setFormOpen(true);
  }
  function bewerkRegel(k) {
    setRegel({
      id: k.id, grootboekCode: k.grootboek_code, omschrijving: k.omschrijving,
      leverancier: k.leverancier || "", bedragExcl: String(k.bedrag_excl),
      btwType: k.btw_type, datum: k.datum, terugkerend: !!k.terugkerend,
      frequentie: k.frequentie || "maandelijks",
    });
    setFout("");
    setFormOpen(true);
  }

  function kiesRekening(code) {
    const r = rekeningen.find((x) => x.code === code);
    setRegel((v) => ({
      ...v,
      grootboekCode: code,
      btwType: r ? r.standaard_btw_type : v.btwType,
    }));
  }

  async function opslaan() {
    setFout("");
    if (!regel.grootboekCode) return setFout("Kies een rekening.");
    if (!regel.omschrijving.trim()) return setFout("Vul een omschrijving in.");
    if (getal(regel.bedragExcl) <= 0) return setFout("Vul een bedrag groter dan 0 in.");

    setBezig(true);
    try {
      const pad = regel.id ? "/api/kosten/bijwerken" : "/api/kosten/toevoegen";
      const res = await fetch(pad, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: regel.id || undefined,
          grootboekCode: regel.grootboekCode,
          omschrijving: regel.omschrijving.trim(),
          leverancier: regel.leverancier.trim() || null,
          bedragExcl: getal(regel.bedragExcl),
          btwTarief: BTW_TYPE_TARIEF[regel.btwType] ?? 0.21,
          btwType: regel.btwType,
          datum: regel.datum,
          terugkerend: regel.terugkerend,
          frequentie: regel.terugkerend ? regel.frequentie : null,
        }),
      });
      const d = await res.json();
      if (!d.ok) throw new Error(d.error || "Opslaan mislukte.");
      setFormOpen(false);
      router.refresh();
    } catch (e) {
      setFout(String(e.message || e));
    }
    setBezig(false);
  }

  async function verwijderen(id) {
    if (!confirm("Deze kostenregel verwijderen?")) return;
    try {
      const res = await fetch("/api/kosten/verwijderen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const d = await res.json();
      if (!d.ok) throw new Error(d.error || "Verwijderen mislukte.");
      setKosten((v) => v.filter((k) => k.id !== id));
      router.refresh();
    } catch (e) {
      alert(String(e.message || e));
    }
  }

  const rubriekLabel = {
    "1a": "Btw over je omzet (21%)", "1b": "Btw over je omzet (9%)",
    "4a": "Verlegde btw — kosten uit landen buiten de EU",
    "4b": "Verlegde btw — kosten uit landen binnen de EU",
    "5b": "Btw die je terugkrijgt (voorbelasting)",
  };

  const vorig = vorigKwartaal();
  const volgend = volgendKwartaal();

  return (
    <div>
      {/* Periode */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <a href={periodeUrl(vorig.j, vorig.k)} style={{ fontSize: 13, fontWeight: 700, color: KLEUR.klei, textDecoration: "none" }}>
          ← {KWARTAAL_LABEL[vorig.k]} {vorig.j}
        </a>
        <div style={{ fontFamily: HEAD, fontSize: 18, fontWeight: 800, color: KLEUR.inkt }}>
          {KWARTAAL_LABEL[kwartaal]} {jaar}
        </div>
        <a href={periodeUrl(volgend.j, volgend.k)} style={{ fontSize: 13, fontWeight: 700, color: KLEUR.klei, textDecoration: "none" }}>
          {KWARTAAL_LABEL[volgend.k]} {volgend.j} →
        </a>
      </div>

      {/* Resultaat */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
        <Cijfer label="Omzet (excl. btw)" waarde={euro(overzicht.omzet_excl)} kleur="#0f6e56" sub="uit verstuurde/betaalde facturen" />
        <Cijfer label="Kosten (excl. btw)" waarde={euro(overzicht.kosten_excl)} kleur="#b45309" sub="alle goedgekeurde kostenregels" />
        <Cijfer
          label="Resultaat"
          waarde={euro(overzicht.resultaat)}
          kleur={overzicht.resultaat >= 0 ? "#0f6e56" : "#b91c1c"}
          sub={overzicht.resultaat >= 0 ? "winst dit kwartaal" : "verlies dit kwartaal"}
        />
        <Cijfer
          label="Btw dit kwartaal (schatting)"
          waarde={euro(overzicht.btw_te_betalen)}
          kleur={overzicht.btw_te_betalen >= 0 ? "#b45309" : "#0f6e56"}
          sub={overzicht.btw_te_betalen >= 0 ? "vermoedelijk te betalen" : "vermoedelijk terug te krijgen"}
        />
      </div>

      <div style={{ background: "#F7F5F0", border: `1px solid ${KLEUR.lijn}`, borderRadius: 12, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: KLEUR.gedempt, lineHeight: 1.6 }}>
        Dit is een schatting op basis van wat hier is ingevoerd — geen automatische indiening. Vul 'm zelf in op{" "}
        <strong>mijn.belastingdienst.nl</strong> zodra het kwartaal voorbij is. Voor het officiële omzetoverzicht per
        kwartaal (factuurstelsel) zie <a href="/btw-aangifte" style={{ color: KLEUR.klei, fontWeight: 700 }}>Omzet &amp; btw</a>.
      </div>

      {/* Btw per rubriek */}
      <div style={{ ...kaart, marginBottom: 20, overflowX: "auto" }}>
        <div style={{ padding: "14px 16px 0" }}>
          <h2 style={{ fontSize: 15, margin: "0 0 2px" }}>Btw per rubriek</h2>
          <p style={{ fontSize: 12.5, color: KLEUR.label, margin: "0 0 10px" }}>In gewone taal — de officiële rubriek staat erbij voor als je 'm invult.</p>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>Waar gaat dit over</th>
              <th style={th}>Rubriek</th>
              <th style={{ ...th, textAlign: "right" }}>Grondslag</th>
              <th style={{ ...th, textAlign: "right" }}>Btw-bedrag</th>
            </tr>
          </thead>
          <tbody>
            {(overzicht.rubrieken || []).map((r) => (
              <tr key={r.rubriek}>
                <td style={td}>{rubriekLabel[r.rubriek] || r.omschrijving}</td>
                <td style={{ ...td, color: KLEUR.label }}>{r.rubriek}</td>
                <td style={tdGetal}>{euro(r.grondslag)}</td>
                <td style={tdGetal}>{euro(r.btw_bedrag)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Kosten */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <h2 style={{ fontSize: 17, margin: 0 }}>Kosten</h2>
        <Knop kind="primair" klein onClick={nieuweRegel}>+ Kosten toevoegen</Knop>
      </div>

      {formOpen && (
        <div style={{ ...kaart, padding: 16, marginBottom: 16, background: "#F7F5F0" }}>
          <h3 style={{ fontSize: 14.5, margin: "0 0 12px" }}>{regel.id ? "Kostenregel bewerken" : "Nieuwe kostenregel"}</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStijl}>Omschrijving</label>
              <input
                style={veldStijl} value={regel.omschrijving} placeholder="Bijv. Claude/Cowork abonnement"
                onChange={(e) => setRegel((v) => ({ ...v, omschrijving: e.target.value }))}
              />
            </div>
            <div>
              <label style={labelStijl}>Leverancier (optioneel)</label>
              <input
                style={veldStijl} value={regel.leverancier} placeholder="Bijv. Anthropic"
                onChange={(e) => setRegel((v) => ({ ...v, leverancier: e.target.value }))}
              />
            </div>
            <div>
              <label style={labelStijl}>Bedrag excl. btw</label>
              <input
                style={veldStijl} inputMode="decimal" value={regel.bedragExcl} placeholder="0,00"
                onChange={(e) => setRegel((v) => ({ ...v, bedragExcl: e.target.value }))}
              />
            </div>
            <div>
              <label style={labelStijl}>Datum</label>
              <input
                style={veldStijl} type="date" value={regel.datum}
                onChange={(e) => setRegel((v) => ({ ...v, datum: e.target.value }))}
              />
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={labelStijl}>Rekening — waar hoort dit bij?</label>
            <select style={veldStijl} value={regel.grootboekCode} onChange={(e) => kiesRekening(e.target.value)}>
              <option value="">— kies een rekening —</option>
              {kostenRekeningen.map((r) => (
                <option key={r.code} value={r.code}>{r.naam}</option>
              ))}
            </select>
            {gekozenRekening && (
              <p style={{ fontSize: 12.5, color: KLEUR.gedempt, margin: "6px 0 0", lineHeight: 1.5 }}>
                {gekozenRekening.uitleg_voor_leek}
              </p>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStijl}>Btw</label>
              <select style={veldStijl} value={regel.btwType} onChange={(e) => setRegel((v) => ({ ...v, btwType: e.target.value }))}>
                {Object.entries(BTW_TYPE_LABEL).map(([k, l]) => (
                  <option key={k} value={k}>{l}</option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 16 }}>
              <label style={{ ...labelStijl, marginBottom: 0, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                <input
                  type="checkbox" checked={regel.terugkerend}
                  onChange={(e) => setRegel((v) => ({ ...v, terugkerend: e.target.checked }))}
                />
                Terugkerende kost
              </label>
              {regel.terugkerend && (
                <select
                  style={{ ...veldStijl, width: "auto" }} value={regel.frequentie}
                  onChange={(e) => setRegel((v) => ({ ...v, frequentie: e.target.value }))}
                >
                  <option value="maandelijks">Elke maand</option>
                  <option value="jaarlijks">Elk jaar</option>
                </select>
              )}
            </div>
          </div>

          {fout && <div style={{ color: "#b91c1c", fontSize: 13, marginBottom: 10 }}>{fout}</div>}

          <div style={{ display: "flex", gap: 8 }}>
            <Knop kind="primair" onClick={opslaan} disabled={bezig}>{bezig ? "Bezig…" : "Opslaan"}</Knop>
            <Knop kind="secondair" onClick={() => setFormOpen(false)}>Annuleren</Knop>
          </div>
        </div>
      )}

      <div style={{ ...kaart, overflowX: "auto", marginBottom: 20 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
          <thead>
            <tr>
              <th style={th}>Datum</th>
              <th style={th}>Omschrijving</th>
              <th style={th}>Rekening</th>
              <th style={{ ...th, textAlign: "right" }}>Bedrag excl.</th>
              <th style={{ ...th, textAlign: "right" }}>Btw</th>
              <th style={th}></th>
            </tr>
          </thead>
          <tbody>
            {kosten.map((k) => (
              <tr key={k.id}>
                <td style={{ ...td, whiteSpace: "nowrap" }}>{datumNL(k.datum)}</td>
                <td style={td}>
                  <div style={{ fontWeight: 600 }}>{k.omschrijving}</div>
                  {k.leverancier && <div style={{ fontSize: 12, color: KLEUR.label }}>{k.leverancier}</div>}
                  {k.terugkerend && <span style={{ marginTop: 4, display: "inline-block" }}><Chip kleur="sage">terugkerend · {k.frequentie === "jaarlijks" ? "jaarlijks" : "maandelijks"}</Chip></span>}
                </td>
                <td style={td}>
                  <div>{k.grootboek_naam}</div>
                  <div style={{ fontSize: 11.5, color: KLEUR.label }}>{BTW_TYPE_LABEL[k.btw_type] || k.btw_type}</div>
                </td>
                <td style={tdGetal}>{euro(k.bedrag_excl)}</td>
                <td style={tdGetal}>{euro(k.btw_bedrag)}</td>
                <td style={{ ...td, whiteSpace: "nowrap", textAlign: "right" }}>
                  <button onClick={() => bewerkRegel(k)} style={{ background: "none", border: "none", color: KLEUR.klei, fontWeight: 700, fontSize: 12.5, cursor: "pointer", marginRight: 10, fontFamily: "inherit" }}>bewerken</button>
                  <button onClick={() => verwijderen(k.id)} style={{ background: "none", border: "none", color: "#b91c1c", fontWeight: 700, fontSize: 12.5, cursor: "pointer", fontFamily: "inherit" }}>verwijderen</button>
                </td>
              </tr>
            ))}
            {kosten.length === 0 && (
              <tr><td colSpan={6} style={{ padding: 24, textAlign: "center", color: KLEUR.label }}>Nog geen kosten in dit kwartaal.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Urenregistratie — los van kosten/omzet/btw, voor het urencriterium */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, marginTop: 8 }}>
        <a href={urenJaarUrl(urenJaar - 1)} style={{ fontSize: 13, fontWeight: 700, color: KLEUR.klei, textDecoration: "none" }}>← {urenJaar - 1}</a>
        <div style={{ fontFamily: HEAD, fontSize: 18, fontWeight: 800, color: KLEUR.inkt }}>Urenregistratie {urenJaar}</div>
        <a href={urenJaarUrl(urenJaar + 1)} style={{ fontSize: 13, fontWeight: 700, color: KLEUR.klei, textDecoration: "none" }}>{urenJaar + 1} →</a>
      </div>

      <div style={{ ...kaart, padding: "16px 18px", marginBottom: 16 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
          <Cijfer label="Uren dit jaar" waarde={`${urenOverzicht.totaal_uren}`} sub={`van de ${urenOverzicht.urencriterium} voor het urencriterium`} />
          <Cijfer
            label="Nog nodig"
            waarde={`${urenOverzicht.resterend}`}
            kleur={urenOverzicht.resterend > 0 ? "#b45309" : "#0f6e56"}
            sub={urenOverzicht.resterend > 0 ? "uur te gaan" : "criterium al gehaald"}
          />
          {urenOverzicht.huidig_jaar && (
            <Cijfer
              label="Verwacht einde jaar"
              waarde={`${urenOverzicht.projectie_einde_jaar}`}
              kleur={urenOverzicht.op_schema ? "#0f6e56" : "#b91c1c"}
              sub={urenOverzicht.op_schema ? "op dit tempo op schema" : "op dit tempo niet op schema"}
            />
          )}
        </div>
        <div style={{ height: 10, borderRadius: 6, background: KLEUR.baan, overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${Math.min(100, urenOverzicht.percentage)}%`,
            background: urenOverzicht.percentage >= 100 ? "#0f6e56" : KLEUR.klei, borderRadius: 6,
          }} />
        </div>
        <div style={{ fontSize: 12, color: KLEUR.label, marginTop: 6 }}>{urenOverzicht.percentage}% van het urencriterium (1.225 uur/jaar)</div>
        <div style={{ margin: "14px 0 12px", borderTop: `1px solid ${KLEUR.lijn}` }} />
        <p style={{ fontSize: 12.5, color: KLEUR.gedempt, margin: 0, lineHeight: 1.6 }}>
          Dit is puur voor jezelf — géén onderdeel van de btw-aangifte. Als eenmanszaak/starter heb je bij minimaal
          1.225 uur per jaar aan je onderneming recht op zelfstandigenaftrek en (de eerste jaren) startersaftrek. De
          Belastingdienst schrijft geen vaste vorm voor, maar bij een controle moet je aannemelijk kunnen maken dat je
          eraan voldoet — vandaar dit overzichtje: datum, aantal uur, en wat je deed.
        </p>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <h2 style={{ fontSize: 17, margin: 0 }}>Geregistreerde uren</h2>
        <Knop kind="primair" klein onClick={nieuweUrenRegel}>+ Uren registreren</Knop>
      </div>

      {urenFormOpen && (
        <div style={{ ...kaart, padding: 16, marginBottom: 16, background: "#F7F5F0" }}>
          <h3 style={{ fontSize: 14.5, margin: "0 0 12px" }}>{urenRegel.id ? "Urenregel bewerken" : "Uren registreren"}</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStijl}>Datum</label>
              <input
                style={veldStijl} type="date" value={urenRegel.datum}
                onChange={(e) => setUrenRegel((v) => ({ ...v, datum: e.target.value }))}
              />
            </div>
            <div>
              <label style={labelStijl}>Aantal uur</label>
              <input
                style={veldStijl} inputMode="decimal" value={urenRegel.aantalUren} placeholder="Bijv. 6,5"
                onChange={(e) => setUrenRegel((v) => ({ ...v, aantalUren: e.target.value }))}
              />
            </div>
            <div>
              <label style={labelStijl}>Wat deed je?</label>
              <input
                style={veldStijl} value={urenRegel.omschrijving} placeholder="Bijv. Klantwerk StudioBaris, administratie"
                onChange={(e) => setUrenRegel((v) => ({ ...v, omschrijving: e.target.value }))}
              />
            </div>
          </div>

          {urenFout && <div style={{ color: "#b91c1c", fontSize: 13, marginBottom: 10 }}>{urenFout}</div>}

          <div style={{ display: "flex", gap: 8 }}>
            <Knop kind="primair" onClick={urenOpslaan} disabled={urenBezig}>{urenBezig ? "Bezig…" : "Opslaan"}</Knop>
            <Knop kind="secondair" onClick={() => setUrenFormOpen(false)}>Annuleren</Knop>
          </div>
        </div>
      )}

      <div style={{ ...kaart, overflowX: "auto", marginBottom: 20 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
          <thead>
            <tr>
              <th style={th}>Datum</th>
              <th style={th}>Wat deed je</th>
              <th style={{ ...th, textAlign: "right" }}>Aantal uur</th>
              <th style={th}></th>
            </tr>
          </thead>
          <tbody>
            {uren.map((u) => (
              <tr key={u.id}>
                <td style={{ ...td, whiteSpace: "nowrap" }}>{datumNL(u.datum)}</td>
                <td style={td}>
                  <div>{u.omschrijving}</div>
                  {u.toegevoegd_door && <div style={{ fontSize: 11.5, color: KLEUR.label }}>{u.toegevoegd_door}</div>}
                </td>
                <td style={tdGetal}>{Number(u.aantal_uren).toLocaleString("nl-NL", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</td>
                <td style={{ ...td, whiteSpace: "nowrap", textAlign: "right" }}>
                  <button onClick={() => bewerkUrenRegel(u)} style={{ background: "none", border: "none", color: KLEUR.klei, fontWeight: 700, fontSize: 12.5, cursor: "pointer", marginRight: 10, fontFamily: "inherit" }}>bewerken</button>
                  <button onClick={() => urenVerwijderenActie(u.id)} style={{ background: "none", border: "none", color: "#b91c1c", fontWeight: 700, fontSize: 12.5, cursor: "pointer", fontFamily: "inherit" }}>verwijderen</button>
                </td>
              </tr>
            ))}
            {uren.length === 0 && (
              <tr><td colSpan={4} style={{ padding: 24, textAlign: "center", color: KLEUR.label }}>Nog geen uren geregistreerd in {urenJaar}.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Rekeningschema, ter referentie */}
      <details open={schemaOpen} onToggle={(e) => setSchemaOpen(e.target.open)} style={kaart}>
        <summary style={{ cursor: "pointer", padding: "14px 16px", fontWeight: 700, fontSize: 14.5, color: KLEUR.inkt, listStyle: "none" }}>
          Rekeningschema — wat betekent elke rekening? {schemaOpen ? "▲" : "▼"}
        </summary>
        <div style={{ padding: "0 16px 16px" }}>
          {["omzet", "kostprijs", "verkoopkosten", "bedrijfskosten", "balans"].map((cat) => {
            const items = rekeningen.filter((r) => r.categorie === cat);
            if (!items.length) return null;
            const catLabel = {
              omzet: "Omzet", kostprijs: "Kostprijs (directe kosten per klant)",
              verkoopkosten: "Verkoop & marketing", bedrijfskosten: "Bedrijfskosten",
              balans: "Balans (bezit, schulden, btw-standen)",
            }[cat];
            return (
              <div key={cat} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11.5, textTransform: "uppercase", letterSpacing: 0.5, color: KLEUR.label, fontWeight: 700, marginBottom: 6 }}>{catLabel}</div>
                {items.map((r) => (
                  <div key={r.code} style={{ padding: "8px 0", borderTop: `1px solid ${KLEUR.lijn}` }}>
                    <div style={{ fontWeight: 700, fontSize: 13.5 }}>{r.naam}</div>
                    <div style={{ fontSize: 12.5, color: KLEUR.gedempt, marginTop: 2 }}>{r.uitleg_voor_leek}</div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </details>
    </div>
  );
}
