import { getBetaalinfo } from "../../../lib/server-data";
import { inclBtw, btwBedrag } from "../../../lib/mollie";
import RestKnop from "./rest-knop";

export const dynamic = "force-dynamic";

const wrap = { maxWidth: 640, margin: "8vh auto", padding: "0 24px", fontFamily: "system-ui, sans-serif", color: "#222" };

function euro(n) {
  return "€ " + Number(n || 0).toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function RestbetalingPage({ params, searchParams }) {
  const p = await params;
  const sp = (await searchParams) || {};
  const info = await getBetaalinfo(p.slug);

  if (!info) {
    return (
      <main style={{ ...wrap, textAlign: "center" }}>
        <h1 style={{ fontSize: 26 }}>Niet gevonden</h1>
        <p style={{ color: "#666" }}>Deze betaallink klopt niet. Vraag even een nieuwe op.</p>
      </main>
    );
  }

  const naam = info.company_name || p.slug;
  const restExcl = Number(info.restbedrag) || 0;
  const websiteExcl = Number(info.websiteprijs) || 0;
  const aanbExcl = Number(info.aanbetaling) || 0;

  if (info.rest_status === "betaald") {
    return (
      <main style={{ ...wrap, textAlign: "center" }}>
        <div style={{ fontSize: 44 }}>✅</div>
        <h1 style={{ fontSize: 28 }}>Bedankt, {naam}!</h1>
        <p style={{ color: "#555", fontSize: 17, lineHeight: 1.6, marginTop: 12 }}>
          Het restbedrag is voldaan. Je website is helemaal van jou. Vanaf nu loopt alleen nog de maandelijkse
          vergoeding voor hosting, onderhoud en de app.
        </p>
      </main>
    );
  }

  if (sp.status === "klaar") {
    return (
      <main style={{ ...wrap, textAlign: "center" }}>
        <div style={{ fontSize: 44 }}>⏳</div>
        <h1 style={{ fontSize: 28 }}>We verwerken je betaling</h1>
        <p style={{ color: "#555", fontSize: 17, lineHeight: 1.6, marginTop: 12 }}>
          Bedankt! Zodra de bank het heeft doorgegeven zie je hier de bevestiging. Dat duurt meestal een paar seconden.
          Je kunt deze pagina zo verversen.
        </p>
      </main>
    );
  }

  if (restExcl <= 0) {
    return (
      <main style={{ ...wrap, textAlign: "center" }}>
        <h1 style={{ fontSize: 26 }}>Nog niets te betalen</h1>
        <p style={{ color: "#666" }}>Er staat voor deze klant geen restbedrag open.</p>
      </main>
    );
  }

  return (
    <main style={wrap}>
      <p style={{ fontSize: 13, letterSpacing: 2, textTransform: "uppercase", color: "#888" }}>StudioBaris · Oplevering</p>
      <h1 style={{ fontSize: 30, margin: "6px 0 4px" }}>Je website staat live</h1>
      <p style={{ color: "#555", fontSize: 16, marginBottom: 22 }}>Voor <strong>{naam}</strong></p>

      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "18px 20px" }}>
        <p style={{ margin: "0 0 16px", color: "#444", fontSize: 15, lineHeight: 1.65 }}>
          Je site is opgeleverd en je app staat klaar. Hiermee betaal je de tweede helft van je website. Daarna is hij
          helemaal van jou en loopt alleen nog de maandelijkse vergoeding door.
        </p>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingTop: 14, borderTop: "1px solid #f0f0f0" }}>
          <span style={{ color: "#666" }}>Je website, totaal</span>
          <div style={{ textAlign: "right" }}>
            <strong style={{ fontSize: 18 }}>{euro(inclBtw(websiteExcl))}</strong>
            <div style={{ fontSize: 12, color: "#888" }}>incl. btw</div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, color: "#0f6e56" }}>
          <span>Al betaald bij akkoord</span>
          <strong>− {euro(inclBtw(aanbExcl))}</strong>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: 14, background: "#fff7ed", border: "1px solid #fcd9a8", borderRadius: 10, padding: "14px 16px" }}>
          <span style={{ color: "#7c4a03", fontWeight: 700 }}>Je betaalt nu</span>
          <div style={{ textAlign: "right" }}>
            <strong style={{ fontSize: 24, color: "#7c4a03" }}>{euro(inclBtw(restExcl))}</strong>
            <div style={{ fontSize: 12, color: "#a35400" }}>incl. btw</div>
            <div style={{ fontSize: 12, color: "#a35400" }}>
              {euro(restExcl)} excl. + {euro(btwBedrag(restExcl))} btw (21%)
            </div>
          </div>
        </div>
      </div>

      <p style={{ fontSize: 13, color: "#777", margin: "14px 0 18px" }}>
        Eenmalige betaling met iDEAL. Je maandelijkse incasso verandert hier niet door.
      </p>

      <RestKnop slug={p.slug} />
    </main>
  );
}
