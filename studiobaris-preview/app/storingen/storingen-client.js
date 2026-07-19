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

// Versies vergelijken als getallen per deel, niet als tekst.
// Als tekst zou "1.1.10" kleiner zijn dan "1.1.9" - precies fout dus.
// Geeft -1 als a ouder is, 1 als a nieuwer is, 0 bij gelijk.
function vergelijkVersie(a, b) {
  const pa = String(a || "0").split(".").map((n) => parseInt(n, 10) || 0);
  const pb = String(b || "0").split(".").map((n) => parseInt(n, 10) || 0);
  const lengte = Math.max(pa.length, pb.length);
  for (let i = 0; i < lengte; i++) {
    const x = pa[i] || 0;
    const y = pb[i] || 0;
    if (x !== y) return x < y ? -1 : 1;
  }
  return 0;
}

// Alleen echt achterlopen telt. Draait een site nieuwer dan wij verwachten
// (bijvoorbeeld vlak na een uitrol), dan is dat geen storing.
function isVerouderd(huidig, nieuwste) {
  if (!huidig) return true; // nog nooit gemeld: wel aandacht waard
  return vergelijkVersie(huidig, nieuwste) < 0;
}

const kaart = {
  border: "1px solid #ECE4D7",
  borderRadius: 12,
  padding: 14,
  marginBottom: 10,
  background: "#fff",
};

function Stip({ kleur, tekst }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#524A40" }}>
      <span style={{ width: 9, height: 9, borderRadius: 9, background: kleur, flex: "0 0 auto" }} />
      {tekst}
    </span>
  );
}

function knopStijl(kleur, bezig) {
  return {
    border: "1px solid " + kleur,
    background: bezig ? "#F4EEE3" : "#fff",
    color: kleur,
    borderRadius: 8,
    padding: "7px 12px",
    fontSize: 13,
    fontWeight: 600,
    cursor: bezig ? "wait" : "pointer",
  };
}

// Hoeveel sites we tegelijk aanspreken. Klein genoeg om niemand plat te leggen,
// groot genoeg om ook bij honderden klanten door te komen.
const BLOKGROOTTE = 5;

