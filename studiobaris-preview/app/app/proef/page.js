import { getInstelling, testcodeKlopt } from "../../../lib/app-proef";
import ProefFormulier from "./proef-formulier";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Probeer de StudioBaris-app 7 dagen gratis",
  robots: { index: false }, // tot de lancering niet in Google
};

const wrap = { maxWidth: 560, margin: "7vh auto", padding: "0 22px", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", color: "#1E2A35" };

export default async function ProefPagina({ searchParams }) {
  const test = String((searchParams && searchParams.test) || "");
  const instelling = await getInstelling();
  const open = instelling.open || testcodeKlopt(test);

  if (!open) {
    return (
      <main style={wrap}>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>Binnenkort beschikbaar</h1>
        <p style={{ color: "#5A6570" }}>
          De StudioBaris-app is binnenkort ook los te proberen. Wil je nu al meer weten? Mail naar{" "}
          <a href="mailto:info@studiobaris.nl">info@studiobaris.nl</a> of bel 06 16 73 21 05.
        </p>
      </main>
    );
  }

  return (
    <main style={wrap}>
      {!instelling.open && (
        <div style={{ background: "#FFF4D6", color: "#7A5A00", padding: "8px 12px", borderRadius: 10, fontSize: 13, marginBottom: 18 }}>
          Testmodus: deze pagina is nog niet openbaar.
        </div>
      )}
      <h1 style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.2, margin: "0 0 10px" }}>
        Probeer de StudioBaris-app 7 dagen gratis
      </h1>
      <p style={{ color: "#5A6570", fontSize: 16, marginTop: 0 }}>
        Maak een foto van je klus, vertel wat je hebt gedaan, en hij staat op je website. Geen betaalgegevens nodig, er loopt niets automatisch door.
      </p>
      <ProefFormulier test={instelling.open ? "" : test} />
      <p style={{ color: "#8A949E", fontSize: 13, marginTop: 22 }}>
        Daarna € 14,95 per maand excl. btw, maandelijks opzegbaar. Werkt met elke WordPress-website.
      </p>
    </main>
  );
}
