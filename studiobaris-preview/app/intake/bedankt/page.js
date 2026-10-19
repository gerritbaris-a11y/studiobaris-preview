// Bedanktpagina na een publieke previewaanvraag (formulier op /intake).
// Een eigen adres, zodat Google een aanvraag kan meten als bezoek aan
// /intake/bedankt. Publiek: /intake staat niet in de middleware-matcher.

import BedanktMeting from "./meting";

export const metadata = {
  title: "Bedankt voor je aanvraag | StudioBaris",
  robots: { index: false, follow: false },
};

const HUISSTIJL = {
  achtergrond: "#F6F7F8",
  donker: "#16202E",
  body: "#4A5750",
  accentDonker: "#CF8531",
};
const FONT_HREF = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap";
const FONT = "'Plus Jakarta Sans', system-ui, sans-serif";

export default function IntakeBedanktPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `@import url('${FONT_HREF}');` }} />
      <BedanktMeting />
      <main style={{ minHeight: "100vh", background: HUISSTIJL.achtergrond, margin: 0, fontFamily: FONT }}>
        <header style={{ background: "#fff", borderBottom: "1px solid #E7EAED" }}>
          <div style={{ maxWidth: 720, margin: "0 auto", padding: "16px 24px" }}>
            <a href="https://studiobaris.nl" style={{ display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: HUISSTIJL.accentDonker, display: "inline-block" }} />
              <span style={{ fontWeight: 800, fontSize: 19, color: HUISSTIJL.donker, letterSpacing: -0.3 }}>StudioBaris</span>
            </a>
          </div>
        </header>
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "12vh 24px 24px", textAlign: "center", color: HUISSTIJL.body }}>
          <div style={{ fontSize: 44, marginBottom: 8 }}>✅</div>
          <h1 style={{ fontSize: 30, fontWeight: 800, color: HUISSTIJL.donker }}>Bedankt!</h1>
          <p style={{ marginTop: 14, fontSize: 18, lineHeight: 1.6 }}>
            We hebben je gegevens goed ontvangen en gaan er meteen mee aan de slag. We nemen zo snel mogelijk contact met je op.
          </p>
        </div>
      </main>
    </>
  );
}