export default function StoringenClient({ klanten, nieuwste }) {
  const [bezig, setBezig] = useState("");
  const [meldingen, setMeldingen] = useState({});
  const [mollie, setMollie] = useState(null);
  const [bulk, setBulk] = useState(null);

  useEffect(() => {
    fetch("/api/mollie/methodes")
      .then((r) => r.json())
      .then(setMollie)
      .catch(() => setMollie({ ok: false, error: "Niet bereikbaar." }));
  }, []);

  const bulkLoopt = !!bulk && !bulk.gereed;
  const geblokkeerd = !!bezig || bulkLoopt;

  async function stuurActie(id, actie) {
    const res = await fetch("/api/klant/site", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, actie }),
    });
    return res.json();
  }

  async function doe(id, actie) {
    setBezig(id + actie);
    setMeldingen((m) => ({ ...m, [id]: null }));
    try {
      const data = await stuurActie(id, actie);
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

  // Alles in een keer, in blokjes. Een klant die faalt blokkeert de rest niet;
  // die verschijnt onderaan in de lijst met wat er misging.
  async function doeAlles(actie, doelen) {
    if (!doelen.length || bulkLoopt) return;
    const fouten = [];
    setBulk({ actie, totaal: doelen.length, klaar: 0, fouten: [], gereed: false });

    for (let i = 0; i < doelen.length; i += BLOKGROOTTE) {
      const blok = doelen.slice(i, i + BLOKGROOTTE);
      const uitkomsten = await Promise.all(
        blok.map(async (k) => {
          try {
            const data = await stuurActie(k.id, actie);
            return data.ok ? null : { naam: k.naam, fout: data.error || "Mislukt." };
          } catch (e) {
            return { naam: k.naam, fout: String(e.message || e) };
          }
        })
      );
      uitkomsten.forEach((u) => u && fouten.push(u));
      const klaar = Math.min(i + BLOKGROOTTE, doelen.length);
      setBulk((b) => (b ? { ...b, klaar, fouten: [...fouten] } : b));
    }

    setBulk((b) => (b ? { ...b, klaar: doelen.length, fouten, gereed: true } : b));
  }

  const achter = klanten.filter((k) => isVerouderd(k.plugin_versie, nieuwste));
  const stil = klanten.filter((k) => ouderDan(k.plugin_gezien_op, 24));
  const fout = klanten.filter((k) => k.site_ververs_fout);

  return (
    <>
      {/* Samenvatting */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
        {[
          { label: "Klanten", n: klanten.length, kleur: "#2B2724" },
          { label: "Verouderde plugin", n: achter.length, kleur: achter.length ? "#b45309" : "#16a34a" },
          { label: "Meer dan 24 uur stil", n: stil.length, kleur: stil.length ? "#b45309" : "#16a34a" },
          { label: "Fout bij bijwerken site", n: fout.length, kleur: fout.length ? "#dc2626" : "#16a34a" },
        ].map((v) => (
          <div key={v.label} style={{ ...kaart, marginBottom: 0, minWidth: 150, flex: "1 1 150px" }}>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "#B0A697" }}>{v.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: v.kleur }}>{v.n}</div>
          </div>
        ))}
      </div>

      {/* Alles in een keer */}
      <div style={{ ...kaart, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 220px" }}>
          <strong style={{ fontSize: 15 }}>Alles in één keer</strong>
          <div style={{ fontSize: 13, color: "#6B6258", marginTop: 2 }}>
            {achter.length
              ? `${achter.length} van de ${klanten.length} ${achter.length === 1 ? "site loopt" : "sites lopen"} achter op versie ${nieuwste}.`
              : `Alle sites draaien op versie ${nieuwste} of nieuwer.`}
          </div>
        </div>
        <button
          style={knopStijl("#b45309", bulkLoopt && bulk.actie === "bijwerken")}
          disabled={geblokkeerd || achter.length === 0}
          onClick={() => doeAlles("bijwerken", achter)}
        >
          {bulkLoopt && bulk.actie === "bijwerken"
            ? `Bijwerken... ${bulk.klaar}/${bulk.totaal}`
            : `Alle plugins bijwerken${achter.length ? ` (${achter.length})` : ""}`}
        </button>
        <button
          style={knopStijl("#C05A38", bulkLoopt && bulk.actie === "ververs")}
          disabled={geblokkeerd || klanten.length === 0}
          onClick={() => doeAlles("ververs", klanten)}
        >
          {bulkLoopt && bulk.actie === "ververs"
            ? `Verversen... ${bulk.klaar}/${bulk.totaal}`
            : `Alle sites verversen (${klanten.length})`}
        </button>
      </div>

      {/* Voortgang en resultaat van de bulk-actie */}
      {bulk && (
        <div
          style={{
            ...kaart,
            background: bulk.gereed && bulk.fouten.length === 0 ? "#f0fdf4" : bulk.gereed ? "#fef2f2" : "#fff",
            borderColor: bulk.gereed && bulk.fouten.length === 0 ? "#bbf7d0" : bulk.gereed ? "#fecaca" : "#ECE4D7",
          }}
        >
          <div style={{ height: 8, borderRadius: 8, background: "#F4EEE3", overflow: "hidden" }}>
            <div
              style={{
                width: `${bulk.totaal ? Math.round((bulk.klaar / bulk.totaal) * 100) : 0}%`,
                height: "100%",
                background: "#C05A38",
                transition: "width .2s",
              }}
            />
          </div>
          <div style={{ fontSize: 13, marginTop: 8, color: "#524A40" }}>
            {bulk.gereed
              ? `Klaar: ${bulk.totaal - bulk.fouten.length} van ${bulk.totaal} gelukt${
                  bulk.fouten.length ? `, ${bulk.fouten.length} mislukt.` : "."
                }${bulk.actie === "bijwerken" && bulk.fouten.length === 0 ? " Herlaad de pagina om de nieuwe versies te zien." : ""}`
              : `Bezig: ${bulk.klaar} van ${bulk.totaal}...`}
          </div>
          {bulk.gereed && bulk.fouten.length > 0 && (
            <ul style={{ margin: "8px 0 0", paddingLeft: 18, fontSize: 13, color: "#b91c1c" }}>
              {bulk.fouten.map((f, i) => (
                <li key={i}>
                  <strong>{f.naam}</strong>: {f.fout}
                </li>
              ))}
            </ul>
          )}
          {bulk.gereed && (
            <button
              style={{ ...knopStijl("#9A9084", false), marginTop: 10 }}
              onClick={() => setBulk(null)}
            >
              Sluiten
            </button>
          )}
        </div>
      )}

      {/* Betalingen */}
      <h2 style={{ fontSize: 17, margin: "18px 0 8px" }}>Betalingen</h2>
      <div style={kaart}>
        {!mollie && <span style={{ color: "#6B6258", fontSize: 14 }}>Bezig met controleren...</span>}
        {mollie && !mollie.ok && (
          <Stip kleur="#dc2626" tekst={`Mollie: ${mollie.error}`} />
        )}
        {mollie && mollie.ok && (
          <div style={{ display: "grid", gap: 6 }}>
            <Stip
              kleur={mollie.incasso_aan && mollie.ideal_machtiging ? "#16a34a" : "#dc2626"}
              tekst={mollie.oordeel}
            />
            <div style={{ fontSize: 13, color: "#6B6258" }}>
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
      {klanten.length === 0 && <p style={{ color: "#6B6258" }}>Nog geen klanten.</p>}

      {klanten.map((k) => {
        const verouderd = isVerouderd(k.plugin_versie, nieuwste);
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
                  style={knopStijl("#C05A38", bezig === k.id + "ververs")}
                  disabled={geblokkeerd}
                  onClick={() => doe(k.id, "ververs")}
                >
                  {bezig === k.id + "ververs" ? "Bezig..." : "Site verversen"}
                </button>
                <button
                  style={knopStijl(verouderd ? "#b45309" : "#9A9084", bezig === k.id + "bijwerken")}
                  disabled={geblokkeerd}
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
                kleur={k.site_ververs_fout ? "#dc2626" : k.site_ververst_op ? "#16a34a" : "#9A9084"}
                tekst={
                  k.site_ververs_fout
                    ? `Laatste duw mislukt: ${k.site_ververs_fout}`
                    : k.site_ververst_op
                      ? `App duwde ${geleden(k.site_ververst_op)} door naar de site`
                      : "App heeft nog nooit doorgeduwd"
                }
              />
              <Stip kleur="#9A9084" tekst={`${k.projecten} projecten · ${k.reviews} reviews`} />
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

      <p style={{ color: "#9A9084", fontSize: 12, marginTop: 18 }}>
        &quot;Site verversen&quot; haalt de projecten opnieuw op en leegt de cache van de klantsite.
        &quot;Plugin bijwerken&quot; laat de site zichzelf naar versie {nieuwste} tillen. Beide werken op afstand:
        we hoeven nooit in de beheeromgeving van een klant in te loggen. De nieuwste versie wordt automatisch
        opgehaald uit het update-endpoint, dus dit scherm klopt vanzelf na elke uitrol.
          </p>
    </>
  );
}
