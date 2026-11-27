import { NextResponse } from "next/server";
import {
  getInstelling, testcodeKlopt, startProef, stuurMail, mailGestuurd,
  normDomein, geldigDomein, geldigEmail,
} from "../../../../lib/app-proef";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FOUT = {
  onvolledig: "Vul je bedrijfsnaam, e-mailadres en website in.",
  bestaat_al: "Voor dit e-mailadres of deze website loopt al een account of proef. Stuur ons een berichtje, dan helpen we je verder.",
};

// Openbaar: een vakman start zelf een proef van 7 dagen.
// Werkt alleen als de schakelaar in het dashboard aan staat, of met de
// geheime testcode (alleen voor Levi en Gerrit, vóór de lancering).
export async function POST(req) {
  try {
    const b = await req.json().catch(() => ({}));
    const instelling = await getInstelling();
    if (!instelling.open && !testcodeKlopt(String(b.test || ""))) {
      return NextResponse.json({ ok: false, error: "De proef is nog niet beschikbaar." }, { status: 403 });
    }

    // Honeypot tegen spam-bots: dit veld is onzichtbaar voor mensen.
    if (b.website_url_extra) return NextResponse.json({ ok: true });

    const bedrijf = String(b.bedrijf || "").trim().slice(0, 120);
    const naam = String(b.naam || "").trim().slice(0, 120);
    const email = String(b.email || "").trim().toLowerCase();
    const domein = normDomein(b.website);

    if (!bedrijf || !geldigEmail(email) || !geldigDomein(domein)) {
      return NextResponse.json({ ok: false, error: "Controleer je bedrijfsnaam, e-mailadres en website." }, { status: 400 });
    }
    if (b.akkoord !== true) {
      return NextResponse.json({ ok: false, error: "Ga eerst akkoord met de voorwaarden." }, { status: 400 });
    }

    const r = await startProef({ naam, bedrijf, email, domein });
    if (!r || r.ok !== true) {
      const code = r && r.fout;
      return NextResponse.json({ ok: false, error: FOUT[code] || "Er ging iets mis. Probeer het later opnieuw." }, { status: code ? 409 : 500 });
    }

    const mail = await stuurMail("welkom", {
      company_id: r.company_id, email, contact: naam,
      proef_eindigt_op: r.proef_eindigt_op, login_token: r.login_token,
    });
    if (mail.sent) await mailGestuurd(r.company_id, "welkom");

    return NextResponse.json({ ok: true, proef_eindigt_op: r.proef_eindigt_op, mail: !!mail.sent });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Er ging iets mis. Probeer het later opnieuw." }, { status: 500 });
  }
}
