// Server-only datatoegang met de service-role key (nooit client-side importeren).
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ipiqrsxbsgylxhgzlhsd.supabase.co";

function key() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY;
}

async function rpc(name, body) {
  const k = key();
  if (!k) return null;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: { apikey: k, Authorization: `Bearer ${k}`, "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
    cache: "no-store",
  });
  if (!res.ok) return null;
  // Functies die niets teruggeven (void) leveren een leeg antwoord op.
  // Dat is geen fout: gewoon true teruggeven in plaats van op JSON stuklopen.
  const tekst = await res.text();
  if (!tekst) return true;
  try {
    return JSON.parse(tekst);
  } catch {
    return true;
  }
}

// Directe tabel-toegang via PostgREST (service-role, server-only).
async function rest(path, opts = {}) {
  const k = key();
  if (!k) return null;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    cache: "no-store",
    ...opts,
    headers: {
      apikey: k,
      Authorization: `Bearer ${k}`,
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) return null;
  const txt = await res.text();
  return txt ? JSON.parse(txt) : [];
}

// --- Leadlijst (de trechter) ---

export async function getLeads() {
  const data = await rest("leads?select=*&order=score.desc.nullslast,bedrijfsnaam.asc&limit=5000");
  return Array.isArray(data) ? data : [];
}

// Leads zoeken op de server. Met 7.900+ rijen sturen we nooit alles naar de browser.
export async function zoekLeads({ naam, tab, zoek, provincie, vakgebied, potentie, wie, limiet, reden }) {
  const data = await rpc("sb_leads_zoek", {
    p_naam: naam || "",
    p_tab: tab || "werk",
    p_zoek: zoek || null,
    p_provincie: provincie || null,
    p_vakgebied: vakgebied || null,
    p_potentie: potentie || null,
    p_wie: wie || "alles",
    p_limiet: Number(limiet) || 30,
    p_reden: reden || null,
  });
  return data || { totaal: 0, rijen: [] };
}

// Leads die ik heb opgepakt maar waar nog geen preview van is.
export async function getMijnLeads(naam) {
  const data = await rpc("sb_mijn_leads", { p_naam: naam || "" });
  return Array.isArray(data) ? data : [];
}

export async function verwijderLead(id) {
  return await rpc("sb_lead_verwijder", { p_id: id });
}

// Provincies, vakgebieden en tellingen voor de filters.
export async function getLeadFacetten(naam) {
  const data = await rpc("sb_lead_facetten", { p_naam: naam || "" });
  return data || { provincies: [], vakgebieden: [], werk: 0, afgerond: 0, socials: 0, totaal: 0 };
}

// Bulk-import van een leadlijst. Bestaande leads worden bijgewerkt; hun status
// en eigenaar blijven staan.
export async function importeerLeads(rijen, bron) {
  const data = await rpc("sb_leads_import", { p_rijen: rijen, p_bron: bron || null });
  return data || null;
}

// Eén lead ophalen (om de vorige status te kennen voordat we hem wijzigen).
export async function getLead(id) {
  const data = await rest(`leads?select=id,bedrijfsnaam,status,owner,vakgebied,plaats,provincie,adres,telefoon,email,website,facebook,instagram,linkedin,google_maps&id=eq.${encodeURIComponent(id)}&limit=1`);
  return Array.isArray(data) && data[0] ? data[0] : null;
}

// Logboek: wie deed wat, wanneer. Mag nooit de actie zelf laten mislukken.
export async function log({ persoon, soort, leadId = null, slug = null, bedrijf = null, van = null, naar = null, details = null }) {
  try {
    return await rpc("sb_log", {
      p_persoon: persoon || null,
      p_soort: soort,
      p_lead: leadId,
      p_slug: slug,
      p_bedrijf: bedrijf,
      p_van: van,
      p_naar: naar,
      p_details: details,
    });
  } catch {
    return null;
  }
}

// Overzichtsrapport: trechter, waar leads sneuvelen, wie wat doet.
export async function getRapport(dagen = 30, persoon = null) {
  const data = await rpc("sb_rapport", { p_dagen: Number(dagen) || 30, p_persoon: persoon || null });
  return data || null;
}

// Vragen die klanten via de app stellen (automatisch ingedeeld).
export async function getVragen({ status = "", categorie = "", bedrijf = "", limiet = 100 } = {}) {
  const data = await rpc("sb_vragen", {
    p_status: status || null,
    p_categorie: categorie || null,
    p_bedrijf: bedrijf || null,
    p_limiet: Number(limiet) || 100,
  });
  return data || { per_categorie: [], open: 0, totaal: 0, rijen: [] };
}

