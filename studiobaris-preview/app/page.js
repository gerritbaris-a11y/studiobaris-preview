export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <main style={{ maxWidth: 640, margin: "12vh auto", padding: "0 24px", fontFamily: "system-ui, sans-serif" }}>
      <p style={{ fontSize: 13, letterSpacing: 2, textTransform: "uppercase", color: "#888" }}>StudioBaris</p>
      <h1 style={{ fontSize: 34, marginTop: 8 }}>Preview-platform</h1>
      <p style={{ marginTop: 16, color: "#555", fontSize: 17 }}>
        Elke klantpreview leeft op een eigen adres, bijvoorbeeld <code>/schildersbedrijf-jansen</code>.
      </p>
      <p style={{ marginTop: 20 }}>
        <a href="/intake" style={{ display: "inline-block", background: "#FF8300", color: "#fff", padding: "12px 22px", borderRadius: 10, fontWeight: 700 }}>
          Nieuwe prospect invoeren →
        </a>
      </p>
    </main>
  );
}
