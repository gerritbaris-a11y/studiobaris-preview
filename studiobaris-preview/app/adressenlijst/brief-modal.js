"use client";

import { useEffect, useRef, useState } from "react";
import { KLEUR, BODY, HEAD } from "../werkplek-stijl";
import { Knop } from "../werkplek-shell";

// Bewerkvenster voor "Brief maken". Haalt de tekst op (opgeslagen versie, of
// een nieuwe van Claude), laat je hem aanpassen en maakt dan de PDF via een
// gewoon formulier naar een nieuw tabblad. Bij "PDF maken" wordt de tekst
// opgeslagen, zodat opnieuw printen dezelfde brief geeft.

const label = { display: "block", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: KLEUR.labelDonker, fontWeight: 700, marginBottom: 5 };
const veld = {
  width: "100%", boxSizing: "border-box", padding: "9px 11px", fontSize: 14, lineHeight: 1.45,
  border: `1px solid ${KLEUR.lijn2}`, borderRadius: 10, background: "#fff", fontFamily: BODY, color: KLEUR.inkt,
};
const hulp = { fontSize: 12, color: KLEUR.labelDonker, marginTop: 4 };

// Vandaag als "YYYY-MM-DD" in Nederlandse tijd.
function vandaagIso() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Amsterdam" });
}
// Zelfde dag een maand later, voluit (zelfde regel als lib/brieven.js).
function actieTot(iso) {
  const m = String(iso || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return "";
  const j = +m[1], mnd = +m[2], d = +m[3];
  const laatste = new Date(Date.UTC(j, mnd + 1, 0)).getUTCDate();
  const tot = new Date(Date.UTC(j, mnd, Math.min(d, laatste)));
  return tot.toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
}

function datumKort(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("nl-NL", { day: "numeric", month: "long", timeZone: "Europe/Amsterdam" });
  } catch { return ""; }
}

