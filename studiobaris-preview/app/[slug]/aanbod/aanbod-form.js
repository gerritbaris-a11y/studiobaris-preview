"use client";

// Afsluiting van de aanbodpagina: nummer achterlaten, wij bellen terug.
// Eén veld (telefoon, vooraf ingevuld als we een echt nummer hebben) en een
// voorkeursmoment. Twee knoppen: "Ja, ik wil deze website" (starten) of
// "Ik heb eerst een vraag". Staat de akkoordlink al klaar, dan kan de
// prospect ook meteen zelf akkoord geven.

import { useState } from "react";

const MOMENTEN = ["Zo snel mogelijk", "Ochtend", "Middag", "Na 18:00"];

export default function AanbodForm({ slug, bedrijf, telefoon, persoon, telToon, tel, wa, akkoordUrl }) {
  const [nummer, setNummer] = useState(telefoon || "");
  const [moment, setMoment] = useState(MOMENTEN[0]);
  const [bezig, setBezig] = useState("");
  const [klaar, setKlaar] = useState("");
  const [fout, setFout] = useState("");

  async function verstuur(soort) {
    setFout("");
    const cijfers = nummer.replace(/[^0-9]/g, "");
    if (cijfers.length < 9) { setFout("Vul je telefoonnummer in, dan bellen we je."); return; }
    setBezig(soort);
    try {
      const res = await fetch("/api/preview/aanvraag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, soort, telefoon: nummer, moment }),
      });
      const j = await res.json().catch(() => ({}));
      if (j.ok || j.code === "te_vaak") { setKlaar(soort); }
      else setFout(j.error || `Dat lukte even niet. Bel of app ons op ${telToon}.`);
    } catch {
      setFout(`Dat lukte even niet. Bel of app ons op ${telToon}.`);
    }
    setBezig("");
  }

  const css = `
    .sbf{background:#1A2B3D;color:#fff;border-radius:22px;padding:22px 18px}
    .sbf h2{color:#fff;margin:0 0 6px}
    .sbf p{margin:0;color:rgba(255,255,255,.85);font-size:15.5px}
    .sbf-wie{display:flex;gap:12px;align-items:center;margin-bottom:16px}
    .sbf-wie img{width:56px;height:56px;border-radius:50%;flex:none;object-fit:cover;background:#F7F4EE}
    .sbf label,.sbf-lbl{display:block;font-weight:700;font-size:14px;margin:16px 0 6px}
    .sbf input{width:100%;height:52px;border-radius:12px;border:0;padding:0 14px;font:inherit;font-size:17px;color:#1A2B3D;background:#fff}
    .sbf-chips{display:flex;flex-wrap:wrap;gap:8px}
    .sbf-chip{min-height:42px;padding:0 14px;border-radius:999px;border:1.5px solid rgba(255,255,255,.4);background:transparent;color:#fff;font:inherit;font-size:14.5px;font-weight:600;cursor:pointer}
    .sbf-chip[aria-pressed="true"]{background:#C79A56;border-color:#C79A56;color:#1A2B3D}
    .sbf-ja{display:flex;align-items:center;justify-content:center;width:100%;min-height:56px;margin-top:20px;border-radius:999px;border:0;background:#C79A56;color:#1A2B3D;font:inherit;font-size:17px;font-weight:800;cursor:pointer}
    .sbf-vraag{display:block;width:100%;margin-top:10px;min-height:48px;border-radius:999px;border:1.5px solid rgba(255,255,255,.45);background:transparent;color:#fff;font:inherit;font-weight:700;font-size:15.5px;cursor:pointer}
    .sbf button:disabled{opacity:.6;cursor:default}
    .sbf-fout{margin-top:12px;background:#fff;color:#B42318;border-radius:10px;padding:10px 12px;font-size:14.5px}
    .sbf-klein{font-size:13.5px;color:rgba(255,255,255,.7);margin-top:12px;text-align:center}
    .sbf-klein a{color:#fff;font-weight:700}
    .sbf-akkoord{display:block;text-align:center;margin-top:14px;color:#fff;font-weight:700;font-size:15px}
  `;

  if (klaar) {
    return (
      <div className="sbf" role="status">
        <style dangerouslySetInnerHTML={{ __html: css }} />
        <div className="sbf-wie">
          <img src={persoon.foto} alt="" width="56" height="56" />
          <div><strong>{persoon.naam} · StudioBaris</strong></div>
        </div>
        <h2>{klaar === "starten" ? "Top, we gaan voor je aan de slag!" : "Helder, we bellen je!"}</h2>
        <p>
          We bellen je op <strong>{nummer}</strong>{moment === MOMENTEN[0] ? " zo snel mogelijk" : ` (${moment.toLowerCase()})`}.
          {klaar === "starten" ? " Dan nemen we samen de laatste dingen door. Je zit nergens aan vast tot je zelf akkoord geeft." : ""}
        </p>
        <p className="sbf-klein">Liever zelf even bellen? <a href={`tel:${tel}`}>{telToon}</a> · <a href={wa} target="_blank" rel="noopener">WhatsApp</a></p>
        <a className="sbf-akkoord" href={`/${slug}`}>&larr; Terug naar je website</a>
      </div>
    );
  }

  return (
    <div className="sbf">
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="sbf-wie">
        <img src={persoon.foto} alt="" width="56" height="56" />
        <div>
          <strong>{persoon.naam} · StudioBaris</strong>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,.75)" }}>Ik bel je terug</div>
        </div>
      </div>
      <h2>Zullen we beginnen?</h2>
      <p>Laat je nummer achter. We bellen je om de laatste dingen voor {bedrijf} door te nemen. Je zit nergens aan vast tot je zelf akkoord geeft.</p>

      <label htmlFor="sbf-tel">Je telefoonnummer</label>
      <input id="sbf-tel" type="tel" inputMode="tel" autoComplete="tel" value={nummer} onChange={(e) => setNummer(e.target.value)} placeholder="06 ..." />

      <div className="sbf-lbl" aria-hidden="true">Wanneer kunnen we je het best bellen?</div>
      <div className="sbf-chips" role="group" aria-label="Wanneer kunnen we je het best bellen?">
        {MOMENTEN.map((m) => (
          <button key={m} type="button" className="sbf-chip" aria-pressed={moment === m} onClick={() => setMoment(m)}>{m}</button>
        ))}
      </div>

      {fout && <div className="sbf-fout" role="alert">{fout}</div>}

      <button type="button" className="sbf-ja" onClick={() => verstuur("starten")} disabled={!!bezig}>
        {bezig === "starten" ? "Even bezig…" : "Ja, ik wil deze website"}
      </button>
      <button type="button" className="sbf-vraag" onClick={() => verstuur("vraag")} disabled={!!bezig}>
        {bezig === "vraag" ? "Even bezig…" : "Ik heb eerst een vraag"}
      </button>

      {akkoordUrl && (
        <a className="sbf-akkoord" href={akkoordUrl}>Liever meteen zelf akkoord geven? &rarr;</a>
      )}
      <p className="sbf-klein">Of bel of app zelf: <a href={`tel:${tel}`}>{telToon}</a> · <a href={wa} target="_blank" rel="noopener">WhatsApp</a></p>
    </div>
  );
}
