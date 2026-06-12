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