export default function BriefModal({ rij, onSluiten, onGemaakt }) {
  const [laden, setLaden] = useState(true);
  const [fout, setFout] = useState("");
  const [t, setT] = useState(null);
  const [notitieVlak, setNotitieVlak] = useState(true);
  const [opgeslagen, setOpgeslagen] = useState(null);
  const formRef = useRef(null);
  const dataRef = useRef(null);

  async function haal(opnieuw) {
    setLaden(true);
    setFout("");
    try {
      const res = await fetch("/api/brieven/tekst", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: rij.slug, opnieuw: !!opnieuw }),
      });
      const d = await res.json();
      if (!d.ok) throw new Error(d.error || "Ophalen mislukt.");
      setT({ vorm: d.teksten.vorm || "jullie", prijs: d.teksten.prijs !== false, verzonden: d.teksten.verzonden || vandaagIso(), aanhef: d.teksten.aanhef || "", opening: d.teksten.opening || "", eigen: d.teksten.eigen || "", app: d.teksten.app || "" });
      setNotitieVlak(d.notitie_vlak !== false);
      setOpgeslagen(d.opgeslagen || null);
    } catch (e) {
      setFout(e.message || "Er ging iets mis.");
    }
    setLaden(false);
  }

  useEffect(() => { haal(false); }, [rij.slug]); // eslint-disable-line react-hooks/exhaustive-deps

  function wijzig(veldnaam, waarde) {
    setT((oud) => ({ ...oud, [veldnaam]: waarde }));
  }

  function maakPdf() {
    if (!t) return;
    if (!t.aanhef.trim() || !t.opening.trim() || !t.app.trim()) {
      return setFout("Aanhef, opening en vak-alinea mogen niet leeg zijn.");
    }
    dataRef.current.value = JSON.stringify({ slug: rij.slug, teksten: t, notitie_vlak: notitieVlak });
    formRef.current.submit(); // opent de PDF in een nieuw tabblad
    // Pas sluiten nadat het formulier echt de deur uit is.
    setTimeout(() => onGemaakt && onGemaakt(rij.slug), 400);
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(43,39,36,.35)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 16px", overflowY: "auto", zIndex: 50 }}
      onClick={onSluiten}
    >
      <div
        style={{ background: KLEUR.kaart, border: `1px solid ${KLEUR.lijn}`, borderRadius: 14, maxWidth: 680, width: "100%", overflow: "hidden" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ background: KLEUR.klei, color: "#fff", padding: "16px 20px", fontFamily: HEAD, fontWeight: 800, fontSize: 16 }}>
          Brief voor {rij.bedrijf}
        </div>

        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14, fontFamily: BODY }}>
          {laden && <div style={{ color: KLEUR.gedempt, fontSize: 14 }}>Tekst wordt geschreven... (ca. 10 seconden)</div>}

          {!laden && t && (
            <>
              {opgeslagen && (
                <div style={{ fontSize: 13, color: KLEUR.sage.tekst, background: KLEUR.sage.bg, padding: "8px 12px", borderRadius: 8 }}>
                  Opgeslagen versie{opgeslagen.afzender ? ` van ${opgeslagen.afzender}` : ""}{opgeslagen.bijgewerkt_op ? `, ${datumKort(opgeslagen.bijgewerkt_op)}` : ""}
                  {opgeslagen.keer > 1 ? ` (al ${opgeslagen.keer}× gemaakt)` : ""}.
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "end" }}>
                <div>
                  <span style={label}>Aanhef</span>
                  <input style={veld} value={t.aanhef} onChange={(e) => wijzig("aanhef", e.target.value)} maxLength={80} />
                </div>
                <div>
                  <span style={label}>Aanspreekvorm</span>
                  <select style={{ ...veld, width: "auto" }} value={t.vorm} onChange={(e) => wijzig("vorm", e.target.value)}>
                    <option value="je">je</option>
                    <option value="jullie">jullie</option>
                  </select>
                </div>
              </div>

              <div>
                <span style={label}>Persoonlijke opening</span>
                <textarea style={{ ...veld, minHeight: 90 }} value={t.opening} onChange={(e) => wijzig("opening", e.target.value)} maxLength={600} />
              </div>

              <div>
                <span style={label}>Eigen regel (optioneel)</span>
                <textarea
                  style={{ ...veld, minHeight: 56 }}
                  value={t.eigen}
                  onChange={(e) => wijzig("eigen", e.target.value)}
                  maxLength={400}
                  placeholder="Bijv. We kwamen vandaag even langs, maar je was aan het werk. Daarom laten we deze brief achter."
                />
                <div style={hulp}>Komt direct na de opening.</div>
              </div>

              <div>
                <span style={label}>Vak-alinea (app en reviews)</span>
                <textarea style={{ ...veld, minHeight: 110 }} value={t.app} onChange={(e) => wijzig("app", e.target.value)} maxLength={700} />
                <div style={hulp}>Staat direct onder het app-blok. Kort houden: 2-3 zinnen.</div>
              </div>

              <div>
                <span style={label}>Brief gaat de deur uit op</span>
                <input type="date" style={{ ...veld, width: "auto" }} value={t.verzonden} onChange={(e) => wijzig("verzonden", e.target.value)} />
                <div style={hulp}>
                  Dit is de datum op de brief.{t.prijs !== false && actieTot(t.verzonden) ? ` De actie loopt tot en met ${actieTot(t.verzonden)} (een maand).` : ""}
                </div>
              </div>

              <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 14, color: KLEUR.inkt, cursor: "pointer" }}>
                <input type="checkbox" checked={t.prijs !== false} onChange={(e) => wijzig("prijs", e.target.checked)} style={{ width: 18, height: 18, accentColor: KLEUR.klei }} />
                Met prijs (brief-actie € 399, rechts in de zijkolom). Uit = brief zonder prijs, voor de A/B-test
              </label>

              <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 14, color: KLEUR.inkt, cursor: "pointer" }}>
                <input type="checkbox" checked={notitieVlak} onChange={(e) => setNotitieVlak(e.target.checked)} style={{ width: 18, height: 18, accentColor: KLEUR.klei }} />
                Lijntjes voor een handgeschreven persoonlijke boodschap (rechts, onder de QR-code en de prijs)
              </label>

              <div style={hulp}>
                De rest (website klaar, het app-blok, wat nu, QR-code, prijs en deadline, ondertekening met jouw naam) wordt er automatisch bij gezet.
              </div>
            </>
          )}

          {fout && <div style={{ color: KLEUR.kleiDonker, fontSize: 13, fontWeight: 700 }}>{fout}</div>}

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "space-between", marginTop: 4 }}>
            <Knop kind="stil" onClick={onSluiten}>Annuleren</Knop>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Knop onClick={() => haal(true)} disabled={laden} title="Laat Claude een nieuwe variant schrijven (je wijzigingen gaan verloren)">
                Opnieuw schrijven
              </Knop>
              <Knop kind="primair" onClick={maakPdf} disabled={laden || !t}>PDF maken</Knop>
            </div>
          </div>
        </div>

        <form ref={formRef} method="POST" action="/api/brieven/pdf" target="_blank" style={{ display: "none" }}>
          <input ref={dataRef} type="hidden" name="data" />
        </form>
      </div>
    </div>
  );
}
