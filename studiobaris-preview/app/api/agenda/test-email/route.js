import { NextResponse } from "next/server";
import { zetTestEmail, isUuid } from "../../../../lib/agenda";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Testmodus op de preview: de prospect kiest zelf op welk e-mailadres hij de
// meldingen van testboekingen krijgt. Werkt alleen zolang de agenda in
// testmodus staat (dus nooit op een live klantagenda).
export async function POST(req) {
  const b = await req.json().catch(() => null);
  const email = String((b && b.email) || "").trim();
  if (!b || !isUuid(b.c) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "Vul een geldig e-mailadres in." }, { status: 400 });
  }
  try {
    const r = await zetTestEmail(b.c, email);
    if (!r) return NextResponse.json({ ok: false, error: "Deze agenda staat niet in testmodus." }, { status: 409 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Opslaan mislukt." }, { status: 500 });
  }
}
