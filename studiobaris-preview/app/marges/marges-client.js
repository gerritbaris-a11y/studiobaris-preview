"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { KLEUR } from "../werkplek-stijl";
import { Knop } from "../werkplek-shell";

const kaart = { background: "#fff", border: `1px solid ${KLEUR.lijn}`, borderRadius: 14 };
const th = {
  textAlign: "left", fontSize: 11, letterSpacing: 1, textTransform: "uppercase",
  color: KLEUR.label, fontWeight: 700, padding: "12px 14px",
  background: KLEUR.baan, borderBottom: `1px solid ${KLEUR.baanRand}`,
};
const td = { padding: "13px 14px", fontSize: 14.5, borderBottom: `1px solid ${KLEUR.lijn}` };
const tdGetal = { ...td, textAlign: "right", fontVariantNumeric: "tabular-nums" };
const veldLabel = { display: "block", fontSize: 12.5, fontWeight: 700, color: KLEUR.labelDonker, marginBottom: 5 };
const veldInput = {
  width: "100%", boxSizing: "border-box", padding: "9px 11px", fontSize: 14.5,
  border: `1px solid ${KLEUR.lijn2}`, borderRadius: 8, fontFamily: "inherit",
};

function euro(v, d = 2) {
  const n = Number(v) || 0;
  return "€ " + n.toLocaleString("nl-NL", { minimumFractionDigits: d, maximumFractionDigits: d });
}

