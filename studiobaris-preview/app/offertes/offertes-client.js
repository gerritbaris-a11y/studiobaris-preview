"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { KLEUR, HEAD } from "../werkplek-stijl";
import { Knop, Chip } from "../werkplek-shell";

// Zelfde sjabloonbestand als bij facturen — het tabblad "Offerte" daarin.
const SJABLOON_URL = "https://drive.google.com/file/d/1vDjsQMx_-OY3svc2hJIQx9vJFXy7S2xB/view";

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

export default function OffertesClient({ offertes, klanten, volgendNummer }) {
  const router = useRouter();
  const [zoek, setZoek] = useState("");
  const [statusFilter, setStatusFilter] = useState("alle");
  const [modalOpen, setModalOpen] = useState(false);
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
        <div style={{ marginLeft: "auto" }}>
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
                <td style={{ ...td, fontVariantNumeric: "tabular-nums" }}>{euro(o.bedrag_incl)}</td>
                <td style={td}>
                  <Chip kleur={STATUS_CHIP[o.status] || "grijs"}>{STATUS_LABEL[o.status] || o.status}</Chip>
                </td>
                <td style={td}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                    {o.pdf_url && (
                      <a
                        href={`/api/offertes/bestand?nummer=${encodeURIComponent(o.nummer)}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: 12.5, fontWeight: 700, color: KLEUR.klei, textDecoration: "none", whiteSpace: "nowrap" }}
                      >
                        PDF ↓
                      </a>
                    )}
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
        <LogOfferteModal
          klanten={klanten}
          volgendNummer={volgendNummer}
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

// Zelfde aanpak als bij facturen: jij vult het offerte-sjabloon zelf in
// (met het hier getoonde volgende nummer) en exporteert 'm zelf als PDF.
// Hier log je 'm daarna.
function LogOfferteModal({ klanten, volgendNummer, onSluiten, onOpgeslagen }) {
  const [slug, setSlug] = useState(klanten[0] ? klanten[0].slug : "");
  const [omschrijving, setOmschrijving] = useState("");
  const [bedragExcl, setBedragExcl] = useState("");
  const [geldigDagen, setGeldigDagen] = useState("30");
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
      form.set("omschrijving", omschrijving.trim());
      form.set("bedragExcl", String(getal(bedragExcl)));
      form.set("geldigDagen", String(getal(geldigDagen) || 30));
      form.set("status", status);
      form.set("bestand", bestand);

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
      <div
        style={{ ...kaart, maxWidth: 560, width: "100%", overflow: "hidden" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ background: KLEUR.klei, color: "#fff", padding: "16px 20px", fontFamily: HEAD, fontWeight: 800, fontSize: 16 }}>
          Nieuwe offerte
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
              Vul het tabblad "Offerte" zelf helemaal in en exporteer 'm als PDF. Log 'm daarna hieronder.
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

          <div>
            <span style={labelStijl}>Omschrijving</span>
            <input
              style={veldStijl}
              placeholder="Bijv. Eenmalige bouw — website + app instellen"
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
              <span style={labelStijl}>Geldig (dagen)</span>
              <input style={veldStijl} inputMode="numeric" value={geldigDagen} onChange={(e) => setGeldigDagen(e.target.value)} />
            </div>
          </div>

          <div>
            <span style={labelStijl}>Status</span>
            <select style={veldStijl} value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="verstuurd">Verstuurd</option>
              <option value="concept">Concept</option>
            </select>
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
