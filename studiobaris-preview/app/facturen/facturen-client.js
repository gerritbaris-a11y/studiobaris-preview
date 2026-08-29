"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { KLEUR, HEAD } from "../werkplek-stijl";
import { Knop, Chip } from "../werkplek-shell";

const SOORT_LABEL = {
  eenmalig: "Eenmalig",
  aanbetaling: "Aanbetaling",
  slottermijn: "Slottermijn",
  maandelijks: "Maandelijks",
};

const STATUS_CHIP = {
  concept: "grijs",
  verstuurd: "amber",
  betaald: "sage",
  mislukt: "rust",
};

const STATUS_LABEL = {
  concept: "Concept",
  verstuurd: "Verstuurd",
  betaald: "Betaald",
  mislukt: "Mislukt",
};

function euro(v) {
  const n = Number(v) || 0;
  return "€ " + n.toFixed(2).replace(".", ",");
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

const kaart = { background: KLEUR.kaart, border: `1px solid ${KLEUR.lijn}`, borderRadius: 14 };
const th = {
  textAlign: "left", fontSize: 11, letterSpacing: 1, textTransform: "uppercase",
  color: KLEUR.label, fontWeight: 700, padding: "12px 14px",
  background: KLEUR.baan, borderBottom: `1px solid ${KLEUR.baanRand}`, whiteSpace: "nowrap",
};
const td = { padding: "13px 14px", fontSize: 14, borderBottom: `1px solid ${KLEUR.lijn}`, verticalAlign: "middle" };
const veldStijl = {
  width: "100%", padding: "9px 12px", border: `1px solid ${KLEUR.lijn2}`, borderRadius: 9,
  fontSize: 14, fontFamily: "inherit", background: "#fff", color: KLEUR.inkt,
};
const labelStijl = { fontSize: 12.5, fontWeight: 700, color: KLEUR.gedempt, display: "block", marginBottom: 5 };

export default function FacturenClient({ facturen, klanten }) {
  const router = useRouter();
  const [zoek, setZoek] = useState("");
  const [statusFilter, setStatusFilter] = useState("alle");
  const [modalOpen, setModalOpen] = useState(false);
  const [versturenBezig, setVersturenBezig] = useState(null);
  const [klantFilter, setKlantFilter] = useState(null); // { slug, klant } — komt uit ?klant= op de URL

  // Vanuit "Mijn klanten" kom je hier met ?klant=<slug> binnen, zodat je bij
  // duizenden facturen niet hoeft te scrollen om die van één klant te vinden.
  // De nummering zelf blijft gewoon doorlopen over alle klanten heen — dit is
  // puur een weergavefilter, geen aparte telling.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get("klant");
    if (!slug) return;
    const gevonden = klanten.find((k) => k.slug === slug);
    setKlantFilter({ slug, klant: gevonden ? gevonden.klant : slug });
  }, [klanten]);

  function wisKlantFilter() {
    setKlantFilter(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("klant");
    window.history.replaceState({}, "", url.toString());
  }

  const gefilterd = useMemo(() => {
    const q = zoek.trim().toLowerCase();
    return facturen.filter((f) => {
      if (klantFilter && f.slug !== klantFilter.slug) return false;
      if (statusFilter !== "alle" && f.status !== statusFilter) return false;
      if (!q) return true;
      return (
        String(f.nummer || "").toLowerCase().includes(q) ||
        String(f.klant || "").toLowerCase().includes(q) ||
        String(f.contactpersoon || "").toLowerCase().includes(q)
      );
    });
  }, [facturen, zoek, statusFilter, klantFilter]);

  async function versturen(nummer) {
    setVersturenBezig(nummer);
    try {
      const res = await fetch("/api/facturen/opnieuw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nummer }),
      });
      const d = await res.json();
      if (!d.ok) throw new Error(d.error || "Versturen mislukte.");
      router.refresh();
    } catch (e) {
      alert(String(e.message || e));
    }
    setVersturenBezig(null);
  }

  return (
    <div>
      {klantFilter && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <Chip kleur="klei">Gefilterd op: {klantFilter.klant}</Chip>
          <button
            onClick={wisKlantFilter}
            style={{ background: "none", border: "none", color: KLEUR.label, fontSize: 12.5, cursor: "pointer", textDecoration: "underline", fontFamily: "inherit", padding: 0 }}
          >
            Alle facturen tonen
          </button>
        </div>
      )}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 16 }}>
        <input
          style={{ ...veldStijl, flex: "1 1 220px" }}
          placeholder="Zoek op klant of factuurnummer…"
          value={zoek}
          onChange={(e) => setZoek(e.target.value)}
        />
        <div style={{ display: "flex", gap: 6 }}>
          {["alle", "concept", "verstuurd", "betaald", "mislukt"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                border: `1px solid ${KLEUR.lijn2}`, borderRadius: 999, padding: "7px 13px",
                fontSize: 13, fontWeight: 600, cursor: "pointer",
                background: statusFilter === s ? KLEUR.inkt : "#fff",
                color: statusFilter === s ? "#fff" : KLEUR.gedempt,
              }}
            >
              {s === "alle" ? "Alle" : STATUS_LABEL[s]}
            </button>
          ))}
        </div>
        <div style={{ marginLeft: "auto" }}>
          <Knop kind="primair" onClick={() => setModalOpen(true)}>+ Nieuwe factuur</Knop>
        </div>
      </div>

      <div style={{ ...kaart, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>Nr</th>
              <th style={th}>Klant</th>
              <th style={th}>Omschrijving</th>
              <th style={th}>Datum</th>
              <th style={th}>Bedrag</th>
              <th style={th}>Status</th>
              <th style={th}></th>
            </tr>
          </thead>
          <tbody>
            {gefilterd.length === 0 && (
              <tr>
                <td style={{ ...td, borderBottom: "none", color: KLEUR.label }} colSpan={7}>
                  {facturen.length === 0
                    ? "Nog geen facturen — maak de eerste met “+ Nieuwe factuur”."
                    : "Geen facturen die aan dit filter voldoen."}
                </td>
              </tr>
            )}
            {gefilterd.map((f) => (
              <tr key={f.nummer}>
                <td style={{ ...td, fontVariantNumeric: "tabular-nums", fontWeight: 700 }}>{f.nummer}</td>
                <td style={td}>
                  <div style={{ fontWeight: 700 }}>{f.klant}</div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    {f.contactpersoon && (
                      <span style={{ color: KLEUR.label, fontSize: 12.5 }}>{f.contactpersoon}</span>
                    )}
                    {f.klant_gratis && <Chip kleur="sage">Gratis / promotie</Chip>}
                  </div>
                </td>
                <td style={td}>
                  {SOORT_LABEL[f.soort] || f.soort}
                  {f.periode && <div style={{ color: KLEUR.label, fontSize: 12.5 }}>{f.periode}</div>}
                </td>
                <td style={{ ...td, fontVariantNumeric: "tabular-nums" }}>{datumNL(f.factuurdatum)}</td>
                <td style={{ ...td, fontVariantNumeric: "tabular-nums" }}>{euro(f.bedrag_incl)}</td>
                <td style={td}>
                  <Chip kleur={STATUS_CHIP[f.status] || "grijs"}>{STATUS_LABEL[f.status] || f.status}</Chip>
                </td>
                <td style={td}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <a
                      href={`/api/facturen/pdf?nummer=${encodeURIComponent(f.nummer)}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: 12.5, fontWeight: 700, color: KLEUR.klei, textDecoration: "none", whiteSpace: "nowrap" }}
                    >
                      PDF ↓
                    </a>
                    <button
                      onClick={() => versturen(f.nummer)}
                      disabled={versturenBezig === f.nummer}
                      style={{
                        background: "none", border: "none", padding: 0, cursor: "pointer",
                        fontSize: 12.5, fontWeight: 700, color: KLEUR.label, whiteSpace: "nowrap",
                        fontFamily: "inherit",
                      }}
                    >
                      {versturenBezig === f.nummer
                        ? "Bezig…"
                        : f.status === "concept"
                        ? "Versturen"
                        : "Opnieuw versturen"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <NieuweFactuurModal
          klanten={klanten}
          onSluiten={() => setModalOpen(false)}
          onOpgeslagen={() => {
            setModalOpen(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function NieuweFactuurModal({ klanten, onSluiten, onOpgeslagen }) {
  const [slug, setSlug] = useState(klanten[0] ? klanten[0].slug : "");
  const [soort, setSoort] = useState("eenmalig");
  const [periode, setPeriode] = useState("");
  const [vervaldagen, setVervaldagen] = useState("14");
  const [incassodatum, setIncassodatum] = useState("");
  const [regels, setRegels] = useState([{ omschrijving: "", bedrag_excl: "" }]);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState("");

  const gekozenKlant = klanten.find((k) => k.slug === slug);
  const subtotaal = regels.reduce((som, r) => som + getal(r.bedrag_excl), 0);
  const btw = Math.round(subtotaal * 0.21 * 100) / 100;
  const totaal = Math.round((subtotaal + btw) * 100) / 100;

  function wijzigRegel(i, veld, waarde) {
    const nieuw = regels.slice();
    nieuw[i] = { ...nieuw[i], [veld]: waarde };
    setRegels(nieuw);
  }
  function voegRegelToe() {
    setRegels([...regels, { omschrijving: "", bedrag_excl: "" }]);
  }
  function verwijderRegel(i) {
    setRegels(regels.filter((_, idx) => idx !== i));
  }

  async function opslaan() {
    setFout("");
    if (!slug) return setFout("Kies een klant.");
    const schoneRegels = regels
      .map((r) => ({ omschrijving: r.omschrijving.trim(), bedrag_excl: getal(r.bedrag_excl) }))
      .filter((r) => r.omschrijving && r.bedrag_excl > 0);
    if (schoneRegels.length === 0) return setFout("Voeg minstens één regel toe met omschrijving en bedrag.");
    if (soort === "maandelijks" && !periode) return setFout("Vul de periode in (bijv. 2026-08) voor een maandelijkse factuur.");

    setBezig(true);
    try {
      const res = await fetch("/api/facturen/nieuw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          soort,
          regels: schoneRegels,
          periode: soort === "maandelijks" ? periode : null,
          incassodatum: incassodatum || null,
          vervaldagen: getal(vervaldagen) || 14,
        }),
      });
      const d = await res.json();
      if (!d.ok) throw new Error(d.error || "Opslaan mislukte.");
      onOpgeslagen();
    } catch (e) {
      setFout(String(e.message || e));
    }
    setBezig(false);
  }

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(43,39,36,.35)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        padding: "40px 16px", overflowY: "auto", zIndex: 50,
      }}
      onClick={onSluiten}
    >
      <div
        style={{ ...kaart, maxWidth: 560, width: "100%", overflow: "hidden" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ background: KLEUR.klei, color: "#fff", padding: "16px 20px", fontFamily: HEAD, fontWeight: 800, fontSize: 16 }}>
          Nieuwe factuur
        </div>
        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <span style={labelStijl}>Klant</span>
            <select style={veldStijl} value={slug} onChange={(e) => setSlug(e.target.value)}>
              {klanten.map((k) => (
                <option key={k.slug} value={k.slug}>
                  {k.klant}{k.gratis ? " — gratis / promotie" : ""}
                </option>
              ))}
            </select>
            {gekozenKlant && gekozenKlant.gratis && (
              <div style={{ marginTop: 6 }}>
                <Chip kleur="sage">Gratis / promotie — websiteprijs en maandbedrag staan op € 0</Chip>
              </div>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: soort === "maandelijks" ? "1fr 1fr" : "1fr 1fr", gap: 10 }}>
            <div>
              <span style={labelStijl}>Type</span>
              <select style={veldStijl} value={soort} onChange={(e) => setSoort(e.target.value)}>
                <option value="eenmalig">Eenmalig</option>
                <option value="aanbetaling">Aanbetaling</option>
                <option value="slottermijn">Slottermijn</option>
                <option value="maandelijks">Maandelijks</option>
              </select>
            </div>
            {soort === "maandelijks" ? (
              <div>
                <span style={labelStijl}>Periode</span>
                <input style={veldStijl} placeholder="2026-08" value={periode} onChange={(e) => setPeriode(e.target.value)} />
              </div>
            ) : (
              <div>
                <span style={labelStijl}>Vervaldagen</span>
                <input style={veldStijl} inputMode="numeric" value={vervaldagen} onChange={(e) => setVervaldagen(e.target.value)} />
              </div>
            )}
          </div>

          <div>
            <span style={labelStijl}>Regels</span>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {regels.map((r, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    style={{ ...veldStijl, flex: "1 1 auto" }}
                    placeholder="Omschrijving"
                    value={r.omschrijving}
                    onChange={(e) => wijzigRegel(i, "omschrijving", e.target.value)}
                  />
                  <input
                    style={{ ...veldStijl, width: 130 }}
                    placeholder="Bedrag excl. btw"
                    inputMode="decimal"
                    value={r.bedrag_excl}
                    onChange={(e) => wijzigRegel(i, "bedrag_excl", e.target.value)}
                  />
                  {regels.length > 1 && (
                    <button
                      onClick={() => verwijderRegel(i)}
                      style={{ background: "none", border: "none", color: KLEUR.label, fontSize: 18, cursor: "pointer", lineHeight: 1 }}
                      aria-label="Regel verwijderen"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={voegRegelToe}
              style={{ marginTop: 8, background: "none", border: "none", color: KLEUR.klei, fontWeight: 700, fontSize: 13, cursor: "pointer", padding: 0 }}
            >
              + regel toevoegen
            </button>
          </div>

          <div style={{ background: KLEUR.baan, borderRadius: 10, padding: "12px 14px", fontSize: 13.5 }}>
            <Totaalregel label="Subtotaal excl. btw" waarde={euro(subtotaal)} />
            <Totaalregel label="Btw 21%" waarde={euro(btw)} />
            <Totaalregel label="Totaal incl. btw" waarde={euro(totaal)} dik />
          </div>

          {fout && <div style={{ fontSize: 13, color: KLEUR.kleiDonker, fontWeight: 600 }}>{fout}</div>}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "14px 20px", borderTop: `1px solid ${KLEUR.lijn}` }}>
          <Knop kind="secondair" onClick={onSluiten}>Annuleren</Knop>
          <Knop kind="primair" onClick={opslaan}>{bezig ? "Bezig…" : "Opslaan als concept"}</Knop>
        </div>
      </div>
    </div>
  );
}

function Totaalregel({ label, waarde, dik }) {
  return (
    <div
      style={{
        display: "flex", justifyContent: "space-between", padding: "3px 0",
        color: dik ? KLEUR.inkt : KLEUR.gedempt, fontWeight: dik ? 800 : 400,
        borderTop: dik ? `1px solid ${KLEUR.baanRand}` : "none",
        marginTop: dik ? 4 : 0, paddingTop: dik ? 8 : 3,
        fontSize: dik ? 15 : 13.5,
      }}
    >
      <span>{label}</span>
      <span>{waarde}</span>
    </div>
  );
}
