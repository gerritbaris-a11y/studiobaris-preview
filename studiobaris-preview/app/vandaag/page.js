import { getAiUpdate, getVoorstellen } from "../../lib/taken-data";
import { leesSessie, isBeheer } from "../../lib/auth";
import WerkplekShell from "../werkplek-shell";
import AiUpdateBlok from "./ai-update-blok";
import Voorstellen from "./voorstellen";
import { KLEUR } from "../werkplek-stijl";
import { getProefOverzicht } from "../../lib/proef";
import ProefMeldingen from "./proef-meldingen";
import { getAanvragenOverzicht } from "../../lib/aanbod";
import AanvraagAf from "../klanten/aanvraag-af";

// Terugbelverzoeken van de aanbodpagina ("Dit wil ik" op de preview). Warmste
// leads die er zijn: bovenaan, tot iemand "Gebeld" aanvinkt.
function telLink(t) {
  let d = String(t || "").replace(/[^0-9+]/g, "");
  if (d.startsWith("0")) d = "+31" + d.slice(1);
  return "tel:" + d;
}
function wanneer(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("nl-NL", { day: "numeric", month: "short", timeZone: "Europe/Amsterdam" }) + ", " +
    d.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Amsterdam" });
}
function Terugbellen({ lijst }) {
  if (!lijst.length) return null;
  const knop = { fontSize: 12.5, padding: "6px 11px", borderRadius: 8, border: "1px solid #1A2B3D", background: "#1A2B3D", color: "#fff", fontWeight: 700, textDecoration: "none" };
  return (
    <div style={{ background: "#fff", border: "2px solid #C79A56", borderRadius: 14, padding: "14px 16px", display: "grid", gap: 10, marginBottom: 14 }}>
      <div>
        <div style={{ fontWeight: 800, fontSize: 15 }}>Wil teruggebeld worden</div>
        <div style={{ fontSize: 13, color: KLEUR.gedempt }}>Via &quot;Dit wil ik&quot; op hun preview. Bel ze nu het warm is en vink daarna af.</div>
      </div>
      {lijst.map((a) => (
        <div key={a.aanvraag_id} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px 12px", borderTop: `1px solid ${KLEUR.baan}`, paddingTop: 10 }}>
          <span style={{ fontWeight: 700 }}>{a.bedrijf || a.slug}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: a.soort === "starten" ? "#0f6e56" : "#854f0b" }}>{a.soort === "starten" ? "Wil starten" : "Heeft een vraag"}</span>
          <span style={{ fontSize: 13, color: KLEUR.gedempt }}>{a.moment || "geen voorkeur"} · {wanneer(a.aanvraag_op)}{a.verkoper ? ` · ${a.verkoper}` : ""}</span>
          <span style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>
            <a href={telLink(a.telefoon)} style={knop}>Bel {a.telefoon}</a>
            <a href={"https://preview.studiobaris.nl/" + a.slug} target="_blank" rel="noopener" style={{ ...knop, background: "#fff", color: "#a35400" }}>Preview</a>
            <AanvraagAf id={a.aanvraag_id} />
          </span>
        </div>
      ))}
    </div>
  );
}

export const dynamic = "force-dynamic";

// "Vandaag": het startscherm voor beheer met wat er nu speelt: bovenaan de
// wekelijkse AI-update (OpenAI / Anthropic / Gemini), daaronder de dagelijkse
// voorstellen voor nieuwe previews. De oude takenlijst die hier stond is
// vervangen (die taken staan op het Bord); getVandaag() wordt niet meer gebruikt.
export default async function VandaagPage() {
  const sessie = leesSessie();
  const naam = sessie && sessie.naam ? sessie.naam : "collega";
  const beheer = isBeheer(sessie);

  const [aiUpdate, voorstellen, proefLijst, aanvragen] = await Promise.all([getAiUpdate(), getVoorstellen(), getProefOverzicht(), getAanvragenOverzicht()]);
  const terugbellen = (aanvragen || []).filter((a) => a.aanvraag_id).sort((x, y) => new Date(y.aanvraag_op) - new Date(x.aanvraag_op));

  // Proefperiode demo-app: recent geplaatste proefprojecten en de maandvraag.
  const nu = Date.now();
  const lopend = (proefLijst || []).filter((p) => p.gestart_op && !p.is_klant && !p.afgewezen);
  const geplaatst = lopend
    .filter((p) => p.laatst_geplaatst_op && nu - new Date(p.laatst_geplaatst_op).getTime() < 7 * 864e5)
    .sort((a, b) => new Date(b.laatst_geplaatst_op) - new Date(a.laatst_geplaatst_op));
  const maandvraag = lopend
    .filter((p) => p.tot && new Date(p.tot).getTime() <= nu)
    .sort((a, b) => new Date(a.tot) - new Date(b.tot));

  return (
    <WerkplekShell
      naam={naam}
      beheer={beheer}
      actief="/vandaag"
      titel="Vandaag"
      sub="Wat er nu speelt."
    >
      <Terugbellen lijst={terugbellen} />
      <ProefMeldingen geplaatst={geplaatst} maandvraag={maandvraag} />
      {aiUpdate ? (
        <AiUpdateBlok update={aiUpdate} />
      ) : (
        <div style={{ background: "#fff", border: `1px solid ${KLEUR.lijn}`, borderRadius: 14, padding: "16px 18px", color: KLEUR.gedempt, fontSize: 14 }}>
          Nog geen AI-update. De eerste verschijnt hier zodra de geplande taak &quot;Wekelijkse AI-update&quot; heeft gedraaid.
        </div>
      )}
      <Voorstellen open={voorstellen.open} dezeWeek={voorstellen.dezeWeek} />
    </WerkplekShell>
  );
}
