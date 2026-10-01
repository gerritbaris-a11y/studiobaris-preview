"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KLEUR, HEAD, BODY } from "../werkplek-stijl";

// Voorstellen voor nieuwe previews, onder de AI-update op Vandaag.
// Goedkeuren maakt meteen de preview; afwijzen vraagt om een korte reden,
// die de dagelijkse zoekronde meeneemt.

const WEBSITE = {
  geen: { label: "Geen website", ...KLEUR.sage },
  verouderd: { label: "Verouderde website", ...KLEUR.amber },
  offline: { label: "Website offline", ...KLEUR.amber },
  portaal: { label: "Alleen standaardpagina", ...KLEUR.amber },
};

const REDENEN = ["Heeft al een goede website", "Geen vakman / verkeerde branche", "Buiten ons gebied", "Bestaat niet meer", "Te groot bedrijf"];

const knop = {
  borderRadius: 10, padding: "9px 15px", fontSize: 13.5, fontWeight: 700, cursor: "pointer",
  fontFamily: BODY, whiteSpace: "nowrap", border: "1px solid transparent",
};

function Chip({ kleur, children }) {
  return (
    <span style={{ background: kleur.bg, color: kleur.tekst, fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 999, whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}

function Rij({ label, children }) {
  if (!children) return null;
  return (
    <>
      <dt style={{ fontSize: 11, letterSpacing: 0.8, textTransform: "uppercase", color: KLEUR.label, fontWeight: 700, paddingTop: 2 }}>{label}</dt>
      <dd style={{ margin: 0, minWidth: 0 }}>{children}</dd>
    </>
  );
}

function Voorstel({ v }) {
  const router = useRouter();
  const [stand, setStand] = useState(v.status === "bezig" ? "bezig" : "");
  const [fout, setFout] = useState(v.status === "mislukt" ? v.fout || "Preview maken mislukt." : "");
  const [afwijzen, setAfwijzen] = useState(false);
  const [reden, setReden] = useState("");
  const [klaar, setKlaar] = useState(null);

  const intake = v.intake || {};
  const web = WEBSITE[v.website_status] || WEBSITE.geen;
  const bronnen = Array.isArray(v.bronnen) ? v.bronnen.filter((b) => b && b.url) : [];

  async function goedkeuren() {
    setStand("bezig"); setFout("");
    try {
      const res = await fetch("/api/voorstellen/goedkeuren", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: v.id }),
      });
      const j = await res.json().catch(() => ({ ok: false, error: "Geen antwoord van de server." }));
      if (!j.ok) throw new Error(j.error || "Preview maken mislukt.");
      setKlaar(j);
      setStand("klaar");
    } catch (e) {
      setStand("");
      setFout(String((e && e.message) || e));
    }
  }

  async function bevestigAfwijzen() {
    if (!reden.trim()) return;
    setStand("afwijzen"); setFout("");
    try {
      const res = await fetch("/api/voorstellen/afwijzen", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: v.id, reden }),
      });
      const j = await res.json().catch(() => ({ ok: false }));
      if (!j.ok) throw new Error(j.error || "Afwijzen mislukt.");
      router.refresh();
    } catch (e) {
      setStand("");
      setFout(String((e && e.message) || e));
    }
  }

  if (klaar) {
    return (
      <div style={{ background: KLEUR.sage.bg, border: `1px solid ${KLEUR.lijn}`, borderRadius: 14, padding: "14px 18px", display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ color: KLEUR.sage.tekst, fontWeight: 700 }}>Preview gemaakt voor {v.bedrijfsnaam}.</span>
        <span style={{ display: "flex", gap: 8 }}>
          <a href={klaar.url} target="_blank" rel="noopener noreferrer" style={{ ...knop, background: "#fff", color: KLEUR.inkt, border: `1px solid ${KLEUR.lijn2}`, textDecoration: "none" }}>Preview bekijken</a>
          <a href="/klanten" style={{ ...knop, background: "transparent", color: KLEUR.kleiDonker, textDecoration: "none" }}>Naar Mijn previews</a>
        </span>
      </div>
    );
  }

  const bezig = stand === "bezig";

  return (
    <article style={{ background: "#fff", border: `1px solid ${KLEUR.lijn}`, borderRadius: 14, padding: "16px 18px", display: "grid", gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 17 }}>{v.bedrijfsnaam}</div>
          <div style={{ fontSize: 13, color: KLEUR.labelDonker }}>{[v.vakgebied, v.plaats].filter(Boolean).join(" · ")}</div>
          {(v.telefoon || v.adres) && (
            <div style={{ fontSize: 13, color: KLEUR.labelDonker }}>{[v.telefoon, v.adres].filter(Boolean).join(" · ")}</div>
          )}
        </div>
        <Chip kleur={web}>{web.label}</Chip>
      </div>

      <p style={{ margin: 0, fontSize: 14, color: KLEUR.gedempt, lineHeight: 1.5 }}>{v.reden}</p>

      <details>
        <summary style={{ cursor: "pointer", fontSize: 13, fontWeight: 700, color: KLEUR.kleiDonker }}>Intake en bronnen bekijken</summary>
        <dl style={{ display: "grid", gridTemplateColumns: "max-content 1fr", gap: "6px 14px", margin: "10px 0 0", padding: "12px 14px", background: KLEUR.baan, borderRadius: 10, fontSize: 13.5 }}>
          <Rij label="Diensten">{Array.isArray(intake.diensten) ? intake.diensten.join(", ") : intake.diensten}</Rij>
          <Rij label="Regio">{Array.isArray(intake.regio) ? intake.regio.join(", ") : intake.regio}</Rij>
          <Rij label="Slogan">{intake.slogan}</Rij>
          <Rij label="Toon">{intake.tone_of_voice}</Rij>
          <Rij label="Stijl">{intake.stijl}</Rij>
          <Rij label="Website">{v.website}</Rij>
          <Rij label="Bronnen">
            {bronnen.length > 0 && bronnen.map((b, i) => (
              <span key={i}>
                {i > 0 ? " · " : ""}
                <a href={b.url} target="_blank" rel="noopener noreferrer" style={{ color: KLEUR.kleiDonker }}>{b.label || "bron"}</a>
              </span>
            ))}
          </Rij>
        </dl>
      </details>

      {fout && <div style={{ fontSize: 13, color: KLEUR.kleiDonker, background: KLEUR.kleiZacht, padding: "8px 12px", borderRadius: 8 }}>{fout}</div>}

      {afwijzen ? (
        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {REDENEN.map((r) => (
              <button key={r} type="button" onClick={() => setReden(r)}
                style={{ ...knop, padding: "5px 11px", fontSize: 12.5, fontWeight: 600, background: reden === r ? KLEUR.inkt : "#fff", color: reden === r ? KLEUR.papier : KLEUR.gedempt, border: `1px solid ${KLEUR.lijn2}` }}>
                {r}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              id={`reden-${v.id}`}
              value={reden}
              onChange={(e) => setReden(e.target.value)}
              placeholder="Of typ zelf een reden"
              style={{ flex: "1 1 220px", minWidth: 0, padding: "9px 11px", fontSize: 13.5, border: `1px solid ${KLEUR.lijn2}`, borderRadius: 10, fontFamily: BODY }}
            />
            <button type="button" onClick={bevestigAfwijzen} disabled={!reden.trim() || stand === "afwijzen"}
              style={{ ...knop, background: KLEUR.inkt, color: KLEUR.papier, opacity: reden.trim() ? 1 : 0.5 }}>
              {stand === "afwijzen" ? "Bezig..." : "Afwijzen"}
            </button>
            <button type="button" onClick={() => { setAfwijzen(false); setReden(""); }} style={{ ...knop, background: "transparent", color: KLEUR.gedempt }}>
              Annuleren
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <button type="button" onClick={goedkeuren} disabled={bezig}
            style={{ ...knop, background: KLEUR.klei, color: "#fff", cursor: bezig ? "wait" : "pointer", opacity: bezig ? 0.75 : 1 }}>
            {bezig ? "Preview wordt gemaakt..." : fout ? "Opnieuw proberen" : "Goedkeuren en preview maken"}
          </button>
          {!bezig && (
            <button type="button" onClick={() => setAfwijzen(true)} style={{ ...knop, background: "#fff", color: KLEUR.inkt, border: `1px solid ${KLEUR.lijn2}` }}>
              Afwijzen
            </button>
          )}
          {bezig && <span style={{ fontSize: 12.5, color: KLEUR.label }}>Duurt ongeveer een minuut. Laat deze pagina open.</span>}
        </div>
      )}
    </article>
  );
}

export default function Voorstellen({ open, dezeWeek }) {
  const gemaakt = (dezeWeek && dezeWeek.gemaakt) || 0;
  const afgewezen = (dezeWeek && dezeWeek.afgewezen) || 0;
  return (
    <section style={{ display: "grid", gap: 12, marginTop: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 19, margin: 0 }}>Voorstellen voor previews</h2>
          <div style={{ fontSize: 13, color: KLEUR.labelDonker }}>
            {open.length} open · deze week {gemaakt} {gemaakt === 1 ? "preview" : "previews"} gemaakt, {afgewezen} afgewezen
          </div>
        </div>
        <a href="/vakfotos" style={{ fontSize: 13, fontWeight: 700, color: KLEUR.kleiDonker }}>Vakfoto&apos;s beheren</a>
      </div>
      {open.length === 0 ? (
        <div style={{ background: "#fff", border: `1px solid ${KLEUR.lijn}`, borderRadius: 14, padding: "16px 18px", color: KLEUR.gedempt, fontSize: 14 }}>
          Geen open voorstellen. Elke ochtend komen er 3 à 4 nieuwe bij.
        </div>
      ) : (
        open.map((v) => <Voorstel key={v.id} v={v} />)
      )}
    </section>
  );
}
