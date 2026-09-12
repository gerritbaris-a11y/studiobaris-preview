"use client";

import { useState } from "react";
import { KLEUR, HEAD } from "../werkplek-stijl";
import {
  Contactpersoon, GegevensEditor, VerwijderKnop,
  MarkeerAlsKlantKnop, MarkeerAlsOudKlantKnop, HeractiveerKlantKnop,
} from "../dashboard/dashboard-actions";
import AfspraakForm from "../abonnementen/afspraak-form";

// Eén rij op het Klantenregister — klap open voor het volledige plaatje
// (adres, KvK, BTW, WhatsApp) plus bewerken en de minder alledaagse acties
// (oud-klant markeren, heractiveren, verwijderen). variant bepaalt welke
// kolommen en knoppen horen bij "klanten" / "toekomstig" / "oud".

const td = { padding: "8px 14px" };
const veldLabel = { color: KLEUR.label, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 2 };

function PakketLabel({ type }) {
  return type === "plugin" ? "Alleen plugin" : type === "vol" ? "Vol pakket" : "—";
}

function euro(v) {
  const n = Number(v) || 0;
  return "€ " + n.toFixed(2).replace(".", ",");
}

const MAANDEN = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
function datumPlus14(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  d.setDate(d.getDate() + 14);
  return `${d.getDate()} ${MAANDEN[d.getMonth()]}`;
}

const actieKnop = {
  background: "#fff", color: KLEUR.klei, border: `1px solid ${KLEUR.lijn2}`,
  padding: "6px 11px", borderRadius: 8, fontSize: 12.5, fontWeight: 700,
  cursor: "pointer", whiteSpace: "nowrap", fontFamily: HEAD,
};

// Optie 5 — de slottermijn. Alleen relevant zolang er nog een restbedrag
// openstaat en er niet al een aankondiging onderweg is; de eigenlijke
// incasso gebeurt niet hier maar 14 dagen later door de dagelijkse cron.
function SlottermijnKnop({ r }) {
  const [open, setOpen] = useState(false);
  const [bedrag, setBedrag] = useState(r.restbedrag != null ? String(r.restbedrag) : "");
  const [bezig, setBezig] = useState(false);
  const [melding, setMelding] = useState("");

  if (r.rest_status === "betaald") {
    return <span style={{ fontSize: 12.5, color: KLEUR.label }}>Slottermijn betaald ✓</span>;
  }
  if (r.rest_status === "aangekondigd") {
    const rond = datumPlus14(r.slottermijn_aangekondigd_op);
    return (
      <span style={{ fontSize: 12.5, color: KLEUR.label }}>
        Slottermijn aangekondigd{rond ? ` — incasso rond ${rond}` : ""}
      </span>
    );
  }
  if (r.rest_status === "open") {
    return <span style={{ fontSize: 12.5, color: KLEUR.label }}>Slottermijn: incasso wordt verwerkt…</span>;
  }
  if (!(Number(r.restbedrag) > 0)) return null;

  async function versturen() {
    setBezig(true);
    setMelding("");
    try {
      const res = await fetch("/api/abonnement/slottermijn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: r.slug, bedrag }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Versturen mislukte.");
      location.reload();
    } catch (e) {
      setMelding(String(e.message || e));
      setBezig(false);
    }
  }

  return (
    <div>
      <button onClick={() => setOpen((v) => !v)} style={actieKnop}>
        {open ? "Sluiten" : "Slottermijn versturen"}
      </button>
      {open && (
        <div style={{ marginTop: 8, background: "#fafbfc", border: `1px solid ${KLEUR.lijn}`, borderRadius: 8, padding: "10px 12px", width: 220 }}>
          <span style={{ fontSize: 11, color: KLEUR.label, fontWeight: 700, display: "block", marginBottom: 2 }}>
            Bedrag, excl. btw
          </span>
          <input
            style={{ width: "100%", padding: "5px 7px", border: `1px solid ${KLEUR.lijn2}`, borderRadius: 6, fontSize: 13 }}
            inputMode="decimal"
            value={bedrag}
            onChange={(e) => setBedrag(e.target.value)}
          />
          <div style={{ fontSize: 11.5, color: KLEUR.label, marginTop: 6 }}>
            Verstuurt meteen de wettelijke 14-dagen-vooraankondiging per mail. De incasso zelf volgt
            automatisch daarna, zonder tussenkomst — mits er een SEPA-mandaat is.
          </div>
          <button
            onClick={versturen}
            disabled={bezig || !(Number(String(bedrag).replace(",", ".")) > 0)}
            style={{ ...actieKnop, marginTop: 8, background: KLEUR.klei, color: "#fff", border: "none", opacity: bezig ? 0.6 : 1 }}
          >
            {bezig ? "Bezig…" : "Versturen"}
          </button>
          {melding && <div style={{ fontSize: 12, color: KLEUR.kleiDonker, marginTop: 6 }}>{melding}</div>}
        </div>
      )}
    </div>
  );
}

