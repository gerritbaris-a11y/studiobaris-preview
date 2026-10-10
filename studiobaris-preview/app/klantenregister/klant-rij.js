"use client";

import { useState } from "react";
import { KLEUR, HEAD } from "../werkplek-stijl";
import {
  Contactpersoon, FactuurEmail, GegevensEditor, VerwijderKnop, KlantNaam,
  MarkeerAlsKlantKnop, MarkeerAlsOudKlantKnop, HeractiveerKlantKnop,
  BetaallinkKnop,
} from "../dashboard/dashboard-actions";
import AfspraakForm from "../abonnementen/afspraak-form";

// Eén rij op het Klantenregister — klap open voor het volledige plaatje
// (adres, KvK, BTW, WhatsApp) plus bewerken en de minder alledaagse acties
// (oud-klant markeren, heractiveren, verwijderen). variant bepaalt welke
// kolommen en knoppen horen bij "klanten" / "toekomstig" / "oud".

const td = { padding: "8px 14px" };
const veldLabel = { color: KLEUR.label, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 2 };

function PakketLabel({ type }) {
  return type === "plugin" ? "Alleen plugin" : type === "vol" ? "Vol pakket" : "—";
}

function euro(v) {
  const n = Number(v) || 0;
  return "€ " + n.toFixed(2).replace(".", ",");
}

const MAANDEN = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
function datumPlus14(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  d.setDate(d.getDate() + 14);
  return `${d.getDate()} ${MAANDEN[d.getMonth()]}`;
}

const actieKnop = {
  background: "#fff", color: KLEUR.klei, border: `1px solid ${KLEUR.lijn2}`,
  padding: "6px 11px", borderRadius: 8, fontSize: 12.5, fontWeight: 700,
  cursor: "pointer", whiteSpace: "nowrap", fontFamily: HEAD,
};

// Optie 5 — de slottermijn. Alleen relevant zolang er nog een restbedrag
// openstaat en er niet al een aankondiging onderweg is; de eigenlijke
// incasso gebeurt niet hier maar 14 dagen later door de dagelijkse cron.
function SlottermijnKnop({ r }) {
  const [open, setOpen] = useState(false);
  const [bedrag, setBedrag] = useState(r.restbedrag != null ? String(r.restbedrag) : "");
  const [bezig, setBezig] = useState(false);
  const [melding, setMelding] = useState("");

  if (r.rest_status === "betaald") {
    return <span style={{ fontSize: 12.5, color: KLEUR.label }}>Slottermijn betaald ✓</span>;
  }
  if (r.rest_status === "aangekondigd") {
    const rond = datumPlus14(r.slottermijn_aangekondigd_op);
    return (
      <span style={{ fontSize: 12.5, color: KLEUR.label }}>
        Slottermijn aangekondigd{rond ? ` — incasso rond ${rond}` : ""}
      </span>
    );
  }
  if (r.rest_status === "open") {
    return <span style={{ fontSize: 12.5, color: KLEUR.label }}>Slottermijn: incasso wordt verwerkt…</span>;
  }
  if (!(Number(r.restbedrag) > 0)) return null;

  async function versturen() {
    setBezig(true);
    setMelding("");
    try {
      const res = await fetch("/api/abonnement/slottermijn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: r.slug, bedrag }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Versturen mislukte.");
      location.reload();
    } catch (e) {
      setMelding(String(e.message || e));
      setBezig(false);
    }
  }

  return (
    <div>
      <button onClick={() => setOpen((v) => !v)} style={actieKnop}>
        {open ? "Sluiten" : "Slottermijn versturen"}
      </button>
      {open && (
        <div style={{ marginTop: 8, background: "#fafbfc", border: `1px solid ${KLEUR.lijn}`, borderRadius: 8, padding: "10px 12px", width: 220 }}>
          <span style={{ fontSize: 11, color: KLEUR.label, fontWeight: 700, display: "block", marginBottom: 2 }}>
            Bedrag, excl. btw
          </span>
          <input
            style={{ width: "100%", padding: "5px 7px", border: `1px solid ${KLEUR.lijn2}`, borderRadius: 6, fontSize: 13 }}
            inputMode="decimal"
            value={bedrag}
            onChange={(e) => setBedrag(e.target.value)}
          />
          <div style={{ fontSize: 11.5, color: KLEUR.label, marginTop: 6 }}>
            Verstuurt meteen de wettelijke 14-dagen-vooraankondiging per mail. De incasso zelf volgt
            automatisch daarna, zonder tussenkomst — mits er een SEPA-mandaat is.
          </div>
          <button
            onClick={versturen}
            disabled={bezig || !(Number(String(bedrag).replace(",", ".")) > 0)}
            style={{ ...actieKnop, marginTop: 8, background: KLEUR.klei, color: "#fff", border: "none", opacity: bezig ? 0.6 : 1 }}
          >
            {bezig ? "Bezig…" : "Versturen"}
          </button>
          {melding && <div style={{ fontSize: 12, color: KLEUR.kleiDonker, marginTop: 6 }}>{melding}</div>}
        </div>
      )}
    </div>
  );
}

