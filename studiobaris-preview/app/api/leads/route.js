import { NextResponse } from "next/server";
import { updateLead } from "../../../lib/server-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSSEN = ["nieuw", "opgepakt", "benaderd", "preview", "klant", "afgewezen"];

export async function POST(req) {
  try {
    const body = await req.json();
    const id = String(body.id || "");
    if (!id) return NextResponse.json({ ok: false, error: "id ontbreekt." }, { status: 400 });

    const fields = {};
    if (typeof body.status === "string") {
      if (!STATUSSEN.includes(body.status)) {
        return NextResponse.json({ ok: false, error: "Onbekende status." }, { status: 400 });
      }
      fields.status = body.status;
    }
    if (body.owner !== undefined) {
      fields.owner = body.owner ? String(body.owner) : null;
    }
    if (body.notitie !== undefined) {
      fields.notitie = body.notitie ? String(body.notitie) : null;
    }

    if (Object.keys(fields).length === 0) {
      return NextResponse.json({ ok: false, error: "Niets om bij te werken." }, { status: 400 });
    }

    const res = await updateLead(id, fields);
    if (!res) return NextResponse.json({ ok: false, error: "Bijwerken mislukt." }, { status: 500 });
    return NextResponse.json({ ok: true, lead: Array.isArray(res) ? res[0] : res });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
