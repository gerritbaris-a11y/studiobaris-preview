import { notFound } from "next/navigation";
import { afspraakOpToken, datumLang, tijdKort, euro } from "../../../lib/agenda";
import AnnuleerKnop from "./annuleer-knop";

export const dynamic = "force-dynamic";
export const metadata = { title: "Je afspraak", robots: { index: false, follow: false } };

// Link uit de bevestigingsmail: afspraak bekijken en (op tijd) annuleren.
export default async function AfspraakPagina({ params }) {
  if (!/^[0-9a-f]{20,64}$/.test(params.token)) notFound();
  const r = await afspraakOpToken(params.token);
  if (!r || !r.afspraak) notFound();
  const a = r.afspraak;
  const voorbij = new Date(a.start) < new Date();
  const magAnnuleren = !voorbij && a.status === "bevestigd"
    && new Date(a.start).getTime() - Date.now() > (r.annuleren_tot_uur || 24) * 3600 * 1000;
  const kaart = { background: "#fff", borderRadius: 18, padding: 22, maxWidth: 480, margin: "40px auto", boxShadow: "0 10px 30px rgba(26,43,61,.08)" };
  return (
    <div style={{ minHeight: "100vh", background: "#F7F5F1", fontFamily: "system-ui, -apple-system, sans-serif", color: "#1A2B3D", padding: "0 16px" }}>
      <div style={kaart}>
        <div style={{ fontSize: 13, color: "#6F7A85" }}>{r.bedrijf}</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: "4px 0 14px" }}>
          {a.status === "geannuleerd" ? "Deze afspraak is geannuleerd" : voorbij ? "Deze afspraak is geweest" : "Je afspraak"}
        </h1>
        <div style={{ fontSize: 16, lineHeight: 1.6 }}>
          <strong>{a.behandeling_naam}</strong><br />
          {datumLang(a.start)} om {tijdKort(a.start)}<br />
          {a.prijs != null && <span style={{ color: "#4A5560" }}>{euro(a.prijs)}</span>}
        </div>
        {a.test && <p style={{ fontSize: 13, color: "#8A6417", background: "#F7EBD1", padding: "8px 10px", borderRadius: 8 }}>Dit is een testboeking op een voorbeeldsite.</p>}
        {magAnnuleren ? <AnnuleerKnop token={params.token} />
          : a.status === "bevestigd" && !voorbij
            ? <p style={{ fontSize: 14, color: "#4A5560" }}>Online annuleren kan tot {r.annuleren_tot_uur || 24} uur van tevoren. Bel de salon even als je niet kunt komen.</p>
            : null}
      </div>
    </div>
  );
}
