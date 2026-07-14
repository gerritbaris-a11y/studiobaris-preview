import { leesSessie } from "../../lib/auth";
import { getVandaag } from "../../lib/server-data";
import VandaagClient from "./vandaag-client";
import { FONT_LINK } from "../werkplek-stijl";

export const dynamic = "force-dynamic";

export default async function Vandaag() {
  const sessie = leesSessie();
  const beheer = sessie?.rol === "beheer";
  // Verkopers zien alleen hun eigen werk; beheer ziet alles.
  const taken = await getVandaag(beheer ? "" : sessie?.naam || "");

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={FONT_LINK} />
      <VandaagClient taken={taken} naam={sessie?.naam || "collega"} beheer={beheer} />
    </>
  );
}
