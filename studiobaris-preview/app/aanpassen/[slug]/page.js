import { leesSessie } from "../../../lib/auth";
import { laadVoorAanpassen, magAanpassen, FONTS } from "../../../lib/aanpassen";
import { getAlleVakfotos } from "../../../lib/vakfotos";
import { nicheKey } from "../../../lib/preview-assets";
import { KLEUR, HEAD, BODY, FONT_LINK } from "../../werkplek-stijl";
import AanpassenClient from "./aanpassen-client";

export const dynamic = "force-dynamic";

function Melding({ titel, tekst }) {
  return (
    <main style={{ maxWidth: 560, margin: "14vh auto", padding: "0 24px", fontFamily: BODY, textAlign: "center", color: KLEUR.inkt }}>
      <h1 style={{ fontFamily: HEAD, fontSize: 24 }}>{titel}</h1>
      <p style={{ color: KLEUR.gedempt }}>{tekst}</p>
      <p><a href="/klanten" style={{ color: KLEUR.klei, fontWeight: 700 }}>Terug naar Mijn previews</a></p>
    </main>
  );
}

export default async function AanpassenPagina({ params }) {
  const p = await params;
  const sessie = leesSessie();
  const rij = await laadVoorAanpassen(p.slug).catch(() => null);
  if (!rij) return <Melding titel="Preview niet gevonden" tekst="Deze preview bestaat niet (meer)." />;
  if (!magAanpassen(sessie, rij)) {
    return <Melding titel="Geen toegang" tekst="Alleen beheer of degene die deze preview maakte, kan hem aanpassen." />;
  }

  const vakfotos = await getAlleVakfotos().catch(() => []);
  const branche = (rij.content && rij.content.bedrijf && rij.content.bedrijf.branche) || "";

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={FONT_LINK} />
      <AanpassenClient
        slug={rij.slug}
        naam={rij.naam || rij.slug}
        live={rij.content || {}}
        werk={rij.werk || null}
        werkDoor={rij.werk_door || ""}
        werkOp={rij.werk_op || ""}
        versie={rij.versie || 1}
        conceptAanwezig={!!rij.concept_aanwezig}
        ik={sessie.naam}
        fonts={FONTS}
        vakfotos={vakfotos.filter((v) => (v.fotos || []).length > 0)}
        eigenVak={nicheKey(branche)}
      />
    </>
  );
}
