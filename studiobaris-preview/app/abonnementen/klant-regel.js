"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AfspraakForm from "./afspraak-form";
import { Chip } from "../werkplek-shell";
import { KLEUR, HEAD } from "../werkplek-stijl";

// Eén klant in het overzicht: de regel zelf, en daaronder — als je 'm opent —
// alles wat je met zijn geld kunt doen. Facturen, de afspraak, opzeggen.

function euro(v) {
  const n = Number(v) || 0;
  return "€ " + n.toFixed(2).replace(".", ",");
}

const MAANDEN = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
function datumNL(iso) {
  if (!iso) return null;
  const d = String(iso).slice(0, 10).split("-");
  if (d.length !== 3) return null;
  return `${Number(d[2])} ${MAANDEN[Number(d[1]) - 1]}`;
}

function status(rij) {
  if (rij.betaal_status === "actief" && rij.betaal_abonnement_id) return { tekst: "Loopt", kleur: "sage" };
  if (rij.betaal_status === "opgezegd") return { tekst: "Opgezegd", kleur: "grijs" };
  if (rij.betaal_status === "mislukt") return { tekst: "Betaling mislukt", kleur: "rust" };
  if (rij.betaal_status === "akkoord") return { tekst: "Wacht op betaling", kleur: "amber" };
  return { tekst: "Nog geen machtiging", kleur: "grijs" };
}

