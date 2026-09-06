// Server-only datatoegang voor het "Boekhouding"-tabblad.
// Zelfde patroon als lib/abonnementen-data.js en lib/server-data.js: de app
// praat via RPC met de database (public-schema), nooit rechtstreeks met de
// workflow-tabellen. Nooit client-side importeren.

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ipiqrsxbsgylxhgzlhsd.supabase.co";

function key() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY;
}

async function rpc(name, body) {
  const k = key();
  if (!k) throw new Error("SUPABASE_SERVICE_ROLE_KEY ontbreekt in de serveromgeving.");
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: {
      apikey: k,
      Authorization: `Bearer ${k}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body || {}),
    cache: "no-store",
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    let melding = t;
    try {
      const j = JSON.parse(t);
      melding = j.message || j.hint || j.details || t;
    } catch {}
    throw new Error(String(melding || `Databasefout (${res.status})`).slice(0, 300));
  }
  const tekst = await res.text();
  if (!tekst) return true;
  try {
    return JSON.parse(tekst);
  } catch {
    return true;
  }
}

// Een leeg overzicht is beter dan een witte pagina: leesacties mogen nooit
// een scherm slopen. Schrijfacties gooien wél door, die moeten zichtbaar zijn.
async function stil(fn, terug) {
  try {
    return await fn();
  } catch {
    return terug;
  }
}

const LEEG_OVERZICHT = {
  jaar: new Date().getFullYear(),
  kwartaal: Math.floor(new Date().getMonth() / 3) + 1,
  van: null, tot: null,
  omzet_excl: 0, omzet_btw: 0, omzet_incl: 0,
  kosten_excl: 0, kosten_btw: 0,
  resultaat: 0, btw_te_betalen: 0,
  rubrieken: [],
};

// Omzet (uit de bestaande facturen) + kosten + resultaat + btw-rubrieken,
// allemaal voor één kwartaal — de kern van de "Boekhouding"-pagina.
export async function getBoekhoudingOverzicht(jaar, kwartaal) {
  return await stil(
    () => rpc("sb_boekhouding_overzicht", { p_jaar: jaar || null, p_kwartaal: kwartaal || null }),
    LEEG_OVERZICHT
  );
}

// De rekeningenlijst, elk met een uitleg in gewone taal — nooit de code als
// eerste tonen, altijd de naam + uitleg (zie claude/boekhouding-rgs-plan.md).
export async function getGrootboekrekeningen() {
  const data = await stil(() => rpc("sb_grootboekrekeningen", {}), []);
  return Array.isArray(data) ? data : [];
}

// Losse kostenregels, optioneel gefilterd op jaar/kwartaal.
export async function getKostenLijst(jaar, kwartaal) {
  const data = await stil(
    () => rpc("sb_kosten_lijst", { p_jaar: jaar || null, p_kwartaal: kwartaal || null }),
    []
  );
  return Array.isArray(data) ? data : [];
}

export async function kostenToevoegen(velden) {
  return await rpc("sb_kosten_toevoegen", {
    p_grootboek_code: velden.grootboekCode,
    p_omschrijving: velden.omschrijving,
    p_leverancier: velden.leverancier || null,
    p_bedrag_excl: velden.bedragExcl,
    p_btw_bedrag: velden.btwBedrag,
    p_btw_tarief: velden.btwTarief,
    p_btw_type: velden.btwType,
    p_datum: velden.datum || null,
    p_terugkerend: !!velden.terugkerend,
    p_frequentie: velden.frequentie || null,
    p_toegevoegd_door: velden.toegevoegdDoor || null,
  });
}

export async function kostenBijwerken(id, velden) {
  return await rpc("sb_kosten_bijwerken", {
    p_id: id,
    p_grootboek_code: velden.grootboekCode ?? null,
    p_omschrijving: velden.omschrijving ?? null,
    p_leverancier: velden.leverancier ?? null,
    p_bedrag_excl: velden.bedragExcl ?? null,
    p_btw_bedrag: velden.btwBedrag ?? null,
    p_btw_tarief: velden.btwTarief ?? null,
    p_btw_type: velden.btwType ?? null,
    p_datum: velden.datum ?? null,
    p_terugkerend: velden.terugkerend ?? null,
    p_frequentie: velden.frequentie ?? null,
  });
}

export async function kostenVerwijderen(id) {
  return await rpc("sb_kosten_verwijderen", { p_id: id });
}

// Urenregistratie — los van kosten/omzet/btw, puur voor het urencriterium
// (1.225 uur per jaar) t.b.v. zelfstandigenaftrek/startersaftrek.

const LEEG_UREN_OVERZICHT = {
  jaar: new Date().getFullYear(),
  totaal_uren: 0, urencriterium: 1225, percentage: 0, resterend: 1225,
  huidig_jaar: true, projectie_einde_jaar: 0, op_schema: false,
};

export async function getUrenOverzicht(jaar) {
  return await stil(
    () => rpc("sb_uren_overzicht", { p_jaar: jaar || null }),
    LEEG_UREN_OVERZICHT
  );
}

export async function getUrenLijst(jaar) {
  const data = await stil(() => rpc("sb_uren_lijst", { p_jaar: jaar || null }), []);
  return Array.isArray(data) ? data : [];
}

export async function urenToevoegen(velden) {
  return await rpc("sb_uren_toevoegen", {
    p_datum: velden.datum || null,
    p_aantal_uren: velden.aantalUren,
    p_omschrijving: velden.omschrijving,
    p_toegevoegd_door: velden.toegevoegdDoor || null,
  });
}

export async function urenBijwerken(id, velden) {
  return await rpc("sb_uren_bijwerken", {
    p_id: id,
    p_datum: velden.datum ?? null,
    p_aantal_uren: velden.aantalUren ?? null,
    p_omschrijving: velden.omschrijving ?? null,
  });
}

export async function urenVerwijderen(id) {
  return await rpc("sb_uren_verwijderen", { p_id: id });
}
