"use client";

import { useMemo, useRef, useState } from "react";
import { KLEUR, BODY } from "../werkplek-stijl";
import { Knop } from "../werkplek-shell";
import BriefModal from "./brief-modal";

// Adressenlijst met zoekveld en aanvinkvakjes. Typ bijv. "Katwijk", vink
// "Alles in beeld" aan en kopieer alleen die selectie voor de route.
// Is er niets aangevinkt, dan kopieert de knop alles wat in beeld staat.
// De selectie wordt niet opgeslagen; herladen = opnieuw beginnen.
// Kolom "Brief": opent een bewerkvenster met de (door Claude geschreven of
// eerder opgeslagen) brieftekst; daarna wordt een printklare PDF gemaakt met
// QR-code naar de eigen preview, ondertekend door wie ingelogd is. Onder de
// knop staat wie er wanneer al een brief voor maakte.
// "Printen voor route" (verschijnt zodra er adressen zijn aangevinkt): alle
// brieven in één PDF en alle kaartjes in één PDF (twee per A4), in dezelfde
// volgorde (alfabetisch). Alleen adressen met een gecontroleerde brief; de
// verzenddatum geldt voor de hele stapel.

const th = {
  textAlign: "left", fontSize: 11, letterSpacing: 1, textTransform: "uppercase",
  color: KLEUR.label, fontWeight: 700, padding: "10px 14px",
  background: KLEUR.baan, borderBottom: `1px solid ${KLEUR.baanRand}`, whiteSpace: "nowrap",
};
const td = { padding: "10px 14px", borderBottom: `1px solid ${KLEUR.lijn}`, fontSize: 14, verticalAlign: "top" };
const briefKnop = {
  display: "inline-block", padding: "6px 12px", borderRadius: 999, fontSize: 12.5, fontWeight: 700,
  border: `1px solid ${KLEUR.klei}`, color: KLEUR.kleiDonker, background: "#fff", textDecoration: "none",
  whiteSpace: "nowrap", fontFamily: BODY,
};
const vinkje = { width: 18, height: 18, cursor: "pointer", accentColor: KLEUR.klei, margin: 0 };

function vandaagIso() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Amsterdam" });
}

function datumKort(iso) {
  try { return new Date(iso).toLocaleDateString("nl-NL", { day: "numeric", month: "short", timeZone: "Europe/Amsterdam" }); } catch { return ""; }
}