const td = { padding: "13px 14px", borderBottom: `1px solid ${KLEUR.lijn}`, verticalAlign: "top", fontSize: 14 };
const tdNum = { ...td, textAlign: "right", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" };

const knop = {
  padding: "7px 13px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer",
  border: `1px solid ${KLEUR.lijn2}`, background: "#fff", color: KLEUR.inkt, fontFamily: HEAD,
};

export default function KlantRegel({ rij, facturen, siteUrl }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [bezig, setBezig] = useState("");
  const [melding, setMelding] = useState("");
  const s = status(rij);

  async function opzeggen() {
    if (!window.confirm(`Abonnement van ${rij.company_name || rij.slug} stoppen? De maandelijkse incasso bij Mollie wordt opgezegd.`)) return;
    setBezig("opzeggen");
    setMelding("");
    try {
      const res = await fetch("/api/abonnement/opzeggen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: rij.slug }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Opzeggen mislukte.");
      setMelding("Opgezegd. Bij Mollie: " + (data.mollie || "—"));
      router.refresh();
    } catch (e) {
      setMelding(String(e.message || e));
    } finally {
      setBezig("");
    }
  }

  async function opnieuwSturen(nummer) {
    setBezig("mail" + nummer);
    setMelding("");
    try {
      const res = await fetch("/api/facturen/opnieuw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nummer }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Versturen mislukte.");
      setMelding(`Factuur ${nummer} is opnieuw verstuurd.`);
      router.refresh();
    } catch (e) {
      setMelding(String(e.message || e));
    } finally {
      setBezig("");
    }
  }

  const laatste = facturen && facturen.length ? facturen[0] : null;

  return (
    <>
      <tr>
        <td style={td}>
          <div style={{ fontWeight: 700 }}>{rij.company_name || rij.slug}</div>
          <div style={{ fontSize: 12.5, color: KLEUR.label }}>
            {rij.contactpersoon ? rij.contactpersoon + " · " : ""}
            {rij.lead_email || "geen e-mailadres"}
          </div>
          <button
            onClick={() => setOpen((v) => !v)}
            style={{ ...knop, marginTop: 6, padding: "5px 10px", fontSize: 12.5, color: KLEUR.klei }}
          >
            {open ? "Sluiten" : "Beheren"}
          </button>
        </td>
        <td style={tdNum}>
          <div style={{ fontWeight: 700 }}>{euro(rij.maandbedrag_incl)}</div>
          <div style={{ fontSize: 12, color: KLEUR.label }}>{euro(rij.maandbedrag)} excl.</div>
        </td>
        <td style={td}>{rij.incassodag ? `de ${rij.incassodag}e` : "—"}</td>
        <td style={td}>{datumNL(rij.volgende_incasso) || "—"}</td>
        <td style={td}>
          {laatste ? (
            <>
              <div>{laatste.nummer}</div>
              <div style={{ fontSize: 12, color: KLEUR.label }}>
                {laatste.status === "verstuurd" ? "verstuurd " : ""}
                {datumNL(laatste.verstuurd_op || laatste.factuurdatum) || ""}
              </div>
            </>
          ) : (
            <span style={{ color: KLEUR.label }}>nog geen</span>
          )}
        </td>
        <td style={td}><Chip kleur={s.kleur}>{s.tekst}</Chip></td>
        <td style={{ ...td, color: KLEUR.gedempt }}>{rij.verzamelaar || "—"}</td>
      </tr>

      {open && (
        <tr>
          <td colSpan={7} style={{ padding: "16px 14px 22px", background: KLEUR.baan, borderBottom: `1px solid ${KLEUR.lijn}` }}>
            <div style={{ display: "grid", gap: 18, maxWidth: 860 }}>
              <div>
                <div style={{ fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: KLEUR.label, fontWeight: 700, marginBottom: 8 }}>
                  De afspraak
                </div>
                <AfspraakForm rij={rij} onKlaar={() => router.refresh()} />
              </div>

              <div>
                <div style={{ fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: KLEUR.label, fontWeight: 700, marginBottom: 8 }}>
                  Facturen
                </div>
                {(!facturen || facturen.length === 0) ? (
                  <div style={{ fontSize: 13.5, color: KLEUR.gedempt }}>
                    Nog geen facturen. Ze ontstaan vanzelf: één zodra de eerste betaling binnen is,
                    en daarna elke maand veertien dagen vóór de incasso.
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: 6 }}>
                    {facturen.map((f) => (
                      <div
                        key={f.nummer}
                        style={{
                          display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap",
                          background: "#fff", border: `1px solid ${KLEUR.lijn}`, borderRadius: 9, padding: "8px 12px",
                        }}
                      >
                        <span style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{f.nummer}</span>
                        <span style={{ fontSize: 13, color: KLEUR.gedempt }}>
                          {f.soort === "maandelijks" ? `maand ${f.periode || ""}` : f.soort}
                        </span>
                        <span style={{ fontVariantNumeric: "tabular-nums" }}>{euro(f.bedrag_incl)}</span>
                        <Chip kleur={f.status === "verstuurd" || f.status === "betaald" ? "sage" : f.status === "mislukt" ? "rust" : "amber"}>
                          {f.status}
                        </Chip>
                        <span style={{ fontSize: 12.5, color: KLEUR.label }}>
                          {datumNL(f.factuurdatum)}
                          {f.incassodatum ? ` · incasso ${datumNL(f.incassodatum)}` : ""}
                        </span>
                        <span style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                          <a
                            href={`/api/facturen/pdf?nummer=${encodeURIComponent(f.nummer)}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ ...knop, textDecoration: "none", color: KLEUR.klei }}
                          >
                            PDF
                          </a>
                          <button
                            onClick={() => opnieuwSturen(f.nummer)}
                            disabled={bezig === "mail" + f.nummer}
                            style={knop}
                          >
                            {bezig === "mail" + f.nummer ? "Bezig…" : "Opnieuw sturen"}
                          </button>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", borderTop: `1px solid ${KLEUR.lijn}`, paddingTop: 12 }}>
                <a
                  href={`${siteUrl}/akkoord/${rij.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ ...knop, textDecoration: "none", color: KLEUR.klei }}
                >
                  Akkoordlink openen →
                </a>
                {rij.betaal_abonnement_id && (
                  <button
                    onClick={opzeggen}
                    disabled={bezig === "opzeggen"}
                    style={{ ...knop, color: KLEUR.kleiDonker, borderColor: "#E8C9C2" }}
                  >
                    {bezig === "opzeggen" ? "Bezig…" : "Abonnement opzeggen"}
                  </button>
                )}
                {melding && <span style={{ fontSize: 13, color: KLEUR.gedempt }}>{melding}</span>}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
