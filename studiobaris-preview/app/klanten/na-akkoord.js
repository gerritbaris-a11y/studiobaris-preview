"use client";

import { useState } from "react";
import { KLEUR, HEAD } from "../werkplek-stijl";
import { maakMail } from "./hosting-check";

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

function aanhef(naam) {
  return naam && naam.trim() ? `Hoi ${naam.trim()},` : "Hoi,";
}

function groet(verkoper) {
  return ["Groet,", verkoper && verkoper.trim() ? `${verkoper.trim()}, StudioBaris` : "StudioBaris"];
}

// --- Route: heeft al een domein ---------------------------------------------
function HeeftDomein({ website, contact, bedrijf, verkoper, email }) {
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

  // De klant kiest zelf of zijn mail meekomt.
  const geenMail = r && r.mail && r.mail.naam === "Geen mail op dit domein";
  const mailVraag = geenMail ? [] : [
    `Nog één vraag over je e-mail${r && r.mail && r.mail.naam && !r.mail.naam.includes(".") ? ` (die staat nu bij ${r.mail.naam})` : ""}: wil je dat je e-mail mee naar ons komt, of blijft hij staan waar hij nu staat?`,
    "Komt hij mee, dan zitten twee mailboxen in je abonnement; daarboven betaal je € 4,95 per extra mailbox. Laat dan even weten welke adressen je nu gebruikt. Blijft hij staan, dan merk je er niets van: je mail werkt gewoon door.",
  ];
  const mail = r && !r.domeinBij.eigen ? maakMail(r, contact || "", bedrijf || "", verkoper, mailVraag) : null;

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
          ) : (
            <>
              {r.domeinBij.onbekend && (
                <div style={{ ...uitleg, marginTop: 6 }}>De partij van het domein konden we niet met zekerheid vinden: vul die zelf in het bericht in.</div>
              )}
              <Bericht onderwerp={mail.onderwerp} tekst={mail.tekst} aan={email} />
              <div style={{ ...uitleg, marginTop: 8 }}>
                Krijg je de verhuiscode binnen, of het antwoord over de mail? Geef het door aan Gerrit of Levi. Wij doen de rest.
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// --- Route: nog geen domein --------------------------------------------------
function GeenDomein({ voorstel, contact, verkoper, email }) {
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
      `Je website komt op ${r.domein}. Die naam is nog vrij en wij leggen hem voor je vast. Het domein is en blijft van jou.`,
      "",
      "Liever een andere naam? Laat het even weten, dan kijken we of die vrij is.",
      "",
      `Twee mailboxen zitten in je abonnement, bijvoorbeeld info@${r.domein}. Welke adressen wil je hebben?`,
      "",
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
            Gaat de klant akkoord met de naam? Geef de naam en de gewenste mailadressen door aan Gerrit of Levi.
          </div>
        </>
      )}
    </div>
  );
}

// --- Het blok -----------------------------------------------------------------
export default function NaAkkoord({ slug, bedrijf, contact, email, website, verkoper, betaalStatus, gegevensIngevuld }) {
  const [open, setOpen] = useState(false);
  const [route, setRoute] = useState(null); // "heeft" | "geen"

  const betaald = ["akkoord", "actief"].includes(String(betaalStatus || ""));
  const link = GEGEVENS_BASIS + slug;
  const voorstel = slug ? `${slug}.nl` : "";

  const gegevensBericht = {
    onderwerp: "Je website: nog even je gegevens",
    tekst: [
      aanhef(contact),
      "",
      `Top dat je akkoord bent! We gaan aan de slag met de website van ${bedrijf || "je bedrijf"}.`,
      "",
      "Eén ding hebben we nog van je nodig: je adres, KvK- en btw-nummer. Die komen in de footer van je website en op je facturen. Het kost je twee minuten:",
      link,
      "",
      "Op dezelfde pagina kun je ook je sociale media en je Google-profiel kwijt, als je die hebt.",
      "",
      ...groet(verkoper),
    ].join("\n"),
  };

  return (
    <div style={blok}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap", fontFamily: "inherit", color: KLEUR.inkt, textAlign: "left" }}
      >
        <span style={{ fontFamily: HEAD, fontSize: 15, fontWeight: 800 }}>{open ? "▾" : "▸"} Na akkoord: zo gaat het verder</span>
        <span style={{ fontSize: 12.5, color: KLEUR.label }}>
          {gegevensIngevuld ? "✓ gegevens binnen" : "gegevens nog niet binnen"}
        </span>
      </button>

      {open && (
        <div style={{ marginTop: 12, background: KLEUR.papier, border: `1px solid ${KLEUR.lijn}`, borderRadius: 12, padding: "12px 14px", display: "grid", gap: 16 }}>
          {/* 1. Gegevens */}
          <div>
            <div style={stapKop}>1. Gegevens van de klant</div>
            {gegevensIngevuld ? (
              <div style={{ ...uitleg, color: KLEUR.sage.tekst, fontWeight: 600 }}>✓ De klant heeft zijn gegevens ingevuld. Niets meer te doen.</div>
            ) : betaald ? (
              <>
                <div style={uitleg}>Adres, KvK en btw vragen we pas na akkoord. De klant ziet de link maar één keer na het betalen, dus stuur hem dit bericht.</div>
                <Bericht onderwerp={gegevensBericht.onderwerp} tekst={gegevensBericht.tekst} aan={email} />
              </>
            ) : (
              <div style={uitleg}>De gegevenspagina werkt pas als de klant akkoord heeft gegeven via de akkoordlink. Daarna verschijnt hier het bericht.</div>
            )}
          </div>

          {/* 2. Domein */}
          <div>
            <div style={stapKop}>2. Domeinnaam</div>
            <div style={uitleg}>Vraag de klant of hij al een domeinnaam heeft.</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
              <button type="button" onClick={() => setRoute("heeft")} style={keuze(route === "heeft")}>Heeft al een domein</button>
              <button type="button" onClick={() => setRoute("geen")} style={keuze(route === "geen")}>Nog geen domein</button>
            </div>
            {route === "heeft" && (
              <HeeftDomein website={website} contact={contact} bedrijf={bedrijf} verkoper={verkoper} email={email} />
            )}
            {route === "geen" && (
              <GeenDomein voorstel={voorstel} contact={contact} verkoper={verkoper} email={email} />
            )}
          </div>

          {/* 3. Wat er daarna gebeurt */}
          <div>
            <div style={stapKop}>3. Wat er daarna gebeurt</div>
            <div style={uitleg}>Dit kun je de klant vertellen:</div>
            <ul style={{ margin: "6px 0 0", paddingLeft: 18, fontSize: 13.5, lineHeight: 1.6 }}>
              <li>Wij bouwen de website op basis van de preview die hij heeft goedgekeurd.</li>
              <li>Hij krijgt de site te zien en mag twee correctierondes doen.</li>
              <li>Bij oplevering krijgt hij een mail met waar alles staat, uitleg over de app en zijn persoonlijke inloglink.</li>
              <li>Pas bij oplevering betaalt hij de tweede helft. Het maandbedrag gaat automatisch.</li>
              <li>Het domein en de website zijn en blijven van hem.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
