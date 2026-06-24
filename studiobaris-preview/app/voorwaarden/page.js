export const dynamic = "force-dynamic";

export const metadata = { title: "Algemene voorwaarden — StudioBaris" };

// Vul hieronder de definitieve algemene voorwaarden in (tekst aangeleverd door StudioBaris).
const VOORWAARDEN = `
[ Hier komen de algemene voorwaarden van StudioBaris.

Lever de tekst aan, dan zet ik die hier netjes neer. Denk aan: dienst & looptijd,
maandelijkse vergoeding en automatische incasso (SEPA), opzegtermijn, eigendom van
domein/website, aansprakelijkheid, en contactgegevens. ]
`;

export default function VoorwaardenPage() {
  return (
    <main style={{ maxWidth: 760, margin: "6vh auto", padding: "0 24px", fontFamily: "system-ui, sans-serif", color: "#222", lineHeight: 1.7 }}>
      <p style={{ fontSize: 13, letterSpacing: 2, textTransform: "uppercase", color: "#888" }}>StudioBaris</p>
      <h1 style={{ fontSize: 30, margin: "6px 0 18px" }}>Algemene voorwaarden</h1>
      <div style={{ whiteSpace: "pre-wrap", fontSize: 15, color: "#333" }}>{VOORWAARDEN.trim()}</div>
    </main>
  );
}
