"use client";

import { useState } from "react";

// Kolommen die de importfunctie verwacht. Andere kolommen worden genegeerd.
const VELDEN = [
  "bedrijfsnaam", "vakgebied", "categorie", "provincie", "plaats", "postcode", "adres",
  "telefoon", "email", "website", "website_type", "social_count", "potentie", "score",
  "reden", "beoordeling", "aantal_reviews", "facebook", "instagram", "linkedin", "google_maps",
];

const BATCH = 500;

// Kleine CSV-lezer die ook met komma's binnen aanhalingstekens omgaat.
function leesCsv(tekst) {
  const rijen = [];
  let rij = [];
  let veld = "";
  let inQuote = false;
  const t = tekst.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (inQuote) {
      if (c === '"') {
        if (t[i + 1] === '"') { veld += '"'; i++; }
        else inQuote = false;
      } else veld += c;
    } else if (c === '"') {
      inQuote = true;
    } else if (c === ",") {
      rij.push(veld); veld = "";
    } else if (c === "\n") {
      rij.push(veld); veld = "";
      if (rij.some((v) => v !== "")) rijen.push(rij);
      rij = [];
    } else {
      veld += c;
    }
  }
  rij.push(veld);
  if (rij.some((v) => v !== "")) rijen.push(rij);
  return rijen;
}

export default function ImportClient() {
  const [bestand, setBestand] = useState(null);
  const [bezig, setBezig] = useState(false);
  const [gedaan, setGedaan] = useState(0);
  const [totaal, setTotaal] = useState(0);
  const [klaar, setKlaar] = useState(null);
  const [fout, setFout] = useState("");

  async function start() {
    if (!bestand) return;
    setBezig(true); setFout(""); setKlaar(null); setGedaan(0);

    let rijen;
    try {
      const tekst = await bestand.text();
      const tabel = leesCsv(tekst);
      if (tabel.length < 2) throw new Error("Het bestand lijkt leeg.");

      const kop = tabel[0].map((k) => k.trim().toLowerCase());
      if (!kop.includes("bedrijfsnaam")) {
        throw new Error("Kolom 'bedrijfsnaam' ontbreekt. Verwachte kolommen: " + VELDEN.join(", "));
      }
      rijen = tabel.slice(1).map((r) => {
        const o = {};
        VELDEN.forEach((v) => {
          const i = kop.indexOf(v);
          o[v] = i >= 0 && r[i] != null ? String(r[i]).trim() : "";
        });
        return o;
      }).filter((o) => o.bedrijfsnaam);
    } catch (e) {
      setFout(String(e.message || e)); setBezig(false); return;
    }

    setTotaal(rijen.length);
    let nieuw = 0, bijgewerkt = 0, eind = 0;

    for (let i = 0; i < rijen.length; i += BATCH) {
      const stuk = rijen.slice(i, i + BATCH);
      try {
        const res = await fetch("/api/leads/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rijen: stuk, bron: bestand.name }),
        });
        const j = await res.json();
        if (!j.ok) throw new Error(j.error || "Import mislukt.");
        nieuw += Number(j.nieuw || 0);
        bijgewerkt += Number(j.bijgewerkt || 0);
        eind = Number(j.totaal || 0);
      } catch (e) {
        setFout("Bij rij " + (i + 1) + ": " + String(e.message || e));
        setBezig(false);
        return;
      }
      setGedaan(Math.min(i + BATCH, rijen.length));
    }

    setKlaar({ nieuw, bijgewerkt, totaal: eind });
    setBezig(false);
  }

  const pct = totaal ? Math.round((gedaan / totaal) * 100) : 0;

  return (
    <div style={{ marginTop: 22 }}>
      <input
        type="file"
        accept=".csv,text/csv"
        onChange={(e) => { setBestand(e.target.files && e.target.files[0]); setKlaar(null); setFout(""); }}
        style={{ fontSize: 14, marginBottom: 14, display: "block" }}
      />

      <button
        onClick={start}
        disabled={!bestand || bezig}
        style={{
          background: !bestand || bezig ? "#cbd5e1" : "#FF8300",
          color: "#fff", border: "none", padding: "12px 22px", borderRadius: 10,
          fontWeight: 700, fontSize: 15, cursor: !bestand || bezig ? "default" : "pointer",
        }}
      >
        {bezig ? `Bezig… ${pct}%` : "Importeren"}
      </button>

      {bezig && (
        <div style={{ marginTop: 14, background: "#eef2f6", borderRadius: 999, height: 10, overflow: "hidden" }}>
          <div style={{ width: pct + "%", height: "100%", background: "#FF8300", transition: "width .2s" }} />
        </div>
      )}
      {bezig && (
        <p style={{ fontSize: 13, color: "#64748b", marginTop: 8 }}>
          {gedaan.toLocaleString("nl-NL")} van {totaal.toLocaleString("nl-NL")} rijen verwerkt…
        </p>
      )}

      {klaar && (
        <div style={{ marginTop: 18, background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#065f46", borderRadius: 12, padding: "14px 16px", fontSize: 14 }}>
          Klaar. <strong>{klaar.nieuw.toLocaleString("nl-NL")}</strong> nieuwe leads toegevoegd,{" "}
          <strong>{klaar.bijgewerkt.toLocaleString("nl-NL")}</strong> bestaande bijgewerkt.
          De lijst bevat nu <strong>{klaar.totaal.toLocaleString("nl-NL")}</strong> leads.{" "}
          <a href="/leads" style={{ color: "#065f46", fontWeight: 700 }}>Naar de leadlijst</a>
        </div>
      )}

      {fout && (
        <div style={{ marginTop: 18, background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", borderRadius: 12, padding: "14px 16px", fontSize: 14 }}>
          {fout}
        </div>
      )}
    </div>
  );
}
