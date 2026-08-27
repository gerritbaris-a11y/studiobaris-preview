"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KLEUR, HEAD } from "../werkplek-stijl";

// Een klant die nog geen afspraak heeft hier binnenhalen. Zodra je het
// maandbedrag vastlegt, verschijnt hij vanzelf in het overzicht hierboven —
// daar staat immers alles wat maandelijks terugkomt.
export default function NieuweKlant({ kandidaten }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [slug, setSlug] = useState("");
  const [websiteprijs, setWebsiteprijs] = useState("599");
  const [maandbedrag, setMaandbedrag] = useState("29,95");
  const [betaalwijze, setBetaalwijze] = useState("ineens");
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState("");

  const veld = {
    padding: "7px 9px", fontSize: 14, borderRadius: 8,
    border: `1px solid ${KLEUR.lijn2}`, background: "#fff", color: KLEUR.inkt,
  };

  async function toevoegen() {
    if (!slug) { setFout("Kies eerst een klant."); return; }
    setBezig(true); setFout("");
    try {
      const res = await fetch("/api/abonnement/instellen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, websiteprijs, maandbedrag, betaalwijze }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Opslaan mislukte.");
      setOpen(false); setSlug("");
      router.refresh();
    } catch (e) {
      setFout(String(e.message || e));
    } finally {
      setBezig(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          padding: "8px 15px", borderRadius: 9, cursor: "pointer", fontFamily: HEAD,
          border: `1px solid ${KLEUR.lijn2}`, background: "#fff", color: KLEUR.klei, fontWeight: 700, fontSize: 13.5,
        }}
      >
        + Klant toevoegen
      </button>
    );
  }

  return (
    <div style={{ background: "#fff", border: `1px solid ${KLEUR.lijn}`, borderRadius: 12, padding: "14px 16px", display: "grid", gap: 10 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <select style={{ ...veld, minWidth: 240 }} value={slug} onChange={(e) => setSlug(e.target.value)}>
          <option value="">Kies een klant…</option>
          {kandidaten.map((k) => (
            <option key={k.slug} value={k.slug}>
              {k.company_name || k.slug}{k.verzamelaar ? ` — ${k.verzamelaar}` : ""}
            </option>
          ))}
        </select>
        <input style={{ ...veld, width: 100 }} value={websiteprijs} onChange={(e) => setWebsiteprijs(e.target.value)} placeholder="website excl." />
        <input style={{ ...veld, width: 100 }} value={maandbedrag} onChange={(e) => setMaandbedrag(e.target.value)} placeholder="p/m excl." />
        <select style={{ ...veld, width: 168 }} value={betaalwijze} onChange={(e) => setBetaalwijze(e.target.value)}>
          <option value="ineens">In één keer</option>
          <option value="twee_termijnen">In twee termijnen</option>
        </select>
        <button
          onClick={toevoegen}
          disabled={bezig}
          style={{ padding: "8px 15px", borderRadius: 9, border: "none", cursor: "pointer", background: KLEUR.klei, color: "#fff", fontWeight: 700, fontFamily: HEAD, opacity: bezig ? 0.6 : 1 }}
        >
          {bezig ? "Bezig…" : "Vastleggen"}
        </button>
        <button onClick={() => setOpen(false)} style={{ ...veld, cursor: "pointer", border: "none", background: "transparent", color: KLEUR.label }}>
          Annuleren
        </button>
      </div>
      <div style={{ fontSize: 12.5, color: KLEUR.label }}>
        Bedragen exclusief btw. De aanbetaling volgt uit de betaalwijze — die vul je nergens meer zelf in.
      </div>
      {fout && <div style={{ fontSize: 13, color: KLEUR.kleiDonker, fontWeight: 600 }}>{fout}</div>}
    </div>
  );
}
