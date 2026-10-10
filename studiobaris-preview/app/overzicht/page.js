import { getCockpit, GROEIPAD, OUTREACH_DOEL_PER_WEEK } from "../../lib/cockpit-data";
import { leesSessie, isBeheer } from "../../lib/auth";
import WerkplekShell from "../werkplek-shell";
import { KLEUR } from "../werkplek-stijl";

export const dynamic = "force-dynamic";

// Het Overzicht is een cockpit: liggen we op koers, en doen we genoeg om er te komen?
// Bewust geen conversiepercentages: met deze aantallen geven die een vertekend beeld.

const kaart = { background: KLEUR.kaart, border: `1px solid ${KLEUR.lijn}`, borderRadius: 14, padding: "18px 20px" };
const kopje = { fontSize: 16, margin: "0 0 4px", color: KLEUR.inkt };
const uitleg = { fontSize: 12.5, color: "#9A9084", margin: "0 0 16px", lineHeight: 1.45 };
const labelStijl = { fontSize: 11.5, letterSpacing: 0.6, textTransform: "uppercase", color: "#9A9084", fontWeight: 700, marginBottom: 6 };

function euro(n, dec = 2) {
  return "€ " + Number(n || 0).toLocaleString("nl-NL", { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

function Status({ goed, tekst }) {
  const c = goed ? KLEUR.sage : KLEUR.amber;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 700, color: c.tekst, background: c.bg, padding: "4px 10px", borderRadius: 999 }}>
      <span aria-hidden="true">{goed ? "✓" : "!"}</span>
      {tekst}
    </span>
  );
}

// Eén getal tegen een doel, met een balkje.
function Meter({ label, waarde, doel, toon, sub }) {
  const pct = doel > 0 ? Math.min(100, Math.round((waarde / doel) * 100)) : 0;
  return (
    <div style={{ flex: "1 1 220px", minWidth: 0 }}>
      <div style={labelStijl}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 34, fontWeight: 800, color: KLEUR.inkt, lineHeight: 1 }}>{toon(waarde)}</span>
        <span style={{ fontSize: 14, color: "#6B6258" }}>van {toon(doel)}</span>
      </div>
      <div style={{ background: KLEUR.baan, borderRadius: 999, height: 8, marginTop: 10, overflow: "hidden" }}>
        <div style={{ width: Math.max(pct, waarde > 0 ? 2 : 0) + "%", height: "100%", background: KLEUR.klei, borderRadius: 999 }} />
      </div>
      {sub && <div style={{ fontSize: 12.5, color: "#6B6258", marginTop: 8 }}>{sub}</div>}
    </div>
  );
}

function OpKoers({ k }) {
  const doelMaand = GROEIPAD.perMaand;
  // Verwacht tot nu toe deze maand (naar rato van de dagen).
  const verwachtNu = (doelMaand * k.dagInMaand) / k.dagenInMaand;
  const maandGoed = k.nieuwDezeMaand >= Math.floor(verwachtNu);
  const totaalGoed = k.klanten >= k.doelKlanten;
  const achter = k.doelKlanten - k.klanten;
  return (
    <div style={kaart}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
        <div>
          <h2 style={kopje}>Op koers?</h2>
          <p style={{ ...uitleg, marginBottom: 18 }}>
            Betalende klanten en vaste maandomzet, tegenover het groeipad uit het stappenplan
            ({GROEIPAD.bandLaag.toLocaleString("nl-NL")}–{GROEIPAD.bandHoog.toLocaleString("nl-NL")} nieuwe klanten per maand).
          </p>
        </div>
        <Status goed={totaalGoed} tekst={totaalGoed ? "Op schema" : `${achter} ${achter === 1 ? "klant" : "klanten"} achter op schema`} />
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 28 }}>
        <Meter
          label="Nieuwe klanten deze maand"
          waarde={k.nieuwDezeMaand}
          doel={doelMaand}
          toon={(n) => String(n)}
          sub={
            <>
              {maandGoed ? "Ligt op tempo" : "Loopt achter op tempo"} · dag {k.dagInMaand} van {k.dagenInMaand} · vorige maand {k.nieuwVorigeMaand}
            </>
          }
        />
        <Meter
          label="Betalende klanten"
          waarde={k.klanten}
          doel={k.doelKlanten}
          toon={(n) => String(n)}
          sub="Groeipad: waar we volgens het plan nu zouden staan"
        />
        <Meter
          label="Vaste maandomzet (MRR)"
          waarde={k.mrr}
          doel={k.doelMrr}
          toon={(n) => euro(n, 0)}
          sub={`${euro(k.mrr)} per maand, excl. btw`}
        />
      </div>
    </div>
  );
}

function weekLabel(maandag) {
  const d = new Date(maandag + "T12:00:00Z");
  return d.toLocaleDateString("nl-NL", { day: "numeric", month: "short", timeZone: "UTC" });
}

