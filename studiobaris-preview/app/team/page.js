import { getTeamLogin, getOmzet } from "../../lib/server-data";
import { leesSessie, isBeheer } from "../../lib/auth";
import WerkplekShell from "../werkplek-shell";
import { ResetKnop } from "./team-actions";

export const dynamic = "force-dynamic";

function euro(n) {
  const v = Number(n || 0);
  return "€ " + v.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const wrap = { maxWidth: 1040, margin: "4vh auto", padding: "0 18px", fontFamily: "system-ui, sans-serif", color: "#2B2724" };

export default async function TeamPage() {
  const sessie = leesSessie();
  const magAlles = isBeheer(sessie);
  const [team, omzet] = await Promise.all([getTeamLogin(), getOmzet()]);

  const omzetVan = (naam) =>
    omzet.find((o) => o.persoon === naam) ||
    { aantal: 0, verkoopbedrag: 0, commissie: 0, verdiend: 0, openstaand: 0, maand_commissie: 0, eigenaarsdeel_verdiend: 0, eigenaarsdeel_openstaand: 0, eigenaarsdeel_maand: 0 };

  // Dit blok is puur de commissie die aan het verkoopteam wordt uitbetaald
  // of nog verschuldigd is — die begint pas te lopen zodra een verkoper
  // zelf een verkoop doet. Gerrit en Levi horen hier niet bij: zij zijn geen
  // "verkopers" die commissie krijgen, maar functioneren samen als het
  // bedrijf zelf (hun eigen omzet staat op hun eigen kaart, als één
  // gezamenlijke pot 50/50 verdeeld). "Verkocht" blijft wel het complete
  // bedrag over iedereen, inclusief Gerrit/Levi — dat is puur "hoeveel is
  // er in totaal verkocht", geen commissie-cijfer.
  const isBeheerNaam = (naam) => (team.find((t) => t.naam === naam) || {}).rol === "beheer";
  const totaal = omzet.reduce(
    (a, o) => {
      const eigenaar = isBeheerNaam(o.persoon);
      return {
        verkoopbedrag: a.verkoopbedrag + Number(o.verkoopbedrag || 0),
        commissie: a.commissie + (eigenaar ? 0 : Number(o.commissie || 0)),
        verdiend: a.verdiend + (eigenaar ? 0 : Number(o.verdiend || 0)),
        openstaand: a.openstaand + (eigenaar ? 0 : Number(o.openstaand || 0)),
        maand_commissie: a.maand_commissie + (eigenaar ? 0 : Number(o.maand_commissie || 0)),
      };
    },
    { verkoopbedrag: 0, commissie: 0, verdiend: 0, openstaand: 0, maand_commissie: 0 }
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
          {t.rol === "beheer" ? (
            <>
              {cel("Omzet — uitbetaald", euro(o.eigenaarsdeel_verdiend), "#0f6e56")}
              {cel("Omzet — nog te verdienen", euro(o.eigenaarsdeel_openstaand), "#b45309")}
              {Number(o.eigenaarsdeel_maand) > 0 && cel("Omzet per maand", euro(o.eigenaarsdeel_maand), "#0f6e56")}
            </>
          ) : (
            <>
              {cel(t.vergoeding_model === "100eur" ? "Vergoeding (€100 p/klant)" : "Commissie (50%)", euro(o.commissie))}
              {cel("Uitbetaald", euro(o.verdiend), "#0f6e56")}
              {cel("Nog te verdienen", euro(o.openstaand), "#b45309")}
              {t.vergoeding_model === "50pct_abo" && cel("Per maand (1/3 abo)", euro(o.maand_commissie), "#0f6e56")}
              {t.vergoeding_model === "50pct_vast" && cel(`Per maand (${euro(t.maand_vast_bedrag)} p/klant)`, euro(o.maand_commissie), "#0f6e56")}
            </>
          )}
        </div>
        {t.rol === "beheer" && (
          <div style={{ fontSize: 11.5, color: "#9A9084" }}>
            "Omzet" is jouw helft van alles wat binnenkomt — 50/50 met de andere eigenaar, ook als jij zelf de
            verkoop deed. Wie de verkoop op zijn naam heeft staan (bij "Verkocht") is dus alleen om te zien waar
            een klant vandaan komt, niet wie het geld krijgt.
          </div>
        )}
      </div>
    );
  };

  return (
    <WerkplekShell
      naam={sessie?.naam || "collega"}
      beheer={magAlles}
      actief="/team"
      titel="Team & omzet"
      sub="Wie verkocht wat, en wat staat er nog open."
    >
      <div style={{ background: "linear-gradient(135deg,#2B2724,#2B2724)", color: "#fff", borderRadius: 16, padding: "16px 20px", marginBottom: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Totaal — hele team</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
          {totVak("Verkocht", euro(totaal.verkoopbedrag))}
          {totVak("Commissie", euro(totaal.commissie))}
          {totVak("Uitbetaald", euro(totaal.verdiend), "#7ee2b8")}
          {totVak("Nog te verdienen", euro(totaal.openstaand), "#ffd18a")}
          {totaal.maand_commissie > 0 && totVak("Commissie per maand", euro(totaal.maand_commissie), "#7ee2b8")}
        </div>
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
    </WerkplekShell>
  );
}
