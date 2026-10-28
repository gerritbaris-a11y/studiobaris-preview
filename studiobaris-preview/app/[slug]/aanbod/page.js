import { notFound } from "next/navigation";
import { cookies, headers } from "next/headers";
import { getAanbodInfo, telAanbod, prijsVoor, euro, echtNummer } from "../../../lib/aanbod";
import { betaallinkUrl } from "../../../lib/betaallink";
import { BRIEF_REVIEWS } from "../../../lib/brief-instellingen";
import { SB_TEL, SB_TEL_TOON, SB_KVK, SB_PERSOON, waMet } from "../../../lib/sb-contact";
import AanbodForm from "./aanbod-form";

export const dynamic = "force-dynamic";

// "Dit wil ik" (okt 2026): de pagina achter de knop in de balk van de preview.
// Opbouw volgens de boekskills:
//  - kop + kernzin in 5 seconden te snappen (StoryBrand, Krug)
//  - meteen een knop naar "ja" (directe actie) en bellen als tussenstap
//  - wat je krijgt (waarde: meer kans op succes, minder moeite — Hormozi)
//  - onze afspraken tegen het wantrouwen in deze markt (StoryBrand agreement plan)
//  - drie stappen (StoryBrand plan), echte reviews, een gezicht (Halbert)
//  - afsluiting: alle stappen, nu, zonder verplichting (Sugarman/Halbert)
// Prijs volgt de brief (lib/aanbod.js → prijsVoor): actie, gewoon of geen.
// In de huisstijl van StudioBaris, niet in die van de prospect: hier praten wij.

export async function generateMetadata({ params }) {
  const info = await getAanbodInfo(params.slug);
  return {
    title: info ? `Je website · ${info.bedrijf}` : "StudioBaris",
    robots: { index: false, follow: false },
  };
}

