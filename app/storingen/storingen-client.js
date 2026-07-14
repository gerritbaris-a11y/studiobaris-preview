"use client";

import { useEffect, useState } from "react";

function geleden(iso) {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.round(ms / 60000);
  if (min < 1) return "zojuist";
  if (min < 60) return `${min} min geleden`;
  const u = Math.round(min / 60);
  if (u < 48) return `${u} uur geleden`;
  return `${Math.round(u / 24)} dagen geleden`;
}

function ouderDan(iso, uren) {
  if (!iso) return true;
  return Date.now() - new Date(iso).getTime() > uren * 3600 * 1000;
}

const kaart = {
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  padding: 14,
  marginBottom: 10,
  background: "#fff",
};

function Stip({ kleur, tekst }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#475569" }}>
      <span style={{ width: 9, height: 9, borderRadius: 9, background: kleur, flex: "0 0 auto" }} />
      {tekst}
    </span>
  );
}

function knopStijl(kleur, bezig) {
  return {
    border: "1px solid " + kleur,
    background: bezig ? "#f1f5f9" : "#fff",
    color: kleur,
    borderRadius: 8,
    padding: "7px 12px",
    fontSize: 13,
    fontWeight: 600,
    cursor: bezig ? "wait" : "pointer",
  };
}

export default function StoringenClient({ klanten, nieuwste }) {
  const [bezig, setBezig] = useState("");
  const [meldingen, setMeldingen] = useState({});
  const [mollie, setMollie] = useState(null);

  useEffect(() => {
    fetch("/api/mollie/methodes")
      .then((r) => r.json())
      .then(setMollie)
      .catch(() => setMollie({ ok: false, error: "Niet bereikbaar." }));
  }, []);

  async function doe(id, actie) {
    setBezig(id + actie);
    setMeldingen((m) => ({ ...m, [id]: null }));
    try {
      const res = await fetch("/api/klant/site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, actie }),
      });
      const data = await res.json();
      if (data.ok && actie === "bijwerken") {
        const d = data.data || {};
        setMeldingen((m) => ({
          ...m,
          [id]: d.bijgewerkt
            ? { goed: true, tekst: `Bijgewerkt van ${d.van} naar ${d.naar}. Herlaad de pagina.` }
            : { goed: true, tekst: `Draait al op ${d.huidig || "de nieuwste versie"}.` },
        }));
      } else if (data.ok) {
        const d = data.data || {};
        const n = d.sync && typeof d.sync === "object" ? Object.values(d.sync).join(", ") : "";
        setMeldingen((m) => ({ ...m, [id]: { goed: true, tekst: `Site ververst. ${n}`.trim() } }));
      } else {
        setMeldingen((m) => ({ ...m, [id]: { goed: false, tekst: data.error || "Mislukt." } }));
      }
    } catch (e) {
      setMeldingen((m) => ({ ...m, [id]: { goed: false, tekst: String(e.message || e) } }));
    } finally {
      setBezig("");
    }
  }

  const achter = klanten.filter((k) => k.plugin_versie !== nieuwste);
  const stil = klanten.filter((k) => ouderDan(k.plugin_gezien_op, 24));
  const fout = klanten.filter((k) => k.site_ververs_fout);

  return (
    <>
      {/* Samenvatting */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
        {[
          { label: "Klanten", n: klanten.length, kleur: "#1A2E40" },
          { label: "Verouderde plugin", n: achter.length, kleur: achter.length ? "#b45309" : "#16a34a" },
          { label: "Meer dan 24 uur stil", n: stil.length, kleur: stil.length ? "#b45309" : "#16a34a" },
          { label: "Fout bij bijwerken site", n: fout.length, kleur: fout.length ? "#dc2626" : "#16a34a" },
        ].map((v) => (
          <div key={v.label} style={{ ...kaart, marginBottom: 0, minWidth: 150, flex: "1 1 150px" }}>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "#888" }}>{v.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: v.kleur }}>{v.n}</div>
          </div>
        ))}
      </div>

      {/* Betalingen */}
      <h2 style={{ fontSize: 17, margin: "18px 0 8px" }}>Betalingen</h2>
      <div style={kaart}>
        {!mollie && <span style={{ color: "#64748b", fontSize: 14 }}>Bezig met controleren...</span>}
        {mollie && !mollie.ok && (
          <Stip kleur="#dc2626" tekst={`Mollie: ${mollie.error}`} />
        )}
        {mollie && mollie.ok && (
          <div style={{ display: "grid", gap: 6 }}>
            <Stip
              kleur={mollie.ideal_machtiging ? "#16a34a" : "#dc2626"}
              tekst={mollie.oordeel}
            />
            <div style={{ fontSize: 13, color: "#64748b" }}>
              Sleutel: <strong>{mollie.sleutel}</strong> · Actief: {(mollie.actief || []).join(", ") || "geen"} ·
              {" "}Kan machtigen: {(mollie.machtiging || []).join(", ") || "geen"}
            </div>
            {!mollie.incasso_aan && (
              <div style={{ fontSize: 13, color: "#7c2d12", background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 8, padding: 10 }}>
                Zet in het Mollie-dashboard <strong>Incasso (SEPA Direct Debit)</strong> aan bij Betaalmethodes.
                Zonder incasso kan geen enkele betaalmethode een machtiging afgeven en faalt de akkoordlink met
                &quot;The payment method selected does not accept recurring payments&quot;.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Klantsites */}
      <h2 style={{ fontSize: 17, margin: "22px 0 8px" }}>Klantsites</h2>
      {klanten.length === 0 && <p style={{ color: "#64748b" }}>Nog geen klanten.</p>}

      {klanten.map((k) => {
        const verouderd = k.plugin_versie !== nieuwste;
        const stilzwijgend = ouderDan(k.plugin_gezien_op, 24);
        const m = meldingen[k.id];
        return (
          <div key={k.id} style={kaart}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <strong style={{ fontSize: 16 }}>{k.naam}</strong>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: 999,
                  background: verouderd ? "#fef3c7" : "#dcfce7",
                  color: verouderd ? "#92400e" : "#166534",
                }}
              >
                plugin {k.plugin_versie || "onbekend"}
                {verouderd ? ` (nieuwste: ${nieuwste})` : ""}
              </span>
              <span style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                <button
                  style={knopStijl("#1d6fd1", bezig === k.id + "ververs")}
                  disabled={!!bezig}
                  onClick={() => doe(k.id, "ververs")}
                >
                  {bezig === k.id + "ververs" ? "Bezig..." : "Site verversen"}
                </button>
                <button
                  style={knopStijl(verouderd ? "#b45309" : "#94a3b8", bezig === k.id + "bijwerken")}
                  disabled={!!bezig}
                  onClick={() => doe(k.id, "bijwerken")}
                >
                  {bezig === k.id + "bijwerken" ? "Bezig..." : "Plugin bijwerken"}
                </button>
              </span>
            </div>

            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 10 }}>
              <Stip
                kleur={stilzwijgend ? "#b45309" : "#16a34a"}
                tekst={
                  k.plugin_gezien_op
                    ? `Site meldde zich ${geleden(k.plugin_gezien_op)}`
                    : "Site heeft zich nog nooit gemeld"
                }
              />
              <Stip
                kleur={k.site_ververs_fout ? "#dc2626" : k.site_ververst_op ? "#16a34a" : "#94a3b8"}
                tekst={
                  k.site_ververs_fout
                    ? `Laatste duw mislukt: ${k.site_ververs_fout}`
                    : k.site_ververst_op
                      ? `App duwde ${geleden(k.site_ververst_op)} door naar de site`
                      : "App heeft nog nooit doorgeduwd"
                }
              />
              <Stip kleur="#94a3b8" tekst={`${k.projecten} projecten · ${k.reviews} reviews`} />
            </div>

            {m && (
              <div
                style={{
                  marginTop: 10,
                  fontSize: 13,
                  padding: 10,
                  borderRadius: 8,
                  background: m.goed ? "#f0fdf4" : "#fef2f2",
                  border: "1px solid " + (m.goed ? "#bbf7d0" : "#fecaca"),
                  color: m.goed ? "#166534" : "#b91c1c",
                }}
              >
                {m.tekst}
              </div>
            )}
          </div>
        );
      })}

      <p style={{ color: "#94a3b8", fontSize: 12, marginTop: 18 }}>
        &quot;Site verversen&quot; haalt de projecten opnieuw op en leegt de cache van de klantsite.
        &quot;Plugin bijwerken&quot; laat de site zichzelf naar versie {nieuwste} tillen. Beide werken op afstand:
        we hoeven nooit in de beheeromgeving van een klant in te loggen.
      </p>
    </>
  );
}
