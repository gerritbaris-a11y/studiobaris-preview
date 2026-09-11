import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// TIJDELIJKE diagnoseroute — direct verwijderen na gebruik. Geeft nooit de
// sleutel zelf terug, alleen het voorvoegsel (test_/live_) zodat we kunnen
// zien welke omgeving er actief staat zonder het geheim te lekken.
export async function GET() {
  const k = process.env.MOLLIE_API_KEY || "";
  const t = process.env.MOLLIE_TEST_API_KEY || "";
  return NextResponse.json({
    mollie_api_key_prefix: k ? k.slice(0, 5) : null,
    mollie_api_key_length: k.length,
    mollie_test_api_key_aanwezig: !!t,
    mollie_test_api_key_prefix: t ? t.slice(0, 5) : null,
    vercel_env: process.env.VERCEL_ENV || null,
  });
}
