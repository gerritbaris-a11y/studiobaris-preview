"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Invoerveld met adrescontrole.
 *
 * Waarom: wat hier wordt ingevuld belandt letterlijk op de website van de klant
 * en in zijn Google-vermelding. Een typefout in de straatnaam of plaats staat
 * dan overal fout, en dat merk je pas als de klant belt.
 *
 * We kijken mee in de officiële Nederlandse adressenregistratie (PDOK, van de
 * overheid - gratis en zonder sleutel). Kiest iemand een suggestie, dan tonen we
 * een vinkje: dit adres bestaat echt en is exact zo geschreven.
 *
 * Het blijft een gewoon tekstveld: wie een buitenlands adres of iets bijzonders
 * heeft kan het altijd zelf intypen. We houden niets tegen, we helpen alleen.
 */
export default function LocatieVeld({
  naam,
  waarde,
  onChange,
  soort = "adres",     // "adres" of "plaats"
  stijl,
  accent = "#FF8300",
  placeholder,
}) {
  const [tekst, setTekst] = useState(waarde || "");
  const [suggesties, setSuggesties] = useState([]);
  const [open, setOpen] = useState(false);
  const [bevestigd, setBevestigd] = useState(false);
  const [bezig, setBezig] = useState(false);
  const houder = useRef(null);
  const laatsteVraag = useRef(0);

  useEffect(() => { setTekst(waarde || ""); }, [waarde]);

  // Klik naast het veld: lijst dicht.
  useEffect(() => {
    function buiten(e) {
      if (houder.current && !houder.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", buiten);
    return () => document.removeEventListener("mousedown", buiten);
  }, []);

  useEffect(() => {
    if (!tekst || tekst.length < 3 || bevestigd) { setSuggesties([]); return; }

    // Even wachten met zoeken tot iemand klaar is met typen.
    const wacht = setTimeout(async () => {
      const vraag = ++laatsteVraag.current;
      setBezig(true);
      try {
        const filter = soort === "plaats" ? "type:(woonplaats OR gemeente)" : "type:(adres OR woonplaats)";
        const url =
          "https://api.pdok.nl/bzk/locatieserver/search/v3_1/suggest?rows=6&fq=" +
          encodeURIComponent(filter) + "&q=" + encodeURIComponent(tekst);
        const res = await fetch(url);
        const data = await res.json();
        // Een ouder antwoord dat later binnenkomt mag een nieuwer niet overschrijven.
        if (vraag !== laatsteVraag.current) return;
        const docs = (data && data.response && data.response.docs) || [];
        setSuggesties(docs.map((d) => d.weergavenaam).filter(Boolean));
        setOpen(true);
      } catch {
        setSuggesties([]);
      } finally {
        if (vraag === laatsteVraag.current) setBezig(false);
      }
    }, 300);

    return () => clearTimeout(wacht);
  }, [tekst, soort, bevestigd]);

  function typ(nieuw) {
    setTekst(nieuw);
    setBevestigd(false);
    if (onChange) onChange(nieuw);
  }

  function kies(s) {
    setTekst(s);
    setBevestigd(true);
    setOpen(false);
    setSuggesties([]);
    if (onChange) onChange(s);
  }

  return (
    <div ref={houder} style={{ position: "relative" }}>
      <input
        name={naam}
        value={tekst}
        onChange={(e) => typ(e.target.value)}
        onFocus={() => { if (suggesties.length) setOpen(true); }}
        placeholder={placeholder}
        autoComplete="off"
        style={{ ...stijl, paddingRight: 92 }}
      />

      <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 12.5, pointerEvents: "none", color: bevestigd ? "#0f6e56" : "#9A9084" }}>
        {bevestigd ? "✓ bevestigd" : bezig ? "zoeken…" : ""}
      </span>

      {open && suggesties.length > 0 && (
        <ul style={{ position: "absolute", zIndex: 20, left: 0, right: 0, top: "calc(100% + 4px)", margin: 0, padding: 4, listStyle: "none", background: "#fff", border: "1px solid #d8dde3", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,.10)", maxHeight: 240, overflowY: "auto" }}>
          {suggesties.map((s) => (
            <li key={s}>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); kies(s); }}
                style={{ display: "block", width: "100%", textAlign: "left", border: "none", background: "transparent", padding: "9px 10px", borderRadius: 7, cursor: "pointer", fontSize: 14, color: "#222" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#f3f5f8"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}

      {!bevestigd && tekst.length >= 3 && (
        <span style={{ display: "block", fontSize: 12, color: "#9A9084", marginTop: 5 }}>
          Kies een suggestie om de schrijfwijze te laten kloppen, of typ zelf door.
        </span>
      )}
    </div>
  );
}
