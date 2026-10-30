"use client";

import { useState } from "react";
import { KLEUR, HEAD } from "../werkplek-stijl";
import { maakMail } from "./hosting-check";
import { rondeUrl, schoonSite } from "../../lib/ronde";

// Op elke previewkaart die op Akkoord staat: wat er na akkoord gebeurt en
// welke berichten de verkoper de klant stuurt. Zelfde opzet als het
// hostingbalkje bovenaan Mijn previews (tekst klaarzetten, kopiëren of
// openen in het mailprogramma). Er wordt hier niets opgeslagen: de
// domeinroute kiest de verkoper per gesprek.

const GEGEVENS_BASIS = "https://betalen.studiobaris.nl/gegevens/";

const blok = { borderTop: `1px solid ${KLEUR.baan}`, paddingTop: 12 };
const stapKop = { fontWeight: 800, fontSize: 14.5, margin: "0 0 4px" };
const uitleg = { fontSize: 12.5, color: KLEUR.gedempt, lineHeight: 1.5 };
const invoer = {
  flex: "1 1 220px", minWidth: 0, padding: "9px 12px", borderRadius: 10,
  border: `1px solid ${KLEUR.lijn2}`, fontSize: 14, fontFamily: "inherit", background: "#fff",
};
const knop = {
  background: KLEUR.klei, color: "#fff", border: "none", padding: "9px 15px", borderRadius: 10,
  fontWeight: 700, fontSize: 13.5, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit",
};
const knopLicht = { ...knop, background: "#fff", color: KLEUR.klei, border: `1px solid ${KLEUR.lijn2}` };
const keuze = (aan) => ({
  ...knopLicht,
  background: aan ? KLEUR.klei : "#fff",
  color: aan ? "#fff" : KLEUR.klei,
});

function Bericht({ onderwerp, tekst, aan }) {
  const [ok, setOk] = useState(false);
  async function kopieer() {
    try {
      await navigator.clipboard.writeText(`Onderwerp: ${onderwerp}\n\n${tekst}`);
      setOk(true);
      setTimeout(() => setOk(false), 2500);
    } catch {}
  }
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ fontSize: 13, marginBottom: 6 }}><strong>Onderwerp:</strong> {onderwerp}</div>
      <pre style={{
        whiteSpace: "pre-wrap", fontFamily: "inherit", fontSize: 13.5, lineHeight: 1.5, margin: 0,
        background: "#fff", border: `1px solid ${KLEUR.lijn}`, borderRadius: 10, padding: "10px 12px",
      }}>{tekst}</pre>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
        <button type="button" onClick={kopieer} style={knop}>{ok ? "✓ Gekopieerd" : "Kopieer bericht"}</button>
        <a
          href={`mailto:${aan || ""}?subject=${encodeURIComponent(onderwerp)}&body=${encodeURIComponent(tekst)}`}
          style={{ ...knopLicht, textDecoration: "none", display: "inline-block" }}
        >
          Open in mailprogramma
        </a>
      </div>
    </div>
  );
}

// Een appje voor de klant: opent WhatsApp met de tekst er al in.
function Appje({ tekst, telefoon }) {
  const [ok, setOk] = useState(false);
  const nr = String(telefoon || "").replace(/[^0-9]/g, "").replace(/^06/, "316");
  async function kopieer() {
    try {
      await navigator.clipboard.writeText(tekst);
      setOk(true);
      setTimeout(() => setOk(false), 2500);
    } catch {}
  }
  return (
    <div style={{ marginTop: 8 }}>
      <pre style={{
        whiteSpace: "pre-wrap", fontFamily: "inherit", fontSize: 13.5, lineHeight: 1.5, margin: 0,
        background: "#fff", border: `1px solid ${KLEUR.lijn}`, borderRadius: 10, padding: "10px 12px",
      }}>{tekst}</pre>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
        <a href={"https://wa.me/" + nr + "?text=" + encodeURIComponent(tekst)} target="_blank" rel="noreferrer"
          style={{ ...knop, textDecoration: "none", display: "inline-block" }}>
          Open in WhatsApp
        </a>
        <button type="button" onClick={kopieer} style={knopLicht}>{ok ? "✓ Gekopieerd" : "Kopieer appje"}</button>
      </div>
      {!nr && <div style={{ ...uitleg, marginTop: 4 }}>Geen telefoonnummer bekend: kies de klant zelf in WhatsApp.</div>}
    </div>
  );
}

