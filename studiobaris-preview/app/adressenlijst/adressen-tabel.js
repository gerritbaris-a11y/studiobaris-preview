"use client";

import { useMemo, useState } from "react";
import { KLEUR, BODY } from "../werkplek-stijl";
import { Knop } from "../werkplek-shell";

// Adressenlijst met zoekveld en aanvinkvakjes. Typ bijv. "Katwijk", vink
// "Alles in beeld" aan en kopieer alleen die selectie voor de route.
// Is er niets aangevinkt, dan kopieert de knop alles wat in beeld staat.
// De selectie wordt niet opgeslagen; herladen = opnieuw beginnen.
// Kolom "Brief": maakt per bedrijf een printklare brief (PDF, nieuw tabblad)
// met QR-code naar de eigen preview, ondertekend door wie ingelogd is.

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

export default function AdressenTabel({ rijen }) {
  const [zoek, setZoek] = useState("");
  const [gekozen, setGekozen] = useState(() => new Set());
  const [status, setStatus] = useState("idle");

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
                      <a
                        href={`/api/brieven/pdf?slug=${encodeURIComponent(r.slug)}`}
                        target="_blank"
                        rel="noopener"
                        onClick={(e) => e.stopPropagation()}
                        style={briefKnop}
                        title="Printklare brief met QR-code naar de preview (wordt in een nieuw tabblad gemaakt, duurt ca. 10 seconden)"
                      >
                        Brief maken
                      </a>
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
    </>
  );
}
