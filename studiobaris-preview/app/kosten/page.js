import { getKosten } from "../../lib/server-data";
import { leesSessie, isBeheer } from "../../lib/auth";
import WerkplekShell from "../werkplek-shell";

export const dynamic = "force-dynamic";

const kaart = { background: "#fff", border: "1px solid #ECE4D7", borderRadius: 14, padding: "16px 18px" };

// Alle rekentarieven op één plek. Alles is aan te passen via de adresbalk,
// bijvoorbeeld: /kosten?hosting=2.5&supabase1000=150&gratis=studiobaris
//
// Dollarprijzen zijn omgerekend naar euro (± $1 = €0,92). Pas ze aan zodra je
// je echte facturen ernaast legt.
const STANDAARD = {
  // --- Vaste platformkosten NU (lage schaal), per maand ---
  supabase_nu: 23,       // Supabase Pro ($25). De kleinste compute (Micro) zit
                         // in het $10-tegoed dat bij Pro hoort, dus die is gratis.
  vercel_nu: 18.5,       // Vercel Pro ($20 bij jaarbetaling)
  github: 0,             // gratis voor privé-repositories
  eigen_domein: 0.92,    // studiobaris.nl, €11/jaar / 12

  // --- Vaste platformkosten bij 1000 GEBRUIKERS (schalen mee) ---
  supabase_1000: 120,    // grotere compute (± Large-tier) + wat verbruik erboven
  vercel_1000: 120,      // meer bandbreedte + function-aanroepen boven het inbegrepen deel

  // --- Per klant, per maand ---
  klant_domein: 0.92,    // €11/jaar / 12
  klant_hosting: 3.0,    // WordPress-hosting per klantsite — AANNAME, controleer met je hoster
  ai_per_project: 0.03,  // Claude Sonnet: ± 4k tokens in + 1,5k uit ($3/$15 per miljoen)
  ai_per_review: 0.004,  // veel korter dan een project
  projecten_dag: 2,      // daglimiet in de app
  reviews_dag: 2,        // daglimiet in de app
  opslag_gb: 0.021,      // Supabase-opslag, per GB p/m
  verkeer_gb: 0.09,      // uitgaand verkeer, per GB
  weergaven: 300,        // geschat aantal keer p/m dat de projectfoto's geladen worden

  maandbedrag: 29.95,    // wat een betalende klant ons oplevert (excl. btw)
};

// Accounts die NIET betalen: ons eigen testbedrijf en gratis vroege klanten.
const GRATIS_STANDAARD = ["studiobaris", "emiel-vakman"];

function euro(n, d = 2) {
  return "€ " + Number(n || 0).toLocaleString("nl-NL", { minimumFractionDigits: d, maximumFractionDigits: d });
}

