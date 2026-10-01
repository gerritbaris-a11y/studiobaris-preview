"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KLEUR, HEAD, BODY } from "../werkplek-stijl";
import { verkleinFoto } from "../../lib/verklein-foto";
import { ACCEPT_ATTRIBUUT } from "../../lib/bestand-validatie";

const kaart = { background: "#fff", border: `1px solid ${KLEUR.lijn}`, borderRadius: 14, padding: "16px 18px" };

function Vak({ vak }) {
  const router = useRouter();
  const [stand, setStand] = useState("");
  const [fout, setFout] = useState("");
  const [weg, setWeg] = useState([]);

  async function upload(e) {
    const gekozen = Array.from(e.target.files || []);
    e.target.value = "";
    if (!gekozen.length) return;
    setFout("");
    try {
      setStand("Foto's verkleinen...");
      const klein = [];
      for (const f of gekozen) klein.push(await verkleinFoto(f, "foto"));
      const res = await fetch("/api/vakfotos/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vakgebied: vak.key, bestanden: klein.map((f) => ({ naam: f.name, grootte: f.size })) }),
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
      body: JSON.stringify({ vakgebied: vak.key, naam }),
    }).then((r) => r.json()).catch(() => ({ ok: false }));
    if (!res.ok) {
      setWeg((w) => w.filter((x) => x !== naam));
      setFout("Verwijderen mislukt.");
    } else router.refresh();
  }

  const fotos = vak.fotos.filter((f) => !weg.includes(f.naam));
  const id = `upload-${vak.key}`;

  return (
    <section style={kaart}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: fotos.length ? 12 : 0 }}>
        <div>
          <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 16 }}>{vak.label}</div>
          <div style={{ fontSize: 12.5, color: fotos.length >= 3 ? KLEUR.labelDonker : "#b45309" }}>
            {fotos.length} {fotos.length === 1 ? "foto" : "foto's"}
            {fotos.length < 3 ? " · minstens 3 nodig, anders vallen previews terug op stockfoto's" : ""}
          </div>
        </div>
        <label htmlFor={id} style={{ background: KLEUR.klei, color: "#fff", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 700, cursor: stand ? "wait" : "pointer", fontFamily: BODY }}>
          {stand || "Foto's toevoegen"}
        </label>
        <input id={id} type="file" multiple accept={ACCEPT_ATTRIBUUT} onChange={upload} disabled={!!stand} style={{ display: "none" }} />
      </div>
      {fout && <div style={{ fontSize: 13, color: KLEUR.kleiDonker, marginBottom: 8 }}>{fout}</div>}
      {fotos.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8 }}>
          {fotos.map((f) => (
            <div key={f.naam} style={{ position: "relative", aspectRatio: "4 / 3", borderRadius: 10, overflow: "hidden", background: KLEUR.baan }}>
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