// --- App-inloglink -------------------------------------------------------
// Elke klant met een app heeft een persoonlijke link (app.studiobaris.nl/in/…).
// Die is 14 dagen geldig; nieuwe telefoon of link kwijt → "Nieuwe link maken"
// en de vorige vervalt. "Bruikbaar" = niet verlopen en nog niet gebruikt.

function korteDatum(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getDate()} ${MAANDEN[d.getMonth()]}`;
}

function linkStatus(app) {
  if (!app || !app.url) return { bruikbaar: false, tekst: "Nog geen link" };
  const verlopen = app.verloopt && new Date(app.verloopt).getTime() < Date.now();
  if (verlopen) return { bruikbaar: false, tekst: `Verlopen op ${korteDatum(app.verloopt)}` };
  if (app.gebruikt) {
    return { bruikbaar: false, tekst: `Al gebruikt op ${korteDatum(app.gebruikt)} · geldig t/m ${korteDatum(app.verloopt) || "?"}` };
  }
  return { bruikbaar: true, tekst: `Nog niet gebruikt · geldig t/m ${korteDatum(app.verloopt) || "?"}` };
}

function waNummer(tel) {
  const t = String(tel || "").replace(/[^\d+]/g, "");
  if (!t) return null;
  if (t.startsWith("+")) return t.slice(1);
  if (t.startsWith("00")) return t.slice(2);
  if (t.startsWith("0")) return "31" + t.slice(1);
  return t;
}

function useAppLink(startApp) {
  const [app, setApp] = useState(startApp);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState("");

  async function maakNieuw() {
    setBezig(true); setFout("");
    try {
      const res = await fetch("/api/klant/applink", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: app.id }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error || "Nieuwe link maken mislukt.");
      const nieuw = { ...app, url: j.url, verloopt: j.verloopt, gebruikt: null };
      setApp(nieuw);
      setBezig(false);
      return nieuw;
    } catch (e) {
      setFout(String(e.message || e));
      setBezig(false);
      return null;
    }
  }
  return { app, bezig, fout, maakNieuw };
}

async function kopieer(tekst) {
  try { await navigator.clipboard.writeText(tekst); return true; } catch { return false; }
}

// Compacte knop in de rij: kopieert de link als die nog bruikbaar is, maakt
// anders eerst een nieuwe en kopieert die.
function AppLinkSnel({ app: startApp }) {
  const { app, bezig, fout, maakNieuw } = useAppLink(startApp);
  const [klaar, setKlaar] = useState("");
  if (!startApp) return <span style={{ fontSize: 12, color: KLEUR.label }}>Geen app</span>;
  const st = linkStatus(app);

  async function klik() {
    let doel = app;
    if (!st.bruikbaar) {
      doel = await maakNieuw();
      if (!doel) return;
    }
    const ok = await kopieer(doel.url);
    setKlaar(ok ? (st.bruikbaar ? "Gekopieerd ✓" : "Nieuw + gekopieerd ✓") : "Kopiëren lukte niet");
    setTimeout(() => setKlaar(""), 2200);
  }

  return (
    <button
      onClick={klik}
      disabled={bezig}
      title={(fout || st.tekst) + (app.url ? "\n" + app.url : "")}
      style={{ ...actieKnop, padding: "5px 9px", fontSize: 12, background: klaar ? "#ecfdf5" : "#fff", opacity: bezig ? 0.6 : 1 }}
    >
      {bezig ? "Bezig…" : klaar || fout ? (klaar || "Mislukt") : st.bruikbaar ? "Kopieer app-link" : "Nieuwe app-link"}
    </button>
  );
}

// Volledig blok in de opengeklapte rij.
function AppLinkBlok({ app: startApp, telefoon, bedrijf }) {
  const { app, bezig, fout, maakNieuw } = useAppLink(startApp);
  const [klaar, setKlaar] = useState(false);

  if (!startApp) {
    return (
      <div style={{ fontSize: 13, color: KLEUR.label }}>
        Geen app-account gevonden voor deze klant. De app wordt aangemaakt bij oplevering — staat hij er wel al,
        dan wijkt de naam te veel af van het register.
      </div>
    );
  }

  const st = linkStatus(app);
  const wa = waNummer(telefoon);
  const waTekst =
    `Hoi! Hier is je persoonlijke link naar de StudioBaris-app${bedrijf ? ` voor ${bedrijf}` : ""}:\n${app.url}\n\n` +
    `Open hem op je telefoon en zet de app daarna op je beginscherm (iPhone: Safari → Deel → "Zet op beginscherm"; ` +
    `Android: Chrome → menu → "Toevoegen aan startscherm"). De link is 14 dagen geldig.`;

  async function nieuw() {
    const tekst = st.bruikbaar
      ? "Er staat nog een geldige, ongebruikte link. Toch een nieuwe maken? De huidige werkt dan niet meer."
      : "Nieuwe link maken? De oude link werkt daarna niet meer.";
    if (!confirm(tekst)) return;
    await maakNieuw();
  }

  return (
    <div style={{ display: "grid", gap: 8 }}>
      {app.url ? (
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          <input
            readOnly
            value={app.url}
            onFocus={(e) => e.target.select()}
            style={{ flex: "1 1 320px", minWidth: 0, fontSize: 12.5, padding: "6px 8px", border: `1px solid ${KLEUR.lijn2}`, borderRadius: 7, fontFamily: "inherit", color: KLEUR.labelDonker || "#524A40", background: "#fff" }}
          />
          <button
            onClick={async () => { if (await kopieer(app.url)) { setKlaar(true); setTimeout(() => setKlaar(false), 1600); } }}
            style={{ ...actieKnop, background: klaar ? "#ecfdf5" : "#fff" }}
          >
            {klaar ? "Gekopieerd ✓" : "Kopieer"}
          </button>
          {wa && (
            <a
              href={`https://wa.me/${wa}?text=${encodeURIComponent(waTekst)}`}
              target="_blank"
              rel="noreferrer"
              style={{ ...actieKnop, textDecoration: "none" }}
            >
              Via WhatsApp ↗
            </a>
          )}
        </div>
      ) : null}
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: 12.5, color: st.bruikbaar ? "#1d7a46" : KLEUR.kleiDonker || "#b45309", fontWeight: 600 }}>
          {st.tekst}
        </span>
        {!st.bruikbaar && app.url && (
          <span style={{ fontSize: 12, color: KLEUR.label }}>— maak een nieuwe link voor je hem verstuurt.</span>
        )}
        <button onClick={nieuw} disabled={bezig} style={{ ...actieKnop, marginLeft: "auto", opacity: bezig ? 0.6 : 1 }}>
          {bezig ? "Bezig…" : "↻ Nieuwe link maken"}
        </button>
      </div>
      {fout && <div style={{ fontSize: 12, color: KLEUR.kleiDonker || "#b45309" }}>{fout}</div>}
      <div style={{ fontSize: 11.5, color: KLEUR.label }}>
        App-account: {app.naam}. Een nieuwe link is 14 dagen geldig; de vorige vervalt direct.
      </div>
    </div>
  );
}

