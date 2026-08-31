"use client";

import { useMemo, useState } from "react";

// Pakketten (maandbedrag). Dit zijn de daadwerkelijk aangeboden pakketten —
// de exacte bedragen staan (bewerkbaar) bij Financieel > Marges; hier alleen
// de twee soorten die we verkopen. "type" is de machine-leesbare pakketsoort
// die het margeoverzicht gebruikt om te groeperen.
const PAKKETTEN = [
  { type: "vol", label: "Volledig pakket", omschrijving: "app + hosting + domeinnaam", bedrag: 29.95 },
  { type: "plugin", label: "Alleen de plugin", omschrijving: "klant heeft al eigen hosting/domein", bedrag: 12.95 },
];

// Diensten die de klant kan afnemen. Pas deze lijst gerust aan.
const DIENSTEN = [
  "Website (eenmalig)",
  "Hosting",
  "Domeinnaam",
  "App voor projecten & reviews",
  "Onderhoud & updates",
  "Reviewsysteem (Google)",
];

const wrap = { maxWidth: 640, margin: "6vh auto", padding: "0 24px", fontFamily: "system-ui, sans-serif", color: "#222" };
const cardBox = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "18px 20px", marginBottom: 16 };
const label = { display: "block", fontSize: 13, fontWeight: 600, color: "#444", marginBottom: 6 };
const input = { width: "100%", boxSizing: "border-box", padding: "10px 12px", fontSize: 15, border: "1px solid #d1d5db", borderRadius: 8, fontFamily: "inherit" };

function euro(n) {
  return "€ " + Number(n).toFixed(2).replace(".", ",");
}

// Bedragen zijn excl. btw; klant betaalt incl. 21% btw.
function inclBtw(n) {
  return Math.round((Number(n) || 0) * 1.21 * 100) / 100;
}

