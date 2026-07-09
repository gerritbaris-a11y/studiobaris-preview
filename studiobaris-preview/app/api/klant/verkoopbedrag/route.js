import { NextResponse } from "next/server";
import { setVerkoopbedrag } from "../../../../lib/server-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Slaat het eenmalige verkoopbedrag (websiteprijs) op bij een klant.
export async function POST(req) {
  try {
    const body = await req.json();
    const slug = body.slug;
    if (!slug) return NextResponse.json({ ok: false, error: "slug ontbreekt." }, { status: 400 });

    let bedrag = null;
    if (body.bedrag !== undefined && body.bedrag !== "") {
      const n = Number(String(body.bedrag).replace(",", "."));
      if (!Number.isNaN(n)) bedrag = n;
    }

    await setVerkoopbedrag(slug, bedrag);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
