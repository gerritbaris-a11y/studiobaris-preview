"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { KLEUR, HEAD } from "../werkplek-stijl";
import { Knop, Chip } from "../werkplek-shell";

const STATUS_CHIP = {
  concept: "grijs",
  verstuurd: "amber",
  akkoord: "sage",
  afgewezen: "rust",
  verlopen: "rust",
};

const STATUS_LABEL = {
  concept: "Concept",
  verstuurd: "Verstuurd",
  akkoord: "Akkoord",
  afgewezen: "Afgewezen",
  verlopen: "Verlopen",
};

// Vanuit welke status je waarheen mag: concept → verstuurd → akkoord/afgewezen.
// Verlopen kan vanuit verstuurd, als de klant niet op tijd reageert.
const VOLGENDE_STATUS = {
  concept: ["verstuurd"],
  verstuurd: ["akkoord", "afgewezen", "verlopen"],
  akkoord: [],
  afgewezen: [],
  verlopen: [],
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

// Toont het eenmalige en/of maandelijkse deel van een offerte in de tabel.
// De meeste offertes hebben er maar één van — dan gewoon één bedrag, geen
// overbodige toevoeging.
function BedragWeergave({ o }) {
  const eenmalig = Number(o.bedrag_incl) || 0;
  const maand = Number(o.maand_bedrag_incl) || 0;
  if (eenmalig > 0 && maand > 0) {
    return (
      <div>
        <div>{euro(eenmalig)}</div>
        <div style={{ color: KLEUR.label, fontSize: 12.5 }}>+ {euro(maand)} / mnd</div>
      </div>
    );
  }
  if (maand > 0) return <span>{euro(maand)} / mnd</span>;
  return <span>{euro(eenmalig)}</span>;
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

export default function OffertesClient({ offertes, klanten, volgendNummer }) {
  const router = useRouter();
  const [zoek, setZoek] = useState("");
  const [statusFilter, setStatusFilter] = useState("alle");
  const [modalOpen, setModalOpen] = useState(false);
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [bezigMet, setBezigMet] = useState(null);

  const gefilterd = useMemo(() => {
    const q = zoek.trim().toLowerCase();
    return offertes.filter((o) => {
      if (statusFilter !== "alle" && o.status !== statusFilter) return false;
      if (!q) return true;
      return (
        String(o.nummer || "").toLowerCase().includes(q) ||
        String(o.klant || "").toLowerCase().includes(q) ||
        String(o.contactpersoon || "").toLowerCase().includes(q)
      );
    });
  }, [offertes, zoek, statusFilter]);

  async function statusWijzigen(nummer, status) {
    setBezigMet(nummer);
    try {
      const res = await fetch("/api/offertes/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nummer, status }),
      });
      const d = await res.json();
      if (!d.ok) throw new Error(d.error || "Bijwerken mislukte.");
      router.refresh();
    } catch (e) {
      alert(String(e.message || e));
    }
    setBezigMet(null);
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 16 }}>
        <input
          style={{ ...veldStijl, flex: "1 1 220px" }}
          placeholder="Zoek op klant of offertenummer…"
          value={zoek}
          onChange={(e) => setZoek(e.target.value)}
        />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["alle", "concept", "verstuurd", "akkoord", "afgewezen", "verlopen"].map((s) => (
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
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button type="button" onClick={() => setLogModalOpen(true)} style={knopKlein}>
            Bijzondere offerte loggen
          </button>
          <Knop kind="primair" onClick={() => setModalOpen(true)}>+ Nieuwe offerte</Knop>
        </div>
      </div>

      <div style={{ ...kaart, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>Nr</th>
              <th style={th}>Klant</th>
              <th style={th}>Datum</th>
              <th style={th}>Geldig tot</th>
              <th style={th}>Bedrag</th>
              <th style={th}>Status</th>
              <th style={th}></th>
            </tr>
          </thead>
          <tbody>
            {gefilterd.length === 0 && (
              <tr>
                <td style={{ ...td, borderBottom: "none", color: KLEUR.label }} colSpan={7}>
                  {offertes.length === 0
                    ? "Nog geen offertes — maak de eerste met “+ Nieuwe offerte”."
                    : "Geen offertes die aan dit filter voldoen."}
                </td>
              </tr>
            )}
            {gefilterd.map((o) => (
              <tr key={o.nummer}>
                <td style={{ ...td, fontVariantNumeric: "tabular-nums", fontWeight: 700 }}>{o.nummer}</td>
                <td style={td}>
                  <div style={{ fontWeight: 700 }}>{o.klant}</div>
                  {o.contactpersoon && (
                    <span style={{ color: KLEUR.label, fontSize: 12.5 }}>{o.contactpersoon}</span>
                  )}
                </td>
                <td style={{ ...td, fontVariantNumeric: "tabular-nums" }}>{datumNL(o.offertedatum)}</td>
                <td style={{ ...td, fontVariantNumeric: "tabular-nums" }}>{datumNL(o.geldig_tot)}</td>
                <td style={{ ...td, fontVariantNumeric: "tabular-nums" }}><BedragWeergave o={o} /></td>
                <td style={td}>
                  <Chip kleur={STATUS_CHIP[o.status] || "grijs"}>{STATUS_LABEL[o.status] || o.status}</Chip>
                </td>
                <td style={td}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                    <a
                      href={o.pdf_url ? `/api/offertes/bestand?nummer=${encodeURIComponent(o.nummer)}` : `/api/offertes/pdf?nummer=${encodeURIComponent(o.nummer)}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: 12.5, fontWeight: 700, color: KLEUR.klei, textDecoration: "none", whiteSpace: "nowrap" }}
                    >
                      PDF ↓
                    </a>
                    {(VOLGENDE_STATUS[o.status] || []).map((s) => (
                      <button
                        key={s}
                        onClick={() => statusWijzigen(o.nummer, s)}
                        disabled={bezigMet === o.nummer}
                        style={{
                          background: "none", border: "none", padding: 0, cursor: "pointer",
                          fontSize: 12.5, fontWeight: 700, color: KLEUR.label, whiteSpace: "nowrap",
                          fontFamily: "inherit",
                        }}
                      >
                        {bezigMet === o.nummer ? "Bezig…" : `Markeer ${STATUS_LABEL[s].toLowerCase()}`}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <NieuweOfferteModal
          klanten={klanten}
          onSluiten={() => setModalOpen(false)}
          onOpgeslagen={() => {
            setModalOpen(false);
            router.refresh();
          }}
        />
      )}

      {logModalOpen && (
        <LogOfferteModal
          klanten={klanten}
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

// Gedeeld tussen "+ Nieuwe offerte" en "Bijzondere offerte loggen": vrije
// regels, elk met een aantal, een prijs per stuk en of het eenmalig of
// maandelijks is. Bevat de offerte beide soorten, dan splitst de PDF
// vanzelf in twee blokken — bij bijvoorbeeld alleen een plugin-afname
// verschijnt er gewoon één blok.
function OfferteRegelsEditor({ regels, onWijzig, onToevoegen, onVerwijderen }) {
  const regelVeld = { ...veldStijl, marginBottom: 0 };
  return (
    <div>
      <span style={labelStijl}>Regels</span>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {regels.map((r, i) => (
          <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              style={{ ...regelVeld, flex: "1 1 auto" }}
              placeholder="Omschrijving"
              value={r.omschrijving}
              onChange={(e) => onWijzig(i, "omschrijving", e.target.value)}
            />
            <input
              style={{ ...regelVeld, width: 64 }}
              inputMode="numeric"
              placeholder="Aantal"
              value={r.aantal}
              onChange={(e) => onWijzig(i, "aantal", e.target.value)}
            />
            <input
              style={{ ...regelVeld, width: 100 }}
              inputMode="decimal"
              placeholder="Per stuk"
              value={r.bedrag_per_stuk}
              onChange={(e) => onWijzig(i, "bedrag_per_stuk", e.target.value)}
            />
            <select
              style={{ ...regelVeld, width: 132 }}
              value={r.soort}
              onChange={(e) => onWijzig(i, "soort", e.target.value)}
            >
              <option value="eenmalig">Eenmalig</option>
              <option value="maandelijks">Maandelijks</option>
            </select>
            <button
              type="button"
              onClick={() => onVerwijderen(i)}
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
        onClick={onToevoegen}
        style={{ marginTop: 8, background: "none", border: "none", color: KLEUR.klei, fontWeight: 700, fontSize: 13, cursor: "pointer", padding: 0, fontFamily: "inherit" }}
      >
        + Regel toevoegen
      </button>
    </div>
  );
}

// Splitst regels in een eenmalig en maandelijks subtotaal — voor de
// live-preview in beide modals, precies zoals de PDF het straks toont.
function totalenPerSoort(regels) {
  const perSoort = (soort) =>
    regels.filter((r) => (soort === "maandelijks" ? r.soort === "maandelijks" : r.soort !== "maandelijks"));
  const excl = (lijst) => lijst.reduce((s, r) => s + getal(r.aantal || 1) * getal(r.bedrag_per_stuk), 0);
  const eenmaligExcl = excl(perSoort("eenmalig"));
  const maandExcl = excl(perSoort("maandelijks"));
  return {
    eenmaligExcl,
    eenmaligBtw: Math.round(eenmaligExcl * 0.21 * 100) / 100,
    eenmaligIncl: Math.round((eenmaligExcl + Math.round(eenmaligExcl * 0.21 * 100) / 100) * 100) / 100,
    maandExcl,
    maandBtw: Math.round(maandExcl * 0.21 * 100) / 100,
    maandIncl: Math.round((maandExcl + Math.round(maandExcl * 0.21 * 100) / 100) * 100) / 100,
  };
}

function TotalenPreview({ regels }) {
  const t = totalenPerSoort(regels);
  const heeftEenmalig = regels.some((r) => r.soort !== "maandelijks");
  const heeftMaand = regels.some((r) => r.soort === "maandelijks");
  return (
    <div style={{ background: KLEUR.baan, borderRadius: 10, padding: "12px 14px", fontSize: 13.5, display: "flex", flexDirection: "column", gap: 10 }}>
      {heeftEenmalig && (
        <div>
          <Totaalregel label="Subtotaal excl. btw" waarde={euro(t.eenmaligExcl)} />
          <Totaalregel label="Btw 21%" waarde={euro(t.eenmaligBtw)} />
          <Totaalregel label="Totaal incl. btw" waarde={euro(t.eenmaligIncl)} dik />
        </div>
      )}
      {heeftMaand && (
        <div>
          <Totaalregel label="Subtotaal excl. btw / mnd" waarde={euro(t.maandExcl)} />
          <Totaalregel label="Btw 21% / mnd" waarde={euro(t.maandBtw)} />
          <Totaalregel label="Totaal incl. btw / mnd" waarde={euro(t.maandIncl)} dik />
        </div>
      )}
    </div>
  );
}

const NIEUWE_REGEL = { omschrijving: "", aantal: "1", bedrag_per_stuk: "", soort: "eenmalig" };

// De reguliere flow: vrije regels, automatisch dezelfde opmaak als iedere
// andere offerte. Komt binnen als concept of verstuurd — de PDF genereert
// het dashboard zelf, precies zoals bij facturen.
function NieuweOfferteModal({ klanten, onSluiten, onOpgeslagen }) {
  const [slug, setSlug] = useState(klanten[0] ? klanten[0].slug : "");
  const [regels, setRegels] = useState([{ ...NIEUWE_REGEL }]);
  const [geldigDagen, setGeldigDagen] = useState("30");
  const [intro, setIntro] = useState("");
  const [status, setStatus] = useState("concept");
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState("");

  function regelWijzig(i, veld, waarde) {
    setRegels((rs) => rs.map((r, idx) => (idx === i ? { ...r, [veld]: waarde } : r)));
  }
  function regelToevoegen() {
    setRegels((rs) => [...rs, { ...NIEUWE_REGEL }]);
  }
  function regelVerwijderen(i) {
    setRegels((rs) => (rs.length > 1 ? rs.filter((_, idx) => idx !== i) : rs));
  }

  async function opslaan() {
    setFout("");
    if (!slug) return setFout("Kies een klant.");
    const schoon = regels.map((r) => ({
      omschrijving: r.omschrijving.trim(),
      aantal: getal(r.aantal) || 1,
      bedrag_per_stuk: getal(r.bedrag_per_stuk),
      soort: r.soort === "maandelijks" ? "maandelijks" : "eenmalig",
    }));
    if (schoon.some((r) => !r.omschrijving || r.bedrag_per_stuk <= 0)) {
      return setFout("Elke regel heeft een omschrijving en een bedrag groter dan 0 nodig.");
    }

    setBezig(true);
    try {
      const res = await fetch("/api/offertes/nieuw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          regels: schoon,
          geldigDagen: getal(geldigDagen) || 30,
          intro: intro.trim() || null,
          status,
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

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(43,39,36,.35)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        padding: "40px 16px", overflowY: "auto", zIndex: 50,
      }}
      onClick={onSluiten}
    >
      <div style={{ ...kaart, maxWidth: 640, width: "100%", overflow: "hidden" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ background: KLEUR.klei, color: "#fff", padding: "16px 20px", fontFamily: HEAD, fontWeight: 800, fontSize: 16 }}>
          Nieuwe offerte
        </div>
        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10 }}>
            <div>
              <span style={labelStijl}>Klant</span>
              <select style={veldStijl} value={slug} onChange={(e) => setSlug(e.target.value)}>
                {klanten.map((k) => (
                  <option key={k.slug} value={k.slug}>{k.klant}</option>
                ))}
              </select>
            </div>
            <div>
              <span style={labelStijl}>Geldig (dagen)</span>
              <input style={veldStijl} inputMode="numeric" value={geldigDagen} onChange={(e) => setGeldigDagen(e.target.value)} />
            </div>
          </div>

          <div>
            <span style={labelStijl}>Intro (optioneel)</span>
            <textarea
              style={{ ...veldStijl, minHeight: 60, resize: "vertical" }}
              placeholder="Een korte openingsregel bij het voorstel…"
              value={intro}
              onChange={(e) => setIntro(e.target.value)}
            />
          </div>

          <OfferteRegelsEditor regels={regels} onWijzig={regelWijzig} onToevoegen={regelToevoegen} onVerwijderen={regelVerwijderen} />

          <TotalenPreview regels={regels} />

          <div>
            <span style={labelStijl}>Status</span>
            <select style={veldStijl} value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="concept">Concept</option>
              <option value="verstuurd">Verstuurd</option>
            </select>
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

// Voor het bijzondere geval: een offerte vastleggen die niet via de
// reguliere flow gaat (bijvoorbeeld al akkoord of afgewezen). Verder
// dezelfde vrije regels en standaard dezelfde automatisch gegenereerde
// PDF-opmaak. Een eigen PDF uploaden kan nog steeds, voor het enkele geval
// dat de standaardopmaak echt niet past.
function LogOfferteModal({ klanten, onSluiten, onOpgeslagen }) {
  const [slug, setSlug] = useState(klanten[0] ? klanten[0].slug : "");
  const [regels, setRegels] = useState([{ ...NIEUWE_REGEL }]);
  const [geldigDagen, setGeldigDagen] = useState("30");
  const [intro, setIntro] = useState("");
  const [status, setStatus] = useState("verstuurd");
  const [bestand, setBestand] = useState(null);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState("");

  function regelWijzig(i, veld, waarde) {
    setRegels((rs) => rs.map((r, idx) => (idx === i ? { ...r, [veld]: waarde } : r)));
  }
  function regelToevoegen() {
    setRegels((rs) => [...rs, { ...NIEUWE_REGEL }]);
  }
  function regelVerwijderen(i) {
    setRegels((rs) => (rs.length > 1 ? rs.filter((_, idx) => idx !== i) : rs));
  }

  async function opslaan() {
    setFout("");
    if (!slug) return setFout("Kies een klant.");
    const schoon = regels.map((r) => ({
      omschrijving: r.omschrijving.trim(),
      aantal: getal(r.aantal) || 1,
      bedrag_per_stuk: getal(r.bedrag_per_stuk),
      soort: r.soort === "maandelijks" ? "maandelijks" : "eenmalig",
    }));
    if (schoon.some((r) => !r.omschrijving || r.bedrag_per_stuk <= 0)) {
      return setFout("Elke regel heeft een omschrijving en een bedrag groter dan 0 nodig.");
    }

    setBezig(true);
    try {
      const form = new FormData();
      form.set("slug", slug);
      form.set("regels", JSON.stringify(schoon));
      form.set("geldigDagen", String(getal(geldigDagen) || 30));
      form.set("intro", intro.trim());
      form.set("status", status);
      if (bestand) form.set("bestand", bestand);

      const res = await fetch("/api/offertes/loggen", { method: "POST", body: form });
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
      <div style={{ ...kaart, maxWidth: 640, width: "100%", overflow: "hidden" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ background: KLEUR.klei, color: "#fff", padding: "16px 20px", fontFamily: HEAD, fontWeight: 800, fontSize: 16 }}>
          Bijzondere offerte loggen
        </div>
        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: KLEUR.baan, borderRadius: 10, padding: "12px 14px", fontSize: 12.5, color: KLEUR.label }}>
            Voor het bijzondere geval: een offerte vastleggen die al akkoord of afgewezen is, of een correctie.
            Zonder eigen PDF ziet de offerte er straks precies zo uit als elke andere.
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10 }}>
            <div>
              <span style={labelStijl}>Klant</span>
              <select style={veldStijl} value={slug} onChange={(e) => setSlug(e.target.value)}>
                {klanten.map((k) => (
                  <option key={k.slug} value={k.slug}>{k.klant}</option>
                ))}
              </select>
            </div>
            <div>
              <span style={labelStijl}>Geldig (dagen)</span>
              <input style={veldStijl} inputMode="numeric" value={geldigDagen} onChange={(e) => setGeldigDagen(e.target.value)} />
            </div>
          </div>

          <div>
            <span style={labelStijl}>Intro (optioneel)</span>
            <textarea
              style={{ ...veldStijl, minHeight: 60, resize: "vertical" }}
              placeholder="Een korte openingsregel bij het voorstel…"
              value={intro}
              onChange={(e) => setIntro(e.target.value)}
            />
          </div>

          <OfferteRegelsEditor regels={regels} onWijzig={regelWijzig} onToevoegen={regelToevoegen} onVerwijderen={regelVerwijderen} />

          <TotalenPreview regels={regels} />

          <div>
            <span style={labelStijl}>Status</span>
            <select style={veldStijl} value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="concept">Concept</option>
              <option value="verstuurd">Verstuurd</option>
              <option value="akkoord">Akkoord</option>
              <option value="afgewezen">Afgewezen</option>
              <option value="verlopen">Verlopen</option>
            </select>
          </div>

          <div>
            <span style={labelStijl}>Eigen PDF (optioneel)</span>
            <input
              type="file"
              accept="application/pdf"
              style={veldStijl}
              onChange={(e) => setBestand(e.target.files && e.target.files[0])}
            />
            <div style={{ color: KLEUR.label, fontSize: 12.5, marginTop: 4 }}>
              Leeg laten voor de standaardopmaak — precies zoals bij een gewone offerte.
            </div>
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