const NAVY = "#1A2B3D", CREME = "#F7F4EE", GOUD = "#C79A56", GOUD_TEKST = "#7E5F28", GRIJS = "#4A5560";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  .sba{--n:${NAVY};--c:${CREME};--g:${GOUD};--gt:${GOUD_TEKST};--gr:${GRIJS};background:var(--c);color:var(--n);min-height:100vh;
    font-family:'Plus Jakarta Sans',system-ui,-apple-system,sans-serif;line-height:1.55;font-size:16px}
  .sba *{box-sizing:border-box}
  .sba-in{max-width:640px;margin:0 auto;padding:0 18px}
  .sba-top{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 0}
  .sba-top a{color:var(--n);font-size:14px;font-weight:600;text-decoration:none}
  .sba-top img{height:28px;width:auto;display:block}
  .sba h1{font-size:30px;line-height:1.15;font-weight:800;margin:18px 0 10px;letter-spacing:-.4px}
  .sba h2{font-size:21px;line-height:1.2;font-weight:800;margin:0 0 14px}
  .sba-eyebrow{font-size:12.5px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:var(--gt)}
  .sba-lead{font-size:18px;color:var(--gr);margin:0 0 20px}
  .sba-knop{display:flex;align-items:center;justify-content:center;width:100%;min-height:54px;border-radius:999px;border:0;
    background:var(--n);color:#fff;font:inherit;font-weight:700;font-size:17px;text-decoration:none;cursor:pointer;padding:0 22px}
  .sba-knop2{display:flex;align-items:center;justify-content:center;width:100%;min-height:50px;border-radius:999px;border:1.5px solid var(--n);
    background:transparent;color:var(--n);font:inherit;font-weight:700;font-size:16px;text-decoration:none;cursor:pointer;padding:0 20px}
  .sba-knoppen{display:grid;gap:10px;margin-bottom:8px}
  .sba-sec{padding:30px 0;border-top:1px solid #E6E1D6}
  .sba-lijst{list-style:none;margin:0;padding:0;display:grid;gap:12px}
  .sba-lijst li{display:flex;gap:12px;align-items:flex-start}
  .sba-vink{flex:none;width:24px;height:24px;border-radius:999px;background:var(--n);color:#fff;display:grid;place-items:center;margin-top:1px}
  .sba-lijst strong{display:block}
  .sba-lijst span{color:var(--gr);font-size:15px}
  .sba-actie{background:#fff;border:2px solid var(--g);border-radius:16px;padding:14px 16px;margin:0 0 18px}
  .sba-actie b{color:var(--gt)}
  .sba-prijs{background:#fff;border:1px solid #E6E1D6;border-radius:16px;overflow:hidden}
  .sba-prijs > div{display:flex;justify-content:space-between;align-items:baseline;gap:12px;padding:14px 16px}
  .sba-prijs > div + div{border-top:1px solid #EFEBE2}
  .sba-prijs .bedrag{font-size:22px;font-weight:800;white-space:nowrap}
  .sba-prijs s{color:#9AA3AD;font-weight:600;font-size:16px;margin-right:8px}
  .sba-klein{font-size:13.5px;color:var(--gr)}
  .sba-stappen{list-style:none;margin:0;padding:0;display:grid;gap:14px;counter-reset:s}
  .sba-stappen li{display:flex;gap:12px;align-items:flex-start}
  .sba-stappen li::before{counter-increment:s;content:counter(s);flex:none;width:30px;height:30px;border-radius:999px;background:var(--g);color:var(--n);
    display:grid;place-items:center;font-weight:800;font-size:15px}
  .sba-rev{background:#fff;border-radius:16px;padding:16px;border:1px solid #E6E1D6}
  .sba-rev + .sba-rev{margin-top:12px}
  .sba-rev .st{color:var(--g);letter-spacing:2px;font-size:15px}
  .sba-rev p{margin:6px 0 8px;font-size:15.5px}
  .sba-rev .wie{font-size:13.5px;color:var(--gr)}
  .sba-voet{padding:26px 0 40px;font-size:13.5px;color:var(--gr);text-align:center;border-top:1px solid #E6E1D6}
  .sba-voet a{color:var(--n)}
  @media(min-width:560px){.sba h1{font-size:38px}.sba-knoppen{grid-template-columns:1fr 1fr}}
`;

const Vink = () => (
  <span className="sba-vink" aria-hidden="true">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg>
  </span>
);

export default async function AanbodPagina({ params }) {
  const slug = params.slug;
  const info = await getAanbodInfo(slug);
  if (!info) notFound();

  await telAanbod(slug, {
    ingelogd: Boolean(cookies().get("sb_sessie") || cookies().get("sb_team")),
    userAgent: headers().get("user-agent") || "",
  });

  const bedrijf = info.bedrijf || slug;
  const prijs = prijsVoor(info.brief);
  const reviews = (BRIEF_REVIEWS || []).filter((r) => r && r.tekst);
  const terug = `/${slug}`;

  return (
    <main className="sba">
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="sba-in">
        <div className="sba-top">
          <a href={terug}>&larr; Terug naar je website</a>
          <img src="/werkplek/wordmark-navy.svg" alt="StudioBaris" width="87" height="28" />
        </div>

        <div className="sba-eyebrow">Voor {bedrijf}</div>
        <h1>Je website staat al klaar.</h1>
        <p className="sba-lead">Je zet je projecten online vanaf je telefoon. Wij doen de rest.</p>

        {prijs && prijs.oud && (
          <div className="sba-actie">
            <b>Brief-actie:</b> je betaalt <b>{euro(prijs.website)}</b> in plaats van {euro(prijs.oud)} eenmalig. Dat geldt tot en met {prijs.tot}.
          </div>
        )}

        <div className="sba-knoppen">
          <a className="sba-knop" href="#starten">Ja, ik wil deze website</a>
          <a className="sba-knop2" href={`tel:${SB_TEL}`}>Eerst bellen: {SB_TEL_TOON}</a>
        </div>
        <p className="sba-klein" style={{ textAlign: "center", margin: "6px 0 26px" }}>Je zit nergens aan vast tot je zelf akkoord geeft.</p>

        <section className="sba-sec">
          <h2>Wat je krijgt</h2>
          <ul className="sba-lijst">
            <li><Vink /><div><strong>Deze website, helemaal af</strong><span>Met je eigen teksten, foto&apos;s en logo. Je krijgt twee rondes om te zeggen wat anders moet.</span></div></li>
            <li><Vink /><div><strong>De StudioBaris-app</strong><span>Projecten en reviews zet je zelf online vanaf je telefoon. Binnen enkele minuten staan ze op je site.</span></div></li>
            <li><Vink /><div><strong>Domeinnaam, hosting en 2 mailadressen</strong><span>Inclusief beveiliging (https). Wij regelen het, ook als je nu al een domein hebt.</span></div></li>
            <li><Vink /><div><strong>Onderhoud zonder omkijken</strong><span>Updates, back-ups en storingen: dat doen wij.</span></div></li>
            <li><Vink /><div><strong>Snel op elke telefoon</strong><span>Onze sites scoren boven de 90 op Google PageSpeed.</span></div></li>
          </ul>
        </section>

        {prijs && (
          <section className="sba-sec">
            <h2>Wat het kost</h2>
            <div className="sba-prijs">
              <div>
                <span>Website + app, eenmalig</span>
                <span className="bedrag">{prijs.oud && <s>{euro(prijs.oud)}</s>}{euro(prijs.website)}</span>
              </div>
              <div>
                <span>Daarna per maand<br /><span className="sba-klein">hosting, onderhoud en de app</span></span>
                <span className="bedrag">{euro(prijs.maand)}</span>
              </div>
            </div>
            <p className="sba-klein" style={{ marginTop: 10 }}>
              Alle bedragen excl. btw. Je betaalt de helft vooraf en de rest pas als je site live staat.
              {prijs.oud ? ` De brief-actie geldt tot en met ${prijs.tot}.` : ""}
            </p>
          </section>
        )}

        <section className="sba-sec">
          <h2>Onze afspraken</h2>
          <ul className="sba-lijst">
            <li><Vink /><div><strong>Je domeinnaam blijft altijd van jou</strong><span>Je website draait bij ons, maar de naam is en blijft van jou.</span></div></li>
            <li><Vink /><div><strong>Eerste jaar vast, daarna per maand opzegbaar</strong><span>Geen jarenlang contract.</span></div></li>
            <li><Vink /><div><strong>Pas de rest betalen als het live staat</strong><span>De helft vooraf, de andere helft bij oplevering.</span></div></li>
            <li><Vink /><div><strong>Geen verrassingen achteraf</strong><span>Extra werk na oplevering doen we alleen als jij dat wilt, en je hoort vooraf wat het kost.</span></div></li>
            <li><Vink /><div><strong>Je gegevens zijn veilig</strong><span>We gebruiken ze alleen voor je website.</span></div></li>
          </ul>
          <p className="sba-klein" style={{ marginTop: 12 }}>Alles staat in onze <a href="/voorwaarden" style={{ color: NAVY }}>algemene voorwaarden</a>.</p>
        </section>

        <section className="sba-sec">
          <h2>Zo gaan we verder</h2>
          <ol className="sba-stappen">
            <li><div><strong>Je zegt ja</strong><br /><span className="sba-klein">Hieronder, of gewoon aan de telefoon.</span></div></li>
            <li><div><strong>Wij maken je site af</strong><br /><span className="sba-klein">We bellen je, nemen je teksten en foto&apos;s door en regelen domein en mail.</span></div></li>
            <li><div><strong>Je site staat live</strong><br /><span className="sba-klein">Jij zet je projecten online vanaf je telefoon. Volgende week kun je al beginnen.</span></div></li>
          </ol>
        </section>

        {reviews.length > 0 && (
          <section className="sba-sec">
            <h2>Wat vakmensen zeggen</h2>
            {reviews.map((r, i) => (
              <div className="sba-rev" key={i}>
                <div className="st" aria-label={`${r.sterren || 5} van 5 sterren`}>{"★".repeat(Math.max(1, Math.min(5, r.sterren || 5)))}</div>
                <p>&ldquo;{r.tekst}&rdquo;</p>
                <div className="wie"><strong style={{ color: NAVY }}>{r.naam}</strong> · {r.bedrijf} · Google-review</div>
              </div>
            ))}
          </section>
        )}

        <section className="sba-sec" id="starten">
          <AanbodForm
            slug={slug}
            bedrijf={bedrijf}
            telefoon={echtNummer(info.telefoon)}
            persoon={SB_PERSOON}
            telToon={SB_TEL_TOON}
            tel={SB_TEL}
            wa={waMet(`Hoi Gerrit, ik heb een vraag over mijn website (preview.studiobaris.nl/${slug}).`)}
            akkoordUrl={info.akkoord_klaar ? betaallinkUrl(slug) : null}
          />
        </section>

        <div className="sba-voet">
          StudioBaris bouwt websites voor vakmannen. Bij je website krijg je onze app, waarmee je zelf projecten en reviews online zet vanaf je telefoon.
          <br /><br />
          KvK {SB_KVK} · <a href={`tel:${SB_TEL}`}>{SB_TEL_TOON}</a> · <a href="/voorwaarden">Algemene voorwaarden</a>
          <br /><br />
          <a href={terug}>&larr; Terug naar je website</a>
        </div>
      </div>
    </main>
  );
}
