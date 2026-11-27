"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { KLEUR } from "../werkplek-stijl";

const select = { padding: "8px 10px", borderRadius: 10, border: `1px solid ${KLEUR.lijn}`, background: "#fff", fontSize: 13.5 };
const knop = { padding: "6px 11px", borderRadius: 999, border: `1px solid ${KLEUR.lijn}`, background: "#fff", fontSize: 12.5, fontWeight: 700, cursor: "pointer", color: KLEUR.inkt, whiteSpace: "nowrap" };

// Zoeken + filters, zelfde plek en gedrag als in de andere tabbladen.
export function AppProefFilters() {
  const router = useRouter();
  const pad = usePathname();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") || "");
  const eerste = useRef(true);

  function zet(updates) {
    const p = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(updates)) { if (v) p.set(k, v); else p.delete(k); }
    p.set("status", "app-proef");
    router.push(`${pad}?${p.toString()}`);
  }

  useEffect(() => {
    if (eerste.current) { eerste.current = false; return; }
    const t = setTimeout(() => zet({ q: q.trim() }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const sel = (naam, opties, standaard) => (
    <select value={sp.get(naam) || standaard} onChange={(e) => zet({ [naam]: e.target.value === standaard ? "" : e.target.value })} style={select}>
      {opties.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 8 }}>
      <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Zoek op bedrijf, e-mail of website…"
        style={{ ...select, flex: "1 1 240px", minWidth: 200 }} />
      {sel("sector", [["", "Alle sectoren"], ["vakman", "Vakmannen"], ["salon", "Salons"]], "")}
      {sel("pstatus", [["open", "Loopt + verlopen"], ["loopt", "Alleen loopt"], ["verlopen", "Alleen verlopen"], ["pro", "Naar Pro"], ["alles", "Alles"]], "open")}
      {sel("psignaal", [["", "Alle signalen"], ["niet_gekoppeld", "Plugin niet gekoppeld"], ["nul_klussen", "0 klussen"], ["bestaande_lead", "Bestaande lead"]], "")}
      {sel("periode", [["maand", "Cijfers: deze maand"], ["alles", "Cijfers: alles"]], "maand")}
    </div>
  );
}

// Balk met de schakelaar voor de openbare proefpagina.
export function Schakelaar({ open, faseB, door }) {
  const router = useRouter();
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState("");
  const klaar = faseB.slot && faseB.koppelknop;

  async function zet(nieuw) {
    if (nieuw && !confirm("Proefpagina openzetten? Vanaf nu kan iedereen een proef starten en betalen.")) return;
    if (!nieuw && !confirm("Proefpagina dichtzetten? Lopende proeven gaan gewoon door.")) return;
    setBezig(true); setFout("");
    const res = await fetch("/api/app-proef/schakelaar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ open: nieuw }) });
    const d = await res.json().catch(() => ({}));
    setBezig(false);
    if (!d.ok) setFout(d.error || "Lukte niet.");
    else router.refresh();
  }

  const vink = (ok, tekst) => (
    <span style={{ fontSize: 13, color: ok ? KLEUR.sage.tekst : KLEUR.rust.tekst, fontWeight: 700 }}>{ok ? "✓" : "✗"} {tekst}</span>
  );

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center", padding: "10px 14px", borderRadius: 12,
      background: open ? KLEUR.sage.bg : KLEUR.baan, border: `1px solid ${KLEUR.lijn}` }}>
      <span style={{ fontWeight: 800, fontSize: 14 }}>Proefpagina: {open ? "open" : "uit"}</span>
      {vink(faseB.slot, "Slot in de app")}
      {vink(faseB.koppelknop, "Koppelknop in de plugin")}
      <span style={{ flex: 1 }} />
      {door && <span style={{ fontSize: 12, color: KLEUR.label }}>laatst gewijzigd door {door}</span>}
      {open
        ? <button style={knop} disabled={bezig} onClick={() => zet(false)}>Dichtzetten</button>
        : <button style={{ ...knop, opacity: klaar ? 1 : 0.6 }} disabled={bezig} onClick={() => (klaar ? zet(true) : setFout("Nog niet klaar: wacht tot beide vinkjes groen zijn (deel B van Gerrit)."))}>Aanzetten</button>}
      {fout && <div role="alert" style={{ flexBasis: "100%", fontSize: 13, color: KLEUR.rust.tekst }}>{fout}</div>}
    </div>
  );
}

// Knoppen per proef: betaallink kopiëren en naar opvolging.
export function ProefActies({ id, status, inOpvolging, verkopers = [] }) {
  const router = useRouter();
  const [melding, setMelding] = useState("");
  const [kies, setKies] = useState(false);
  const [verkoper, setVerkoper] = useState("");

  async function betaallink() {
    const res = await fetch("/api/app-proef/betaallink", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    const d = await res.json().catch(() => ({}));
    if (!d.ok) return setMelding(d.error || "Lukte niet.");
    try { await navigator.clipboard.writeText(d.url); setMelding("Link gekopieerd"); } catch { setMelding(d.url); }
  }

  async function opvolging() {
    const res = await fetch("/api/app-proef/opvolging", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, verkoper }) });
    const d = await res.json().catch(() => ({}));
    if (!d.ok) return setMelding(d.error || "Lukte niet.");
    setKies(false); setMelding("In Toekomstig gezet"); router.refresh();
  }

  if (status === "pro") return <span style={{ fontSize: 12, color: KLEUR.label }}>staat onder Actief</span>;

  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
      <button style={knop} onClick={betaallink}>Betaallink</button>
      {status === "verlopen" && !inOpvolging && !kies && <button style={knop} onClick={() => setKies(true)}>Naar opvolging</button>}
      {kies && (
        <>
          <select value={verkoper} onChange={(e) => setVerkoper(e.target.value)} style={{ ...select, padding: "5px 8px", fontSize: 12.5 }}>
            <option value="">Geen verkoper</option>
            {verkopers.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
          <button style={knop} onClick={opvolging}>Bevestig</button>
        </>
      )}
      {melding && <span style={{ fontSize: 12, color: KLEUR.label, maxWidth: 220, overflowWrap: "anywhere" }}>{melding}</span>}
    </div>
  );
}
