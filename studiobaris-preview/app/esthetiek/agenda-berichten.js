import { berichtenOverzicht } from "../../lib/agenda";
import { KLEUR, HEAD } from "../werkplek-stijl";

// Eén regel per salon met een agenda: hoeveel e-mails en WhatsApp-berichten er
// deze maand zijn verstuurd (WhatsApp tegen de bundel). Puur ter info: na de
// bundel schakelt het systeem zelf over op e-mail, er hoeft niets gecontroleerd.
export default async function AgendaBerichten() {
  let rijen = [];
  try { rijen = await berichtenOverzicht(); } catch { return null; }
  if (!rijen.length) return null;
  const th = { textAlign: "left", fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.4, color: KLEUR.label, padding: "6px 10px" };
  const td = { padding: "8px 10px", fontSize: 14, borderTop: `1px solid ${KLEUR.lijn}` };
  return (
    <div style={{ background: "#fff", border: `1px solid ${KLEUR.lijn}`, borderRadius: 16, padding: "14px 8px", marginBottom: 16 }}>
      <h2 style={{ fontFamily: HEAD, fontSize: 16, fontWeight: 800, margin: "0 10px 8px" }}>Agenda-berichten deze maand</h2>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><th style={th}>Salon</th><th style={th}>Afspraken</th><th style={th}>E-mail</th><th style={th}>WhatsApp</th></tr></thead>
          <tbody>
            {rijen.map((r) => (
              <tr key={r.company_id}>
                <td style={td}>{r.naam}{r.test_modus ? <span style={{ color: KLEUR.label, fontSize: 12 }}> · test</span> : null}</td>
                <td style={td}>{r.afspraken_maand}</td>
                <td style={td}>{r.email}</td>
                <td style={{ ...td, color: r.whatsapp >= r.bundel ? KLEUR.amber.tekst : undefined }}>
                  {r.whatsapp_aan ? `${r.whatsapp} van ${r.bundel}` : "uit"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
