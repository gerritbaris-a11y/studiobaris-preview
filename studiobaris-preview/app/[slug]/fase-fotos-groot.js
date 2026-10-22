"use client";

// Fasefoto's op de projectpagina, aanklikbaar: tik op een foto en hij opent
// schermvullend. Bladeren met de pijlen, vegen of de pijltjestoetsen; sluiten
// met de X, Escape of een tik naast de foto.

import { useEffect, useRef, useState } from "react";

const LABEL = {
  position: "absolute",
  top: 8,
  left: 8,
  background: "rgba(17,24,39,.78)",
  color: "#fff",
  fontSize: ".7rem",
  fontWeight: 700,
  padding: ".15rem .5rem",
  borderRadius: 999,
  letterSpacing: ".3px",
};

const KNOP = {
  position: "absolute",
  background: "rgba(255,255,255,.14)",
  color: "#fff",
  border: 0,
  borderRadius: 999,
  width: 44,
  height: 44,
  fontSize: 22,
  lineHeight: "44px",
  textAlign: "center",
  cursor: "pointer",
};

export default function FaseFotosGroot({ fases, className }) {
  const [open, setOpen] = useState(-1);
  const startX = useRef(null);
  const n = fases.length;
  const ga = (stap) => setOpen((i) => (i + stap + n) % n);

  useEffect(() => {
    if (open < 0) return;
    const toets = (e) => {
      if (e.key === "Escape") setOpen(-1);
      if (e.key === "ArrowRight") ga(1);
      if (e.key === "ArrowLeft") ga(-1);
    };
    window.addEventListener("keydown", toets);
    const oud = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", toets);
      document.body.style.overflow = oud;
    };
  }, [open]);

  return (
    <>
      <div className={className} style={{ display: "flex", alignItems: "stretch", placeItems: "stretch", gap: 2, padding: 0, overflow: "hidden" }}>
        {fases.map((f, i) => (
          <button
            type="button"
            key={i}
            onClick={() => setOpen(i)}
            aria-label={`${f.label}-foto vergroten`}
            style={{
              position: "relative",
              flex: 1,
              minWidth: 0,
              alignSelf: "stretch",
              minHeight: "100%",
              border: 0,
              padding: 0,
              cursor: "zoom-in",
              backgroundColor: "transparent",
              backgroundImage: `url(${f.url})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <span style={LABEL}>{f.label}</span>
          </button>
        ))}
      </div>

      {open >= 0 && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(-1)}
          onTouchStart={(e) => { startX.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => {
            if (startX.current == null) return;
            const dx = e.changedTouches[0].clientX - startX.current;
            startX.current = null;
            if (Math.abs(dx) > 50) ga(dx < 0 ? 1 : -1);
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(10,14,22,.94)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "56px 12px",
          }}
        >
          <img
            src={fases[open].url}
            alt={`${fases[open].label} de klus`}
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: 8, display: "block" }}
          />
          <span style={{ ...LABEL, top: 18, left: "50%", transform: "translateX(-50%)", fontSize: ".85rem", padding: ".3rem .8rem" }}>
            {fases[open].label} · {open + 1} van {n}
          </span>
          <button type="button" aria-label="Sluiten" onClick={() => setOpen(-1)} style={{ ...KNOP, top: 10, right: 10 }}>×</button>
          {n > 1 && (
            <>
              <button type="button" aria-label="Vorige foto" onClick={(e) => { e.stopPropagation(); ga(-1); }} style={{ ...KNOP, left: 10, top: "50%", marginTop: -22 }}>‹</button>
              <button type="button" aria-label="Volgende foto" onClick={(e) => { e.stopPropagation(); ga(1); }} style={{ ...KNOP, right: 10, top: "50%", marginTop: -22 }}>›</button>
            </>
          )}
        </div>
      )}
    </>
  );
}
