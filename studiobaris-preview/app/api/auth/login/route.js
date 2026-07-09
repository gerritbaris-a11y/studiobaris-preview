import { NextResponse } from "next/server";
import { getUserByNaam, setUserWachtwoord } from "../../../../lib/server-data";
import { hashWachtwoord, checkWachtwoord, zetSessie } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const { naam, wachtwoord } = await req.json();
    if (!naam || !wachtwoord) {
      return NextResponse.json({ ok: false, error: "Naam en wachtwoord vereist." }, { status: 400 });
    }

    const user = await getUserByNaam(naam);
    if (!user) {
      return NextResponse.json({ ok: false, error: "Onbekende gebruiker." }, { status: 404 });
    }

    if (!user.password_hash) {
      // Eerste keer: dit wordt het wachtwoord.
      if (String(wachtwoord).length < 6) {
        return NextResponse.json({ ok: false, error: "Kies minstens 6 tekens." }, { status: 400 });
      }
      await setUserWachtwoord(user.id, hashWachtwoord(wachtwoord));
    } else if (!checkWachtwoord(wachtwoord, user.password_hash)) {
      return NextResponse.json({ ok: false, error: "Onjuist wachtwoord." }, { status: 401 });
    }

    zetSessie({ id: user.id, naam: user.naam, rol: user.rol });
    return NextResponse.json({ ok: true, rol: user.rol, naam: user.naam });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