// Een ingestuurde feedbackronde, met afvinken als verwerkt.
function RondeKaart({ f }) {
  const [klaar, setKlaar] = useState(!!f.verwerkt_op);
  const [bezig, setBezig] = useState(false);
  async function vinkAf() {
    setBezig(true);
    try {
      const r = await fetch("/api/ronde/verwerkt", {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: f.id }),
      });
      const d = await r.json();
      if (d.ok) setKlaar(true);
    } catch {}
    setBezig(false);
  }
  const op = new Date(f.aangemaakt_op).toLocaleString("nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  const regels = Object.entries(f.antwoorden || {});
  return (
    <div style={{ background: "#fff", border: `1px solid ${klaar ? KLEUR.lijn : KLEUR.amber.dot}`, borderRadius: 10, padding: "10px 12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <strong style={{ fontSize: 14 }}>{f.ronde === 3 ? "Laatste controle: akkoord" : `Feedback ronde ${f.ronde}`} · {op}</strong>
        {klaar
          ? <span style={{ fontSize: 12.5, fontWeight: 700, color: KLEUR.sage.tekst }}>✓ Verwerkt{f.verwerkt_door ? " door " + f.verwerkt_door : ""}</span>
          : <button type="button" onClick={vinkAf} disabled={bezig} style={{ ...knopLicht, padding: "6px 12px", fontSize: 12.5 }}>{bezig ? "…" : "Verwerkt ✓"}</button>}
      </div>
      <ul style={{ margin: "6px 0 0", paddingLeft: 18, fontSize: 13.5, lineHeight: 1.55 }}>
        {regels.map(([k, v]) => (
          <li key={k} style={{ color: v === "Goed" ? KLEUR.label : KLEUR.inkt }}>
            <strong>{k}:</strong> {v === "Goed" ? "goed" : v}
          </li>
        ))}
      </ul>
    </div>
  );
}

// Overdrachtsdocument maken en versturen (alleen beheer). Een nieuwe
// app-inloglink maakt de vorige ongeldig; daarom eerst een bevestiging.
function Overdracht({ slug, site, email, verstuurd }) {
  const [wp, setWp] = useState("");
  const [mail, setMail] = useState("geen");
  const [naar, setNaar] = useState(email || "");
  const [bezig, setBezig] = useState("");
  const [zeker, setZeker] = useState(false);
  const [melding, setMelding] = useState(null); // { goed, tekst }

  function download(b64) {
    try {
      const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = (schoonSite(site) || slug).replace(/\./g, "-") + "-website-en-app.pdf";
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch {}
  }

  async function doe(actie) {
    setBezig(actie); setMelding(null);
    try {
      const res = await fetch("/api/overdracht", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug, site, wp, mail, naar, actie }),
      });
      const d = await res.json();
      if (d.pdf) download(d.pdf);
      if (!d.ok) setMelding({ goed: false, tekst: d.error || "Er ging iets mis." });
      else if (actie === "versturen") setMelding({ goed: true, tekst: `Verstuurd naar ${naar}, met een nieuwe inloglink voor de app (${d.app}). De PDF is ook gedownload.` });
    } catch {
      setMelding({ goed: false, tekst: "Er ging iets mis. Probeer het zo nog eens." });
    }
    setBezig(""); setZeker(false);
  }

  const veld = { ...invoer, display: "block", width: "100%", marginTop: 4, fontWeight: 400 };
  const laatste = verstuurd && verstuurd[0];
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {laatste && (
        <div style={{ ...uitleg, color: KLEUR.sage.tekst, fontWeight: 600 }}>
          ✓ Laatst verstuurd op {new Date(laatste.verstuurd_op).toLocaleString("nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} naar {laatste.naar}{laatste.door ? ` (door ${laatste.door})` : ""}.
        </div>
      )}
      <label style={{ fontSize: 13, fontWeight: 700 }}>
        WordPress-gebruikersnaam van de klant
        <input value={wp} onChange={(e) => setWp(e.target.value)} placeholder="zoals aangemaakt in WordPress" autoCapitalize="off" autoCorrect="off" spellCheck={false} style={veld} />
      </label>
      <label style={{ fontSize: 13, fontWeight: 700 }}>
        E-mail van de klant
        <select value={mail} onChange={(e) => setMail(e.target.value)} style={veld}>
          <option value="geen">Geen e-mail op het domein</option>
          <option value="bij-ons">Verhuisd naar StudioBaris (hoofdstuk &quot;Je e-mail&quot; erbij)</option>
          <option value="blijft">Blijft waar hij was</option>
        </select>
      </label>
      <label style={{ fontSize: 13, fontWeight: 700 }}>
        Versturen naar
        <input value={naar} onChange={(e) => setNaar(e.target.value)} placeholder="e-mailadres klant" inputMode="email" autoCapitalize="off" style={veld} />
      </label>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" onClick={() => doe("voorbeeld")} disabled={!!bezig} style={knopLicht}>
          {bezig === "voorbeeld" ? "Bezig…" : "Bekijk voorbeeld (PDF)"}
        </button>
        {!zeker ? (
          <button type="button" onClick={() => setZeker(true)} disabled={!!bezig} style={knop}>Maak inloglink en verstuur</button>
        ) : (
          <>
            <button type="button" onClick={() => doe("versturen")} disabled={!!bezig} style={knop}>
              {bezig === "versturen" ? "Bezig…" : "Ja, versturen"}
            </button>
            <button type="button" onClick={() => setZeker(false)} disabled={!!bezig} style={knopLicht}>Annuleer</button>
          </>
        )}
      </div>
      {zeker && <div style={uitleg}>Er wordt een nieuwe app-inloglink gemaakt (twee weken geldig). Een eerdere link voor deze klant werkt daarna niet meer.</div>}
      {melding && (
        <div style={{ background: melding.goed ? KLEUR.sage.bg : KLEUR.rust.bg, color: melding.goed ? KLEUR.sage.tekst : KLEUR.rust.tekst, borderRadius: 10, padding: "9px 12px", fontSize: 13.5, fontWeight: 600 }}>
          {melding.tekst}
        </div>
      )}
    </div>
  );
}

const SB_TEL_TOON = "06 16 73 21 05";

function aanhef(naam) {
  return naam && naam.trim() ? `Hoi ${naam.trim()},` : "Hoi,";
}

// De mailvraag staat in elk bericht: het aantal mailboxen bepaalt mee het
// maandbedrag (2 inbegrepen, daarboven € 4,95 per extra mailbox per maand).
function mailVraag(domein, nuBij) {
  return [
    `Wil je ook e-mail op je eigen domein, bijvoorbeeld info@${domein}?${nuBij ? ` Je e-mail staat nu bij ${nuBij}; die kan mee naar ons.` : ""}`,
    "Zo ja, laat dan weten hoeveel mailboxen je wilt en welke adressen. Twee mailboxen zitten in je abonnement. Elke extra mailbox kost € 4,95 per maand, bovenop je maandbedrag.",
    ...(nuBij ? ["Wil je je e-mail liever houden waar hij nu staat? Dan merk je er niets van: je mail werkt gewoon door."] : []),
  ];
}

function groet(verkoper) {
  return ["Groet,", verkoper && verkoper.trim() ? `${verkoper.trim()}, StudioBaris` : "StudioBaris"];
}

// --- Route: heeft al een domein ---------------------------------------------
function HeeftDomein({ website, contact, bedrijf, verkoper, email, gegevensRegels }) {
  const [adres, setAdres] = useState(website || "");
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState("");
  const [r, setR] = useState(null);

  async function check(e) {
    e.preventDefault();
    if (!adres.trim()) return;
    setBezig(true); setFout(""); setR(null);
    try {
      const res = await fetch("/api/hosting-check", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ adres }),
      });
      const d = await res.json();
      if (!d.ok) setFout(d.error || "Opzoeken mislukt.");
      else setR(d);
    } catch {
      setFout("Opzoeken mislukt. Probeer het zo nog eens.");
    }
    setBezig(false);
  }

  // Waar staat de mail nu? Alleen een bekende partij noemen, geen MX-hostnaam.
  const nuBij = r && r.mail && r.mail.naam !== "Geen mail op dit domein" && !r.mail.naam.includes(".") ? r.mail.naam : "";
  const vraag = r ? mailVraag(r.domein, nuBij) : [];
  const mail = r && !r.domeinBij.eigen ? maakMail(r, contact || "", bedrijf || "", verkoper, [...gegevensRegels, ...vraag]) : null;
  // Domein staat al bij ons: alleen de gegevens zijn dan nog nodig.
  const alleenGegevens = r && r.domeinBij.eigen ? {
    onderwerp: "Je website: e-mail en gegevens",
    tekst: [aanhef(contact), "", ...vraag.flatMap((x) => [x, ""]), ...gegevensRegels.flatMap((x) => [x, ""]), ...groet(verkoper)].join("\n"),
  } : null;

  return (
    <div style={{ marginTop: 10 }}>
      <div style={uitleg}>Zoek op waar domein, website en mail nu zitten. Je krijgt meteen het bericht voor de verhuiscode, met de vraag of de mail mee moet.</div>
      <form onSubmit={check} style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
        <input value={adres} onChange={(e) => setAdres(e.target.value)} placeholder="www.bedrijfsnaam.nl"
          inputMode="url" autoCapitalize="off" autoCorrect="off" spellCheck={false} style={invoer} />
        <button type="submit" disabled={bezig} style={{ ...knop, opacity: bezig ? 0.6 : 1 }}>
          {bezig ? "Bezig met zoeken…" : "Opzoeken"}
        </button>
      </form>
      {fout && <div style={{ marginTop: 8, fontSize: 13.5, color: KLEUR.rust.tekst }}>{fout}</div>}

      {r && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 13, lineHeight: 1.6 }}>
            <div><strong>Domein:</strong> {r.domeinBij.naam}{r.domeinBij.zeker ? "" : " (waarschijnlijk)"}</div>
            <div><strong>Website:</strong> {r.website.naam}{"zeker" in r.website && !r.website.zeker ? " (waarschijnlijk)" : ""}</div>
            <div><strong>Mail:</strong> {r.mail.naam}{"zeker" in r.mail && !r.mail.zeker ? " (waarschijnlijk)" : ""}</div>
            {r.dnssec && <div><strong>DNSSEC:</strong> staat aan, moet uit (staat in het bericht)</div>}
            {r.slot && <div><strong>Verhuisslot:</strong> staat aan, moet eraf (staat in het bericht)</div>}
          </div>
          {r.domeinBij.eigen ? (
            <div style={{ marginTop: 8, background: KLEUR.sage.bg, color: KLEUR.sage.tekst, borderRadius: 10, padding: "9px 12px", fontSize: 13.5, fontWeight: 600 }}>
              Dit domein staat al bij StudioBaris. Een verhuiscode is niet nodig.
            </div>
          ) : null}
          {alleenGegevens && <Bericht onderwerp={alleenGegevens.onderwerp} tekst={alleenGegevens.tekst} aan={email} />}
          {!r.domeinBij.eigen && (
            <>
              {r.domeinBij.onbekend && (
                <div style={{ ...uitleg, marginTop: 6 }}>De partij van het domein konden we niet met zekerheid vinden: vul die zelf in het bericht in.</div>
              )}
              <Bericht onderwerp={mail.onderwerp} tekst={mail.tekst} aan={email} />
              <div style={{ ...uitleg, marginTop: 8 }}>
                Krijg je de verhuiscode binnen, of het antwoord over de mail? Geef het door aan Gerrit of Levi, met het aantal mailboxen en de adressen. Wil de klant meer dan twee mailboxen, dan gaat zijn maandbedrag omhoog.
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// --- Route: nog geen domein --------------------------------------------------
function GeenDomein({ voorstel, contact, verkoper, email, gegevensRegels }) {
  const [domein, setDomein] = useState(voorstel || "");
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState("");
  const [r, setR] = useState(null);

  async function check(e) {
    e.preventDefault();
    if (!domein.trim()) return;
    setBezig(true); setFout(""); setR(null);
    try {
      const res = await fetch("/api/domein-check", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ domein }),
      });
      const d = await res.json();
      if (!d.ok) setFout(d.error || "Opzoeken mislukt.");
      else setR(d);
    } catch {
      setFout("Opzoeken mislukt. Probeer het zo nog eens.");
    }
    setBezig(false);
  }

  const bericht = r && r.vrij ? {
    onderwerp: `Je domeinnaam: ${r.domein}`,
    tekst: [
      aanhef(contact),
      "",
      `Top dat je akkoord bent! Je website komt op ${r.domein}. Die naam is nog vrij en wij leggen hem voor je vast. Het domein is en blijft van jou.`,
      "",
      "Liever een andere naam? Laat het even weten, dan kijken we of die vrij is.",
      "",
      ...mailVraag(r.domein, "").flatMap((x) => [x, ""]),
      ...gegevensRegels.flatMap((x) => [x, ""]),
      ...groet(verkoper),
    ].join("\n"),
  } : null;

  return (
    <div style={{ marginTop: 10 }}>
      <div style={uitleg}>Vraag de klant welke naam hij wil en kijk of die vrij is. Is hij vrij, dan staat het bericht klaar.</div>
      <form onSubmit={check} style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
        <input value={domein} onChange={(e) => setDomein(e.target.value)} placeholder="schildersbedrijfjansen.nl"
          inputMode="url" autoCapitalize="off" autoCorrect="off" spellCheck={false} style={invoer} />
        <button type="submit" disabled={bezig} style={{ ...knop, opacity: bezig ? 0.6 : 1 }}>
          {bezig ? "Bezig met zoeken…" : "Check"}
        </button>
      </form>
      <div style={{ fontSize: 12, color: KLEUR.label, marginTop: 4 }}>Zonder extensie kijken we naar .nl.</div>
      {fout && <div style={{ marginTop: 8, fontSize: 13.5, color: KLEUR.rust.tekst }}>{fout}</div>}
      {r && !r.vrij && (
        <div style={{ marginTop: 8, background: KLEUR.rust.bg, color: KLEUR.rust.tekst, borderRadius: 10, padding: "9px 12px", fontSize: 13.5, fontWeight: 600 }}>
          {r.domein} is al bezet. Probeer een andere naam. Is dit domein toch van de klant zelf, kies dan &quot;Heeft al een domein&quot;.
        </div>
      )}
      {bericht && (
        <>
          <div style={{ marginTop: 8, background: KLEUR.sage.bg, color: KLEUR.sage.tekst, borderRadius: 10, padding: "9px 12px", fontSize: 13.5, fontWeight: 600 }}>
            {r.domein} is vrij.
          </div>
          <Bericht onderwerp={bericht.onderwerp} tekst={bericht.tekst} aan={email} />
          <div style={{ ...uitleg, marginTop: 8 }}>
            Gaat de klant akkoord met de naam? Geef de naam door aan Gerrit of Levi, met het aantal mailboxen en de adressen. Wil de klant meer dan twee mailboxen, dan gaat zijn maandbedrag omhoog.
          </div>
        </>
      )}
    </div>
  );
}

