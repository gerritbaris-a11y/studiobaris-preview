import { KLEUR } from "./werkplek-stijl";
import { SECTOREN, sectorPad } from "../lib/segment";

// Tabbalk bovenaan Mijn previews, Benaderd en Leads: wissel van sector zonder
// eerst het menu te openen. Alleen voor beheer; verkopers zien alleen Portfolio.
// `tellers` (optioneel): { portfolio: 12, boeking: 3, spoed: 0 }.
export default function SectorBalk({ pad, sector, tellers }) {
  return (
    <div role="tablist" aria-label="Sector" style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 18, padding: 4, background: KLEUR.baan, border: `1px solid ${KLEUR.baanRand}`, borderRadius: 18, width: "fit-content", maxWidth: "100%" }}>
      {SECTOREN.map((s) => {
        const aan = s.id === sector;
        const n = tellers ? tellers[s.id] : null;
        return (
          <a
            key={s.id}
            role="tab"
            aria-selected={aan}
            href={sectorPad(pad, s.id)}
            style={{
              padding: "8px 14px", borderRadius: 999, fontSize: 14, textDecoration: "none", whiteSpace: "nowrap",
              fontWeight: aan ? 700 : 600,
              color: aan ? "#fff" : KLEUR.gedempt,
              background: aan ? KLEUR.navy : "transparent",
            }}
          >
            {s.label}
            {n != null && <span style={{ marginLeft: 6, fontWeight: 600, opacity: 0.75 }}>{n}</span>}
          </a>
        );
      })}
    </div>
  );
}
