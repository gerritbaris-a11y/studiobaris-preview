import { leesAfrekenToken, getAccount, APP_PRO_MAAND_EXCL } from "../../../lib/app-proef";
import { inclBtw, btwBedrag } from "../../../lib/mollie";
import ProFormulier from "./pro-formulier";

export const dynamic = "force-dynamic";
export const metadata = { title: "Doorgaan met StudioBaris-app Pro", robots: { index: false } };

const wrap = { maxWidth: 560, margin: "7vh auto", padding: "0 22px", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", color: "#1E2A35" };
const euro = (n) => "€ " + Number(n).toFixed(2).replace(".", ",");

export default async function ProPagina({ searchParams }) {
  const k = String((searchParams && searchParams.k) || "");
  const id = leesAfrekenToken(k);
  const account = id ? await getAccount(id) : null;

  if (!account) {
    return (
      <main style={wrap}>
        <h1 style={{ fontSize: 26, fontWeight: 800 }}>Deze link klopt niet</h1>
        <p style={{ color: "#5A6570" }}>Open de link opnieuw vanuit de app of je mail, of stuur ons een berichtje: info@studiobaris.nl.</p>
      </main>
    );
  }

  if (account.toegang === "pro" || account.toegang === "website") {
    return (
      <main style={wrap}>
        <h1 style={{ fontSize: 26, fontWeight: 800 }}>Je hebt Pro al</h1>
        <p style={{ color: "#5A6570" }}>Je hoeft niets te doen. Je kunt gewoon verder in de app.</p>
      </main>
    );
  }

  const einde = account.proef_eindigt_op ? new Date(account.proef_eindigt_op) : null;
  const proefLoopt = account.toegang === "proef" && einde && einde > new Date();
  const datum = einde ? einde.toLocaleDateString("nl-NL", { day: "numeric", month: "long", timeZone: "Europe/Amsterdam" }) : null;

  return (
    <main style={wrap}>
      {proefLoopt && (
        <div style={{ background: "#EEF5EA", padding: "10px 14px", borderRadius: 12, fontSize: 14, marginBottom: 18 }}>
          Je proef loopt tot en met {datum}. Je eerste betaalde maand gaat pas daarna in.
        </div>
      )}
      <h1 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 6px" }}>Doorgaan met Pro</h1>
      <p style={{ color: "#5A6570", marginTop: 0 }}>{account.name}</p>

      <div style={{ border: "1px solid #E6E0D4", borderRadius: 16, padding: "14px 16px", margin: "16px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800 }}>
          <span>StudioBaris-app Pro</span><span>{euro(inclBtw(APP_PRO_MAAND_EXCL))} per maand</span>
        </div>
        <div style={{ fontSize: 12.5, color: "#8A949E", marginTop: 2 }}>
          {euro(APP_PRO_MAAND_EXCL)} excl. + {euro(btwBedrag(APP_PRO_MAAND_EXCL))} btw (21%) · maandelijks opzegbaar
        </div>
        <div style={{ fontSize: 13.5, color: "#5A6570", marginTop: 10 }}>
          Je betaalt nu de eerste maand met iDEAL. Daarna schrijven we elke maand automatisch af; je krijgt de factuur 14 dagen van tevoren per mail.
        </div>
      </div>

      <ProFormulier k={k} email={account.email || ""} contact={account.contact_naam || ""} />
    </main>
  );
}