function Outreach({ weken }) {
  const doel = OUTREACH_DOEL_PER_WEEK;
  const nu = weken[weken.length - 1] || { aantal: 0, perPersoon: {} };
  const vorige = weken[weken.length - 2] || { aantal: 0 };
  const max = Math.max(doel, ...weken.map((w) => w.aantal), 1);
  const hoogte = 120;
  const personen = Object.entries(nu.perPersoon).sort((a, b) => b[1] - a[1]);
  return (
    <div style={kaart}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
        <div>
          <h2 style={kopje}>Outreach deze week</h2>
          <p style={uitleg}>
            Hoeveel leads we zelf benaderd hebben: een preview gemaakt (voor brief of mail) of op &quot;benaderd&quot; gezet.
            Dit is het getal dat we in de hand hebben; klanten volgen pas weken later.
          </p>
        </div>
        <Status goed={nu.aantal >= doel} tekst={nu.aantal >= doel ? "Weekdoel gehaald" : `Nog ${doel - nu.aantal} te gaan`} />
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
        <span style={{ fontSize: 34, fontWeight: 800, color: KLEUR.inkt, lineHeight: 1 }}>{nu.aantal}</span>
        <span style={{ fontSize: 14, color: "#6B6258" }}>van {doel} deze week · vorige week {vorige.aantal}</span>
      </div>
      {personen.length > 0 && (
        <div style={{ fontSize: 13, color: "#6B6258", marginBottom: 18 }}>
          {personen.map(([p, n], i) => (
            <span key={p}>
              {i > 0 && " · "}
              <strong style={{ color: KLEUR.inkt }}>{p}</strong> {n}
            </span>
          ))}
        </div>
      )}

      {/* Laatste 8 weken */}
      <div style={labelStijl}>
        Laatste {weken.length} weken{" "}
        <span style={{ textTransform: "none", letterSpacing: 0, fontWeight: 500 }}>· stippellijn = weekdoel ({doel})</span>
      </div>
      <div style={{ position: "relative", height: hoogte + 22, marginTop: 18 }}>
        <div
          aria-hidden="true"
          style={{ position: "absolute", left: 0, right: 0, bottom: 22 + (doel / max) * hoogte, borderTop: `1.5px dashed ${KLEUR.label}` }}
        />
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, top: 0, display: "flex", alignItems: "flex-end", gap: 6 }}>
          {weken.map((w, i) => {
            const h = Math.round((w.aantal / max) * hoogte);
            const huidig = i === weken.length - 1;
            return (
              <div key={w.week} title={`Week van ${weekLabel(w.week)}: ${w.aantal} benaderd`} style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: huidig ? KLEUR.inkt : "#6B6258", marginBottom: 3 }}>{w.aantal || ""}</span>
                <div style={{ width: "100%", maxWidth: 34, height: Math.max(h, w.aantal > 0 ? 3 : 1), background: huidig ? KLEUR.klei : "#E3B7A5", borderRadius: "4px 4px 0 0" }} />
                <span style={{ fontSize: 10.5, color: "#9A9084", marginTop: 6, whiteSpace: "nowrap" }}>{weekLabel(w.week)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function tekstVoor(a) {
  const B = ({ children }) => <strong style={{ color: KLEUR.inkt }}>{children}</strong>;
  switch (a.soort) {
    case "previews": {
      const n = a.namen.length;
      const getoond = a.namen.slice(0, 3).join(", ");
      return (
        <>
          {n === 1 ? "preview gemaakt voor " : `${n} previews gemaakt: `}
          <B>{getoond}</B>
          {n > 3 && <span style={{ color: "#9A9084" }}> en {n - 3} meer</span>}
        </>
      );
    }
    case "klant":
      return <>🎉 nieuwe klant: <B>{a.wat}</B></>;
    case "fase":
      return <><B>{a.wat}</B> → {a.naar}</>;
    case "lead_benaderd":
      return <>benaderd: <B>{a.wat}</B></>;
    case "lead_klant":
      return <>lead klant geworden: <B>{a.wat}</B></>;
    case "lead_afgewezen":
      return <>afgewezen: <B>{a.wat}</B></>;
    case "sync":
      return <>{a.aantal} nieuwe {a.aantal === 1 ? "lead" : "leads"} uit de leadlijst</>;
    case "gegevens":
      return <>gegevens aangevuld: <B>{a.wat}</B></>;
    default:
      return a.soort;
  }
}

function Activiteit({ items }) {
  return (
    <div style={kaart}>
      <h2 style={kopje}>Activiteit</h2>
      <p style={uitleg}>Wat er de afgelopen 7 dagen gebeurd is.</p>
      {items.length === 0 ? (
        <p style={{ fontSize: 13.5, color: "#9A9084", margin: 0 }}>Deze week nog niets vastgelegd.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {items.map((a, i) => (
            <div
              key={i}
              style={{ display: "flex", gap: 12, alignItems: "baseline", padding: "9px 0", borderTop: i ? `1px solid ${KLEUR.baan}` : "none", fontSize: 13.5, flexWrap: "wrap" }}
            >
              <span style={{ color: "#9A9084", fontSize: 12, whiteSpace: "nowrap", minWidth: 96 }}>
                {new Date(a.moment).toLocaleString("nl-NL", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Amsterdam" })}
              </span>
              <span style={{ fontWeight: 700, color: KLEUR.inkt, minWidth: 60 }}>{a.persoon || "—"}</span>
              <span style={{ color: KLEUR.gedempt, flex: "1 1 220px", minWidth: 0 }}>{tekstVoor(a)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default async function OverzichtPage() {
  const sessie = leesSessie();
  const beheer = isBeheer(sessie);
  const c = await getCockpit();

  return (
    <WerkplekShell
      naam={sessie?.naam || "collega"}
      beheer={beheer}
      actief="/overzicht"
      titel="Overzicht"
      sub="Liggen we op koers, en doen we genoeg om er te komen?"
    >
      {c.fout && (
        <div style={{ ...kaart, background: KLEUR.amber.bg, borderColor: KLEUR.amber.bg, color: KLEUR.amber.tekst, fontSize: 13.5, marginBottom: 14 }}>
          Niet alle cijfers konden worden opgehaald; wat hieronder staat kan onvolledig zijn.
        </div>
      )}
      <div style={{ display: "grid", gap: 14 }}>
        <OpKoers k={c.koers} />
        <Outreach weken={c.outreach} />
        <Activiteit items={c.activiteit} />
      </div>
    </WerkplekShell>
  );
}