function pct(v) {
  if (v === null || v === undefined) return "—";
  return Number(v).toLocaleString("nl-NL", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + "%";
}

const PAKKET_LABEL = { vol: "Volledig pakket", plugin: "Alleen de plugin" };

function MargeKaart({ titel, sub, omzet, kosten, eenmalig }) {
  const marge = omzet - kosten;
  const margePct = omzet > 0 ? (marge / omzet) * 100 : null;
  return (
    <div style={{ ...kaart, padding: "16px 18px", flex: "1 1 260px", minWidth: 240 }}>
      <div style={{ fontSize: 13.5, fontWeight: 800, color: KLEUR.inkt, marginBottom: 2 }}>{titel}</div>
      <div style={{ fontSize: 12, color: KLEUR.label, marginBottom: 12 }}>{sub}</div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, marginBottom: 4 }}>
        <span style={{ color: KLEUR.gedempt }}>Omzet p/m</span>
        <span style={{ fontWeight: 700 }}>{euro(omzet)}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, marginBottom: 8 }}>
        <span style={{ color: KLEUR.gedempt }}>Kosten p/m</span>
        <span style={{ fontWeight: 700, color: "#b45309" }}>− {euro(kosten)}</span>
      </div>
      <div style={{ borderTop: `1px solid ${KLEUR.lijn}`, paddingTop: 8, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontSize: 13.5, fontWeight: 800 }}>Marge p/m</span>
        <span style={{ fontSize: 19, fontWeight: 800, color: marge >= 0 ? "#0f6e56" : "#b91c1c" }}>
          {euro(marge)} <span style={{ fontSize: 12.5, fontWeight: 700 }}>({pct(margePct)})</span>
        </span>
      </div>
      {eenmalig != null && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px dashed ${KLEUR.lijn}`, fontSize: 12.5, color: KLEUR.label, lineHeight: 1.5 }}>
          + {euro(eenmalig)} eenmalig bij oplevering (website). Hier zonder eigen kostprijs meegerekend — pas
          "kostprijs plugin, vast" hieronder aan als de bouw zelf ook direct geld kost.
        </div>
      )}
    </div>
  );
}

export default function MargesClient({ marges }) {
  const router = useRouter();
  const i = marges.instellingen || {};

  const [form, setForm] = useState({
    websiteEenmalig: i.website_eenmalig ?? 599,
    maandbedragVol: i.maandbedrag_vol ?? 29.95,
    maandbedragPlugin: i.maandbedrag_plugin ?? 12.95,
    kostprijsHosting: i.kostprijs_hosting ?? 3.0,
    kostprijsDomein: i.kostprijs_domein ?? 0.92,
    kostprijsPluginVast: i.kostprijs_plugin_vast ?? 0,
  });
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState("");
  const [opgeslagen, setOpgeslagen] = useState(false);

  function zet(veld, waarde) {
    setOpgeslagen(false);
    setForm((f) => ({ ...f, [veld]: waarde }));
  }

  const getal = (v) => {
    const n = Number(String(v).replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  };

  // Scenario's rekenen live mee terwijl je typt, nog vóór opslaan — zo zie je
  // meteen het effect van een ander tarief voordat je 'm definitief maakt.
  const scenarios = useMemo(() => {
    const hosting = getal(form.kostprijsHosting);
    const domein = getal(form.kostprijsDomein);
    const pluginVast = getal(form.kostprijsPluginVast);
    return {
      vol: { omzet: getal(form.maandbedragVol), kosten: hosting + domein + pluginVast, eenmalig: getal(form.websiteEenmalig) },
      plugin: { omzet: getal(form.maandbedragPlugin), kosten: pluginVast, eenmalig: null },
      volGratis: { omzet: getal(form.maandbedragVol), kosten: hosting + domein + pluginVast, eenmalig: 0 },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  async function opslaan() {
    setFout(""); setBezig(true); setOpgeslagen(false);
    try {
      const res = await fetch("/api/financieel/instellingen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Opslaan mislukt.");
      setOpgeslagen(true);
      router.refresh();
    } catch (e) {
      setFout(String(e.message || e));
    } finally {
      setBezig(false);
    }
  }

  const klanten = marges.klanten || [];
  const perPakket = marges.per_pakket || [];

  return (
    <div>
      {/* Instelbare tarieven */}
      <div style={{ ...kaart, padding: "18px 20px", marginBottom: 20 }}>
        <h2 style={{ fontSize: 15, margin: "0 0 3px" }}>Tarieven</h2>
        <p style={{ fontSize: 12.5, color: KLEUR.label, margin: "0 0 16px" }}>
          Verkoopprijzen en kostprijzen op één plek. Alles hieronder rekent meteen door in de scenario's en het
          overzicht — pas op "Opslaan" om ook echt te wijzigen wat er in de database staat.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14, marginBottom: 14 }}>
          <div>
            <label style={veldLabel}>Website, eenmalig</label>
            <input style={veldInput} value={form.websiteEenmalig} onChange={(e) => zet("websiteEenmalig", e.target.value)} />
          </div>
          <div>
            <label style={veldLabel}>Volledig pakket, p/m</label>
            <input style={veldInput} value={form.maandbedragVol} onChange={(e) => zet("maandbedragVol", e.target.value)} />
          </div>
          <div>
            <label style={veldLabel}>Alleen plugin, p/m</label>
            <input style={veldInput} value={form.maandbedragPlugin} onChange={(e) => zet("maandbedragPlugin", e.target.value)} />
          </div>
          <div>
            <label style={veldLabel}>Kostprijs hosting, p/m</label>
            <input style={veldInput} value={form.kostprijsHosting} onChange={(e) => zet("kostprijsHosting", e.target.value)} />
          </div>
          <div>
            <label style={veldLabel}>Kostprijs domein, p/m</label>
            <input style={veldInput} value={form.kostprijsDomein} onChange={(e) => zet("kostprijsDomein", e.target.value)} />
          </div>
          <div>
            <label style={veldLabel}>Kostprijs plugin, vast p/m</label>
            <input style={veldInput} value={form.kostprijsPluginVast} onChange={(e) => zet("kostprijsPluginVast", e.target.value)} />
          </div>
        </div>
        <p style={{ fontSize: 12, color: KLEUR.label, margin: "0 0 14px", lineHeight: 1.5 }}>
          "Kostprijs plugin, vast" is een optionele extra post bovenop de werkelijk gemeten AI-rekenkosten per klant
          (die worden er in het overzicht per klant automatisch bij opgeteld — die hoef je hier niet zelf in te
          schatten).
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Knop kind="primair" onClick={opslaan} disabled={bezig}>{bezig ? "Bezig…" : "Opslaan"}</Knop>
          {opgeslagen && <span style={{ fontSize: 13, color: "#0f6e56", fontWeight: 700 }}>Opgeslagen.</span>}
          {fout && <span style={{ fontSize: 13, color: "#b91c1c", fontWeight: 700 }}>{fout}</span>}
          {i.updated_at && (
            <span style={{ fontSize: 12, color: KLEUR.label, marginLeft: "auto" }}>
              Laatst gewijzigd {new Date(i.updated_at).toLocaleString("nl-NL")}{i.updated_door ? ` door ${i.updated_door}` : ""}
            </span>
          )}
        </div>
      </div>

      {/* Scenario's: marge per pakket bij de tarieven hierboven, los van wie het nu daadwerkelijk afneemt */}
      <h2 style={{ fontSize: 15, margin: "0 0 10px" }}>Marge per pakket</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
        <MargeKaart
          titel="Volledig pakket"
          sub="hosting + domein + de app"
          omzet={scenarios.vol.omzet}
          kosten={scenarios.vol.kosten}
          eenmalig={scenarios.vol.eenmalig}
        />
        <MargeKaart
          titel="Alleen de plugin"
          sub="klant heeft eigen hosting/domein"
          omzet={scenarios.plugin.omzet}
          kosten={scenarios.plugin.kosten}
        />
        <MargeKaart
          titel="Volledig pakket, website gratis"
          sub="zelfde maandbundel, geen eenmalige bouwkosten"
          omzet={scenarios.volGratis.omzet}
          kosten={scenarios.volGratis.kosten}
          eenmalig={0}
        />
      </div>

      {/* Live: per pakketsoort, gebaseerd op wie er nu daadwerkelijk betaalt */}
      <h2 style={{ fontSize: 15, margin: "0 0 10px" }}>Nu, per pakketsoort</h2>
      <div style={{ ...kaart, overflowX: "auto", marginBottom: 24 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>Pakket</th>
              <th style={{ ...th, textAlign: "right" }}>Klanten</th>
              <th style={{ ...th, textAlign: "right" }}>Omzet p/m</th>
              <th style={{ ...th, textAlign: "right" }}>Kosten p/m</th>
              <th style={{ ...th, textAlign: "right" }}>Marge p/m</th>
            </tr>
          </thead>
          <tbody>
            {perPakket.map((g) => (
              <tr key={g.pakket_type || "onbekend"}>
                <td style={td}>{PAKKET_LABEL[g.pakket_type] || "Onbekend pakket"}</td>
                <td style={tdGetal}>{g.aantal}</td>
                <td style={tdGetal}>{euro(g.omzet_maand)}</td>
                <td style={tdGetal}>{euro(g.kosten_maand)}</td>
                <td style={{ ...tdGetal, fontWeight: 800, color: g.marge_maand >= 0 ? "#0f6e56" : "#b91c1c" }}>{euro(g.marge_maand)}</td>
              </tr>
            ))}
            {perPakket.length === 0 && (
              <tr><td colSpan={5} style={{ ...td, textAlign: "center", color: KLEUR.label }}>Nog geen betalende klanten.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Live: per klant */}
      <h2 style={{ fontSize: 15, margin: "0 0 10px" }}>Nu, per klant</h2>
      <div style={{ ...kaart, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>Klant</th>
              <th style={th}>Pakket</th>
              <th style={{ ...th, textAlign: "right" }}>Omzet p/m</th>
              <th style={{ ...th, textAlign: "right" }}>Hosting+domein</th>
              <th style={{ ...th, textAlign: "right" }}>AI (gemeten)</th>
              <th style={{ ...th, textAlign: "right" }}>Marge p/m</th>
              <th style={{ ...th, textAlign: "right" }}>Marge %</th>
            </tr>
          </thead>
          <tbody>
            {klanten.map((k) => (
              <tr key={k.slug}>
                <td style={{ ...td, fontWeight: 700 }}>
                  {k.company_name}
                  {k.klantnummer && <span style={{ fontSize: 11.5, color: KLEUR.label, fontWeight: 400 }}> · #{k.klantnummer}</span>}
                </td>
                <td style={td}>{PAKKET_LABEL[k.pakket_type] || "—"}</td>
                <td style={tdGetal}>{euro(k.maandbedrag)}</td>
                <td style={tdGetal}>{euro((k.pakket_type === "vol" ? getal(form.kostprijsHosting) + getal(form.kostprijsDomein) : 0))}</td>
                <td style={tdGetal}>{euro(k.ai_kosten_maand, 4)}</td>
                <td style={{ ...tdGetal, fontWeight: 800, color: k.marge_maand >= 0 ? "#0f6e56" : "#b91c1c" }}>{euro(k.marge_maand)}</td>
                <td style={tdGetal}>{pct(k.marge_pct)}</td>
              </tr>
            ))}
            {klanten.length === 0 && (
              <tr><td colSpan={7} style={{ ...td, textAlign: "center", color: KLEUR.label }}>Nog geen betalende klanten.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <p style={{ marginTop: 18, fontSize: 12.5, color: KLEUR.label, maxWidth: 680, lineHeight: 1.5 }}>
        De kolom "AI (gemeten)" is de werkelijke rekenkost van de app deze maand, gemeten per klant — geen
        schatting. Bij weinig gebruik is dit nog verwaarloosbaar klein; dat kan later oplopen bij meer klanten of
        drukker gebruik. De eenmalige bouwkosten (websiteprijs) tellen hier niet mee in de p/m-marge, om appels met
        appels te vergelijken — die zie je apart op de Facturen- en Omzet &amp; btw-pagina's.
      </p>
    </div>
  );
}