// Telefoonnummers komen soms met spaties/streepjes binnen (bijv. handmatig
// overgetypt); voor een uniforme kolom laten we alleen cijfers en een
// eventuele voorloop-"+" staan.
function schoonTelefoon(v) {
  if (!v) return v;
  return String(v).replace(/[^\d+]/g, "");
}

export default function KlantRij({ r, variant }) {
  const [open, setOpen] = useState(false);
  const telefoon = schoonTelefoon(r.lead_phone || r.b_telefoon) || "—";
  const email = r.lead_email || r.b_email || "—";
  const kolommen = variant === "klant" ? 8 : 6;
  // Portefeuille-filter (VerkoperFilter) werkt alleen op de Klanten-tabel —
  // data-attributen daarom alleen daar meegeven, anders zou een filterklik
  // ook rijen op Toekomstig/Oud onterecht verbergen.
  const filterAttrs = variant === "klant" ? { "data-verzamelaar": r.verzamelaar || "", "data-rij-hoofd": "1" } : {};
  const filterAttrsDetail = variant === "klant" ? { "data-verzamelaar": r.verzamelaar || "" } : {};

  return (
    <>
      <tr
        style={{ borderTop: `1px solid ${KLEUR.baanRand}`, cursor: "pointer" }}
        onClick={() => setOpen((v) => !v)}
        {...filterAttrs}
      >
        {variant !== "toekomstig" && (
          <td style={{ ...td, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{r.klantnummer || "—"}</td>
        )}
        <td style={{ ...td, fontWeight: 700 }}>
          {r.company_name || r.slug}{" "}
          <span style={{ color: KLEUR.label, fontWeight: 400, fontSize: 12 }}>{open ? "▲" : "▾"}</span>
        </td>
        <td style={td}>{r.contactpersoon || "—"}</td>
        <td style={{ ...td, whiteSpace: "nowrap" }}>{telefoon}</td>
        <td style={td}>{email}</td>
        {variant !== "oud" && <td style={td}><PakketLabel type={r.pakket_type} /></td>}
        {variant === "klant" && (
          <td style={{ ...td, color: KLEUR.gedempt }}>{r.verzamelaar || "—"}</td>
        )}
        {variant === "klant" && (
          <td style={{ ...td, textAlign: "right" }}>{r.maandbedrag ? euro(r.maandbedrag) + " p/m" : "—"}</td>
        )}
        {variant === "toekomstig" && (
          <td style={{ ...td, textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
            <MarkeerAlsKlantKnop slug={r.slug} bedrijf={r.company_name} data={r} />
          </td>
        )}
        {variant === "oud" && (
          <td style={{ ...td, textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
            <HeractiveerKlantKnop slug={r.slug} bedrijf={r.company_name} />
          </td>
        )}
      </tr>
      {open && (
        <tr style={{ background: KLEUR.baan }} {...filterAttrsDetail}>
          <td colSpan={kolommen} style={{ padding: "14px 18px" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "grid", gap: 12 }}>
              {variant !== "oud" && (
                <div style={{ fontSize: 13.5 }}>
                  <span style={veldLabel}>Websiteprijs</span>{r.websiteprijs ? euro(r.websiteprijs) : "—"}
                </div>
              )}

              <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-start", borderTop: `1px solid ${KLEUR.baanRand}`, paddingTop: 12 }}>
                <Contactpersoon slug={r.slug} value={r.contactpersoon} />
                <GegevensEditor slug={r.slug} data={r} defaultOpen />
              </div>

              {(variant === "klant" || variant === "toekomstig") && (
                <div style={{ borderTop: `1px solid ${KLEUR.baanRand}`, paddingTop: 12 }}>
                  <div style={{ fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: KLEUR.label, fontWeight: 700, marginBottom: 8 }}>
                    De afspraak
                  </div>
                  <AfspraakForm rij={r} onKlaar={() => location.reload()} />
                  {variant === "toekomstig" && (
                    <div style={{ fontSize: 12, color: KLEUR.label, marginTop: 8 }}>
                      Let op: "Vastleggen" geeft meteen een klantnummer — hij verschijnt hierna bij "Klanten".
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", borderTop: `1px solid ${KLEUR.baanRand}`, paddingTop: 12 }}>
                {variant === "klant" && (
                  <a href={`/facturen?klant=${encodeURIComponent(r.slug)}`} style={{ color: KLEUR.klei, fontWeight: 700, fontSize: 13, textDecoration: "none" }}>
                    Facturen bekijken →
                  </a>
                )}
                {variant === "klant" && <SlottermijnKnop r={r} />}
                {variant === "klant" && (
                  <MarkeerAlsOudKlantKnop slug={r.slug} bedrijf={r.company_name} heeftActiefAbonnement={r.betaal_status === "actief"} />
                )}
                {variant === "toekomstig" && <MarkeerAlsKlantKnop slug={r.slug} bedrijf={r.company_name} data={r} />}
                {variant === "oud" && <HeractiveerKlantKnop slug={r.slug} bedrijf={r.company_name} />}
                <div style={{ marginLeft: "auto" }}>
                  <VerwijderKnop slug={r.slug} naam={r.company_name} />
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
