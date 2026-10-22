// Fasefoto's (Voor / Tijdens / Na) voor een project dat de prospect zelf in
// zijn demo-app plaatste. Zelfde opbouw als de SB Embed-plugin op een echte
// klantsite: de eerste voor-, tijdens- en na-foto naast elkaar, elk met label.
// Is er maar één foto (of een gewoon preview-project), dan toont de aanroeper
// gewoon het enkele beeld zoals altijd.

export function heeftFases(p) {
  return !!(p && Array.isArray(p.fases) && p.fases.length > 1);
}

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

// className/style: die van het bestaande beeldvak (pph, pimg, img), zodat
// hoogte, afronding en achtergrond van de stijl gelijk blijven.
export default function FaseFotos({ fases, className, style }) {
  return (
    <div className={className} style={{ ...style, display: "flex", gap: 2, padding: 0, overflow: "hidden" }}>
      {fases.map((f, i) => (
        <div
          key={i}
          style={{
            position: "relative",
            flex: 1,
            minWidth: 0,
            backgroundImage: `url(${f.url})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <span style={LABEL}>{f.label}</span>
        </div>
      ))}
    </div>
  );
}
