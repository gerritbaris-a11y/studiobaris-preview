import { getTeamLogin, getOmzet, getBtw } from "../../lib/server-data";
import { leesSessie } from "../../lib/auth";
import { BTW_TARIEF } from "../../lib/mollie";
import { ResetKnop } from "./team-actions";

export const dynamic = "force-dynamic";

function euro(n) {
  const v = Number(n || 0);
  return "€ " + v.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const wrap = { maxWidth: 1040, margin: "4vh auto", padding: "0 18px", fontFamily: "system-ui, sans-serif", color: "#2B2724" };

export default async function TeamPage() {
  const sessie = leesSessie();
  const [team, omzet, btw] = await Promise.all([getTeamLogin(), getOmzet(), getBtw()]);

  // Btw die we opzij zetten. Ingevoerde bedragen zijn excl. btw; de klant betaalt
  // incl. Wat binnenkomt aan btw dragen we later af, dus dat zetten we apart.
  const pct = Math.round(BTW_TARIEF * 100);
  const eenmaligExcl = Number(btw.ontvangen_eenmalig_excl || 0);
  const eenmaligBtw = Math.round(eenmaligExcl * BTW_TARIEF * 100) / 100;
  const eenmaligIncl = eenmaligExcl + eenmaligBtw;
  const aboMaandExcl = Number(btw.lopend_abo_maand_excl || 0);
  const aboMaandBtw = Math.round(aboMaandExcl * BTW_TARIEF * 100) / 100;

  const omzetVan = (naam) =>
    omzet.find((o) => o.persoon === naam) ||
    { aantal: 0, verkoopbedrag: 0, commissie: 0, verdiend: 0, openstaand: 0 };

  const totaal = omzet.reduce(
    (a, o) => ({
      verkoopbedrag: a.verkoopbedrag + Number(o.verkoopbedrag || 0),
      commissie: a.commissie + Number(o.commissie || 0),
      verdiend: a.verdiend + Number(o.verdiend || 0),
      openstaand: a.openstaand + Number(o.openstaand || 0),
    }),
    { verkoopbedrag: 0, commissie: 0, verdiend: 0, openstaand: 0 }
  );

  const beheer = team.filter((t) => t.rol === "beheer");
  const verkopers = team.filter((t) => t.rol !== "beheer");

  const totVak = (label, waarde, kleur) => (
    <div style={{ flex: "1 1 130px", minWidth: 130 }}>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,.7)", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: kleur || "#fff", lineHeight: 1.1 }}>{waarde}</div>
    </div>
  );

  const persoonCard = (t) => {
    const o = omzetVan(t.naam);
    const cel = (label, waarde, kleur) => (
      <div style={{ flex: "1 1 90px", minWidth: 90 }}>
        <div style={{ fontSize: 11, color: "#9A9084" }}>{label}</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: kleur || "#2B2724" }}>{waarde}</div>
      </div>
    );
    return (
      <div key={t.id} style={{ background: "#fff", border: "1px solid #ECE4D7", borderRadius: 14, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ width: 34, height: 34, borderRadius: 10, background: t.rol === "beheer" ? "#2B2724" : "#C05A38", color: "#fff", display: "grid", placeItems: "center", fontWeight: 800 }}>
            {t.naam.charAt(0).toUpperCase()}
          </span>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{t.naam}</div>
          <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 999, background: t.rol === "beheer" ? "#e6f1fb" : "#fff7ed", color: t.rol === "beheer" ? "#9E3B2E" : "#9a3412" }}>
            {t.rol === "beheer" ? "Beheer" : "Verkoop"}
          </span>
          <span style={{ fontSize: 12, color: t.gezet ? "#0f6e56" : "#b45309" }}>
            {t.gezet ? "● wachtwoord ingesteld" : "○ nog niet ingelogd"}
          </span>
          <div style={{ marginLeft: "auto" }}>
            <ResetKnop id={t.id} naam={t.naam} gezet={t.gezet} />
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, borderTop: "1px solid #f0f0f0", paddingTop: 12 }}>
          {cel("Klanten", o.aantal)}
          {cel("Verkocht", euro(o.verkoopbedrag))}
          {cel("Commissie (50%)", euro(o.commissie))}
          {cel("Uitbetaald", euro(o.verdiend), "#0f6e56")}
          {cel("Nog te verdienen", euro(o.openstaand), "#b45309")}
        </div>
      </div>
    );
  };

  return (
    <main style={wrap}>
      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <p style={{ fontSize: 13, letterSpacing: 2, textTransform: "uppercase", color: "#B0A697", margin: 0 }}>StudioBaris</p>
        {sessie && (
          <span style={{ marginLeft: "auto", fontSize: 13, color: "#6B6258" }}>
            Ingelogd als <strong style={{ color: "#2B2724" }}>{sessie.naam}</strong>
            {" · "}
            <a href="/api/auth/logout" style={{ color: "#C05A38" }}>Uitloggen</a>
          </span>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", margin: "6px 0 16px" }}>
        <h1 style={{ fontSize: 26, margin: 0 }}>Team &amp; omzet</h1>
        <a href="/dashboard" style={{ color: "#C05A38", fontSize: 14 }}>→ naar Klanten</a>
        <a href="/leads" style={{ color: "#C05A38", fontSize: 14 }}>→ naar Leads</a>
      </div>

      <div style={{ background: "linear-gradient(135deg,#2B2724,#2B2724)", color: "#fff", borderRadius: 16, padding: "16px 20px", marginBottom: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Totaal — hele team</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
          {totVak("Verkocht", euro(totaal.verkoopbedrag))}
          {totVak("Commissie (50%)", euro(totaal.commissie))}
          {totVak("Uitbetaald", euro(totaal.verdiend), "#7ee2b8")}
          {totVak("Nog te verdienen", euro(totaal.openstaand), "#ffd18a")}
        </div>
      </div>

      {/* Btw opzij zetten — apart van de omzet, zodat we niet voor verrassingen staan. */}
      <div style={{ background: "#fff", border: "1px solid #E7DFD1", borderLeft: "5px solid #C98A2B", borderRadius: 16, padding: "16px 20px", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#2B2724" }}>Btw — opzij zetten</div>
          <span style={{ fontSize: 12.5, color: "#9A9084" }}>Dit geld is niet van ons; het gaat naar de Belastingdienst.</span>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 22, alignItems: "flex-end", marginTop: 8 }}>
          <div style={{ flex: "1 1 200px", minWidth: 180 }}>
            <div style={{ fontSize: 12, color: "#8A6417", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>Nu apart houden</div>
            <div style={{ fontSize: 30, fontWeight: 800, color: "#8A6417", lineHeight: 1.05 }}>{euro(eenmaligBtw)}</div>
            <div style={{ fontSize: 12.5, color: "#9A9084", marginTop: 3 }}>{pct}% btw over ontvangen betalingen</div>
          </div>
          <div style={{ flex: "1 1 200px", minWidth: 180 }}>
            <div style={{ fontSize: 12, color: "#6B6258", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>Komt er elke maand bij</div>
            <div style={{ fontSize: 30, fontWeight: 800, color: "#2B2724", lineHeight: 1.05 }}>{euro(aboMaandBtw)}<span style={{ fontSize: 15, fontWeight: 600, color: "#9A9084" }}> / maand</span></div>
            <div style={{ fontSize: 12.5, color: "#9A9084", marginTop: 3 }}>{pct}% btw over lopende abonnementen</div>
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 0, borderTop: "1px solid #F4EEE3", marginTop: 14, paddingTop: 12 }}>
          {[
            ["Ontvangen (incl. btw)", euro(eenmaligIncl), "#2B2724"],
            ["Waarvan onze omzet (excl.)", euro(eenmaligExcl), "#2B2724"],
            [`Waarvan btw (${pct}%)`, euro(eenmaligBtw), "#8A6417"],
          ].map(([label, waarde, kleur], i) => (
            <div key={label} style={{ flex: "1 1 150px", minWidth: 140, paddingLeft: i ? 14 : 0, borderLeft: i ? "1px solid #F4EEE3" : "none" }}>
              <div style={{ fontSize: 12, color: "#9A9084" }}>{label}</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: kleur }}>{waarde}</div>
            </div>
          ))}
        </div>

        <p style={{ fontSize: 12, color: "#9A9084", margin: "12px 0 0", lineHeight: 1.5 }}>
          Indicatie op basis van betalingen die al binnen zijn ({btw.aantal_betaald} {btw.aantal_betaald === 1 ? "klant" : "klanten"} betaald,
          {" "}{btw.aantal_abo} met een lopend abonnement). Btw draag je per aangifteperiode af aan de Belastingdienst; de btw die je zelf
          over zakelijke kosten betaalt (voorbelasting) mag je hiervan aftrekken, dus de uiteindelijke afdracht kan lager uitvallen.
          Houd dit even af met je boekhouder.
        </p>
      </div>

      {verkopers.length > 0 && (
        <>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#9A9084", textTransform: "uppercase", letterSpacing: 1, margin: "4px 0 10px" }}>Verkoop</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12, marginBottom: 20 }}>
            {verkopers.map(persoonCard)}
          </div>
        </>
      )}

      <div style={{ fontSize: 12, fontWeight: 700, color: "#9A9084", textTransform: "uppercase", letterSpacing: 1, margin: "4px 0 10px" }}>Beheer</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
        {beheer.map(persoonCard)}
      </div>
    </main>
  );
}
