import { leesAfrekenToken, getAccount } from "../../../../lib/app-proef";
import { POST as webhook } from "../../../api/mollie/webhook/route";

export const dynamic = "force-dynamic";
export const metadata = { title: "StudioBaris-app Pro", robots: { index: false } };

const wrap = { maxWidth: 560, margin: "8vh auto", padding: "0 22px", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", color: "#1E2A35" };

// Terugkeerpagina na iDEAL. De webhook kan een paar seconden later komen dan
// de klant hier is; daarom bij "nog niet verwerkt" een vriendelijke tussenstand.
export default async function ProKlaar({ searchParams }) {
  const id = leesAfrekenToken(String((searchParams && searchParams.k) || ""));
  // Alleen op een testversie: de webhook van Mollie komt daar niet aan, dus
  // verwerken we de betaling hier. De webhook haalt de status zelf bij Mollie
  // op en is idempotent; in productie gebeurt dit nooit.
  const pid = String((searchParams && searchParams.pid) || "");
  if (id && process.env.VERCEL_ENV !== "production" && /^tr_[A-Za-z0-9]+$/.test(pid)) {
    const form = new FormData();
    form.set("id", pid);
    await webhook(new Request("http://intern/api/mollie/webhook", { method: "POST", body: form })).catch(() => {});
  }
  const account = id ? await getAccount(id) : null;
  const pro = account && account.toegang === "pro";

  return (
    <main style={wrap}>
      {pro ? (
        <>
          <h1 style={{ fontSize: 28, fontWeight: 800 }}>Pro staat aan</h1>
          <p style={{ color: "#5A6570" }}>
            Bedankt! Je factuur is onderweg naar je mail. In de app kun je gewoon verder: je hoeft niets opnieuw te installeren.
          </p>
        </>
      ) : (
        <>
          <h1 style={{ fontSize: 28, fontWeight: 800 }}>Bijna klaar</h1>
          <p style={{ color: "#5A6570" }}>
            We verwerken je betaling. Dat duurt meestal een paar seconden; ververs deze pagina zo. Ging de betaling niet door? Dan kun je het via dezelfde link opnieuw proberen.
          </p>
        </>
      )}
    </main>
  );
}