export async function zetVraagStatus(id, status, notitie = null) {
  return await rpc("sb_vraag_status", { p_id: id, p_status: status, p_notitie: notitie });
}

// Wat elke klant ons kost: AI-verbruik, foto's en opslag.
export async function getKosten() {
  const data = await rpc("sb_kosten", {});
  return data || { gemiddelden: {}, klanten: [] };
}

export async function getTeam() {
  const data = await rest("app_users?select=naam,rol&order=rol.asc,naam.asc");
  return Array.isArray(data) ? data : [];
}

// --- Login / accounts ---

// Namen + rol + of er al een wachtwoord is ingesteld (voor de inlogpagina).
export async function getTeamLogin() {
  const data = await rest("app_users?select=id,naam,rol,password_hash,vergoeding_model&order=rol.asc,naam.asc");
  return (Array.isArray(data) ? data : []).map((u) => ({
    id: u.id, naam: u.naam, rol: u.rol, gezet: !!u.password_hash,
    vergoeding_model: u.vergoeding_model || "50pct",
  }));
}

export async function getUserByNaam(naam) {
  const data = await rest(
    `app_users?select=id,naam,rol,password_hash&naam=eq.${encodeURIComponent(naam)}&limit=1`
  );
  return Array.isArray(data) && data[0] ? data[0] : null;
}

export async function setUserWachtwoord(id, hash) {
  return await rest(`app_users?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ password_hash: hash }),
  });
}

export async function updateLead(id, fields) {
  const body = { ...fields, updated_at: new Date().toISOString() };
  if (fields.owner !== undefined && fields.owner) body.claimed_at = new Date().toISOString();
  return await rest(`leads?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(body),
  });
}

// Claim-met-slot: pak een lead alleen op als hij nog écht vrij is.
// De filter owner=is.null maakt dit atomair — bellen twee verkopers tegelijk
// op "Pak op", dan lukt het maar bij één. De ander krijgt netjes te horen
// wie de lead al heeft, zodat niemand dubbel belt.
export async function claimLead(id, naam) {
  const nu = new Date().toISOString();
  const rijen = await rest(
    `leads?id=eq.${encodeURIComponent(id)}&owner=is.null&select=id,bedrijfsnaam,status,owner`,
    {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ owner: naam, status: "opgepakt", claimed_at: nu, updated_at: nu }),
    }
  );
  if (Array.isArray(rijen) && rijen.length > 0) return { ok: true, lead: rijen[0] };
  // Niks bijgewerkt: de lead was net al opgepakt. Haal op wie hem heeft.
  const huidig = await getLead(id);
  if (huidig && huidig.owner === naam) return { ok: true, lead: huidig };
  return { ok: false, taken: true, owner: huidig ? huidig.owner : null, lead: huidig };
}

// Contactpersoon van de klant (voor de aanhef in het verkoop-appje).
export async function setContactpersoon(slug, naam) {
  return await rpc("sb_set_contactpersoon", { p_slug: slug, p_naam: naam });
}

// De persoonlijke openingszin van het verkoopappje.
export async function setPersoonlijk(slug, tekst) {
  return await rpc("sb_set_persoonlijk", { p_slug: slug, p_tekst: tekst });
}

// Verkoopbedrag (eenmalige websiteprijs) opslaan bij een klant.
export async function setVerkoopbedrag(slug, bedrag) {
  return await rpc("sb_set_verkoopbedrag", { p_slug: slug, p_bedrag: bedrag });
}

// Omzet + 50%-commissie per persoon (verzamelaar).
export async function getOmzet() {
  const data = await rpc("sb_omzet_overzicht", {});
  return Array.isArray(data) ? data : [];
}

// Btw-reserve: hoeveel btw we opzij moeten zetten. Ingevoerde bedragen zijn
// excl. btw; de klant betaalt incl. Wij innen die btw en dragen 'm later af.
export async function getBtw() {
  const data = await rpc("sb_btw_overzicht", {});
  const r = (Array.isArray(data) ? data[0] : data) || {};
  return {
    aanbetaling_excl: Number(r.aanbetaling_excl || 0),
    rest_excl: Number(r.rest_excl || 0),
    ontvangen_eenmalig_excl: Number(r.ontvangen_eenmalig_excl || 0),
    lopend_abo_maand_excl: Number(r.lopend_abo_maand_excl || 0),
    aantal_betaald: Number(r.aantal_betaald || 0),
    aantal_abo: Number(r.aantal_abo || 0),
    verwacht_akkoord_excl: Number(r.verwacht_akkoord_excl || 0),
  };
}

// Alle inzendingen (intake + feedback) van een klant, nieuwste eerst.
export async function getInzendingen(slug) {
  const data = await rpc("sb_inzendingen", { p_slug: slug });
  return Array.isArray(data) ? data : [];
}

