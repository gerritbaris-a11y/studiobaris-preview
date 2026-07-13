"use client";

import { useState } from "react";

const STIJLEN = [
  { id: "stoer", naam: "Direct & Stoer", uitleg: "Donkere hero, krachtig, grote bel-knoppen. Voor wie snel gebeld wil worden." },
  { id: "modern", naam: "Strak & Modern", uitleg: "Licht, rustig en typografisch, met uitklapbare diensten." },
  { id: "persoonlijk", naam: "Warm & Persoonlijk", uitleg: "De vakman centraal, met een persoonlijk verhaal en stappen." },
];

export default function StijlKiezer({ slug, bedrijf, huidige }) {
  const [gekozen, setGekozen] = useState(huidige);
  const [bezig, setBezig] = useState("");
  const [fout, setFout] = useState("");

  async function kies(stijl) {
    setBezig(stijl); setFout("");
    try {
      const res = await fetch("/api/klant/stijl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, stijl, bedrijf }),
      });
      const j = await res.json();
      if (j.ok) setGekozen(stijl);
      else setFout(j.error || "Lukt niet.");
    } catch {
      setFout("Lukt niet.");
    }
    setBezig("");
  }

  return (
    <>
      <style>{`
        .sb-stijlen { display: grid; grid-template-columns: 1fr; gap: 18px; }
        @media (min-width: 1000px) { .sb-stijlen { grid-template-columns: repeat(3, 1fr); } }
        .sb-frame { width: 100%; height: 560px; border: none; }
        .sb-scherm { border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; background: #fff; }
      `}</style>

      {fout && <p style={{ color: "#b91c1c", fontSize: 14 }}>{fout}</p>}

      <div className="sb-stijlen">
        {STIJLEN.map((s) => {
          const actief = gekozen === s.id;
          return (
            <div key={s.id} style={{
              border: "2px solid " + (actief ? "#FF8300" : "#e5e7eb"),
              borderRadius: 16, padding: 12, background: actief ? "#fff7ed" : "#fff",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <strong style={{ fontSize: 16 }}>{s.naam}</strong>
                {actief && (
                  <span style={{ fontSize: 11.5, fontWeight: 700, background: "#FF8300", color: "#fff", padding: "3px 9px", borderRadius: 999 }}>
                    Gekozen
                  </span>
                )}
              </div>
              <p style={{ fontSize: 12.5, color: "#64748b", margin: "0 0 10px", minHeight: 34, lineHeight: 1.45 }}>{s.uitleg}</p>

              <div className="sb-scherm">
                <iframe
                  className="sb-frame"
                  src={`/${slug}?review=1&stijl=${s.id}`}
                  title={s.naam}
                  loading="lazy"
                />
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button
                  onClick={() => kies(s.id)}
                  disabled={actief || bezig === s.id}
                  style={{
                    flex: 1, padding: "10px 14px", borderRadius: 10, fontWeight: 700, fontSize: 14,
                    border: "none", cursor: actief ? "default" : "pointer",
                    background: actief ? "#e2e8f0" : "#1A2E40",
                    color: actief ? "#94a3b8" : "#fff",
                  }}
                >
                  {bezig === s.id ? "Bezig…" : actief ? "Dit is de stijl" : "Kies deze stijl"}
                </button>
                <a
                  href={`/${slug}?review=1&stijl=${s.id}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    padding: "10px 14px", borderRadius: 10, fontWeight: 700, fontSize: 14,
                    border: "1px solid #d8dde3", color: "#334155", textDecoration: "none", whiteSpace: "nowrap",
                  }}
                >
                  Groot ↗
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
