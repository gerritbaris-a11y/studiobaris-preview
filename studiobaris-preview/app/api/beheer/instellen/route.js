import { NextResponse } from "next/server";
import { klantInstellen } from "../../../../lib/server-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Daglimieten + abonnementsvorm per klant instellen.
export async function POST(req) {
  try {
    const { id, projectLimit, reviewLimit, abonnementsvorm } = await req.json();
    if (!id) return NextResponse.json({ ok: false, error: "id ontbreekt." }, { status: 400 });
    await klantInstellen(id, {
      projectLimit: projectLimit === "" || projectLimit == null ? null : Number(projectLimit),
      reviewLimit: reviewLimit === "" || reviewLimit == null ? null : Number(reviewLimit),
      abonnementsvorm: abonnementsvorm ?? null,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
