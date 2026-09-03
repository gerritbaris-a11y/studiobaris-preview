"use client";

import { useState } from "react";
import { KLEUR } from "../werkplek-stijl";
import {
  Contactpersoon, GegevensEditor, VerwijderKnop,
  MarkeerAlsKlantKnop, MarkeerAlsOudKlantKnop, HeractiveerKlantKnop,
} from "../dashboard/dashboard-actions";

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

export default function KlantRij({ r, variant }) {
  const [open, setOpen] = useState(false);
  const telefoon = r.lead_phone || r.b_telefoon || "—";
  const email = r.lead_email || r.b_email || "—";
  const kolommen = variant === "klant" ? 7 : 6;

  return (
    <>
      <tr
        style={{ borderTop: `1px solid ${KLEUR.baanRand}`, cursor: "pointer" }}
        onClick={() => setOpen((v) => !v)}
      >
        {variant !== "toekomstig" && (
          <td style={{ ...td, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{r.klantnummer || "—"}</td>
        )}
        <td style={{ ...td, fontWeight: 700 }}>
          {r.company_name || r.slug}{" "}
          <span style={{ color: KLEUR.label, fontWeight: 400, fontSize: 12 }}>{open ? "▲" : "▾"}</span>
        </td>
        <td style={td}>{r.contactpersoon || "—"}</td>
        <td style={td}>{telefoon}</td>
        <td style={td}>{email}</td>
        {variant !== "oud" && <td style={td}><PakketLabel type={r.pakket_type} /></td>}
        {variant === "klant" && (
          <td style={{ ...td, textAlign: "right" }}>{r.maandbedrag ? euro(r.maandbedrag) + " p/m" : "—"}</td>
        )}
        {variant === "toekomstig" && (
          <td style={{ ...td, textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
            <MarkeerAlsKlantKnop slug={r.slug} bedrijf={r.company_name} />
          </td>
        )}
        {variant === "oud" && (
          <td style={{ ...td, textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
            <HeractiveerKlantKnop slug={r.slug} bedrijf={r.company_name} />
          </td>
        )}
      </tr>
      {open && (
        <tr style={{ background: KLEUR.baan }}>
          <td colSpan={kolommen} style={{ padding: "14px 18px" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "10px 20px", fontSize: 13.5 }}>
                <div><span style={veldLabel}>Adres</span>{r.b_adres || "—"}</div>
                <div><span style={veldLabel}>KvK</span>{r.b_kvk || "—"}</div>
                <div><span style={veldLabel}>BTW-nummer</span>{r.b_btw || "—"}</div>
                <div><span style={veldLabel}>WhatsApp</span>{r.b_whatsapp || "—"}</div>
                {variant !== "oud" && (
                  <div><span style={veldLabel}>Websiteprijs</span>{r.websiteprijs ? euro(r.websiteprijs) : "—"}</div>
                )}
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-start", borderTop: `1px solid ${KLEUR.baanRand}`, paddingTop: 12 }}>
                <Contactpersoon slug={r.slug} value={r.contactpersoon} />
                <GegevensEditor slug={r.slug} data={r} />
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", borderTop: `1px solid ${KLEUR.baanRand}`, paddingTop: 12 }}>
                {variant === "klant" && (
                  <a href={`/facturen?klant=${encodeURIComponent(r.slug)}`} style={{ color: KLEUR.klei, fontWeight: 700, fontSize: 13, textDecoration: "none" }}>
                    Facturen bekijken →
                  </a>
                )}
                {variant === "klant" && (
                  <MarkeerAlsOudKlantKnop slug={r.slug} bedrijf={r.company_name} heeftActiefAbonnement={r.betaal_status === "actief"} />
                )}
                {variant === "toekomstig" && <MarkeerAlsKlantKnop slug={r.slug} bedrijf={r.company_name} />}
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