function Cijfer({ label, waarde, kleur, sub }) {
  return (
    <div style={{ ...kaart, flex: "1 1 160px", minWidth: 160 }}>
      <div style={{ fontSize: 11.5, letterSpacing: 0.6, textTransform: "uppercase", color: "#9A9084", fontWeight: 700, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: kleur || "#2B2724", lineHeight: 1.15 }}>{waarde}</div>
      {sub && <div style={{ fontSize: 12, color: "#9A9084", marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function Regel({ label, waarde, sub, dik }) {
  return (
    <tr style={{ borderTop: "1px solid #F4EEE3" }}>
      <td style={{ padding: "8px 8px 8px 0", fontWeight: dik ? 800 : 500, color: "#2B2724" }}>
        {label}
        {sub && <span style={{ display: "block", fontSize: 11.5, color: "#9A9084", fontWeight: 400 }}>{sub}</span>}
      </td>
      <td style={{ padding: "8px 0", textAlign: "right", fontWeight: dik ? 800 : 600, whiteSpace: "nowrap" }}>{waarde}</td>
    </tr>
  );
}

export default async function KostenPage({ searchParams }) {
  const sessie = leesSessie();
  const beheer = isBeheer(sessie);
  const sp = (await searchParams) || {};
  const num = (k, d) => (sp[k] !== undefined ? Number(sp[k]) : d);

  const t = {
    supabase_nu: num("supabase", STANDAARD.supabase_nu),
    vercel_nu: num("vercel", STANDAARD.vercel_nu),
    github: num("github", STANDAARD.github),
    eigen_domein: num("eigendomein", STANDAARD.eigen_domein),
    supabase_1000: num("supabase1000", STANDAARD.supabase_1000),
    vercel_1000: num("vercel1000", STANDAARD.vercel_1000),
    klant_domein: num("klantdomein", STANDAARD.klant_domein),
    klant_hosting: num("hosting", STANDAARD.klant_hosting),
    ai_per_project: num("aiproject", STANDAARD.ai_per_project),
    ai_per_review: num("aireview", STANDAARD.ai_per_review),
    projecten_dag: num("projectendag", STANDAARD.projecten_dag),
    reviews_dag: num("reviewsdag", STANDAARD.reviews_dag),
    opslag_gb: num("opslag", STANDAARD.opslag_gb),
    verkeer_gb: num("verkeer", STANDAARD.verkeer_gb),
    weergaven: num("weergaven", STANDAARD.weergaven),
    maandbedrag: num("maandbedrag", STANDAARD.maandbedrag),
  };

  const gratisLijst = sp.gratis !== undefined
    ? String(sp.gratis).split(",").map((s) => s.trim()).filter(Boolean)
    : GRATIS_STANDAARD;

  const data = await getKosten();
  const klanten = data.klanten || [];

  // AI-kosten per klant p/m: uitgaan van vol gebruik (de daglimiet), zoals gevraagd.
  const aiPerKlant = (t.projecten_dag * t.ai_per_project + t.reviews_dag * t.ai_per_review) * 30;

  // Per klant: de variabele kosten die met díé klant meebewegen.
  const rijen = klanten.map((k) => {
    const gb = Number(k.opslag_mb || 0) / 1024;
    const opslag = gb * t.opslag_gb;
    const verkeer = gb * t.weergaven * t.verkeer_gb;
    const betaalt = !gratisLijst.includes(k.slug);
    const variabel = t.klant_domein + t.klant_hosting + aiPerKlant + opslag + verkeer;
    return { ...k, gb, opslag, verkeer, betaalt, variabel };
  }).sort((a, b) => b.variabel - a.variabel);

  const aantal = rijen.length;
  const betalend = rijen.filter((r) => r.betaalt).length;

  // Alles op één hoop: vaste platformkosten + alle variabele klantkosten samen.
  const vastNu = t.supabase_nu + t.vercel_nu + t.github + t.eigen_domein;
  const variabelTotaal = rijen.reduce((s, r) => s + r.variabel, 0);
  const totaleKosten = vastNu + variabelTotaal;
  const kostPerKlant = aantal ? totaleKosten / aantal : 0;
  const omzet = betalend * t.maandbedrag;
  const resultaat = omzet - totaleKosten;

  // Projectie naar 1000 betalende gebruikers.
  const N = 1000;
  const vast1000 = t.supabase_1000 + t.vercel_1000 + t.github + t.eigen_domein;
  const varPerKlant1000 = t.klant_domein + t.klant_hosting + aiPerKlant; // opslag/verkeer verwaarloosbaar per klant
  const totaal1000 = vast1000 + N * varPerKlant1000;
  const kostPerKlant1000 = totaal1000 / N;
  const omzet1000 = N * t.maandbedrag;
  const resultaat1000 = omzet1000 - totaal1000;

  return (
    <WerkplekShell
      naam={sessie?.naam || "collega"}
      beheer={beheer}
      actief="/kosten"
      titel="Kosten & resultaat"
      sub="Alle kosten op één hoop, gedeeld over het aantal klanten. Hoe meer klanten, hoe lager de kost per klant."
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
        <Cijfer label="Klanten" waarde={aantal} sub={betalend + " betalend, " + (aantal - betalend) + " gratis"} />
        <Cijfer label="Totale kosten" waarde={euro(totaleKosten)} kleur="#b45309" sub="alles samen, p/m" />
        <Cijfer label="Kost per klant" waarde={euro(kostPerKlant)} kleur="#b45309" sub="totaal ÷ klanten" />
        <Cijfer label="Omzet" waarde={euro(omzet)} kleur="#0f6e56" sub={betalend + " × " + euro(t.maandbedrag)} />
        <Cijfer label="Resultaat" waarde={euro(resultaat)} kleur={resultaat >= 0 ? "#0f6e56" : "#b91c1c"} sub={resultaat >= 0 ? "winst p/m" : "verlies p/m"} />
      </div>

      {resultaat < 0 && (
        <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", color: "#9a3412", borderRadius: 12, padding: "14px 16px", marginBottom: 16, fontSize: 14, lineHeight: 1.6 }}>
          <strong>Nu draaien we {euro(-resultaat)} verlies per maand.</strong> Dat klopt en is te verwachten: de vaste
          platformkosten ({euro(vastNu)} p/m) lopen door of je nu 1 of 100 klanten hebt, en op dit moment betaalt maar {betalend} van de {aantal}.
          Elke betalende klant erbij verlaagt de kost per klant en duwt dit naar winst. Zie de projectie hieronder.
        </div>
      )}

      {/* Kostenopbouw */}
      <div style={{ ...kaart, marginBottom: 16 }}>
        <h2 style={{ fontSize: 15, margin: "0 0 12px" }}>Waar de kosten zitten</h2>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
          <tbody>
            <tr><td colSpan={2} style={{ fontSize: 11.5, textTransform: "uppercase", letterSpacing: 0.5, color: "#9A9084", fontWeight: 700, padding: "0 0 2px" }}>Vast — loopt door, ongeacht het aantal klanten</td></tr>
            <Regel label="Supabase (database + opslag)" sub="Pro-abonnement. De kleinste rekenkracht zit in het tegoed." waarde={euro(t.supabase_nu)} />
            <Regel label="Vercel (app draaien)" sub="Pro-abonnement, jaarbetaling" waarde={euro(t.vercel_nu)} />
            <Regel label="GitHub (code bewaren)" sub="gratis voor privé-code" waarde={euro(t.github)} />
            <Regel label="Eigen domein studiobaris.nl" sub="€11 per jaar" waarde={euro(t.eigen_domein)} />
            <Regel label="Vast totaal" waarde={euro(vastNu)} dik />

            <tr><td colSpan={2} style={{ fontSize: 11.5, textTransform: "uppercase", letterSpacing: 0.5, color: "#9A9084", fontWeight: 700, padding: "14px 0 2px" }}>Per klant — schaalt mee met het aantal klanten</td></tr>
            <Regel label="Klant-domeinnaam" sub="€11 per jaar per klant" waarde={euro(t.klant_domein)} />
            <Regel label="Hosting klantwebsite" sub="WordPress-hosting per klant — aanname, controleer" waarde={euro(t.klant_hosting)} />
            <Regel label="AI-teksten" sub={t.projecten_dag + " projecten + " + t.reviews_dag + " reviews per dag, bij vol gebruik"} waarde={euro(aiPerKlant)} />
            <Regel label="Opslag + verkeer foto's" sub="gemeten; klein bij nette fotogroottes" waarde={"± " + euro(variabelTotaal / Math.max(aantal, 1) - t.klant_domein - t.klant_hosting - aiPerKlant, 2)} />
            <Regel label="Per klant, per maand" waarde={"± " + euro(t.klant_domein + t.klant_hosting + aiPerKlant)} dik />
          </tbody>
        </table>
      </div>

      {/* Supabase-compute uitleg */}
      <div style={{ ...kaart, marginBottom: 16, background: "#F7F5F0" }}>
        <h2 style={{ fontSize: 14.5, margin: "0 0 6px" }}>Even over die Supabase-computekosten</h2>
        <p style={{ fontSize: 13, color: "#524A40", lineHeight: 1.65, margin: 0 }}>
          Supabase rekent twee dingen: opslag (die groeit met je foto's, een paar cent per klant) én <strong>compute</strong> —
          de rekenkracht van de database-server die altijd aan staat. Bij het Pro-abonnement van $25 zit een tegoed van $10,
          precies genoeg voor de kleinste server (Micro). Zolang we klein zijn kost compute ons dus niets extra.
          Zodra er honderden klanten tegelijk data opvragen, wordt Micro te krap en moeten we naar een grotere server:
          Small, Medium, Large, enzovoort — elke stap kost fors meer per maand. Daarom staat compute NU op nul, maar zit er
          in de kolom "bij 1000 klanten" een flink bedrag: dan draaien we op een grotere server. Het is geen kost per klant,
          maar een trap die je af en toe op moet als je groeit.
        </p>
      </div>

      {/* Projectie */}
      <div style={{ ...kaart, marginBottom: 16 }}>
        <h2 style={{ fontSize: 15, margin: "0 0 4px" }}>Nu vs. bij 1000 klanten</h2>
        <p style={{ fontSize: 12.5, color: "#9A9084", margin: "0 0 12px" }}>Dezelfde som, maar dan met 1000 betalende klanten. Zie hoe de kost per klant instort.</p>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ textAlign: "left", color: "#9A9084", fontSize: 11.5, textTransform: "uppercase", letterSpacing: 0.5 }}>
              <th style={{ padding: "0 8px 8px 0" }}></th>
              <th style={{ padding: "0 8px 8px", textAlign: "right" }}>Nu ({aantal} klanten)</th>
              <th style={{ padding: "0 0 8px 8px", textAlign: "right" }}>Bij 1000 klanten</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderTop: "1px solid #F4EEE3" }}>
              <td style={{ padding: "9px 8px 9px 0" }}>Vaste platformkosten</td>
              <td style={{ padding: "9px 8px", textAlign: "right" }}>{euro(vastNu)}</td>
              <td style={{ padding: "9px 0 9px 8px", textAlign: "right" }}>{euro(vast1000)}</td>
            </tr>
            <tr style={{ borderTop: "1px solid #F4EEE3" }}>
              <td style={{ padding: "9px 8px 9px 0" }}>Klantkosten samen</td>
              <td style={{ padding: "9px 8px", textAlign: "right" }}>{euro(variabelTotaal)}</td>
              <td style={{ padding: "9px 0 9px 8px", textAlign: "right" }}>{euro(N * varPerKlant1000)}</td>
            </tr>
            <tr style={{ borderTop: "1px solid #F4EEE3", fontWeight: 700 }}>
              <td style={{ padding: "9px 8px 9px 0" }}>Totale kosten</td>
              <td style={{ padding: "9px 8px", textAlign: "right" }}>{euro(totaleKosten)}</td>
              <td style={{ padding: "9px 0 9px 8px", textAlign: "right" }}>{euro(totaal1000)}</td>
            </tr>
            <tr style={{ borderTop: "1px solid #F4EEE3", fontWeight: 800 }}>
              <td style={{ padding: "9px 8px 9px 0" }}>Kost per klant</td>
              <td style={{ padding: "9px 8px", textAlign: "right", color: "#b45309" }}>{euro(kostPerKlant)}</td>
              <td style={{ padding: "9px 0 9px 8px", textAlign: "right", color: "#0f6e56" }}>{euro(kostPerKlant1000)}</td>
            </tr>
            <tr style={{ borderTop: "1px solid #F4EEE3" }}>
              <td style={{ padding: "9px 8px 9px 0" }}>Omzet</td>
              <td style={{ padding: "9px 8px", textAlign: "right" }}>{euro(omzet)}</td>
              <td style={{ padding: "9px 0 9px 8px", textAlign: "right" }}>{euro(omzet1000)}</td>
            </tr>
            <tr style={{ borderTop: "2px solid #E7DFD1", fontWeight: 800 }}>
              <td style={{ padding: "9px 8px 9px 0" }}>Resultaat p/m</td>
              <td style={{ padding: "9px 8px", textAlign: "right", color: resultaat >= 0 ? "#0f6e56" : "#b91c1c" }}>{euro(resultaat)}</td>
              <td style={{ padding: "9px 0 9px 8px", textAlign: "right", color: resultaat1000 >= 0 ? "#0f6e56" : "#b91c1c" }}>{euro(resultaat1000)}</td>
            </tr>
          </tbody>
        </table>
        <p style={{ fontSize: 12, color: "#9A9084", marginTop: 12, lineHeight: 1.6 }}>
          De projectie gaat ervan uit dat alle 1000 klanten betalen. De kost per klant zakt van {euro(kostPerKlant)} naar
          {" "}{euro(kostPerKlant1000)}, omdat de vaste kosten dan over 1000 schouders worden verdeeld in plaats van {aantal}.
          Dát is de reden om klussen en klanten te blijven werven: elke klant erbij maakt de rest goedkoper.
        </p>
      </div>

      {/* Per klant */}
      <div style={kaart}>
        <h2 style={{ fontSize: 15, margin: "0 0 12px" }}>Per klant</h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5, minWidth: 720 }}>
            <thead>
              <tr style={{ textAlign: "left", color: "#9A9084", fontSize: 11.5, textTransform: "uppercase", letterSpacing: 0.5 }}>
                <th style={{ padding: "6px 8px 8px 0" }}>Klant</th>
                <th style={{ padding: "6px 8px 8px" }}>Betaalt</th>
                <th style={{ padding: "6px 8px 8px" }}>Foto&apos;s</th>
                <th style={{ padding: "6px 8px 8px", textAlign: "right" }}>Domein</th>
                <th style={{ padding: "6px 8px 8px", textAlign: "right" }}>Hosting</th>
                <th style={{ padding: "6px 8px 8px", textAlign: "right" }}>AI</th>
                <th style={{ padding: "6px 8px 8px", textAlign: "right" }}>Opslag+verkeer</th>
                <th style={{ padding: "6px 0 8px 8px", textAlign: "right" }}>Kost p/m</th>
              </tr>
            </thead>
            <tbody>
              {rijen.map((r) => (
                <tr key={r.id} style={{ borderTop: "1px solid #F4EEE3" }}>
                  <td style={{ padding: "9px 8px 9px 0", fontWeight: 700 }}>{r.naam}</td>
                  <td style={{ padding: "9px 8px" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: r.betaalt ? "#0f6e56" : "#9A9084" }}>{r.betaalt ? "● betaalt" : "○ gratis"}</span>
                  </td>
                  <td style={{ padding: "9px 8px" }}>{r.fotos}</td>
                  <td style={{ padding: "9px 8px", textAlign: "right", color: "#6B6258" }}>{euro(t.klant_domein)}</td>
                  <td style={{ padding: "9px 8px", textAlign: "right", color: "#6B6258" }}>{euro(t.klant_hosting)}</td>
                  <td style={{ padding: "9px 8px", textAlign: "right", color: "#6B6258" }}>{euro(aiPerKlant)}</td>
                  <td style={{ padding: "9px 8px", textAlign: "right", color: (r.opslag + r.verkeer) > 2 ? "#b91c1c" : "#6B6258" }}>{euro(r.opslag + r.verkeer)}</td>
                  <td style={{ padding: "9px 0 9px 8px", textAlign: "right", fontWeight: 700 }}>{euro(r.variabel)}</td>
                </tr>
              ))}
              {rijen.length === 0 && (
                <tr><td colSpan={8} style={{ padding: 20, textAlign: "center", color: "#9A9084" }}>Nog geen klanten in de app.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 12, color: "#9A9084", marginTop: 12, lineHeight: 1.6 }}>
          <strong>Aannames die je zelf kunt aanpassen</strong> via de adresbalk. Hosting per klant: {euro(t.klant_hosting)}
          {" "}(<code>?hosting=…</code>) — controleer dit met je hoster. AI bij vol gebruik: {t.projecten_dag} projecten +
          {" "}{t.reviews_dag} reviews per dag (<code>?projectendag=…&amp;reviewsdag=…</code>). Grotere Supabase-server bij
          1000 klanten: {euro(t.supabase_1000)} (<code>?supabase1000=…</code>). Gratis accounts: {gratisLijst.join(", ") || "geen"}
          {" "}(<code>?gratis=slug1,slug2</code>). Dollarprijzen zijn omgerekend naar euro.
        </p>
      </div>
    </WerkplekShell>
  );
}
