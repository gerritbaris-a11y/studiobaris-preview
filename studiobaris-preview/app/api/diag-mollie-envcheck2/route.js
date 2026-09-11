import { NextResponse } from "next/server";
import { actieveSleutelSoort } from "../../../lib/mollie";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// TIJDELIJK — direct verwijderen na gebruik. Bevestigt dat apiKey() nu
// de testsleutel pakt op Preview, ook al staat MOLLIE_API_KEY zelf op live.
export async function GET() {
  return NextResponse.json({
    actieve_sleutel: actieveSleutelSoort(),
    vercel_env: process.env.VERCEL_ENV || null,
  });
}
