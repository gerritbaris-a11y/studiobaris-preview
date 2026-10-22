"use client";

import { KLEUR } from "../werkplek-stijl";

// Alleen voor beheer: kies van welke verkoper je het overzicht ziet.
export default function VerkoperKeuze({ verkopers, gekozen }) {
  return (
    <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: KLEUR.gedempt, marginBottom: 14 }}>
      Verkoper
      <select
        value={gekozen}
        onChange={(e) => {
          const v = e.target.value;
          location.href = v ? `/verdiensten?wie=${encodeURIComponent(v)}` : "/verdiensten";
        }}
        style={{ padding: "8px 10px", borderRadius: 9, border: `1px solid ${KLEUR.lijn}`, background: "#fff", fontSize: 14, fontFamily: "inherit", color: KLEUR.inkt }}
      >
        <option value="">Iedereen</option>
        {verkopers.map((v) => <option key={v} value={v}>{v}</option>)}
      </select>
    </label>
  );
}
