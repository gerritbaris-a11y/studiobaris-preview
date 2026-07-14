// Stuurt een notificatie-mail naar StudioBaris met de previewlink.
// Best-effort: werkt zodra RESEND_API_KEY is ingesteld in Vercel. Zonder key
// wordt het stil overgeslagen (het formulier blijft dan gewoon werken).
export async function sendPreviewEmail({ naam, url, review }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { sent: false, reason: "geen RESEND_API_KEY" };

  const to = process.env.NOTIFY_EMAIL || "gerritbaris@gmail.com";
  const from = process.env.EMAIL_FROM || "StudioBaris <onboarding@resend.dev>";
  const r = review || {};
  const lijst = (arr) => (arr && arr.length ? "<ul>" + arr.map((x) => `<li>${x}</li>`).join("") + "</ul>" : "<p>—</p>");

  const html = `
    <h2>Nieuwe preview aangevraagd: ${naam}</h2>
    <p><strong>Bekijk de previewsite:</strong><br><a href="${url}">${url}</a></p>
    ${r.bron ? `<p><strong>Via:</strong> ${r.bron}</p>` : ""}
    ${r.interesse ? `<p><strong>Interesse:</strong> ${r.interesse}</p>` : ""}
    <hr>
    <h3>Controlepunten</h3>
    <p><strong>Let op:</strong></p>${lijst(r.let_op)}
    <p><strong>Ontbrekende gegevens:</strong></p>${lijst(r.ontbrekend)}
    <p><strong>Afgeleid uit de aangeleverde informatie:</strong></p>${lijst(r.afgeleid)}
  `;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject: `Nieuwe preview: ${naam}`, html }),
    });
    return { sent: res.ok };
  } catch {
    return { sent: false };
  }
}
