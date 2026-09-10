import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Tijdelijke diagnoseroute: bevestigt dat MOLLIE_TEST_API_KEY bestaat, een
// test-sleutel is (begint met "test_") en daadwerkelijk werkt bij Mollie.
// Toont NOOIT de sleutel zelf. Na het uitzoeken weer verwijderen.
export async function GET() {
  const k = process.env.MOLLIE_TEST_API_KEY || "";
  if (!k) {
    return NextResponse.json({ aanwezig: false });
  }
  const vorm = k.startsWith("test_") ? "test-sleutel" : k.startsWith("live_") ? "LIVE-sleutel (!)" : "onbekend formaat";

  let mollieStatus = null;
  let mollieOk = null;
  try {
    const res = await fetch("https://api.mollie.com/v2/methods", {
      headers: { Authorization: `Bearer ${k}` },
      cache: "no-store",
    });
    mollieStatus = res.status;
    mollieOk = res.ok;
  } catch (e) {
    mollieStatus = "fetch-fout";
    mollieOk = false;
  }

  return NextResponse.json({ aanwezig: true, vorm, mollieStatus, mollieOk });
}