// --- Het blok -----------------------------------------------------------------
export default function NaAkkoord({ slug, bedrijf, contact, email, telefoon, website, verkoper, betaalStatus, gegevensIngevuld, beheer, rondes = [], overdrachten = [] }) {
  const [open, setOpen] = useState(false);
  const [route, setRoute] = useState(null); // "heeft" | "geen"
  const [site, setSite] = useState((rondes[0] && rondes[0].site) || "");

  const betaald = ["akkoord", "actief"].includes(String(betaalStatus || ""));
  const link = GEGEVENS_BASIS + slug;
  const voorstel = slug ? `${slug}.nl` : "";
  const akkoordLive = rondes.find((f) => f.ronde === 3);

  // Adres, KvK en btw zijn bij beide routes nodig. Ze gaan mee in hetzelfde
  // bericht als het domein, zodat de klant één mail krijgt in plaats van twee.
  const gegevensRegels = betaald && !gegevensIngevuld ? [
    `Verder hebben we nog je adres, KvK- en btw-nummer nodig voor de footer van je website en je facturen. Dat kost je twee minuten: ${link}`,
    "Op dezelfde pagina kun je ook je sociale media en je Google-profiel kwijt, als je die hebt.",
  ] : [];

  return (
    <div style={blok}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap", fontFamily: "inherit", color: KLEUR.inkt, textAlign: "left" }}
      >
        <span style={{ fontFamily: HEAD, fontSize: 15, fontWeight: 800 }}>{open ? "▾" : "▸"} Na akkoord: van akkoord tot live</span>
        <span style={{ fontSize: 12.5, color: KLEUR.label }}>
          {gegevensIngevuld ? "✓ gegevens binnen" : "gegevens nog niet binnen"}
        </span>
      </button>

      {open && (
        <div style={{ marginTop: 12, background: KLEUR.papier, border: `1px solid ${KLEUR.lijn}`, borderRadius: 12, padding: "12px 14px", display: "grid", gap: 16 }}>
          {/* 1. Domein, met daarin ook de vraag om de gegevens */}
          <div>
            <div style={stapKop}>1. Domeinnaam</div>
            <div style={uitleg}>Vraag de klant of hij al een domeinnaam heeft. Daarna staat er één bericht klaar met alles wat we van hem nodig hebben.</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
              <button type="button" onClick={() => setRoute("heeft")} style={keuze(route === "heeft")}>Heeft al een domein</button>
              <button type="button" onClick={() => setRoute("geen")} style={keuze(route === "geen")}>Nog geen domein</button>
            </div>
            {route === "heeft" && (
              <HeeftDomein website={website} contact={contact} bedrijf={bedrijf} verkoper={verkoper} email={email} gegevensRegels={gegevensRegels} />
            )}
            {route === "geen" && (
              <GeenDomein voorstel={voorstel} contact={contact} verkoper={verkoper} email={email} gegevensRegels={gegevensRegels} />
            )}
          </div>

          {/* 2. Gegevens: alleen status, het verzoek zit in het bericht hierboven */}
          <div>
            <div style={stapKop}>2. Gegevens van de klant</div>
            {gegevensIngevuld ? (
              <div style={{ ...uitleg, color: KLEUR.sage.tekst, fontWeight: 600 }}>✓ De klant heeft adres, KvK en btw ingevuld.</div>
            ) : betaald ? (
              <div style={uitleg}>Nog niet ingevuld. De link staat in het bericht bij stap 1. De klant ziet hem zelf maar één keer, direct na het betalen.</div>
            ) : (
              <div style={uitleg}>De gegevenspagina werkt pas als de klant akkoord heeft gegeven via de akkoordlink. Daarna komt de link vanzelf in het bericht bij stap 1.</div>
            )}
          </div>

          {/* 3. Van eerste versie tot live */}
          <div>
            <div style={stapKop}>3. Eerste versie, feedback en oplevering</div>
            <div style={uitleg}>
              De klant geeft feedback via een formulier dat hem pagina voor pagina door zijn website leidt
              (Home, Diensten, Projecten, Over ons, Contact). Per pagina tikt hij &quot;Ziet er goed uit&quot; of
              &quot;Dit wil ik anders&quot; en schrijft hij kort wat. Hij krijgt twee rondes. Wij verwerken het en appen als het klaar is.
              Daarna loopt hij de site nog één keer door en geeft hij akkoord om live te gaan.
              {!beheer && " Deze appjes stuurt StudioBaris (Gerrit of Levi); jij hoeft hier niets te doen."}
            </div>
            <ol style={{ margin: "8px 0 0", paddingLeft: 18, fontSize: 13.5, lineHeight: 1.6 }}>
              <li><strong>Eerste versie klaar:</strong> appje met de link naar ronde 1.</li>
              <li><strong>Ronde 1 verwerkt:</strong> appje met de link naar ronde 2 (de laatste).</li>
              <li><strong>Ronde 2 verwerkt:</strong> appje met de link naar de laatste controle. Daar geeft hij akkoord.</li>
              <li><strong>Akkoord binnen:</strong> site live zetten, overdrachtsdocument met de app-link versturen (stap 4), appje Live, en even bellen om samen de app op zijn telefoon te zetten.</li>
            </ol>

            {beheer && rondes.length > 0 && (
              <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                {rondes.map((f) => <RondeKaart key={f.id} f={f} />)}
              </div>
            )}

            {beheer && (
              <div style={{ marginTop: 14, display: "grid", gap: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 700 }}>
                  Domeinnaam van de website
                  <input value={site} onChange={(e) => setSite(e.target.value)} placeholder="bedrijfsnaam.nl"
                    inputMode="url" autoCapitalize="off" autoCorrect="off" spellCheck={false}
                    style={{ ...invoer, display: "block", width: "100%", marginTop: 4, fontWeight: 400 }} />
                  <span style={{ display: "block", fontWeight: 400, color: KLEUR.label, fontSize: 12, marginTop: 3 }}>
                    Het formulier opent per stap de pagina&apos;s van deze site.
                  </span>
                </label>

                <div>
                  <div style={{ fontWeight: 700, fontSize: 13.5 }}>Eerste versie klaar → ronde 1</div>
                  <Appje telefoon={telefoon} tekst={[
                    aanhef(contact),
                    "",
                    "Je website is klaar om te bekijken! 🎉",
                    "",
                    "Via deze link lopen we samen je website door, pagina voor pagina. Per pagina tik je op \"Ziet er goed uit\" of \"Dit wil ik anders\". Het duurt een paar minuten:",
                    "👉 " + rondeUrl(slug, 1, site),
                    "",
                    "Je hebt twee rondes om dingen aan te laten passen. Zet daarom alles wat je wilt veranderen nu bij elkaar.",
                    "",
                    "Lukt het niet? Bel of app ons: " + SB_TEL_TOON + ".",
                    "",
                    "Groet, StudioBaris",
                  ].join("\n")} />
                </div>

                <div>
                  <div style={{ fontWeight: 700, fontSize: 13.5 }}>Ronde 1 verwerkt → ronde 2</div>
                  <Appje telefoon={telefoon} tekst={[
                    aanhef(contact),
                    "",
                    "Je wijzigingen zijn verwerkt!",
                    "",
                    "Loop je website nog één keer door via deze link. Dit is je tweede en laatste ronde:",
                    "👉 " + rondeUrl(slug, 2, site),
                    "",
                    "Is alles goed? Tik dan overal op \"Ziet er goed uit\".",
                    "",
                    "Groet, StudioBaris",
                  ].join("\n")} />
                </div>

                <div>
                  <div style={{ fontWeight: 700, fontSize: 13.5 }}>Ronde 2 verwerkt → laatste controle</div>
                  <Appje telefoon={telefoon} tekst={[
                    aanhef(contact),
                    "",
                    "Alles is aangepast!",
                    "",
                    "Loop je website nog één keer door via deze link. Klopt alles? Dan tik je aan het eind op \"Akkoord\" en zetten wij je website live:",
                    "👉 " + rondeUrl(slug, 3, site),
                    "",
                    "Daarna krijg je een mail met je app en alles op een rij.",
                    "",
                    "Groet, StudioBaris",
                  ].join("\n")} />
                </div>

                <div>
                  <div style={{ fontWeight: 700, fontSize: 13.5 }}>Live</div>
                  <Appje telefoon={telefoon} tekst={[
                    aanhef(contact),
                    "",
                    "Je website staat live! 🎉 👉 " + (schoonSite(site) || "[domein]"),
                    "",
                    "Je krijgt zo een mail met alles op een rij: waar alles staat en je persoonlijke link naar de app. Stuur die link aan niemand door, hij werkt als je wachtwoord.",
                    "",
                    "Zullen we even bellen? Dan zetten we samen de app op je telefoon en plaats je je eerste project. Dat duurt ongeveer tien minuten. Laat maar weten wanneer het je uitkomt.",
                    "",
                    "De tweede helft van het websitebedrag wordt automatisch van je rekening afgeschreven. De factuur krijg je per mail.",
                    "",
                    "Groet, StudioBaris",
                  ].join("\n")} />
                  <div style={{ ...uitleg, marginTop: 6 }}>Stuur dit appje nadat het overdrachtsdocument (stap 4) is verstuurd. Daarna de fase op Klaar zetten.</div>
                </div>
              </div>
            )}
          </div>

          {/* 4. Overdracht: app-link en document (alleen beheer) */}
          {beheer && (
            <div>
              <div style={stapKop}>4. Overdracht: app-link en document</div>
              <div style={uitleg}>
                {akkoordLive
                  ? <span style={{ color: KLEUR.sage.tekst, fontWeight: 600 }}>✓ Akkoord gegeven op {new Date(akkoordLive.aangemaakt_op).toLocaleString("nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}. </span>
                  : "Nog geen akkoord uit de laatste controle. "}
                Zet de site live en zorg dat het app-account en de plugin klaarstaan (draaiboek). Daarna maakt deze knop een nieuwe app-inloglink,
                zet die in het document &quot;Je website en je app&quot; en mailt dat naar de klant.
              </div>
              <div style={{ marginTop: 10 }}>
                <Overdracht slug={slug} site={site} email={email} verstuurd={overdrachten} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
