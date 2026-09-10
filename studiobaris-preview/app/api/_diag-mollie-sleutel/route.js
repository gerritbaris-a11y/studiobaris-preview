import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Tijdelijke diagnoseroute (zelfde patroon als eerder bij Drive-backup):
// toont NOOIT de sleutel zelf, alleen of hij bestaat en of het een test- of
// live-sleutel is (Mollie-sleutels beginnen met "test_" of "live_"). Na het
// uitzoeken weer verwijderen.
export async function GET() {
  const k = process.env.MOLLIE_API_KEY || "";
  const t = process.env.MOLLIE_TEST_API_KEY || "";
  const info = (v) => (!v ? "ontbreekt" : v.startsWith("test_") ? "test-sleutel" : v.startsWith("live_") ? "LIVE-sleutel" : "onbekend formaat");
  return NextResponse.json({
    MOLLIE_API_KEY: info(k),
    MOLLIE_TEST_API_KEY: info(t),
  });
}
