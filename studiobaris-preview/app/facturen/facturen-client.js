"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { KLEUR, HEAD } from "../werkplek-stijl";
import { Knop, Chip } from "../werkplek-shell";

// Het echte sjabloon in Drive — hier vul je zelf de klantgegevens, regels en
// het (hieronder getoonde) volgende nummer in, en exporteer je 'm zelf als
// PDF. Dit dashboard genereert voor deze facturen dus bewust geen PDF meer.
const SJABLOON_URL = "https://drive.google.com/file/d/1vDjsQMx_-OY3svc2hJIQx9vJFXy7S2xB/view";

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
function vandaag() {
  return new Date().toISOString().slice(0, 10);
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
const knopKlein = {
  background: "#fff", border: `1px solid ${KLEUR.lijn2}`, color: KLEUR.klei,
  padding: "7px 11px", borderRadius: 8, fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
};

export default function FacturenClient({ facturen, klanten, volgendNummer, instellingen }) {
  const router = useRouter();
  const [zoek, setZoek] = useState("");
  const [statusFilter, setStatusFilter] = useState("alle");
  const [modalOpen, setModalOpen] = useState(false);
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [versturenBezig, setVersturenBezig] = useState(null);
  const [statusBezig, setStatusBezig] = useState(null);
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

  // Handmatige statuswijziging: het vangnet voor betalingen buiten Mollie om
  // (overschrijving, contant) of om een foutje recht te zetten.
  async function statusWijzigen(nummer, status) {
    setStatusBezig(nummer);
    try {
      const res = await fetch("/api/facturen/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nummer, status }),
      });
      const d = await res.json();
      if (!d.ok) throw new Error(d.error || "Status wijzigen mislukte.");
      router.refresh();
    } catch (e) {
      alert(String(e.message || e));
    }
    setStatusBezig(null);
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
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={() => setLogModalOpen(true)}
            style={{ background: "none", border: "none", color: KLEUR.label, fontSize: 12.5, cursor: "pointer", textDecoration: "underline", fontFamily: "inherit", padding: 0, whiteSpace: "nowrap" }}
          >
            Bijzondere factuur handmatig loggen
          </button>
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
                  <select
                    value={f.status}
                    disabled={statusBezig === f.nummer}
                    onChange={(e) => statusWijzigen(f.nummer, e.target.value)}
                    title="Status handmatig wijzigen"
                    style={{
                      appearance: "none", border: "none", cursor: statusBezig === f.nummer ? "wait" : "pointer",
                      fontFamily: "inherit", fontSize: 12, fontWeight: 700, padding: "3px 22px 3px 10px",
                      borderRadius: 999,
                      background: `${(KLEUR[STATUS_CHIP[f.status] || "grijs"] || KLEUR.grijs).bg} url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'%3E%3Cpath fill='%237A7168' d='M2.5 4.5 6 8l3.5-3.5z'/%3E%3C/svg%3E") no-repeat right 8px center`,
                      backgroundSize: "9px",
                      color: (KLEUR[STATUS_CHIP[f.status] || "grijs"] || KLEUR.grijs).tekst,
                      opacity: statusBezig === f.nummer ? 0.6 : 1,
                    }}
                  >
                    {Object.keys(STATUS_LABEL).map((s) => (
                      <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                    ))}
                  </select>
                </td>
                <td style={td}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <a
                      href={
                        f.pdf_url
                          ? `/api/facturen/bestand?nummer=${encodeURIComponent(f.nummer)}`
                          : `/api/facturen/pdf?nummer=${encodeURIComponent(f.nummer)}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: 12.5, fontWeight: 700, color: KLEUR.klei, textDecoration: "none", whiteSpace: "nowrap" }}
                    >
                      PDF ↓
                    </a>
                    {!f.pdf_url && (
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
                    )}
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
          instellingen={instellingen}
          onSluiten={() => setModalOpen(false)}
          onOpgeslagen={() => {
            setModalOpen(false);
            router.refresh();
          }}
        />
      )}
      {logModalOpen && (
        <LogFactuurModal
          klanten={klanten}
          volgendNummer={volgendNummer}
          onSluiten={() => setLogModalOpen(false)}
          onOpgeslagen={() => {
            setLogModalOpen(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

// Regel-voor-regel: het "echte" formulier voor een nieuwe factuur. Klant
// kiezen, type, en een vrij aantal regels (omschrijving + bedrag per regel —
// meerwerk of een afwijkende prijs is gewoon een extra of aangepaste regel).
// sb_factuur_maak claimt het nummer pas bij "Aanmaken", nooit eerder, en de
// factuur komt altijd als concept binnen: de PDF bekijk je en verstuur je
// zelf pas met "Versturen" in de tabel hierboven.
function NieuweFactuurModal({ klanten, instellingen, onSluiten, onOpgeslagen }) {
  const [slug, setSlug] = useState(klanten[0] ? klanten[0].slug : "");
  const [soort, setSoort] = useState("eenmalig");
  const [periode, setPeriode] = useState(new Date().toISOString().slice(0, 7));
  const [vervaldagen, setVervaldagen] = useState(14);
  const [regels, setRegels] = useState([{ omschrijving: "", bedrag_excl: "" }]);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState("");

  function regelWijzig(i, veld, waarde) {
    setRegels((rs) => rs.map((r, idx) => (idx === i ? { ...r, [veld]: waarde } : r)));
  }
  function regelToevoegen() {
    setRegels((rs) => [...rs, { omschrijving: "", bedrag_excl: "" }]);
  }
  function regelVerwijderen(i) {
    setRegels((rs) => (rs.length > 1 ? rs.filter((_, idx) => idx !== i) : rs));
  }

  const periodeLabel = (() => {
    const [j, m] = periode.split("-").map(Number);
    if (!j || !m) return periode;
    return new Date(j, m - 1, 1).toLocaleDateString("nl-NL", { month: "long", year: "numeric" });
  })();

  // Snel de standaardtarieven invullen (uit Financieel → Instellingen) —
  // blijft daarna gewoon een vrij te bewerken/verwijderen regel, geen
  // vastgezet sjabloon.
  function vulPakket(type) {
    if (type === "vol") {
      setRegels([
        { omschrijving: "Website op maat (eenmalig)", bedrag_excl: String(instellingen.website_eenmalig ?? "") },
        {
          omschrijving: soort === "maandelijks" ? `Abonnement vol pakket — ${periodeLabel}` : "Abonnement vol pakket (eerste maand)",
          bedrag_excl: String(instellingen.maandbedrag_vol ?? ""),
        },
      ]);
    } else {
      setRegels([
        {
          omschrijving: soort === "maandelijks" ? `Abonnement plugin — ${periodeLabel}` : "Abonnement plugin (eerste maand)",
          bedrag_excl: String(instellingen.maandbedrag_plugin ?? ""),
        },
      ]);
    }
  }

  const subtotaal = regels.reduce((s, r) => s + getal(r.bedrag_excl), 0);
  const btw = Math.round(subtotaal * 0.21 * 100) / 100;
  const totaal = Math.round((subtotaal + btw) * 100) / 100;

  async function opslaan() {
    setFout("");
    if (!slug) return setFout("Kies een klant.");
    if (soort === "maandelijks" && !periode) return setFout("Kies een periode.");
    const schoon = regels.map((r) => ({ omschrijving: r.omschrijving.trim(), bedrag_excl: getal(r.bedrag_excl) }));
    if (schoon.some((r) => !r.omschrijving || r.bedrag_excl <= 0)) {
      return setFout("Elke regel heeft een omschrijving en een bedrag groter dan 0 nodig.");
    }

    setBezig(true);
    try {
      const res = await fetch("/api/facturen/nieuw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          soort,
          regels: schoon,
          periode: soort === "maandelijks" ? periode : null,
          vervaldagen: Number(vervaldagen) || 14,
        }),
      });
      const d = await res.json();
      if (!d.ok) throw new Error(d.error || "Aanmaken mislukte.");
      onOpgeslagen();
    } catch (e) {
      setFout(String(e.message || e));
    }
    setBezig(false);
  }

  const regelVeld = { ...veldStijl, marginBottom: 0 };

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(43,39,36,.35)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        padding: "40px 16px", overflowY: "auto", zIndex: 50,
      }}
      onClick={onSluiten}
    >
      <div style={{ ...kaart, maxWidth: 620, width: "100%", overflow: "hidden" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ background: KLEUR.klei, color: "#fff", padding: "16px 20px", fontFamily: HEAD, fontWeight: 800, fontSize: 16 }}>
          Nieuwe factuur
        </div>
        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <span style={labelStijl}>Klant</span>
            <select style={veldStijl} value={slug} onChange={(e) => setSlug(e.target.value)}>
              {klanten.map((k) => (
                <option key={k.slug} value={k.slug}>{k.klant}</option>
              ))}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: soort === "maandelijks" ? "1fr 1fr 100px" : "1fr 100px", gap: 10 }}>
            <div>
              <span style={labelStijl}>Type</span>
              <select style={veldStijl} value={soort} onChange={(e) => setSoort(e.target.value)}>
                <option value="eenmalig">Eenmalig</option>
                <option value="aanbetaling">Aanbetaling</option>
                <option value="slottermijn">Slottermijn</option>
                <option value="maandelijks">Maandelijks</option>
              </select>
            </div>
            {soort === "maandelijks" && (
              <div>
                <span style={labelStijl}>Periode</span>
                <input type="month" style={veldStijl} value={periode} onChange={(e) => setPeriode(e.target.value)} />
              </div>
            )}
            <div>
              <span style={labelStijl}>Vervaltermijn</span>
              <input style={veldStijl} inputMode="numeric" value={vervaldagen} onChange={(e) => setVervaldagen(e.target.value)} />
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" onClick={() => vulPakket("vol")} style={knopKlein}>
              Vol pakket invullen (€{instellingen.website_eenmalig ?? "—"} + €{instellingen.maandbedrag_vol ?? "—"})
            </button>
            <button type="button" onClick={() => vulPakket("plugin")} style={knopKlein}>
              Alleen plugin invullen (€{instellingen.maandbedrag_plugin ?? "—"})
            </button>
          </div>

          <div>
            <span style={labelStijl}>Regels</span>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {regels.map((r, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    style={{ ...regelVeld, flex: "1 1 auto" }}
                    placeholder="Omschrijving"
                    value={r.omschrijving}
                    onChange={(e) => regelWijzig(i, "omschrijving", e.target.value)}
                  />
                  <input
                    style={{ ...regelVeld, width: 110 }}
                    inputMode="decimal"
                    placeholder="Bedrag excl."
                    value={r.bedrag_excl}
                    onChange={(e) => regelWijzig(i, "bedrag_excl", e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => regelVerwijderen(i)}
                    disabled={regels.length === 1}
                    title="Regel verwijderen"
                    style={{
                      background: "none", border: "none", cursor: regels.length === 1 ? "default" : "pointer",
                      color: regels.length === 1 ? KLEUR.lijn2 : KLEUR.label, fontSize: 18, padding: "0 4px", lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={regelToevoegen}
              style={{ marginTop: 8, background: "none", border: "none", color: KLEUR.klei, fontWeight: 700, fontSize: 13, cursor: "pointer", padding: 0, fontFamily: "inherit" }}
            >
              + Regel toevoegen
            </button>
          </div>

          <div style={{ background: KLEUR.baan, borderRadius: 10, padding: "12px 14px", fontSize: 13.5 }}>
            <Totaalregel label="Subtotaal excl. btw" waarde={euro(subtotaal)} />
            <Totaalregel label="Btw 21%" waarde={euro(btw)} />
            <Totaalregel label="Totaal incl. btw" waarde={euro(totaal)} dik />
          </div>

          <div style={{ color: KLEUR.label, fontSize: 12.5 }}>
            Komt binnen als concept — je bekijkt de PDF en verstuurt 'm zelf pas met "Versturen" in de tabel.
          </div>

          {fout && <div style={{ fontSize: 13, color: KLEUR.kleiDonker, fontWeight: 600 }}>{fout}</div>}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "14px 20px", borderTop: `1px solid ${KLEUR.lijn}` }}>
          <Knop kind="secondair" onClick={onSluiten}>Annuleren</Knop>
          <Knop kind="primair" onClick={opslaan}>{bezig ? "Bezig…" : "Aanmaken"}</Knop>
        </div>
      </div>
    </div>
  );
}

// Voor eenmalige/aanbetaling/slottermijn-facturen die je zelf aanmaakt: geen
// regel-voor-regel formulier meer — jij vult het echte sjabloon in Drive in
// (met het hier getoonde volgende nummer) en exporteert 'm zelf als PDF.
// Hier log je 'm daarna: klant, bedrag, datum, status + de PDF erbij.
function LogFactuurModal({ klanten, volgendNummer, onSluiten, onOpgeslagen }) {
  const [slug, setSlug] = useState(klanten[0] ? klanten[0].slug : "");
  const [soort, setSoort] = useState("eenmalig");
  const [omschrijving, setOmschrijving] = useState("");
  const [bedragExcl, setBedragExcl] = useState("");
  const [factuurdatum, setFactuurdatum] = useState(vandaag());
  const [status, setStatus] = useState("verstuurd");
  const [bestand, setBestand] = useState(null);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState("");

  const btw = Math.round(getal(bedragExcl) * 0.21 * 100) / 100;
  const totaal = Math.round((getal(bedragExcl) + btw) * 100) / 100;

  async function opslaan() {
    setFout("");
    if (!slug) return setFout("Kies een klant.");
    if (!omschrijving.trim()) return setFout("Vul een omschrijving in.");
    if (getal(bedragExcl) <= 0) return setFout("Vul een bedrag groter dan 0 in.");
    if (!bestand) return setFout("Voeg de geëxporteerde PDF toe.");

    setBezig(true);
    try {
      const form = new FormData();
      form.set("slug", slug);
      form.set("soort", soort);
      form.set("omschrijving", omschrijving.trim());
      form.set("bedragExcl", String(getal(bedragExcl)));
      form.set("factuurdatum", factuurdatum);
      form.set("status", status);
      form.set("bestand", bestand);

      const res = await fetch("/api/facturen/loggen", { method: "POST", body: form });
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
          <div style={{ background: KLEUR.baan, borderRadius: 10, padding: "12px 14px", fontSize: 13.5, display: "flex", flexDirection: "column", gap: 6 }}>
            <div>
              Volgend nummer: <strong style={{ fontVariantNumeric: "tabular-nums" }}>{volgendNummer || "—"}</strong>
              <span style={{ color: KLEUR.label }}> — vul dit over in het sjabloon.</span>
            </div>
            <a href={SJABLOON_URL} target="_blank" rel="noreferrer" style={{ color: KLEUR.klei, fontWeight: 700, textDecoration: "none" }}>
              Open sjabloon in Drive →
            </a>
            <div style={{ color: KLEUR.label, fontSize: 12.5 }}>
              Vul het sjabloon zelf helemaal in en exporteer 'm als PDF (Bestand → Downloaden → PDF).
              Log 'm daarna hieronder.
            </div>
          </div>

          <div>
            <span style={labelStijl}>Klant</span>
            <select style={veldStijl} value={slug} onChange={(e) => setSlug(e.target.value)}>
              {klanten.map((k) => (
                <option key={k.slug} value={k.slug}>{k.klant}</option>
              ))}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <span style={labelStijl}>Type</span>
              <select style={veldStijl} value={soort} onChange={(e) => setSoort(e.target.value)}>
                <option value="eenmalig">Eenmalig</option>
                <option value="aanbetaling">Aanbetaling</option>
                <option value="slottermijn">Slottermijn</option>
                <option value="maandelijks">Maandelijks</option>
              </select>
            </div>
            <div>
              <span style={labelStijl}>Factuurdatum</span>
              <input type="date" style={veldStijl} value={factuurdatum} onChange={(e) => setFactuurdatum(e.target.value)} />
            </div>
          </div>

          <div>
            <span style={labelStijl}>Omschrijving</span>
            <input
              style={veldStijl}
              placeholder="Bijv. Bouw — website + app instellen"
              value={omschrijving}
              onChange={(e) => setOmschrijving(e.target.value)}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <span style={labelStijl}>Bedrag excl. btw</span>
              <input style={veldStijl} inputMode="decimal" value={bedragExcl} onChange={(e) => setBedragExcl(e.target.value)} />
            </div>
            <div>
              <span style={labelStijl}>Status</span>
              <select style={veldStijl} value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="verstuurd">Verstuurd</option>
                <option value="betaald">Betaald</option>
                <option value="concept">Concept</option>
              </select>
            </div>
          </div>

          <div style={{ background: KLEUR.baan, borderRadius: 10, padding: "12px 14px", fontSize: 13.5 }}>
            <Totaalregel label="Btw 21%" waarde={euro(btw)} />
            <Totaalregel label="Totaal incl. btw" waarde={euro(totaal)} dik />
          </div>

          <div>
            <span style={labelStijl}>Geëxporteerde PDF</span>
            <input
              type="file"
              accept="application/pdf"
              style={veldStijl}
              onChange={(e) => setBestand(e.target.files && e.target.files[0])}
            />
          </div>

          {fout && <div style={{ fontSize: 13, color: KLEUR.kleiDonker, fontWeight: 600 }}>{fout}</div>}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "14px 20px", borderTop: `1px solid ${KLEUR.lijn}` }}>
          <Knop kind="secondair" onClick={onSluiten}>Annuleren</Knop>
          <Knop kind="primair" onClick={opslaan}>{bezig ? "Bezig…" : "Loggen"}</Knop>
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
