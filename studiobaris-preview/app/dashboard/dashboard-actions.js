"use client";

import { useState } from "react";

export default function PublishButton({ slug }) {
  const [s, setS] = useState("idle");
  async function go() {
    if (!confirm("Conceptversie publiceren? De live site wordt hiermee bijgewerkt.")) return;
    setS("bezig");
    try {
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const d = await res.json();
      if (d.ok) location.reload();
      else { alert(d.error || "Publiceren mislukt"); setS("idle"); }
    } catch (e) {
      alert(String(e)); setS("idle");
    }
  }
  return (
    <button onClick={go} disabled={s === "bezig"}
      style={{ background: "#1d7a46", color: "#fff", border: "none", padding: "6px 12px", borderRadius: 7, fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
      {s === "bezig" ? "Bezig…" : "Publiceer concept"}
    </button>
  );
}

export function PublishToggle({ slug, gepubliceerd }) {
  const [s, setS] = useState("idle");
  async function go() {
    const msg = gepubliceerd
      ? "Site offline halen? De publieke link werkt daarna niet meer."
      : "Site online zetten? De publieke link wordt dan zichtbaar voor iedereen.";
    if (!confirm(msg)) return;
    setS("bezig");
    try {
      const res = await fetch("/api/publish-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, value: !gepubliceerd }),
      });
      const d = await res.json();
      if (d.ok) location.reload();
      else { alert(d.error || "Mislukt"); setS("idle"); }
    } catch (e) { alert(String(e)); setS("idle"); }
  }
  return (
    <button onClick={go} disabled={s === "bezig"}
      style={{ background: gepubliceerd ? "#fff" : "#1d7a46", color: gepubliceerd ? "#b45309" : "#fff", border: gepubliceerd ? "1px solid #d8dde3" : "none", padding: "6px 12px", borderRadius: 7, fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
      {s === "bezig" ? "Bezig…" : gepubliceerd ? "Offline halen" : "Online zetten"}
    </button>
  );
}

export const STATUS_OPTIES = ["Nieuw", "Gebeld", "Wachten op feedback 1", "Wachten op feedback 2", "Wachten op feedback 3", "Klaar"];

async function bewaarKlant(slug, payload) {
  const res = await fetch("/api/klant/update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug, ...payload }),
  });
  return res.json();
}

export function KlantNaam({ slug, value }) {
  const [v, setV] = useState(value || "");
  const [saved, setSaved] = useState(false);
  async function blur() {
    if (v === (value || "")) return;
    const d = await bewaarKlant(slug, { verzamelaar: v });
    if (d.ok) { setSaved(true); setTimeout(() => setSaved(false), 1200); }
  }
  return (
    <input value={v} onChange={(e) => setV(e.target.value)} onBlur={blur} placeholder="Naam"
      style={{ width: 120, padding: "4px 7px", border: "1px solid " + (saved ? "#1d7a46" : "#d8dde3"), borderRadius: 6, fontSize: 13 }} />
  );
}

export function KlantStatus({ slug, value }) {
  const [v, setV] = useState(value || "Nieuw");
  async function change(e) {
    const nv = e.target.value; setV(nv);
    await bewaarKlant(slug, { pipeline_status: nv });
  }
  return (
    <select value={v} onChange={change}
      style={{ padding: "5px 7px", border: "1px solid #d8dde3", borderRadius: 6, fontSize: 13, background: "#fff", maxWidth: 150 }}>
      {STATUS_OPTIES.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

export function KlantBedrag({ slug, value }) {
  const [v, setV] = useState(value != null ? String(value) : "");
  const [saved, setSaved] = useState(false);
  async function blur() {
    const d = await bewaarKlant(slug, { maandbedrag: v });
    if (d.ok) { setSaved(true); setTimeout(() => setSaved(false), 1200); }
  }
  return (
    <span style={{ whiteSpace: "nowrap" }}>€&nbsp;
      <input value={v} onChange={(e) => setV(e.target.value)} onBlur={blur} placeholder="0" inputMode="decimal"
        style={{ width: 54, padding: "4px 6px", border: "1px solid " + (saved ? "#1d7a46" : "#d8dde3"), borderRadius: 6, fontSize: 13 }} />
      <span style={{ color: "#888", fontSize: 12 }}> /mnd</span>
    </span>
  );
}

export function AkkoordLink({ slug }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.origin + "/akkoord/" + slug);
      setCopied(true); setTimeout(() => setCopied(false), 1400);
    } catch {}
  }
  return (
    <button onClick={copy}
      style={{ background: "#fff", border: "1px solid #d8dde3", color: "#1d6fd1", padding: "5px 9px", borderRadius: 6, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}>
      {copied ? "Gekopieerd!" : "Akkoord-link"}
    </button>
  );
}
