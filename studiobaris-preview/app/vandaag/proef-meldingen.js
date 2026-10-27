"use client";

// Proefperiode demo-app op "Vandaag" (alleen Gerrit en Levi zien deze pagina).
// 1. Proefproject geplaatst: een prospect heeft de afgelopen 7 dagen zelf een
//    project in zijn app gezet. Warmste lead: bellen.
// 2. Maandvraag: de proefperiode is voorbij en het is nog geen klant.
//    Nog in traject? Dan verlengen, anders preview + demo-app verwijderen.

import { useState } from "react";
import { KLEUR } from "../werkplek-stijl";

const PREVIEW = "https://preview.studiobaris.nl/";

function datum(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("nl-NL", { day: "numeric", month: "short", timeZone: "Europe/Amsterdam" });
}

function telLink(t) {
  if (!t) return "";
  let d = String(t).replace(/[^0-9+]/g, "");
  if (d.startsWith("0")) d = "+31" + d.slice(1);
  return "tel:" + d;
}

const kaart = { background: "#fff", border: `1px solid ${KLEUR.lijn}`, borderRadius: 14, padding: "14px 16px", display: "grid", gap: 10 };
const rij = { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px 12px", borderTop: `1px solid ${KLEUR.baan}`, paddingTop: 10 };
const knop = { fontSize: 12.5, padding: "6px 11px", borderRadius: 8, border: "1px solid #1A2B3D", background: "#1A2B3D", color: "#fff", fontWeight: 700, cursor: "pointer", textDecoration: "none", fontFamily: "inherit" };
const knopLicht = { ...knop, background: "#fff", color: "#a35400" };
const knopRood = { ...knop, background: "#fff", color: "#c0392b", borderColor: "#e3b9b4" };

export default function ProefMeldingen({ geplaatst = [], maandvraag = [] }) {
  const [bezig, setBezig] = useState("");
  if (geplaatst.length === 0 && maandvraag.length === 0) return null;

  async function post(pad, slug, sleutel) {
    setBezig(sleutel);
    try {
      const res = await fetch(pad, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug }) });
      const j = await res.json();
      if (j.ok) { window.location.reload(); return; }
      alert(j.error || "Mislukt.");
    } catch { alert("Mislukt."); }
    setBezig("");
  }

  function verwijder(p) {
    if (!confirm(`"${p.bedrijf || p.slug}" is niet meer in traject?\n\nDit verwijdert de preview én de demo-app definitief. Dit kan niet ongedaan gemaakt worden.`)) return;
    post("/api/klant/delete", p.slug, "weg-" + p.slug);
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      {geplaatst.length > 0 && (
        <div style={kaart}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15 }}>Proefproject geplaatst</div>
            <div style={{ fontSize: 13, color: KLEUR.gedempt }}>Deze prospects hebben zelf een project in hun app gezet. Bel ze nu het nog vers is.</div>
          </div>
          {geplaatst.map((p) => (
            <div key={p.slug} style={rij}>
              <span style={{ fontWeight: 700 }}>{p.bedrijf || p.slug}</span>
              <span style={{ fontSize: 13, color: KLEUR.gedempt }}>
                {p.geplaatst} van 3 · laatst op {datum(p.laatst_geplaatst_op)}{p.verkoper ? ` · ${p.verkoper}` : ""}
              </span>
              <span style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                {p.telefoon && <a href={telLink(p.telefoon)} style={knop}>Bel {p.telefoon}</a>}
                <a href={PREVIEW + p.slug} target="_blank" rel="noopener" style={knopLicht}>Preview openen</a>
              </span>
            </div>
          ))}
        </div>
      )}

      {maandvraag.length > 0 && (
        <div style={kaart}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15 }}>Nog in traject?</div>
            <div style={{ fontSize: 13, color: KLEUR.gedempt }}>De proefmaand van deze previews is voorbij. Kan het nog klant worden, verleng dan. Zo niet, verwijder preview en demo-app.</div>
          </div>
          {maandvraag.map((p) => (
            <div key={p.slug} style={rij}>
              <span style={{ fontWeight: 700 }}>{p.bedrijf || p.slug}</span>
              <span style={{ fontSize: 13, color: KLEUR.gedempt }}>
                verlopen op {datum(p.tot)} · {p.geplaatst} van 3 geplaatst{p.verkoper ? ` · ${p.verkoper}` : ""}{p.verlengd ? ` · ${p.verlengd}× verlengd` : ""}
              </span>
              <span style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                <button onClick={() => post("/api/proef/verleng", p.slug, "verleng-" + p.slug)} disabled={!!bezig} style={knopLicht}>
                  {bezig === "verleng-" + p.slug ? "Verlengen…" : "Ja, verleng 30 dagen"}
                </button>
                <button onClick={() => verwijder(p)} disabled={!!bezig} style={knopRood}>
                  {bezig === "weg-" + p.slug ? "Verwijderen…" : "Nee, verwijderen"}
                </button>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
