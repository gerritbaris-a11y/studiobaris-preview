"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { KLEUR } from "../werkplek-stijl";

// Zoeken + filters van het Klantenregister. Alles staat in de URL, zodat een
// filter te delen/bookmarken is en de server alleen de juiste pagina stuurt.

const SIGNALEN = [
  ["", "Alle"],
  ["aandacht", "Aandacht nodig"],
  ["betaal", "Betaling"],
  ["website", "Website"],
  ["plugin", "Plugin verouderd"],
  ["appnooit", "App nooit gebruikt"],
  ["inactief", "Inactief in app"],
  ["gegevens", "Gegevens incompleet"],
];

export default function FilterBalk({ keuzes, sectorLabel = {} }) {
  const router = useRouter();
  const pad = usePathname();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") || "");
  const eerste = useRef(true);

  function zet(updates) {
    const p = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v) p.set(k, v); else p.delete(k);
    }
    p.delete("pagina"); // nieuw filter → terug naar pagina 1
    router.push(`${pad}?${p.toString()}`);
  }

  // Zoeken met een kleine vertraging, zodat niet elke toetsaanslag herlaadt.
  useEffect(() => {
    if (eerste.current) { eerste.current = false; return; }
    const t = setTimeout(() => zet({ q: q.trim() }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const sel = (naam, opties, leegLabel) => (
    <select value={sp.get(naam) || ""} onChange={(e) => zet({ [naam]: e.target.value })} style={select}>
      <option value="">{leegLabel}</option>
      {opties.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );

  const actief = ["q", "sector", "pakket", "provincie", "verkoper", "signaal"].some((k) => sp.get(k));

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Zoek op naam, nummer, plaats, telefoon, e-mail, domein…"
        style={{ ...select, flex: "1 1 280px", minWidth: 200 }}
      />
      {sel("sector", keuzes.sectoren.map((s) => [s, sectorLabel[s] || s]), "Alle sectoren")}
      {sel("pakket", [["vol", "Vol pakket"], ["plugin", "Alleen plugin"]], "Alle pakketten")}
      {sel("provincie", keuzes.provincies.map((p) => [p, p]), "Alle provincies")}
      {sel("verkoper", [...keuzes.verkopers.map((v) => [v, v]), ["-", "Zonder verkoper"]], "Alle verkopers")}
      <select value={sp.get("signaal") || ""} onChange={(e) => zet({ signaal: e.target.value })} style={select}>
        {SIGNALEN.map(([v, l]) => <option key={v} value={v}>{v ? l : "Alle signalen"}</option>)}
      </select>
      <select value={sp.get("sort") || "nummer"} onChange={(e) => zet({ sort: e.target.value === "nummer" ? "" : e.target.value })} style={select}>
        <option value="nummer">Sorteer: klantnummer</option>
        <option value="nieuw">Sorteer: nieuwste eerst</option>
        <option value="naam">Sorteer: naam A-Z</option>
        <option value="bedrag">Sorteer: maandbedrag</option>
        <option value="aandacht">Sorteer: meeste aandacht</option>
      </select>
      {actief && (
        <button
          type="button"
          onClick={() => { setQ(""); const s = sp.get("status"); router.push(s ? `${pad}?status=${s}` : pad); }}
          style={{ ...select, cursor: "pointer", fontWeight: 700, color: KLEUR.klei }}
        >
          Wis filters
        </button>
      )}
    </div>
  );
}

const select = {
  padding: "8px 10px", border: `1px solid ${KLEUR.lijn2}`, borderRadius: 8,
  fontSize: 13.5, fontFamily: "inherit", background: "#fff", color: KLEUR.inkt,
};
