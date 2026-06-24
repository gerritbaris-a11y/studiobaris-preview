import { getBetaalinfo } from "../../../lib/server-data";
import AkkoordKnop from "./akkoord-knop";

export const dynamic = "force-dynamic";

function euro(v) {
  const n = Number(v);
  if (!n) return null;
  return "€ " + n.toFixed(2).replace(".", ",");
}

const wrap = { maxWidth: 620, margin: "8vh auto", padding: "0 24px", fontFamily: "system-ui, sans-serif", color: "#222" };

export default async function AkkoordPage({ params, searchParams }) {
  const info = await getBetaalinfo(params.slug);

  if (!info) {
    return (
      <main style={wrap}>
        <h1 style={{ fontSize: 26 }}>Niet gevonden</h1>
        <p style={{ color: "#555" }}>Deze akkoordlink lijkt niet (meer) te kloppen. Neem contact met ons op.</p>
      </main>
    );
  }

  const naam = info.company_name || params.slug;
  const bedrag = euro(info.maandbedrag);
  const status = info.betaal_status;
  const netBetaald = searchParams && searchParams.status === "klaar";

  // Al actief: machtiging gelukt.
  if (status === "actief") {
    return (
      <main style={{ ...wrap, textAlign: "center" }}>
        <div style={{ fontSize: 44 }}>✅</div>
        <h1 style={{ fontSize: 28 }}>Bedankt, {naam}!</h1>
        <p style={{ color: "#555", fontSize: 17, lineHeight: 1.6, marginTop: 12 }}>
          Je machtiging is actief. We gaan nu je domein en hosting in orde maken en je website live zetten.
          {bedrag ? ` De maandelijkse vergoeding van ${bedrag} wordt vanaf volgende maand automatisch geïncasseerd.` : ""}
        </p>
      </main>
    );
  }

  // Net terug van de betaalpagina, webhook nog niet verwerkt.
  if (netBetaald) {
    return (
      <main style={{ ...wrap, textAlign: "center" }}>
        <div style={{ fontSize: 44 }}>⏳</div>
        <h1 style={{ fontSize: 28 }}>We verwerken je betaling…</h1>
        <p style={{ color: "#555", fontSize: 17, lineHeight: 1.6, marginTop: 12 }}>
          Bedankt! Zodra de betaling is bevestigd, staat je machtiging klaar en gaan wij aan de slag.
          Je hoeft verder niets te doen.
        </p>
      </main>
    );
  }

  return (
    <main style={wrap}>
      <p style={{ fontSize: 13, letterSpacing: 2, textTransform: "uppercase", color: "#888" }}>StudioBaris · Akkoord</p>
      <h1 style={{ fontSize: 28, margin: "6px 0 4px" }}>Akkoord & maandabonnement</h1>
      <p style={{ color: "#555", marginBottom: 18 }}>Voor <strong>{naam}</strong></p>

      {!bedrag ? (
        <div style={{ background: "#fff7ed", border: "1px solid #fcd9a8", borderRadius: 12, padding: "16px 18px" }}>
          Er is voor jou nog geen maandbedrag ingesteld. Neem even contact met ons op, dan zetten we het klaar.
        </div>
      ) : (
        <>
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "18px 20px" }}>
            <div style={{ fontSize: 15, color: "#444", lineHeight: 1.6 }}>
              Met dit akkoord ga je akkoord dat StudioBaris je website bouwt, het domein en de hosting
              verzorgt, en hiervoor maandelijks een vast bedrag incasseert. Je geeft daarvoor een
              automatische incasso (SEPA-machtiging) af. Je kunt de incasso altijd stopzetten zoals
              wettelijk toegestaan; opzeggen kan per maand.
            </div>
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ color: "#666" }}>Maandelijkse vergoeding</span>
              <strong style={{ fontSize: 24 }}>{bedrag}<span style={{ fontSize: 14, fontWeight: 400, color: "#888" }}> / maand</span></strong>
            </div>
          </div>

          <p style={{ fontSize: 13, color: "#777", margin: "14px 0 18px" }}>
            Je betaalt zo eenmalig de eerste maand; daarmee geef je meteen de machtiging af.
            Daarna wordt het bedrag elke maand automatisch afgeschreven.
          </p>

          <AkkoordKnop slug={params.slug} />
        </>
      )}
    </main>
  );
}