export async function getConcept(slug) {
  const data = await rpc("get_concept", { p_slug: slug });
  return data || null;
}

export async function getFull(slug) {
  const data = await rpc("get_full", { p_slug: slug });
  return data || null;
}

export async function getOverview() {
  const data = await rpc("get_overview", {});
  return Array.isArray(data) ? data : [];
}

export async function getBetaalinfo(slug) {
  const data = await rpc("get_betaalinfo", { p_slug: slug });
  return data || null;
}

export async function updateKlant(slug, { verzamelaar = null, status = null, maandbedrag = null }) {
  return await rpc("update_klant", {
    p_slug: slug,
    p_verzamelaar: verzamelaar,
    p_status: status,
    p_maandbedrag: maandbedrag,
  });
}

export async function setBetaling(slug, fields = {}) {
  return await rpc("set_betaling", {
    p_slug: slug,
    p_status: fields.status ?? null,
    p_provider: fields.provider ?? null,
    p_klant_id: fields.klant_id ?? null,
    p_abonnement_id: fields.abonnement_id ?? null,
    p_mandaat_id: fields.mandaat_id ?? null,
    p_voorwaarden: fields.voorwaarden === true,
  });
}

// Stand van de restbetaling (de tweede helft van het websitebedrag).
export async function setRest(slug, status, paymentId = null) {
  return await rpc("sb_set_rest", { p_slug: slug, p_status: status, p_payment: paymentId });
}

// De stijl van een preview omzetten. Dezelfde inhoud, andere weergave.
export async function setStijl(slug, stijl) {
  return await rpc("sb_set_stijl", { p_slug: slug, p_stijl: stijl });
}

export async function deleteKlant(slug) {
  return await rpc("delete_klant", { p_slug: slug });
}

// Lichte, losse route om een (toekomstige) klant handmatig neer te zetten,
// zonder de zware AI-intake en zonder meteen een klantnummer.
export async function maakKlant(velden) {
  return await rpc("sb_klant_aanmaken", {
    p_bedrijfsnaam: velden.bedrijfsnaam,
    p_contactpersoon: velden.contactpersoon || null,
    p_email: velden.email || null,
    p_telefoon: velden.telefoon || null,
    p_adres: velden.adres || null,
    p_kvk: velden.kvk || null,
    p_btw: velden.btw || null,
    p_pakket_type: velden.pakket_type || null,
    p_websiteprijs: velden.websiteprijs ?? null,
    p_maandbedrag: velden.maandbedrag ?? null,
    p_notitie: velden.notitie || null,
  });
}

// Handmatig "dit is nu al een klant" aanvinken — koppelt het eerstvolgende
// klantnummer, los van een factuur of Mollie-betaling. De drie extra velden
// zijn optioneel: de afgesproken tarieven meteen vastleggen kan, maar hoeft
// niet. Betaalwijze/incassodag blijven de taak van "Afspraak vastleggen" op
// Abonnementen, dat gebeurt hier bewust niet.
export async function markeerKlant(slug, velden = {}) {
  return await rpc("sb_klant_markeren", {
    p_slug: slug,
    p_websiteprijs: velden.websiteprijs ?? null,
    p_maandbedrag: velden.maandbedrag ?? null,
    p_pakket_type: velden.pakket_type || null,
  });
}

// Een bestaande lead/preview toevoegen aan het Klantenregister als
// "toekomstige klant" — geen klantnummer, geen andere gegevens gewijzigd.
export async function maakKlantKandidaat(slug) {
  return await rpc("sb_klant_kandidaat_maken", { p_slug: slug });
}

// Een klant die geen klant meer is: klantnummer en factuurhistorie blijven
// intact, hij verdwijnt alleen uit de actieve Klanten-lijst op het register.
export async function maakOudKlant(slug) {
  return await rpc("sb_klant_oud_maken", { p_slug: slug });
}

// Terugzetten als actieve klant na "Markeer als oud-klant".
export async function heractiveerKlant(slug) {
  return await rpc("sb_klant_heractiveren", { p_slug: slug });
}

export async function updateBedrijf(slug, velden) {
  return await rpc("update_bedrijf", { p_slug: slug, p_velden: velden });
}

// --- Beheerdashboard (monitoring van alle klant-apps) ---

export async function getKlantOverzicht() {
  const data = await rpc("sb_klant_overzicht", {});
  return Array.isArray(data) ? data : [];
}

export async function klantInstellen(id, { projectLimit = null, reviewLimit = null, abonnementsvorm = null }) {
  return await rpc("sb_klant_instellen", {
    p_id: id,
    p_project_limit: projectLimit,
    p_review_limit: reviewLimit,
    p_abonnementsvorm: abonnementsvorm,
  });
}

