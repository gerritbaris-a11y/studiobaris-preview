"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KLEUR, HEAD, BODY } from "../werkplek-stijl";
import { verkleinFoto } from "../../lib/verklein-foto";
import { ACCEPT_ATTRIBUUT } from "../../lib/bestand-validatie";

const kaart = { background: "#fff", border: `1px solid ${KLEUR.lijn}`, borderRadius: 14, padding: "16px 18px" };

// Zelfde grens als HERO_MIN_BREEDTE in lib/vakfotos.js (die kan hier niet
// geïmporteerd worden: het is servercode).
const HERO_MIN_BREEDTE = 1920;

function afmeting(bestand) {
  return new Promise((klaar) => {
    const url = URL.createObjectURL(bestand);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); klaar({ b: img.naturalWidth, h: img.naturalHeight }); };
    img.onerror = () => { URL.revokeObjectURL(url); klaar(null); };
    img.src = url;
  });
}

// Eén rij foto's met uploadknop: de gewone vakfoto's of de hero-foto's.
function FotoBlok({ vak, soort, fotos: alle }) {
  const router = useRouter();
  const [stand, setStand] = useState("");
  const [fout, setFout] = useState("");
  const [weg, setWeg] = useState([]);
  const isHero = soort === "hero";

  async function upload(e) {
    const gekozen = Array.from(e.target.files || []);
    e.target.value = "";
    if (!gekozen.length) return;
    setFout("");
    try {
      if (isHero) {
        // Een hero vult het hele scherm: te smal of staand wordt onscherp of
        // raar bijgesneden. Die weigeren we meteen, met de reden erbij.
        setStand("Afmetingen controleren...");
        const afgekeurd = [];
        for (const f of gekozen) {
          const m = await afmeting(f);
          if (m && (m.b < HERO_MIN_BREEDTE || m.b <= m.h)) afgekeurd.push(`${f.name} (${m.b}×${m.h})`);
        }
        if (afgekeurd.length) {
          throw new Error(`Te klein of niet liggend voor een hero (minstens ${HERO_MIN_BREEDTE} px breed, liggend): ${afgekeurd.join(", ")}`);
        }
      }
      setStand("Foto's verkleinen...");
      const klein = [];
      for (const f of gekozen) klein.push(await verkleinFoto(f, "foto"));
      const res = await fetch("/api/vakfotos/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vakgebied: vak.key, soort, bestanden: klein.map((f) => ({ naam: f.name, grootte: f.size })) }),
      });
      const plekken = await res.json();
      if (!plekken.ok) throw new Error(plekken.error || "Kon de upload niet voorbereiden.");
      for (let i = 0; i < klein.length; i++) {
        setStand(`Foto ${i + 1} van ${klein.length} versturen...`);
        const op = await fetch(plekken.bestanden[i].uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": klein[i].type || "image/jpeg", "x-upsert": "true" },
          body: klein[i],
        });
        if (!op.ok) throw new Error(`"${klein[i].name}" kon niet worden verstuurd.`);
      }
      setStand("");
      router.refresh();
    } catch (err) {
      setStand("");
      setFout(String((err && err.message) || err));
    }
  }

  async function verwijder(naam) {
    setWeg((w) => [...w, naam]);
    const res = await fetch("/api/vakfotos/verwijderen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vakgebied: vak.key, naam, soort }),
    }).then((r) => r.json()).catch(() => ({ ok: false }));
    if (!res.ok) {
      setWeg((w) => w.filter((x) => x !== naam));
      setFout("Verwijderen mislukt.");
    } else router.refresh();
  }

  const fotos = (alle || []).filter((f) => !weg.includes(f.naam));
  const id = `upload-${vak.key}-${soort}`;
  const status = isHero
    ? fotos.length
      ? `${fotos.length} hero-${fotos.length === 1 ? "foto" : "foto's"}`
      : "geen hero-foto · achtergrond komt uit de gewone foto's"
    : `${fotos.length} ${fotos.length === 1 ? "foto" : "foto's"}${fotos.length < 3 ? " · minstens 3 nodig, anders vallen previews terug op stockfoto's" : ""}`;
  const statusKleur = isHero ? KLEUR.labelDonker : fotos.length >= 3 ? KLEUR.labelDonker : "#b45309";

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: fotos.length ? 10 : 0 }}>
        <div>
          <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: isHero ? 13.5 : 16 }}>{isHero ? "Hero-foto's (achtergrond bovenaan)" : vak.label}</div>
          <div style={{ fontSize: 12.5, color: statusKleur }}>{status}</div>
        </div>
        <label htmlFor={id} style={{ background: isHero ? "#fff" : KLEUR.klei, color: isHero ? KLEUR.klei : "#fff", border: isHero ? `1.5px solid ${KLEUR.klei}` : "none", borderRadius: 10, padding: "7px 13px", fontSize: 13, fontWeight: 700, cursor: stand ? "wait" : "pointer", fontFamily: BODY }}>
          {stand || (isHero ? "Hero-foto toevoegen" : "Foto's toevoegen")}
        </label>
        <input id={id} type="file" multiple accept={ACCEPT_ATTRIBUUT} onChange={upload} disabled={!!stand} style={{ display: "none" }} />
      </div>
      {fout && <div style={{ fontSize: 13, color: KLEUR.kleiDonker, marginBottom: 8 }}>{fout}</div>}
      {fotos.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fill, minmax(${isHero ? 200 : 120}px, 1fr))`, gap: 8 }}>
          {fotos.map((f) => (
            <div key={f.naam} style={{ position: "relative", aspectRatio: isHero ? "16 / 9" : "4 / 3", borderRadius: 10, overflow: "hidden", background: KLEUR.baan }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.url} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              <button
                type="button"
                onClick={() => verwijder(f.naam)}
                title="Foto verwijderen"
                aria-label="Foto verwijderen"
                style={{ position: "absolute", top: 6, right: 6, width: 26, height: 26, borderRadius: 999, border: "none", background: "rgba(43,39,36,.75)", color: "#fff", cursor: "pointer", fontSize: 14, lineHeight: "26px", padding: 0 }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Vak({ vak }) {
  return (
    <section style={kaart}>
      <FotoBlok vak={vak} soort="gewoon" fotos={vak.fotos} />
      <div style={{ borderTop: `1px solid ${KLEUR.lijn}`, margin: "14px 0 12px" }} />
      <FotoBlok vak={vak} soort="hero" fotos={vak.heros} />
    </section>
  );
}

export default function VakfotosClient({ vakken }) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      {vakken.map((v) => <Vak key={v.key} vak={v} />)}
    </div>
  );
}