export default function AdressenTabel({ rijen, brieven = [] }) {
  const [briefRij, setBriefRij] = useState(null);
  const [gemaakt, setGemaakt] = useState(() => Object.fromEntries(brieven.map((b) => [b.slug, b])));
  const [zoek, setZoek] = useState("");
  const [gekozen, setGekozen] = useState(() => new Set());
  const [status, setStatus] = useState("idle");
  const [verzonden, setVerzonden] = useState(vandaagIso);
  const stapelForm = useRef(null);
  const stapelData = useRef(null);

  // Stapel voor de route: aangevinkte adressen, alfabetisch (zelfde volgorde
  // als de PDF's), gesplitst in wel/geen gecontroleerde brief.
  const stapel = useMemo(() => {
    const lijst = rijen.filter((r) => gekozen.has(r.slug)).sort((a, b) => a.bedrijf.localeCompare(b.bedrijf, "nl"));
    // Alleen brieven die in de huidige versie zijn gecontroleerd (versie 2).
    const metBrief = lijst.filter((r) => gemaakt[r.slug] && Number(gemaakt[r.slug].versie) === 2);
    return {
      metBrief,
      zonderBrief: lijst.filter((r) => !(gemaakt[r.slug] && Number(gemaakt[r.slug].versie) === 2)),
      metKaartje: metBrief.filter((r) => gemaakt[r.slug].kaartje),
    };
  }, [rijen, gekozen, gemaakt]);

  function printBrieven() {
    stapelData.current.value = JSON.stringify({ slugs: stapel.metBrief.map((r) => r.slug), verzonden });
    stapelForm.current.submit(); // opent de PDF in een nieuw tabblad
  }
  function printKaartjes() {
    const slugs = stapel.metKaartje.map((r) => r.slug).join(",");
    window.open(`/api/brieven/kaartjes?stapel=1&slugs=${encodeURIComponent(slugs)}`, "_blank");
  }

  const zichtbaar = useMemo(() => {
    const q = zoek.trim().toLowerCase();
    if (!q) return rijen;
    return rijen.filter((r) => [r.bedrijf, r.telefoon, r.adres].join(" ").toLowerCase().includes(q));
  }, [rijen, zoek]);

  const allesInBeeldAan = zichtbaar.length > 0 && zichtbaar.every((r) => gekozen.has(r.slug));

  function wissel(slug) {
    setGekozen((oud) => {
      const nieuw = new Set(oud);
      if (nieuw.has(slug)) nieuw.delete(slug);
      else nieuw.add(slug);
      return nieuw;
    });
  }

  function wisselAllesInBeeld() {
    setGekozen((oud) => {
      const nieuw = new Set(oud);
      if (allesInBeeldAan) zichtbaar.forEach((r) => nieuw.delete(r.slug));
      else zichtbaar.forEach((r) => nieuw.add(r.slug));
      return nieuw;
    });
  }

  const teKopieren = gekozen.size > 0 ? rijen.filter((r) => gekozen.has(r.slug)) : zichtbaar;

  async function kopieer() {
    const tekst = ["Bedrijf\tTelefoon\tAdres"]
      .concat(teKopieren.map((r) => [r.bedrijf, r.telefoon, r.adres].map((v) => String(v || "").replace(/\s+/g, " ").trim()).join("\t")))
      .join("\n");
    try {
      await navigator.clipboard.writeText(tekst);
      setStatus("ok");
    } catch {
      setStatus("fout");
    }
    setTimeout(() => setStatus("idle"), 1800);
  }

  const knopTekst =
    status === "ok" ? "Gekopieerd!"
    : status === "fout" ? "Kopiëren mislukt"
    : gekozen.size > 0 ? `${gekozen.size} aangevinkt kopiëren`
    : zoek.trim() ? `${zichtbaar.length} in beeld kopiëren`
    : "Hele lijst kopiëren";

  return (
    <>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 12 }}>
        <input
          type="search"
          value={zoek}
          onChange={(e) => setZoek(e.target.value)}
          placeholder="Zoek op plaats, straat of naam (bijv. Katwijk)"
          style={{ flex: "1 1 260px", minWidth: 0, padding: "10px 12px", fontSize: 14, border: `1px solid ${KLEUR.lijn2}`, borderRadius: 10, background: "#fff", fontFamily: BODY }}
        />
        <Knop onClick={kopieer} kind={gekozen.size > 0 ? "primair" : "secondair"}>{knopTekst}</Knop>
        {gekozen.size > 0 && (
          <button
            type="button"
            onClick={() => setGekozen(new Set())}
            style={{ background: "none", border: "none", color: KLEUR.kleiDonker, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: BODY }}
          >
            Vinkjes wissen
          </button>
        )}
      </div>

      {gekozen.size > 0 && (
        <div style={{ background: KLEUR.kaart, border: `1px solid ${KLEUR.lijn}`, borderRadius: 14, padding: "14px 16px", marginBottom: 12, fontFamily: BODY }}>
          <div style={{ fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: KLEUR.label, fontWeight: 700, marginBottom: 10 }}>Printen voor route</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
            <label style={{ fontSize: 14, color: KLEUR.inkt, display: "flex", gap: 8, alignItems: "center" }}>
              Gaat de deur uit op
              <input type="date" value={verzonden} onChange={(e) => setVerzonden(e.target.value)}
                style={{ padding: "8px 10px", fontSize: 14, border: `1px solid ${KLEUR.lijn2}`, borderRadius: 10, background: "#fff", fontFamily: BODY }} />
            </label>
            <Knop kind="primair" onClick={printBrieven} disabled={!stapel.metBrief.length}>
              {`Brieven printen (${stapel.metBrief.length})`}
            </Knop>
            <Knop onClick={printKaartjes} disabled={!stapel.metKaartje.length} title="Twee per A4 met snijlijnen; op fotokarton printen">
              {`Kaartjes printen (${stapel.metKaartje.length})`}
            </Knop>
          </div>
          <div style={{ fontSize: 12.5, color: KLEUR.labelDonker, marginTop: 8 }}>
            Brieven en kaartjes staan in dezelfde volgorde (alfabetisch). De datum komt op elke brief; de actie loopt een maand.
          </div>
          {stapel.zonderBrief.length > 0 && (
            <div style={{ fontSize: 13, color: KLEUR.kleiDonker, marginTop: 8 }}>
              {stapel.zonderBrief.length === 1 ? "1 adres heeft" : `${stapel.zonderBrief.length} adressen hebben`} nog geen gecontroleerde brief en {stapel.zonderBrief.length === 1 ? "wordt" : "worden"} niet geprint: {stapel.zonderBrief.map((r) => r.bedrijf).join(", ")}. Maak eerst die brief via "Brief maken".
            </div>
          )}
          {stapel.metBrief.length > stapel.metKaartje.length && (
            <div style={{ fontSize: 13, color: KLEUR.labelDonker, marginTop: 6 }}>
              Zonder kaartje-vinkje (alleen brief): {stapel.metBrief.filter((r) => !gemaakt[r.slug].kaartje).map((r) => r.bedrijf).join(", ")}.
            </div>
          )}
          <form ref={stapelForm} method="POST" action="/api/brieven/stapel" target="_blank" style={{ display: "none" }}>
            <input ref={stapelData} type="hidden" name="data" />
          </form>
        </div>
      )}

      <div style={{ background: KLEUR.kaart, border: `1px solid ${KLEUR.lijn}`, borderRadius: 14, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ ...th, width: 1 }}>
                  <input type="checkbox" checked={allesInBeeldAan} onChange={wisselAllesInBeeld} style={vinkje} title="Alles in beeld aan-/uitvinken" aria-label="Alles in beeld aanvinken" />
                </th>
                <th style={th}>Bedrijf</th>
                <th style={th}>Telefoon</th>
                <th style={th}>Adres</th>
                <th style={th}>Brief</th>
              </tr>
            </thead>
            <tbody>
              {zichtbaar.map((r) => {
                const aan = gekozen.has(r.slug);
                return (
                  <tr key={r.slug} onClick={() => wissel(r.slug)} style={{ cursor: "pointer", background: aan ? KLEUR.kleiZacht : undefined }}>
                    <td style={td}>
                      <input type="checkbox" checked={aan} onChange={() => wissel(r.slug)} onClick={(e) => e.stopPropagation()} style={vinkje} aria-label={`${r.bedrijf} aanvinken`} />
                    </td>
                    <td style={{ ...td, fontWeight: 700, color: KLEUR.inkt }}>{r.bedrijf}</td>
                    <td style={{ ...td, whiteSpace: "nowrap", color: KLEUR.gedempt }}>
                      {r.telefoon ? (
                        <a href={`tel:${r.telefoon.replace(/[^0-9+]/g, "")}`} onClick={(e) => e.stopPropagation()} style={{ color: KLEUR.gedempt, textDecoration: "none" }}>{r.telefoon}</a>
                      ) : "—"}
                    </td>
                    <td style={{ ...td, color: r.adres ? KLEUR.gedempt : KLEUR.label }}>{r.adres || "Adres onbekend"}</td>
                    <td style={{ ...td, whiteSpace: "nowrap" }}>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setBriefRij(r); }}
                        style={{ ...briefKnop, cursor: "pointer" }}
                        title="Tekst bekijken en aanpassen, daarna een printklare PDF maken"
                      >
                        {gemaakt[r.slug] && Number(gemaakt[r.slug].versie) === 2 ? "Brief bekijken" : gemaakt[r.slug] ? "Opnieuw maken" : "Brief maken"}
                      </button>
                      {gemaakt[r.slug] && (
                        <div style={{ fontSize: 11.5, color: KLEUR.labelDonker, marginTop: 4 }}>
                          {gemaakt[r.slug].afzender || "Gemaakt"}{gemaakt[r.slug].bijgewerkt_op ? ` · ${datumKort(gemaakt[r.slug].bijgewerkt_op)}` : ""}
                        </div>
                      )}
                      {/* Kaartje en verzenddatum (alleen bij brieven in de huidige versie). */}
                      {gemaakt[r.slug] && Number(gemaakt[r.slug].versie) === 2 && (
                        <div style={{ fontSize: 11.5, color: KLEUR.labelDonker, marginTop: 2 }}>
                          {gemaakt[r.slug].kaartje ? (
                            <>
                              met kaartje ·{" "}
                              <a
                                href={`/api/brieven/kaartje?slug=${encodeURIComponent(r.slug)}`}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                style={{ color: KLEUR.kleiDonker, fontWeight: 700 }}
                              >
                                Kaartje bekijken
                              </a>
                            </>
                          ) : "zonder kaartje"}
                          {gemaakt[r.slug].verzonden ? <div>datum op brief: {datumKort(gemaakt[r.slug].verzonden)}</div> : null}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {zichtbaar.length === 0 && (
                <tr><td colSpan={5} style={{ ...td, color: KLEUR.label }}>{rijen.length ? "Niets gevonden." : "Nog geen online previews."}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {briefRij && (
        <BriefModal
          rij={briefRij}
          onSluiten={() => setBriefRij(null)}
          onGemaakt={(slug, extra = {}) => {
            setGemaakt((g) => ({ ...g, [slug]: { slug, afzender: "Net gemaakt", bijgewerkt_op: new Date().toISOString(), versie: 2, ...extra } }));
            setBriefRij(null);
          }}
        />
      )}
    </>
  );
}