// De persoonlijke inloglink van een klant. Bewust langlevend: een vakman moet
// één keer installeren en daarna altijd binnenkomen. Raakt een link kwijt of
// in verkeerde handen, dan maak je gewoon een nieuwe aan — de oude vervalt dan.
export async function nieuweLogin(id, dagen = 3650) {
  return await rpc("sb_klant_nieuwe_login", { p_id: id, p_dagen: dagen });
}

// --- Akkoord-link aanmaken (werknemer-tool) ---

export async function maakAkkoord({
  companyName,
  email = null,
  phone = null,
  pakket = null,
  pakketType = null,
  maandbedrag = null,
  aanbetaling = null,
  diensten = [],
  verzamelaar = null,
}) {
  return await rpc("sb_akkoord_aanmaken", {
    p_company_name: companyName,
    p_pakket: pakket,
    p_maandbedrag: maandbedrag,
    p_aanbetaling: aanbetaling,
    p_diensten: diensten,
    p_verzamelaar: verzamelaar,
    p_email: email,
    p_phone: phone,
    p_pakket_type: pakketType,
  });
}

// --- Klantsites op afstand bijwerken/verversen ---

// Domein + licentiesleutel van één klant (server-only).
export async function getKlantSite(id) {
  const rows = await rest(
    `companies?id=eq.${encodeURIComponent(id)}&select=id,name,slug,license_key,allowed_domains,plugin_versie`
  );
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}

// Roept een endpoint van de SB Embed-plugin aan op de site van de klant.
// pad = "ververs" of "bijwerken".
export async function roepKlantSite(id, pad) {
  const klant = await getKlantSite(id);
  if (!klant) return { ok: false, error: "Klant niet gevonden." };
  const domein = Array.isArray(klant.allowed_domains) ? klant.allowed_domains[0] : null;
  if (!domein) return { ok: false, error: "Geen domein bekend voor deze klant." };
  if (!klant.license_key) return { ok: false, error: "Geen licentiesleutel bekend voor deze klant." };

  const url = `https://${domein}/wp-json/sb-embed/v1/${pad}`;
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 20000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "X-SB-License": klant.license_key, "Content-Type": "application/json" },
      signal: ac.signal,
      cache: "no-store",
    });
    const tekst = await res.text();
    let data = null;
    try { data = JSON.parse(tekst); } catch { data = { rauw: tekst.slice(0, 200) }; }
    // De site vertelt zelf welke versie hij draait. Dat vastleggen, want anders
    // leren we de versie alleen als de site projecten ophaalt - en een site zonder
    // projectpagina's (zoals onze eigen marketingsite) doet dat nooit.
    if (data && data.versie && data.versie !== klant.plugin_versie) {
      try {
        await rest(`companies?id=eq.${encodeURIComponent(id)}`, {
          method: "PATCH",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify({
            plugin_versie: String(data.versie).slice(0, 20),
            plugin_gezien_op: new Date().toISOString(),
          }),
        });
      } catch {}
    }

    if (!res.ok) {
      // 404 = de site kent dit endpoint nog niet, dus draait een oude plugin.
      // Dat is geen storing maar een eenmalige klus: die site moet handmatig
      // naar 1.1.1 of hoger, daarna kan hij zichzelf bijwerken.
      if (res.status === 404) {
        return {
          ok: false,
          error:
            "Deze site draait nog een plugin van vóór 1.1.1 en kan zichzelf nog niet op afstand bijwerken. " +
            "Installeer de nieuwste zip eenmalig via WordPress (Plugins > Nieuwe plugin > Uploaden). Daarna gaat het vanzelf.",
          data,
        };
      }
      return { ok: false, error: (data && data.error) || `Site gaf ${res.status} terug.`, data };
    }
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: e.name === "AbortError" ? "De site reageerde niet binnen 20 seconden." : String(e.message || e) };
  } finally {
    clearTimeout(t);
  }
}

// "Vandaag": de urgentie-afleiding uit de database. Geeft een lijst taken terug,
// elk met reden, kleur (rust/amber/sage/grijs/klei), lane en actielabel.
// p_wie leeg = alles (beheer); een verkopersnaam = alleen die previews/leads.
export async function getVandaag(wie = "") {
  const data = await rpc("sb_vandaag", { p_wie: wie || "" });
  return Array.isArray(data) ? data : [];
}

// Openstaande restbetalingen: klanten die de aanbetaling voldeden maar de
// tweede helft nog niet. p_wie leeg = alles (beheer).
export async function getRestbetalingen(wie = "") {
  const data = await rpc("sb_restbetalingen", { p_wie: wie || "" });
  return Array.isArray(data) ? data : [];
}