// Telefoonnummers komen soms met spaties/streepjes binnen (bijv. handmatig
// overgetypt); voor een uniforme kolom laten we alleen cijfers en een
// eventuele voorloop-"+" staan.
function schoonTelefoon(v) {
  if (!v) return v;
  return String(v).replace(/[^\d+]/g, "");
}

export default function KlantRij({ r, variant, team = [], app = null }) {
  const [open, setOpen] = useState(false);
  const telefoon = schoonTelefoon(r.lead_phone || r.b_telefoon) || "—";
  const email = r.lead_email || r.b_email || "—";
  const kolommen = variant === "klant" ? 9 : 6;
  // Portefeuille-filter (VerkoperFilter) werkt alleen op de Klanten-tabel —
  // data-attributen daarom alleen daar meegeven, anders zou een filterklik
  // ook rijen op Toekomstig/Oud onterecht verbergen.
  const filterAttrs = variant === "klant" ? { "data-verzamelaar": r.verzamelaar || "", "data-rij-hoofd": "1" } : {};
  const filterAttrsDetail = variant === "klant" ? { "data-verzamelaar": r.verzamelaar || "" } : {};

  return (
    <>
      <tr
        style={{ borderTop: `1px solid ${KLEUR.baanRand}`, cursor: "pointer" }}
        onClick={() => setOpen((v) => !v)}
        {...filterAttrs}
      >
        {variant !== "toekomstig" && (
          <td style={{ ...td, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{r.klantnummer || "—"}</td>
        )}
        <td style={{ ...td, fontWeight: 700 }}>
          {r.company_name || r.slug}{" "}
          <span style={{ color: KLEUR.label, fontWeight: 400, fontSize: 12 }}>{open ? "▲" : "▾"}</span>
        </td>
        <td style={td}>{r.contactpersoon || "—"}</td>
        <td style={{ ...td, whiteSpace: "nowrap" }}>{telefoon}</td>
        <td style={td}>
          {email}
          {r.factuur_email && r.factuur_email !== email && (
            <div style={{ fontSize: 11.5, color: KLEUR.label }}>facturen: {r.factuur_email}</div>
          )}
        </td>
        {variant !== "oud" && <td style={td}><PakketLabel type={r.pakket_type} /></td>}
        {variant === "klant" && (
          <td style={td} onClick={(e) => e.stopPropagation()}>
            <KlantNaam slug={r.slug} value={r.verzamelaar} team={team} />
          </td>
        )}
        {variant === "klant" && (
          <td style={{ ...td, textAlign: "right" }}>{r.maandbedrag ? euro(r.maandbedrag) + " p/m" : "—"}</td>
        )}
        {variant === "klant" && (
          <td style={{ ...td, textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
            <AppLinkSnel app={app} />
          </td>
        )}
        {variant === "toekomstig" && (
          <td style={{ ...td, textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
            <MarkeerAlsKlantKnop slug={r.slug} bedrijf={r.company_name} data={r} />
          </td>
        )}
        {variant === "oud" && (
          <td style={{ ...td, textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
            <HeractiveerKlantKnop slug={r.slug} bedrijf={r.company_name} />
          </td>
        )}
      </tr>
      {open && (
        <tr style={{ background: KLEUR.baan }} {...filterAttrsDetail}>
          <td colSpan={kolommen} style={{ padding: "14px 18px" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "grid", gap: 12 }}>
              {variant !== "oud" && (
                <div style={{ fontSize: 13.5 }}>
                  <span style={veldLabel}>Websiteprijs</span>{r.websiteprijs ? euro(r.websiteprijs) : "—"}
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start", borderTop: `1px solid ${KLEUR.baanRand}`, paddingTop: 12 }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-start" }}>
                  <Contactpersoon slug={r.slug} value={r.contactpersoon} />
                  <FactuurEmail slug={r.slug} value={r.factuur_email} standaard={r.b_email || r.lead_email} />
                </div>
                <GegevensEditor slug={r.slug} data={r} defaultOpen />
              </div>

              <div style={{ borderTop: `1px solid ${KLEUR.baanRand}`, paddingTop: 12 }}>
                <div style={{ fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: KLEUR.label, fontWeight: 700, marginBottom: 8 }}>
                  App-inloglink
                </div>
                <AppLinkBlok app={app} telefoon={r.lead_phone || r.b_telefoon} bedrijf={r.company_name} />
              </div>

              {(variant === "klant" || variant === "toekomstig") && (
                <div style={{ borderTop: `1px solid ${KLEUR.baanRand}`, paddingTop: 12 }}>
                  <div style={{ fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: KLEUR.label, fontWeight: 700, marginBottom: 8 }}>
                    De afspraak
                  </div>
                  <AfspraakForm rij={r} onKlaar={() => location.reload()} />
                  {variant === "toekomstig" && (
                    <div style={{ fontSize: 12, color: KLEUR.label, marginTop: 8 }}>
                      Let op: "Vastleggen" geeft meteen een klantnummer — hij verschijnt hierna bij "Klanten".
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", borderTop: `1px solid ${KLEUR.baanRand}`, paddingTop: 12 }}>
                {variant === "klant" && (
                  <a href={`/facturen?klant=${encodeURIComponent(r.slug)}`} style={{ color: KLEUR.klei, fontWeight: 700, fontSize: 13, textDecoration: "none" }}>
                    Facturen bekijken →
                  </a>
                )}
                {(variant === "klant" || variant === "toekomstig") && (
                  <BetaallinkKnop slug={r.slug} style={actieKnop} />
                )}
                {variant === "klant" && <SlottermijnKnop r={r} />}
                {variant === "klant" && (
                  <MarkeerAlsOudKlantKnop slug={r.slug} bedrijf={r.company_name} heeftActiefAbonnement={r.betaal_status === "actief"} />
                )}
                {variant === "toekomstig" && <MarkeerAlsKlantKnop slug={r.slug} bedrijf={r.company_name} data={r} />}
                {variant === "oud" && <HeractiveerKlantKnop slug={r.slug} bedrijf={r.company_name} />}
                <div style={{ marginLeft: "auto" }}>
                  <VerwijderKnop slug={r.slug} naam={r.company_name} />
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
