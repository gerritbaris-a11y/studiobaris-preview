"use client";

import { useState } from "react";

export default function PublishButton({ slug }) {
  const [s, setS] = useState("idle");
  async function go() {
    if (!confirm("Conceptversie publiceren? De live site wordt hiermee bijgewerkt.")) return;
    setS("bezig");
    try {
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const d = await res.json();
      if (d.ok) location.reload();
      else { alert(d.error || "Publiceren mislukt"); setS("idle"); }
    } catch (e) {
      alert(String(e)); setS("idle");
    }
  }
  return (
    <button onClick={go} disabled={s === "bezig"}
      style={{ background: "#1d7a46", color: "#fff", border: "none", padding: "6px 12px", borderRadius: 7, fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
      {s === "bezig" ? "Bezig…" : "Publiceer concept"}
    </button>
  );
}

export function PublishToggle({ slug, gepubliceerd }) {
  const [s, setS] = useState("idle");
  async function go() {
    const msg = gepubliceerd
      ? "Site offline halen? De publieke link werkt daarna niet meer."
      : "Site online zetten? De publieke link wordt dan zichtbaar voor iedereen.";
    if (!confirm(msg)) return;
    setS("bezig");
    try {
      const res = await fetch("/api/publish-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, value: !gepubliceerd }),
      });
      const d = await res.json();
      if (d.ok) location.reload();
      else { alert(d.error || "Mislukt"); setS("idle"); }
    } catch (e) { alert(String(e)); setS("idle"); }
  }
  return (
    <button onClick={go} disabled={s === "bezig"}
      style={{ background: gepubliceerd ? "#fff" : "#1d7a46", color: gepubliceerd ? "#b45309" : "#fff", border: gepubliceerd ? "1px solid #E3DACB" : "none", padding: "6px 12px", borderRadius: 7, fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
      {s === "bezig" ? "Bezig…" : gepubliceerd ? "Offline halen" : "Online zetten"}
    </button>
  );
}

export const STATUS_OPTIES = ["Nieuw", "Gebeld", "Wachten op feedback 1", "Wachten op feedback 2", "Wachten op feedback 3", "Klaar"];

async function bewaarKlant(slug, payload) {
  const res = await fetch("/api/klant/update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug, ...payload }),
  });
  return res.json();
}

// De klantreis als klikbare fasebalk. Klik een fase om die te zetten.
export const FASES = ["Nieuw", "Preview", "Akkoord", "Klant-intake", "Feedback 1", "Feedback 2", "Klaar"];
const OUD_NAAR_NIEUW = {
  "Gebeld": "Preview",
  "Preview klaar": "Preview",
  "Wachten op feedback 1": "Feedback 1",
  "Wachten op feedback 2": "Feedback 2",
  "Wachten op feedback 3": "Feedback 2",
};

// "Geen interesse": zet de klant op archief (pipeline_status "Afgewezen"). Hij
// verdwijnt uit de actieve lijst, maar blijft bewaard en is terug te zetten.
export function GeenInteresseKnop({ slug, bedrijf, huidige }) {
  const [s, setS] = useState("idle");
  async function go() {
    if (!confirm(`"${bedrijf || slug}" archiveren (geen interesse)?\n\nHij verdwijnt uit je actieve klanten, maar je kunt hem onderaan altijd terugzetten.`)) return;
    setS("bezig");
    const d = await bewaarKlant(slug, { pipeline_status: "Afgewezen", van: huidige || "", bedrijf: bedrijf || slug });
    if (d && d.ok) location.reload();
    else { setS("idle"); alert("Mislukt, probeer opnieuw."); }
  }
  return (
    <button onClick={go} disabled={s === "bezig"} title="Archiveren — zet deze klant op 'geen interesse'"
      style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#fff", color: "#9E3B2E", border: "1.5px solid #E4B7AE", padding: "7px 13px", borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit" }}>
      <span aria-hidden="true">🗂</span> {s === "bezig" ? "Bezig…" : "Archiveren"}
    </button>
  );
}

// Een gearchiveerde klant weer terugzetten in de actieve lijst.
export function TerugNaarActiefKnop({ slug, bedrijf }) {
  const [s, setS] = useState("idle");
  async function go() {
    setS("bezig");
    const d = await bewaarKlant(slug, { pipeline_status: "Preview", van: "Afgewezen", bedrijf: bedrijf || slug });
    if (d && d.ok) location.reload();
    else setS("idle");
  }
  return (
    <button onClick={go} disabled={s === "bezig"}
      style={{ background: "#fff", color: "#524A40", border: "1px solid #E3DACB", padding: "6px 11px", borderRadius: 8, fontSize: 12.5, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit" }}>
      {s === "bezig" ? "Bezig…" : "Terugzetten"}
    </button>
  );
}

const PAKKETTEN = {
  vol: { label: "Vol pakket", websiteprijs: "599", maandbedrag: "29,95" },
  plugin: { label: "Alleen plugin", websiteprijs: "0", maandbedrag: "12,95" },
};

// "+ Klant toevoegen" op het Klantenregister: ofwel een bestaande lead/
// preview kiezen (die staat dan al met al zijn gegevens klaar — dit zet
// alleen het kandidaat-vlaggetje), ofwel iemand die nog nergens in de
// pijplijn staat helemaal los aanmaken. Geen van beide geeft een
// klantnummer — dat gebeurt pas via "Markeer als klant".
export function NieuweKlantKnop({ kandidaten = [] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}
        style={{ background: "#1d7a46", color: "#fff", border: "none", padding: "9px 15px", borderRadius: 9, fontWeight: 700, fontSize: 13.5, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit" }}>
        + Klant toevoegen
      </button>
      {open && <NieuweKlantModal kandidaten={kandidaten} onSluiten={() => setOpen(false)} />}
    </>
  );
}

function NieuweKlantModal({ kandidaten, onSluiten }) {
  const [modus, setModus] = useState(kandidaten.length ? "bestaand" : "nieuw");
  const [kandidaatSlug, setKandidaatSlug] = useState("");
  const [v, setV] = useState({
    bedrijfsnaam: "", contactpersoon: "", email: "", telefoon: "",
    adres: "", kvk: "", btw: "", pakket_type: "vol", websiteprijs: "599", maandbedrag: "29,95", notitie: "",
  });
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState("");
  const set = (k, val) => setV((s) => ({ ...s, [k]: val }));

  function kiesPakket(type) {
    const p = PAKKETTEN[type];
    setV((s) => ({ ...s, pakket_type: type, websiteprijs: p.websiteprijs, maandbedrag: p.maandbedrag }));
  }

  async function toevoegenBestaand() {
    setFout("");
    if (!kandidaatSlug) { setFout("Kies eerst een lead."); return; }
    setBezig(true);
    try {
      const res = await fetch("/api/klanten/kandidaat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: kandidaatSlug }),
      });
      const d = await res.json();
      if (!d.ok) throw new Error(d.error || "Toevoegen mislukt.");
      location.reload();
    } catch (e) {
      setFout(String(e.message || e));
      setBezig(false);
    }
  }

  async function aanmakenNieuw() {
    setFout("");
    if (!v.bedrijfsnaam.trim()) { setFout("Bedrijfsnaam is verplicht."); return; }
    setBezig(true);
    try {
      const res = await fetch("/api/klanten/aanmaken", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(v),
      });
      const d = await res.json();
      if (!d.ok) throw new Error(d.error || "Aanmaken mislukt.");
      location.reload();
    } catch (e) {
      setFout(String(e.message || e));
      setBezig(false);
    }
  }

  const inp = { width: "100%", padding: "7px 9px", border: "1px solid #E3DACB", borderRadius: 7, fontSize: 13.5, fontFamily: "inherit" };
  const lab = { fontSize: 12, color: "#6B6258", fontWeight: 700, display: "block", marginBottom: 3 };
  const rij = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 };
  const tab = (actief) => ({
    flex: 1, padding: "8px 10px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
    border: actief ? "1.5px solid #1d7a46" : "1px solid #E3DACB",
    background: actief ? "#e7f3ea" : "#fff", color: actief ? "#0f6e56" : "#524A40",
  });

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(43,39,36,.35)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 16px", overflowY: "auto", zIndex: 50 }}
      onClick={onSluiten}
    >
      <div style={{ background: "#fff", borderRadius: 14, maxWidth: 520, width: "100%", overflow: "hidden", boxShadow: "0 12px 40px rgba(0,0,0,.18)" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ background: "#C05A38", color: "#fff", padding: "16px 20px", fontWeight: 800, fontSize: 16 }}>
          Klant toevoegen aan het register
        </div>
        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" onClick={() => setModus("bestaand")} style={tab(modus === "bestaand")}>Bestaande lead</button>
            <button type="button" onClick={() => setModus("nieuw")} style={tab(modus === "nieuw")}>Nieuwe klant</button>
          </div>

          {modus === "bestaand" ? (
            <>
              <div style={{ background: "#FBF7EF", border: "1px solid #ECE4D7", borderRadius: 10, padding: "10px 12px", fontSize: 12.5, color: "#6B6258" }}>
                Kies een lead die al in "Mijn previews" staat. Zijn gegevens
                blijven ongewijzigd en er komt geen klantnummer bij — dat doe
                je zelf later met "Markeer als klant".
              </div>
              {kandidaten.length === 0 ? (
                <div style={{ fontSize: 13, color: "#9A9084" }}>Geen leads meer over om te kiezen.</div>
              ) : (
                <label style={lab}>Lead
                  <select style={inp} value={kandidaatSlug} onChange={(e) => setKandidaatSlug(e.target.value)}>
                    <option value="">Kies een lead…</option>
                    {kandidaten.map((k) => (
                      <option key={k.slug} value={k.slug}>
                        {k.company_name || k.slug}{k.verzamelaar ? ` — ${k.verzamelaar}` : ""}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {fout && <div style={{ color: "#b91c1c", fontSize: 13, fontWeight: 600 }}>{fout}</div>}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 }}>
                <button type="button" onClick={onSluiten} style={{ background: "#fff", border: "1px solid #E3DACB", padding: "9px 15px", borderRadius: 8, fontSize: 13.5, cursor: "pointer", fontFamily: "inherit" }}>Annuleren</button>
                <button type="button" onClick={toevoegenBestaand} disabled={bezig || kandidaten.length === 0}
                  style={{ background: "#1d7a46", color: "#fff", border: "none", padding: "9px 16px", borderRadius: 8, fontWeight: 700, fontSize: 13.5, cursor: "pointer", fontFamily: "inherit" }}>
                  {bezig ? "Bezig…" : "Toevoegen aan register"}
                </button>
              </div>
            </>
          ) : (
            <>
              <div style={{ background: "#FBF7EF", border: "1px solid #ECE4D7", borderRadius: 10, padding: "10px 12px", fontSize: 12.5, color: "#6B6258" }}>
                Voor iemand die nog nergens in de previews-pijplijn staat. Deze
                klant komt los te staan, zonder klantnummer en zonder
                abonnement — dat volgt pas via "Markeer als klant".
              </div>
              <label style={lab}>Bedrijfsnaam *
                <input style={inp} value={v.bedrijfsnaam} onChange={(e) => set("bedrijfsnaam", e.target.value)} autoFocus />
              </label>
              <div style={rij}>
                <label style={lab}>Contactpersoon
                  <input style={inp} value={v.contactpersoon} onChange={(e) => set("contactpersoon", e.target.value)} />
                </label>
                <label style={lab}>E-mail
                  <input style={inp} value={v.email} onChange={(e) => set("email", e.target.value)} />
                </label>
              </div>
              <div style={rij}>
                <label style={lab}>Telefoon
                  <input style={inp} value={v.telefoon} onChange={(e) => set("telefoon", e.target.value)} />
                </label>
                <label style={lab}>KvK
                  <input style={inp} value={v.kvk} onChange={(e) => set("kvk", e.target.value)} />
                </label>
              </div>
              <label style={lab}>Adres
                <input style={inp} value={v.adres} onChange={(e) => set("adres", e.target.value)} />
              </label>
              <label style={lab}>BTW-nummer
                <input style={inp} value={v.btw} onChange={(e) => set("btw", e.target.value)} />
              </label>
              <div>
                <div style={lab}>Pakket</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="button" onClick={() => kiesPakket("vol")} style={tab(v.pakket_type === "vol")}>
                    Vol pakket<br /><span style={{ fontWeight: 500, fontSize: 11.5 }}>€ 599 + € 29,95 p/m</span>
                  </button>
                  <button type="button" onClick={() => kiesPakket("plugin")} style={tab(v.pakket_type === "plugin")}>
                    Alleen plugin<br /><span style={{ fontWeight: 500, fontSize: 11.5 }}>€ 12,95 p/m</span>
                  </button>
                </div>
              </div>
              <div style={rij}>
                <label style={lab}>Websiteprijs (eenmalig, €)
                  <input style={inp} value={v.websiteprijs} onChange={(e) => set("websiteprijs", e.target.value)} />
                </label>
                <label style={lab}>Maandbedrag (€)
                  <input style={inp} value={v.maandbedrag} onChange={(e) => set("maandbedrag", e.target.value)} />
                </label>
              </div>
              <label style={lab}>Notitie (intern)
                <input style={inp} value={v.notitie} onChange={(e) => set("notitie", e.target.value)} />
              </label>
              {fout && <div style={{ color: "#b91c1c", fontSize: 13, fontWeight: 600 }}>{fout}</div>}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 }}>
                <button type="button" onClick={onSluiten} style={{ background: "#fff", border: "1px solid #E3DACB", padding: "9px 15px", borderRadius: 8, fontSize: 13.5, cursor: "pointer", fontFamily: "inherit" }}>Annuleren</button>
                <button type="button" onClick={aanmakenNieuw} disabled={bezig}
                  style={{ background: "#1d7a46", color: "#fff", border: "none", padding: "9px 16px", borderRadius: 8, fontWeight: 700, fontSize: 13.5, cursor: "pointer", fontFamily: "inherit" }}>
                  {bezig ? "Bezig…" : "Klant aanmaken"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Handmatige koppeling: "dit is nu al zeker een betalende klant", los van een
// factuur of Mollie-betaling. Alleen zichtbaar/zinvol zolang er nog geen
// klantnummer is.
export function MarkeerAlsKlantKnop({ slug, bedrijf }) {
  const [bezig, setBezig] = useState(false);
  async function go() {
    if (!confirm(`"${bedrijf || slug}" nu al als klant markeren?\n\nHij krijgt dan meteen een klantnummer, ook al is er nog geen factuur of betaling.`)) return;
    setBezig(true);
    try {
      const res = await fetch("/api/klanten/markeren", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const d = await res.json();
      if (d.ok) location.reload();
      else { alert(d.error || "Mislukt, probeer opnieuw."); setBezig(false); }
    } catch (e) { alert(String(e)); setBezig(false); }
  }
  return (
    <button onClick={go} disabled={bezig}
      style={{ background: "#fff", color: "#0f6e56", border: "1px solid #bfe0cf", padding: "6px 11px", borderRadius: 8, fontSize: 12.5, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit" }}>
      {bezig ? "Bezig…" : "Markeer als klant"}
    </button>
  );
}

// "Oud-klant" markeren: hij verdwijnt uit de actieve Klanten-lijst op het
// register, maar klantnummer en factuurhistorie blijven volledig intact —
// regelt geen lopend abonnement, dat doe je apart via "Abonnement opzeggen".
export function MarkeerAlsOudKlantKnop({ slug, bedrijf, heeftActiefAbonnement }) {
  const [bezig, setBezig] = useState(false);
  async function go() {
    const waarschuwing = heeftActiefAbonnement
      ? "\n\nLet op: er loopt nog een actief abonnement/incasso. Dit zet 'm niet stop — regel dat apart via 'Abonnement opzeggen' op Abonnementen."
      : "";
    if (!confirm(`"${bedrijf || slug}" als oud-klant markeren?\n\nKlantnummer en facturen blijven bewaard, maar hij verdwijnt uit de actieve Klanten-lijst.${waarschuwing}`)) return;
    setBezig(true);
    try {
      const res = await fetch("/api/klanten/oud-klant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const d = await res.json();
      if (d.ok) location.reload();
      else { alert(d.error || "Mislukt, probeer opnieuw."); setBezig(false); }
    } catch (e) { alert(String(e)); setBezig(false); }
  }
  return (
    <button onClick={go} disabled={bezig}
      style={{ background: "#fff", color: "#9A7B4F", border: "1px solid #E3D3B8", padding: "6px 11px", borderRadius: 8, fontSize: 12.5, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit" }}>
      {bezig ? "Bezig…" : "Markeer als oud-klant"}
    </button>
  );
}

// Oud-klant weer terugzetten als actieve klant.
export function HeractiveerKlantKnop({ slug, bedrijf }) {
  const [bezig, setBezig] = useState(false);
  async function go() {
    setBezig(true);
    try {
      const res = await fetch("/api/klanten/heractiveren", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const d = await res.json();
      if (d.ok) location.reload();
      else { alert(d.error || "Mislukt, probeer opnieuw."); setBezig(false); }
    } catch (e) { alert(String(e)); setBezig(false); }
  }
  return (
    <button onClick={go} disabled={bezig}
      style={{ background: "#fff", color: "#0f6e56", border: "1px solid #bfe0cf", padding: "6px 11px", borderRadius: 8, fontSize: 12.5, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit" }}>
      {bezig ? "Bezig…" : "Weer actief maken"}
    </button>
  );
}

export function FaseStepper({ slug, huidige, bedrijf }) {
  const [bezig, setBezig] = useState(false);
  const norm = OUD_NAAR_NIEUW[huidige] || huidige || "Nieuw";
  const idx = Math.max(0, FASES.indexOf(norm));
  async function zet(f) {
    if (f === norm || bezig) return;
    setBezig(true);
    // van + bedrijf meesturen, zodat het logboek weet wat er precies veranderde.
    const d = await bewaarKlant(slug, { pipeline_status: f, van: norm, bedrijf: bedrijf || slug });
    if (d && d.ok) location.reload();
    else setBezig(false);
  }
  return (
    <div style={{ display: "flex", gap: 4, overflowX: "auto", paddingBottom: 2 }}>
      {FASES.map((f, i) => {
        const done = i < idx;
        const cur = i === idx;
        const bg = cur ? "#2B2724" : done ? "#e1f5ee" : "#F4EEE3";
        const col = cur ? "#fff" : done ? "#0f6e56" : "#9A9084";
        return (
          <button key={f} onClick={() => zet(f)} disabled={bezig} title={"Zet fase op " + f}
            style={{ flex: "0 0 auto", fontSize: 11.5, fontWeight: cur ? 700 : 600, padding: "6px 10px", borderRadius: 8, border: "none", cursor: "pointer", background: bg, color: col, whiteSpace: "nowrap" }}>
            {f}
          </button>
        );
      })}
    </div>
  );
}

const INZENDING_LABEL = { intake: "Klant-intake", feedback: "Feedback" };

export function InzendingenKnop({ slug }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(null);
  const [laden, setLaden] = useState(false);
  async function toggle() {
    if (open) { setOpen(false); return; }
    setOpen(true);
    if (data === null) {
      setLaden(true);
      try {
        const res = await fetch("/api/klant/inzendingen", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug }),
        });
        const d = await res.json();
        setData(d.ok ? d.inzendingen || [] : []);
      } catch { setData([]); }
      setLaden(false);
    }
  }
  return (
    <div style={{ width: "100%" }}>
      <button onClick={toggle}
        style={{ background: "#fff", border: "1px solid #E3DACB", color: "#2B2724", padding: "6px 11px", borderRadius: 7, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
        {open ? "Verberg inzendingen" : "Bekijk wat de klant invulde"}
      </button>
      {open && (
        <div style={{ marginTop: 8, background: "#fafbfc", border: "1px solid #ECE4D7", borderRadius: 10, padding: "10px 12px" }}>
          {laden && <div style={{ color: "#B0A697", fontSize: 13 }}>Laden...</div>}
          {!laden && data && data.length === 0 && (
            <div style={{ color: "#B0A697", fontSize: 13 }}>De klant heeft nog niets ingevuld.</div>
          )}
          {!laden && data && data.map((s, i) => (
            <div key={i} style={{ borderTop: i === 0 ? "none" : "1px solid #eef1f4", paddingTop: i === 0 ? 0 : 9, marginTop: i === 0 ? 0 : 9 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: "#2B2724" }}>
                {INZENDING_LABEL[s.type] || s.type}
                <span style={{ color: "#9A9084", fontWeight: 500 }}> - {new Date(s.created_at).toLocaleString("nl-NL", { dateStyle: "medium", timeStyle: "short" })}</span>
              </div>
              {Object.entries(s.antwoorden || {}).map(([k, v]) => (
                <div key={k} style={{ fontSize: 13, marginTop: 3, lineHeight: 1.35 }}>
                  <span style={{ color: "#B0A697" }}>{k}:</span> {typeof v === "object" ? JSON.stringify(v) : String(v)}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Contactpersoon bij de klant - wordt de aanhef in het verkoop-appje.
export function Contactpersoon({ slug, value }) {
  const [v, setV] = useState(value || "");
  const [opgeslagen, setOpgeslagen] = useState(value || "");
  const [bezig, setBezig] = useState(false);
  const gewijzigd = v.trim() !== (opgeslagen || "").trim();

  async function bewaar() {
    if (!gewijzigd) return;
    setBezig(true);
    const res = await fetch("/api/klant/contactpersoon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, naam: v }),
    });
    const d = await res.json();
    if (d.ok) setOpgeslagen(v);
    setBezig(false);
  }

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}
      title="Voornaam van de klant - wordt de aanhef in het appje">
      <span style={{ color: "#B0A697", fontSize: 12 }}>Contact</span>
      <input
        value={v}
        onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") bewaar(); }}
        placeholder="voornaam"
        style={{ width: 100, padding: "5px 8px", border: "1px solid " + (gewijzigd ? "#C05A38" : "#E3DACB"), borderRadius: 6, fontSize: 13, fontFamily: "inherit" }}
      />
      <OpslaanKnop gewijzigd={gewijzigd} opgeslagen={Boolean(opgeslagen)} bezig={bezig} onClick={bewaar} />
    </span>
  );
}

// Kleine opslaanknop bij een veld. Verschijnt zodra je iets hebt gewijzigd,
// en bevestigt daarna dat het is opgeslagen. Enter werkt ook.
function OpslaanKnop({ gewijzigd, opgeslagen, bezig, onClick }) {
  if (opgeslagen && !gewijzigd) {
    return (
      <span style={{ fontSize: 12, fontWeight: 700, color: "#0f6e56", whiteSpace: "nowrap" }}>
        Opgeslagen ✓
      </span>
    );
  }
  return (
    <button
      onClick={onClick}
      disabled={!gewijzigd || bezig}
      style={{
        fontSize: 12.5, fontWeight: 700, padding: "6px 11px", borderRadius: 8, whiteSpace: "nowrap",
        border: "1px solid " + (gewijzigd ? "#2B2724" : "#ECE4D7"),
        background: gewijzigd ? "#2B2724" : "#fff",
        color: gewijzigd ? "#fff" : "#B0A697",
        cursor: gewijzigd && !bezig ? "pointer" : "default",
        fontFamily: "inherit",
      }}
    >
      {bezig ? "Bezig…" : "Opslaan"}
    </button>
  );
}

// Het verkoop-appje, kant-en-klaar met naam en de juiste links erin.
function bouwAppje({ contact, bedrijf, slug, afzender, persoonlijk, demoGevuld }) {
  const naam = (contact && contact.trim()) || bedrijf || "";
  const previewLink = "https://preview.studiobaris.nl/" + slug + "?review=1";
  // Persoonlijke demo-app: de app in het jasje van deze klant. Is die er (nog) niet
  // of is hij leeg, dan de algemene demo.
  const demoLink = demoGevuld ? "https://demo.studiobaris.nl/" + slug : "https://demo.studiobaris.nl";
  const groet = afzender || "Gerrit";
  const zin = (persoonlijk && persoonlijk.trim()) || "[PERSOONLIJKE ZIN — vul deze nog in]";

  return [
    "Hoi " + naam + ",",
    "",
    zin,
    "",
    "De meeste goede vakmannen hebben via mond-tot-mondreclame werk zat, dus een site voor méér klanten heb je vast niet nodig.",
    "",
    "Maar je wilt wél dat je online reputatie klopt als mensen je opzoeken, tussen alle beunhazen van nu.",
    "",
    "En 's avonds achter een laptop kruipen voor je site — daar heeft niemand zin in. Daarom heb ik iets anders gebouwd: een website die je bijhoudt via een app op je telefoon.",
    "",
    "Sta je op de klus? Foto maken, review erbij, en binnen 10 seconden staat het live op je site.",
    "",
    "Onder andere Timmer- en Onderhoudsbedrijf Emiel en PM Sanitairzaken gingen je voor. Die swipen hun klussen nu live vanaf de bouwplaats.",
    "",
    "Ik heb alvast een complete website-opzet voor jouw bedrijf ontworpen, inclusief de app-koppeling. Je kunt 'm hier direct bekijken:",
    "",
    "Jouw website: " + previewLink,
    "Jouw app: " + demoLink,
    "",
    "Het inrichten doe ik tot eind augustus gratis. Kijk eerst maar even of het ontwerp je bevalt — vind je 'm niks, dan is de prijs toch niet interessant. En bevalt-ie wel, dan vertel ik je precies wat het kost. Geen kleine lettertjes.",
    "",
    "Laat gerust weten wat je ervan vindt — ook als het niks voor je is. Dan weet ik het, en zijn we ook even goede vrienden.",
    "",
    "Groet,",
    groet + " (www.studiobaris.nl)",
  ].join("\n");
}

// De persoonlijke openingszin. Zonder deze zin is het appje niet af.
export function PersoonlijkeZin({ slug, value }) {
  const [v, setV] = useState(value || "");
  const [opgeslagen, setOpgeslagen] = useState(value || "");
  const [bezig, setBezig] = useState(false);
  const gewijzigd = v.trim() !== (opgeslagen || "").trim();
  const leeg = !(opgeslagen || "").trim();

  async function bewaar() {
    if (!gewijzigd) return;
    setBezig(true);
    const res = await fetch("/api/klant/persoonlijk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, tekst: v }),
    });
    const d = await res.json();
    if (d.ok) setOpgeslagen(v);
    setBezig(false);
  }

  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: leeg ? "#b45309" : "#2B2724" }}>
          Persoonlijke zin
        </span>
        <span style={{ fontSize: 11.5, color: "#9A9084" }}>
          Waar je ze mee raakt. Iets wat je op hun socials of site zag.
        </span>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
        <textarea
          value={v}
          onChange={(e) => setV(e.target.value)}
          rows={2}
          placeholder="Bijv: kwam die badkamer in Voorburg tegen op je Facebook. Strak werk."
          style={{
            flex: 1, minWidth: 0, boxSizing: "border-box", padding: "8px 10px", fontSize: 13.5,
            border: "1px solid " + (gewijzigd ? "#C05A38" : leeg ? "#fcd9a8" : "#E3DACB"),
            background: leeg && !gewijzigd ? "#fffbf5" : "#fff",
            borderRadius: 8, fontFamily: "inherit", resize: "vertical", lineHeight: 1.5,
          }}
        />
        <OpslaanKnop gewijzigd={gewijzigd} opgeslagen={!leeg} bezig={bezig} onClick={bewaar} />
      </div>
    </div>
  );
}

export function AppjeKnop({ slug, bedrijf, contact, afzender, telefoon, demoGevuld, persoonlijk }) {
  const [status, setStatus] = useState("idle");

  // Wat ontbreekt er nog voordat dit appje de deur uit kan?
  const mist = [];
  if (!contact || !String(contact).trim()) mist.push("de voornaam van de klant");
  if (!persoonlijk || !String(persoonlijk).trim()) mist.push("de persoonlijke zin");
  if (!telefoon || !String(telefoon).trim()) mist.push("een telefoonnummer");
  const klaar = mist.length === 0;

  function tekst() {
    return bouwAppje({ contact, bedrijf, slug, afzender, persoonlijk, demoGevuld });
  }

  async function kopieer() {
    try {
      await navigator.clipboard.writeText(tekst());
      setStatus("gekopieerd");
      setTimeout(() => setStatus("idle"), 1800);
    } catch {
      setStatus("fout");
      setTimeout(() => setStatus("idle"), 1800);
    }
  }

  function openWhatsapp() {
    const nr = String(telefoon || "").replace(/[^0-9]/g, "").replace(/^06/, "316");
    const url = "https://wa.me/" + (nr ? nr : "") + "?text=" + encodeURIComponent(tekst());
    window.open(url, "_blank", "noopener");
  }

  const knop = {
    display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5, padding: "7px 11px",
    borderRadius: 8,
    border: "1px solid " + (klaar ? "#25D366" : "#ECE4D7"),
    background: klaar ? "#25D366" : "#ECE4D7",
    color: klaar ? "#fff" : "#9A9084",
    cursor: klaar ? "pointer" : "not-allowed",
    fontWeight: 700, fontFamily: "inherit", whiteSpace: "nowrap",
  };
  const knop2 = { ...knop, background: "#fff", color: klaar ? "#0f6e56" : "#9A9084", border: "1px solid " + (klaar ? "#25D366" : "#ECE4D7") };

  return (
    <span style={{ display: "inline-flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
      <button
        onClick={() => klaar && openWhatsapp()}
        disabled={!klaar}
        style={knop}
        title={klaar ? "Opent WhatsApp met de tekst er al in" : "Nog niet compleet: " + mist.join(", ")}
      >
        Appje versturen
      </button>
      <button onClick={() => klaar && kopieer()} disabled={!klaar} style={knop2}>
        {status === "gekopieerd" ? "Gekopieerd!" : status === "fout" ? "Kopieren mislukt" : "Tekst kopieren"}
      </button>
      {!klaar && (
        <span style={{ fontSize: 12, color: "#b45309", fontWeight: 600 }}>
          Nog invullen: {mist.join(", ")}
        </span>
      )}
    </span>
  );
}

export function KlantNaam({ slug, value }) {
  const [v, setV] = useState(value || "");
  const [opgeslagen, setOpgeslagen] = useState(value || "");
  const [bezig, setBezig] = useState(false);
  const gewijzigd = v.trim() !== (opgeslagen || "").trim();

  async function bewaar() {
    if (!gewijzigd) return;
    setBezig(true);
    const d = await bewaarKlant(slug, { verzamelaar: v });
    if (d.ok) setOpgeslagen(v);
    setBezig(false);
  }

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }} title="Wie behandelt deze klant">
      <input
        value={v}
        onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") bewaar(); }}
        placeholder="Naam"
        style={{ width: 120, padding: "5px 8px", border: "1px solid " + (gewijzigd ? "#C05A38" : "#E3DACB"), borderRadius: 6, fontSize: 13, fontFamily: "inherit" }}
      />
      <OpslaanKnop gewijzigd={gewijzigd} opgeslagen={Boolean(opgeslagen)} bezig={bezig} onClick={bewaar} />
    </span>
  );
}

export function KlantStatus({ slug, value }) {
  const [v, setV] = useState(value || "Nieuw");
  async function change(e) {
    const nv = e.target.value; setV(nv);
    await bewaarKlant(slug, { pipeline_status: nv });
  }
  return (
    <select value={v} onChange={change}
      style={{ padding: "5px 7px", border: "1px solid #E3DACB", borderRadius: 6, fontSize: 13, background: "#fff", maxWidth: 150 }}>
      {STATUS_OPTIES.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

export function KlantBedrag({ slug, value }) {
  const [v, setV] = useState(value != null ? String(value) : "");
  const [opgeslagen, setOpgeslagen] = useState(value != null ? String(value) : "");
  const [bezig, setBezig] = useState(false);
  const gewijzigd = v.trim() !== (opgeslagen || "").trim();

  async function bewaar() {
    if (!gewijzigd) return;
    setBezig(true);
    const d = await bewaarKlant(slug, { maandbedrag: v });
    if (d.ok) setOpgeslagen(v);
    setBezig(false);
  }

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
      <span style={{ color: "#B0A697", fontSize: 12 }}>€</span>
      <input
        value={v}
        onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") bewaar(); }}
        placeholder="0" inputMode="decimal"
        style={{ width: 60, padding: "5px 7px", border: "1px solid " + (gewijzigd ? "#C05A38" : "#E3DACB"), borderRadius: 6, fontSize: 13, fontFamily: "inherit" }}
      />
      <span style={{ color: "#B0A697", fontSize: 12 }}>/mnd</span>
      <OpslaanKnop gewijzigd={gewijzigd} opgeslagen={Boolean(opgeslagen)} bezig={bezig} onClick={bewaar} />
    </span>
  );
}

// Eenmalig verkoopbedrag (websiteprijs). Verkoper krijgt hiervan 50%.
export function VerkoopBedrag({ slug, value }) {
  const [v, setV] = useState(value != null ? String(value) : "");
  const [opgeslagen, setOpgeslagen] = useState(value != null ? String(value) : "");
  const [bezig, setBezig] = useState(false);
  const gewijzigd = v.trim() !== (opgeslagen || "").trim();

  async function bewaar() {
    if (!gewijzigd) return;
    setBezig(true);
    const res = await fetch("/api/klant/verkoopbedrag", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, bedrag: v }),
    });
    const d = await res.json();
    if (d.ok) {
      setOpgeslagen(v);
      // De aanbetaling en de restbetaling worden hieruit berekend: even verversen.
      setTimeout(() => window.location.reload(), 700);
    }
    setBezig(false);
  }

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}
      title="Eenmalig verkoopbedrag (excl. btw). De helft wordt de aanbetaling, de helft het restbedrag.">
      <span style={{ color: "#B0A697", fontSize: 12 }}>Verkoop €</span>
      <input
        value={v}
        onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") bewaar(); }}
        placeholder="0" inputMode="decimal"
        style={{ width: 70, padding: "5px 7px", border: "1px solid " + (gewijzigd ? "#C05A38" : "#E3DACB"), borderRadius: 6, fontSize: 13, fontFamily: "inherit" }}
      />
      <OpslaanKnop gewijzigd={gewijzigd} opgeslagen={Boolean(opgeslagen)} bezig={bezig} onClick={bewaar} />
    </span>
  );
}

export function AkkoordLink({ slug }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.origin + "/akkoord/" + slug);
      setCopied(true); setTimeout(() => setCopied(false), 1400);
    } catch {}
  }
  return (
    <button onClick={copy}
      style={{ background: "#fff", border: "1px solid #E3DACB", color: "#C05A38", padding: "5px 9px", borderRadius: 6, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}>
      {copied ? "Gekopieerd!" : "Akkoord-link"}
    </button>
  );
}

// Alle deelbare links van een klant op één plek, met kopieer-knoppen.
export function LinkChips({ slug, gepubliceerd, heeftDemo, demoGevuld, magMaken, volledig, heeftRest, restBetaald, stijl }) {
  const [copied, setCopied] = useState("");
  const [demoBezig, setDemoBezig] = useState(false);
  const [open, setOpen] = useState(false);

  const PREVIEW = "https://preview.studiobaris.nl";
  const DEMO = "https://demo.studiobaris.nl";

  // Alle links van deze klant, op één plek. Elke link is te kopiëren én te openen.
  const links = [
    { key: "w", naam: "Website", url: PREVIEW + "/" + slug, uit: !gepubliceerd, hint: gepubliceerd ? "De live website" : "Nog offline - eerst publiceren" },
    { key: "p", naam: "Preview", url: PREVIEW + "/" + slug + "?review=1", hint: "Stuur dit naar de klant" },
    { key: "d", naam: "Demo-app", url: DEMO + "/" + slug, uit: !heeftDemo, leeg: heeftDemo && !demoGevuld, hint: !heeftDemo ? "Nog niet gemaakt" : demoGevuld ? "De app in zijn eigen jasje" : "Let op: leeg (geen foto's in de preview)" },
    { key: "i", naam: "Klant-intake", url: PREVIEW + "/intake/" + slug, verborgen: !volledig, hint: "Stuur dit na akkoord" },
    { key: "f", naam: "Feedback", url: PREVIEW + "/feedback/" + slug, verborgen: !volledig, hint: "Voor feedbackronde 1 en 2" },
    { key: "b", naam: "Betaallink", url: PREVIEW + "/akkoord/" + slug, hint: "Helft vooraf + maandelijkse incasso" },
    {
      key: "r",
      naam: restBetaald ? "Restbedrag (voldaan)" : "Restbetaling",
      url: PREVIEW + "/restbetaling/" + slug,
      uit: !heeftRest,
      hint: !heeftRest
        ? "Vul eerst een verkoopbedrag in"
        : restBetaald
          ? "Het restbedrag is al betaald"
          : "De tweede helft, te sturen bij oplevering",
    },
  ].filter((l) => !l.verborgen);

  function copy(url, key) {
    try {
      navigator.clipboard.writeText(url);
      setCopied(key);
      setTimeout(() => setCopied(""), 1600);
    } catch {}
  }

  async function maakDemo() {
    setDemoBezig(true);
    try {
      const res = await fetch("/api/klant/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const j = await res.json();
      if (j.ok) { window.location.reload(); return; }
      alert(j.error || "Demo-app maken mislukt.");
    } catch (e) {
      alert("Demo-app maken mislukt.");
    }
    setDemoBezig(false);
  }

  const chip = {
    display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5, padding: "7px 11px",
    borderRadius: 8, border: "1px solid #E3DACB", background: "#fff", color: "#524A40",
    cursor: "pointer", textDecoration: "none", whiteSpace: "nowrap", fontFamily: "inherit",
  };

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
        <button onClick={() => setOpen(!open)} style={{ ...chip, borderColor: "#2B2724", color: "#2B2724", fontWeight: 700 }}>
          {open ? "Links verbergen" : "Alle links"}
        </button>
        <a href={`/vergelijk/${slug}`} style={{ ...chip, borderColor: "#7c3aed", color: "#6d28d9", background: "#faf5ff" }}>
          Stijl kiezen{stijl ? ` (${stijl})` : ""}
        </a>

        {links.map((l) => (
          <button
            key={l.key}
            onClick={() => !l.uit && copy(l.url, l.key)}
            disabled={l.uit}
            title={l.hint + (l.uit ? "" : "\n" + l.url)}
            style={{
              ...chip,
              borderColor: l.uit ? "#ECE4D7" : l.key === "r" && restBetaald ? "#a7f3d0" : l.key === "d" ? (l.leeg ? "#E3DACB" : "#C05A38") : "#E3DACB",
              color: l.uit ? "#B0A697" : l.key === "r" && restBetaald ? "#065f46" : l.key === "d" && !l.leeg ? "#a35400" : "#524A40",
              background: copied === l.key ? "#ecfdf5" : l.key === "r" && restBetaald ? "#ecfdf5" : l.key === "d" && !l.leeg && !l.uit ? "#fff7ed" : "#fff",
              cursor: l.uit ? "not-allowed" : "pointer",
            }}
          >
            {copied === l.key ? "Gekopieerd ✓" : l.naam + (l.uit ? " (nvt)" : l.leeg ? " (leeg)" : "")}
          </button>
        ))}

        {!heeftDemo && magMaken && (
          <button onClick={maakDemo} disabled={demoBezig} style={{ ...chip, borderColor: "#C05A38", color: "#a35400" }}>
            {demoBezig ? "Demo-app maken…" : "+ Demo-app maken"}
          </button>
        )}
      </div>

      {/* Uitgeklapt: de volledige links, zichtbaar en los te kopiëren. */}
      {open && (
        <div style={{ marginTop: 10, background: "#FBF7F0", border: "1px solid #ECE4D7", borderRadius: 10, padding: "10px 12px", display: "grid", gap: 8 }}>
          {links.map((l) => (
            <div key={l.key} style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#2B2724", minWidth: 92 }}>{l.naam}</span>
              <input
                readOnly
                value={l.uit ? "—" : l.url}
                onFocus={(e) => e.target.select()}
                style={{ flex: "1 1 260px", minWidth: 0, fontSize: 12.5, padding: "6px 8px", border: "1px solid #E3DACB", borderRadius: 7, background: "#fff", color: l.uit ? "#B0A697" : "#524A40", fontFamily: "inherit" }}
              />
              <button onClick={() => !l.uit && copy(l.url, "x" + l.key)} disabled={l.uit} style={{ ...chip, padding: "6px 10px", cursor: l.uit ? "not-allowed" : "pointer" }}>
                {copied === "x" + l.key ? "✓" : "Kopieer"}
              </button>
              {!l.uit && (
                <a href={l.url} target="_blank" rel="noreferrer" style={{ ...chip, padding: "6px 10px" }}>Open ↗</a>
              )}
            </div>
          ))}
          <p style={{ fontSize: 11.5, color: "#9A9084", margin: 0 }}>
            Tip: de knop &quot;Appje versturen&quot; zet de preview- en demo-link al kant-en-klaar in een WhatsApp-bericht.
          </p>
        </div>
      )}
    </div>
  );
}

export function VerwijderKnop({ slug, naam }) {
  const [s, setS] = useState("idle");
  async function go() {
    if (!confirm(`Klant "${naam || slug}" definitief verwijderen?\n\nDit verwijdert de preview én alle inzendingen. Dit kan niet ongedaan gemaakt worden.`)) return;
    setS("bezig");
    try {
      const res = await fetch("/api/klant/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const d = await res.json();
      if (d.ok) location.reload();
      else { alert(d.error || "Verwijderen mislukt"); setS("idle"); }
    } catch (e) { alert(String(e)); setS("idle"); }
  }
  return (
    <button onClick={go} disabled={s === "bezig"}
      style={{ background: "#fff", color: "#c0392b", border: "1px solid #e3b9b4", padding: "5px 10px", borderRadius: 6, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}>
      {s === "bezig" ? "Bezig…" : "Verwijderen"}
    </button>
  );
}

export function GegevensEditor({ slug, data = {}, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const [s, setS] = useState("idle");
  const [v, setV] = useState({
    slogan: data.b_slogan || "",
    telefoon: data.b_telefoon || "",
    whatsapp: data.b_whatsapp || "",
    email: data.b_email || "",
    adres: data.b_adres || "",
    kvk: data.b_kvk || "",
    btw: data.b_btw || "",
  });
  const set = (k, val) => setV({ ...v, [k]: val });

  async function save() {
    setS("bezig");
    try {
      const res = await fetch("/api/klant/gegevens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, ...v }),
      });
      const d = await res.json();
      if (d.ok) location.reload();
      else { alert(d.error || "Opslaan mislukt"); setS("idle"); }
    } catch (e) { alert(String(e)); setS("idle"); }
  }

  const inp = { width: "100%", padding: "5px 7px", border: "1px solid #E3DACB", borderRadius: 6, fontSize: 13, marginTop: 2 };
  const lab = { fontSize: 11, color: "#666", fontWeight: 600, display: "block", marginTop: 7 };
  const velden = [["slogan", "Slogan"], ["telefoon", "Telefoon"], ["whatsapp", "WhatsApp (intl. nr.)"], ["email", "E-mail"], ["adres", "Adres"], ["kvk", "KvK"], ["btw", "BTW"]];

  return (
    <div style={{ marginTop: 8 }}>
      <button onClick={() => setOpen(!open)}
        style={{ background: "#fff", border: "1px solid #E3DACB", color: "#C05A38", padding: "5px 9px", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>
        {open ? "Sluiten" : "Gegevens bewerken"}
      </button>
      {open && (
        <div style={{ marginTop: 8, background: "#fafbfc", border: "1px solid #ECE4D7", borderRadius: 8, padding: "10px 12px", width: 230 }}>
          {velden.map(([k, label]) => (
            <label key={k} style={lab}>{label}
              <input style={inp} value={v[k]} onChange={(e) => set(k, e.target.value)} />
            </label>
          ))}
          <button onClick={save} disabled={s === "bezig"}
            style={{ marginTop: 10, background: "#1d7a46", color: "#fff", border: "none", padding: "7px 14px", borderRadius: 7, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
            {s === "bezig" ? "Opslaan…" : "Opslaan"}
          </button>
        </div>
      )}
    </div>
  );
}

// De inloglink naar de app van deze klant. Handig als hij 'm kwijt is.
export function AppLinkKnop({ bedrijf }) {
  const [bezig, setBezig] = useState(false);
  const [url, setUrl] = useState("");
  const [fout, setFout] = useState("");
  const [copied, setCopied] = useState(false);

  async function haal() {
    setBezig(true); setFout(""); setUrl("");
    try {
      const res = await fetch("/api/klant/applink", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bedrijf }),
      });
      const j = await res.json();
      if (j.ok) setUrl(j.url);
      else setFout(j.error || "Lukt niet.");
    } catch {
      setFout("Lukt niet.");
    }
    setBezig(false);
  }

  const chip = {
    display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5, padding: "7px 11px",
    borderRadius: 8, border: "1px solid #E3DACB", background: "#fff", color: "#524A40",
    cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit",
  };

  if (url) {
    return (
      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", width: "100%" }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#2B2724" }}>App-inlog</span>
        <input readOnly value={url} onFocus={(e) => e.target.select()}
          style={{ flex: "1 1 240px", minWidth: 0, fontSize: 12.5, padding: "6px 8px", border: "1px solid #E3DACB", borderRadius: 7, fontFamily: "inherit", color: "#524A40" }} />
        <button onClick={() => { try { navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch {} }}
          style={{ ...chip, background: copied ? "#ecfdf5" : "#fff" }}>
          {copied ? "Gekopieerd ✓" : "Kopieer"}
        </button>
        <span style={{ fontSize: 11.5, color: "#9A9084" }}>14 dagen geldig</span>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <button onClick={haal} disabled={bezig} style={chip}>
        {bezig ? "Bezig…" : "App-inloglink maken"}
      </button>
      {fout && <span style={{ fontSize: 12, color: "#b45309" }}>{fout}</span>}
    </div>
  );
}