export default function NieuwAkkoordPage() {
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [pakketIndex, setPakketIndex] = useState(0);
  const [aanbetaling, setAanbetaling] = useState("");
  const [diensten, setDiensten] = useState(() => new Set());
  const [extra, setExtra] = useState("");
  const [verzamelaar, setVerzamelaar] = useState("");

  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState("");
  const [resultaat, setResultaat] = useState(null); // { url, slug }
  const [gekopieerd, setGekopieerd] = useState(false);

  const pakket = PAKKETTEN[pakketIndex];

  function toggleDienst(d) {
    setDiensten((prev) => {
      const next = new Set(prev);
      if (next.has(d)) next.delete(d);
      else next.add(d);
      return next;
    });
  }

  const gekozenDiensten = useMemo(() => {
    const list = Array.from(diensten);
    const e = extra.trim();
    if (e) list.push(e);
    return list;
  }, [diensten, extra]);

  async function verstuur() {
    setFout("");
    if (!companyName.trim()) return setFout("Vul een bedrijfsnaam in.");
    const bedrag = Number(String(aanbetaling).replace(",", "."));
    if (!bedrag || bedrag <= 0) return setFout("Vul een aanbetalingsbedrag in.");

    setBezig(true);
    try {
      const res = await fetch("/api/akkoord/nieuw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: companyName.trim(),
          email: email.trim() || null,
          phone: phone.trim() || null,
          pakket: pakket.label,
          pakketType: pakket.type,
          maandbedrag: pakket.bedrag,
          aanbetaling: bedrag,
          diensten: gekozenDiensten,
          verzamelaar: verzamelaar.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Er ging iets mis.");
      setResultaat({ url: data.url, slug: data.slug });
    } catch (e) {
      setFout(String(e.message || e));
    } finally {
      setBezig(false);
    }
  }

  function kopieer() {
    if (!resultaat) return;
    try {
      navigator.clipboard.writeText(resultaat.url);
      setGekopieerd(true);
      setTimeout(() => setGekopieerd(false), 1800);
    } catch {}
  }

  function nogEen() {
    setResultaat(null);
    setCompanyName("");
    setEmail("");
    setPhone("");
    setAanbetaling("");
    setDiensten(new Set());
    setExtra("");
  }

  // --- Resultaatscherm ---
  if (resultaat) {
    const waMsg = encodeURIComponent(
      `Hoi! Hierbij de link om je aanbetaling te voldoen en de machtiging af te geven:\n${resultaat.url}`
    );
    return (
      <main style={{ ...wrap, textAlign: "center" }}>
        <div style={{ fontSize: 42 }}>✅</div>
        <h1 style={{ fontSize: 26, margin: "6px 0" }}>Akkoord-link klaar</h1>
        <p style={{ color: "#555", marginBottom: 18 }}>Deel deze link met <strong>{companyName}</strong>.</p>

        <div style={{ ...cardBox, wordBreak: "break-all", fontSize: 15, background: "#f8fafc" }}>{resultaat.url}</div>

        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={kopieer} style={{ ...input, width: "auto", cursor: "pointer", fontWeight: 600, background: "#1A2E40", color: "#fff", border: "none" }}>
            {gekopieerd ? "Gekopieerd ✓" : "Kopieer link"}
          </button>
          <a href={`https://wa.me/?text=${waMsg}`} target="_blank" rel="noreferrer" style={{ ...input, width: "auto", textDecoration: "none", fontWeight: 600, background: "#25D366", color: "#fff", border: "none", display: "inline-block" }}>
            Deel via WhatsApp
          </a>
        </div>

        <button onClick={nogEen} style={{ marginTop: 22, background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontSize: 15 }}>
          + Nog een akkoord aanmaken
        </button>
      </main>
    );
  }

  // --- Formulier ---
  return (
    <main style={wrap}>
      <p style={{ fontSize: 13, letterSpacing: 2, textTransform: "uppercase", color: "#888" }}>StudioBaris · Intern</p>
      <h1 style={{ fontSize: 28, margin: "6px 0 4px" }}>Nieuw akkoord aanmaken</h1>
      <p style={{ color: "#555", marginBottom: 20 }}>Na mondeling akkoord, vóór aanvang. Vul in wat de klant afneemt en de aanbetaling; je krijgt direct een deelbare link.</p>

      <div style={cardBox}>
        <label style={label}>Bedrijfsnaam klant *</label>
        <input style={input} value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Bijv. PM Sanitairzaken" />

        <div style={{ display: "flex", gap: 12, marginTop: 14, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 200px" }}>
            <label style={label}>E-mail klant</label>
            <input style={input} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="klant@voorbeeld.nl" />
          </div>
          <div style={{ flex: "1 1 160px" }}>
            <label style={label}>Telefoon klant</label>
            <input style={input} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="06 12345678" />
          </div>
        </div>
      </div>

      <div style={cardBox}>
        <label style={label}>Pakket (maandbedrag) *</label>
        {PAKKETTEN.map((p, i) => (
          <label key={p.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", border: "1px solid " + (pakketIndex === i ? "#1A2E40" : "#e5e7eb"), borderRadius: 8, marginBottom: 8, cursor: "pointer", background: pakketIndex === i ? "#f5f7fa" : "#fff" }}>
            <input type="radio" name="pakket" checked={pakketIndex === i} onChange={() => setPakketIndex(i)} />
            <span style={{ flex: 1 }}>
              <strong>{p.label}</strong> <span style={{ color: "#888", fontSize: 13 }}>({p.omschrijving})</span>
            </span>
            <span style={{ textAlign: "right" }}>
              <strong>{euro(p.bedrag)}<span style={{ fontWeight: 400, color: "#888", fontSize: 13 }}> /mnd</span></strong>
              <span style={{ display: "block", fontSize: 11, color: "#888" }}>excl. btw · {euro(inclBtw(p.bedrag))} incl.</span>
            </span>
          </label>
        ))}
      </div>

      <div style={cardBox}>
        <label style={label}>Aanbetaling nu (eenmalig, via iDEAL) *</label>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18, color: "#666" }}>€</span>
          <input style={{ ...input, maxWidth: 160 }} inputMode="decimal" value={aanbetaling} onChange={(e) => setAanbetaling(e.target.value)} placeholder="0,00" />
          <span style={{ fontSize: 12.5, color: "#888" }}>excl. btw</span>
        </div>
        {Number(String(aanbetaling).replace(",", ".")) > 0 && (
          <p style={{ fontSize: 12.5, color: "#555", marginTop: 6 }}>
            Klant betaalt <strong>{euro(inclBtw(Number(String(aanbetaling).replace(",", "."))))}</strong> incl. btw.
          </p>
        )}
        <p style={{ fontSize: 12.5, color: "#777", marginTop: 8 }}>
          Bedragen zijn excl. btw; de klant betaalt incl. 21% btw. Dit is de eerste betaling via de link — hiermee geeft de klant meteen de automatische incasso (SEPA-machtiging) af voor het maandbedrag. De 2e helft van de websiteprijs factureer je later bij oplevering.
        </p>
      </div>

      <div style={cardBox}>
        <label style={label}>Wat neemt de klant af?</label>
        <div style={{ display: "grid", gap: 8 }}>
          {DIENSTEN.map((d) => (
            <label key={d} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
              <input type="checkbox" checked={diensten.has(d)} onChange={() => toggleDienst(d)} />
              <span>{d}</span>
            </label>
          ))}
        </div>
        <input style={{ ...input, marginTop: 12 }} value={extra} onChange={(e) => setExtra(e.target.value)} placeholder="Iets anders? Typ het hier..." />
      </div>

      <div style={cardBox}>
        <label style={label}>Jouw naam (medewerker)</label>
        <input style={input} value={verzamelaar} onChange={(e) => setVerzamelaar(e.target.value)} placeholder="Bijv. Gerrit" />
      </div>

      {fout && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", borderRadius: 10, padding: "12px 14px", marginBottom: 14 }}>{fout}</div>
      )}

      <button onClick={verstuur} disabled={bezig} style={{ ...input, cursor: bezig ? "wait" : "pointer", fontWeight: 700, fontSize: 16, background: "#1A2E40", color: "#fff", border: "none", opacity: bezig ? 0.7 : 1 }}>
        {bezig ? "Bezig..." : "Akkoord-link aanmaken"}
      </button>
    </main>
  );
}
