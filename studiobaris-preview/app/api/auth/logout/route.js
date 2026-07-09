import { NextResponse } from "next/server";
import { wisSessie } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

function uitloggen(req) {
  wisSessie();
  const url = new URL("/login", req.url);
  return NextResponse.redirect(url, { status: 303 });
}

export async function GET(req) {
  return uitloggen(req);
}
export async function POST(req) {
  return uitloggen(req);
}
