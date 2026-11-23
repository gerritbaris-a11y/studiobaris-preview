"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Chip } from "../werkplek-shell";
import { KLEUR, HEAD } from "../werkplek-stijl";

// Bring a friend in het Beheren-paneel. Bewust zo simpel mogelijk: één
// keuzeveld "Aangebracht door". De rest (gratis maand toekennen bij de eerste
// betaling, verrekenen op de maandfactuur, Mollie een maand overslaan) gaat
// vanzelf. Brengt iemand meerdere klanten aan, dan krijgt hij per klant een
// maand; die worden één voor één, maand na maand, verrekend.

const MAANDEN = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
function maandNL(periode) {
  if (!periode) return "";
  const [j, m] = String(periode).split("-");
  return `${MAANDEN[Number(m) - 1] || m} ${j}`;
}

const knop = {
  padding: "6px 11px", borderRadius: 8, fontSize: 12.5, fontWeight: 700, cursor: "pointer",
  border: `1px solid ${KLEUR.lijn2}`, background: "#fff", color: KLEUR.inkt, fontFamily: HEAD,
};

export default function BringAFriend({ rij, overzicht, klanten }) {
  const router = useRouter();
  const [bezig, setBezig] = useState("");
  const [melding, setMelding] = useState("");

  if (!overzicht) {
    return (
      <div style={{ fontSize: 13, color: KLEUR.gedempt }}>
        Bring a friend is nog niet actief: de database-update (supabase/bring_a_friend.sql) moet nog één keer gedraaid worden.
      </div>
    );
  }

  const huidig = overzicht.aangebracht_door ? overzicht.aangebracht_door.slug : "";
  const toegekend = !!overzicht.toegekend_op;
  const tegoeden = Array.isArray(overzicht.tegoeden) ? overzicht.tegoeden : [];
  const vrienden = Array.isArray(overzicht.vrienden) ? overzicht.vrienden : [];
  const open = tegoeden.filter((t) => t.status === "gepland");
  const opties = (klanten || []).filter((k) => k.slug !== rij.slug);

  async function stuur(body, klaar) {
    setBezig(body.actie + (body.tegoedId || ""));
    setMelding("");
    try {
      const res = await fetch("/api/bring-a-friend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Dat lukte niet.");
      setMelding(klaar);
      router.refresh();
    } catch (e) {
      setMelding(String(e.message || e));
    } finally {
      setBezig("");
    }
  }

  return (
    <div style={{ display: "grid", gap: 10, background: "#fff", border: `1px solid ${KLEUR.lijn}`, borderRadius: 10, padding: "12px 14px" }}>
      <label style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", fontSize: 13.5 }}>
        <span style={{ fontWeight: 700 }}>Aangebracht door</span>
        <select
          value={huidig}
          disabled={toegekend || bezig === "aanbrenger"}
          onChange={(e) =>
            stuur(
              { actie: "aanbrenger", slug: rij.slug, aanbrenger: e.target.value },
              e.target.value ? "Opgeslagen. De gratis maanden volgen vanzelf na de eerste betaling." : "Gewist."
            )
          }
          style={{ padding: "6px 8px", fontSize: 13.5, borderRadius: 8, border: `1px solid ${KLEUR.lijn2}`, background: "#fff", color: KLEUR.inkt, minWidth: 220 }}
        >
          <option value="">— niemand —</option>
          {opties.map((k) => (
            <option key={k.slug} value={k.slug}>{k.company_name || k.slug}</option>
          ))}
        </select>
      </label>

      {huidig && !toegekend && (
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", fontSize: 13 }}>
          <Chip kleur="sage">Bring a friend</Chip>
          <span style={{ color: KLEUR.gedempt }}>
            Beide klanten krijgen 1 maand gratis zodra de eerste betaling binnen is.
          </span>
          <button
            style={knop}
            disabled={bezig === "toekennen"}
            title="Alleen nodig als deze klant de eerste keer buiten Mollie om (per bank) heeft betaald."
            onClick={() => {
              if (window.confirm("Eerste betaling al binnen (bijv. per bank)? Dan nu de gratis maanden toekennen.")) {
                stuur({ actie: "toekennen", slug: rij.slug }, "Toegekend: beide klanten hebben een gratis maand tegoed.");
              }
            }}
          >
            {bezig === "toekennen" ? "Bezig…" : "Al betaald? Nu toekennen"}
          </button>
        </div>
      )}

      {vrienden.length > 0 && (
        <div style={{ fontSize: 13, color: KLEUR.gedempt }}>
          Heeft {vrienden.length === 1 ? "1 klant" : `${vrienden.length} klanten`} aangebracht:{" "}
          {vrienden.map((v) => v.naam + (v.toegekend_op ? "" : " (wacht op eerste betaling)")).join(", ")}
        </div>
      )}

      {tegoeden.length > 0 && (
        <div style={{ display: "grid", gap: 6 }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>
            Gratis maanden: {open.length} gepland
            {tegoeden.length - open.length > 0 ? `, ${tegoeden.filter((t) => t.status === "verrekend").length} verrekend` : ""}
          </div>
          {tegoeden.map((t) => (
            <div key={t.id} style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", fontSize: 13 }}>
              <Chip kleur={t.status === "gepland" ? "amber" : t.status === "verrekend" ? "sage" : "grijs"}>
                {t.status === "gepland" ? "Gepland" : t.status === "verrekend" ? `Verrekend ${maandNL(t.periode)}` : "Ingetrokken"}
              </Chip>
              <span style={{ color: KLEUR.gedempt }}>
                via {t.gekoppeld_aan_naam || "—"}{t.factuur ? ` · factuur ${t.factuur}` : ""}
              </span>
              {t.status === "gepland" && (
                <button
                  style={{ ...knop, marginLeft: "auto", color: KLEUR.kleiDonker, borderColor: "#E8C9C2" }}
                  disabled={bezig === "intrekken" + t.id}
                  onClick={() => {
                    if (window.confirm("Deze gratis maand schrappen?")) {
                      stuur({ actie: "intrekken", tegoedId: t.id }, "Gratis maand ingetrokken.");
                    }
                  }}
                >
                  Intrekken
                </button>
              )}
            </div>
          ))}
          {open.length > 0 && rij.betaal_status === "actief" && !rij.betaal_abonnement_id && (
            <div style={{ fontSize: 12.5, color: KLEUR.kleiDonker }}>
              Let op: deze klant heeft geen automatische incasso. Verreken de gratis maand handmatig op de volgende factuur.
            </div>
          )}
          {open.length > 0 && (
            <div style={{ fontSize: 12.5, color: KLEUR.label }}>
              Wordt vanzelf verrekend: de eerstvolgende maandfactuur wordt € 0,00 en Mollie schrijft die maand niets af.
              Meerdere gratis maanden komen achter elkaar.
            </div>
          )}
        </div>
      )}

      {melding && <div style={{ fontSize: 13, color: KLEUR.gedempt }}>{melding}</div>}
    </div>
  );
}
