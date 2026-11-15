import MobielMenu from "../[slug]/mobiel-menu";
import { brandVars } from "../../lib/brand";
import FaseFotos, { heeftFases } from "../[slug]/fase-fotos";
import { nicheFoto } from "../../lib/preview-assets";
import VoorproefLabel from "../[slug]/voorproef-label";
import ReviewBrug, { REVIEW_PLEK } from "../[slug]/review-brug";
import { waLink, kopDelen, sterren } from "./gedeeld";

// Stijl "Social & Creator": voor vakmensen die hun social media willen laten
// zien. Donkere hero met schuin gestapelde 9:16-foto's (zoals stories),
// een lopende band met diensten, een swipebare "Live vanaf de klus"-rij en
// een blok met hun kanalen en volgers.
//
// Optioneel blok in de content (alleen tonen wat er is, nooit verzinnen):
//   social: {
//     statistieken: [{ waarde: "101K", label: "volgers op Instagram" }, ...],
//     quote: "Kansen krijg je niet aangereikt...",
//     partners: ["Snickers Workwear", "Moasure"]
//   }
// Kanalen komen uit bedrijf.socials (instagram, tiktok, facebook, youtube, linkedin).

const KANALEN = [
  ["instagram", "Instagram"],
  ["tiktok", "TikTok"],
  ["youtube", "YouTube"],
  ["facebook", "Facebook"],
  ["linkedin", "LinkedIn"],
];

function handleVan(url) {
  const s = String(url || "").trim().replace(/\/+$/, "");
  if (!s) return "";
  if (s.startsWith("@")) return s;
  const laatste = s.split("/").pop() || "";
  return laatste ? "@" + laatste.replace(/^@/, "") : "";
}

function urlVan(soort, waarde) {
  const s = String(waarde || "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  const h = s.replace(/^@/, "");
  const basis = { instagram: "https://www.instagram.com/", tiktok: "https://www.tiktok.com/@", youtube: "https://www.youtube.com/@", facebook: "https://www.facebook.com/", linkedin: "https://www.linkedin.com/in/" }[soort];
  return basis ? basis + h : "";
}

function Icoon({ soort }) {
  const p = { width: 20, height: 20, viewBox: "0 0 24 24", "aria-hidden": true };
  if (soort === "instagram") return <svg {...p} fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" /></svg>;
  if (soort === "tiktok") return <svg {...p} fill="currentColor"><path d="M16.6 3c.4 2.2 1.8 3.7 4 3.9v3.2c-1.5.1-2.8-.4-4-1.2v6.3c0 3.7-3 6.3-6.6 5.8-2.8-.4-4.9-2.9-4.8-5.7.1-3.3 3-5.8 6.3-5.4v3.3c-1.4-.4-3 .5-3.2 2-.3 1.6 1 3 2.6 2.9 1.4 0 2.4-1.2 2.4-2.6V3h3.3Z" /></svg>;
  if (soort === "youtube") return <svg {...p} fill="currentColor"><path d="M22 8.2a3 3 0 0 0-2.1-2.1C18 5.6 12 5.6 12 5.6s-6 0-7.9.5A3 3 0 0 0 2 8.2 31 31 0 0 0 1.6 12 31 31 0 0 0 2 15.8a3 3 0 0 0 2.1 2.1c1.9.5 7.9.5 7.9.5s6 0 7.9-.5a3 3 0 0 0 2.1-2.1c.3-1.2.4-2.5.4-3.8s-.1-2.6-.4-3.8ZM10 15V9l5.2 3L10 15Z" /></svg>;
  if (soort === "facebook") return <svg {...p} fill="currentColor"><path d="M14 8h3V4h-3c-2.8 0-4.5 1.8-4.5 4.6V11H7v4h2.5v7h4v-7H17l.5-4h-4V8.8c0-.5.3-.8.5-.8Z" /></svg>;
  return <svg {...p} fill="currentColor"><path d="M4 9h4v11H4zM6 3a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm4 6h3.8v1.6c.6-1 1.9-1.9 3.7-1.9 3.6 0 4.3 2.3 4.3 5.4V20h-4v-5.2c0-1.3 0-2.9-1.8-2.9s-2 1.4-2 2.8V20h-4V9Z" /></svg>;
}

const PIJL = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;

export default function SocialSite({ content, slug = "", isConcept, isReview }) {
  const modeQuery = isConcept ? "?concept=1" : "";
  const c = content || {};
  const b = c.bedrijf || {};
  const m = c.merk || {};
  const hero = c.hero || {};
  const social = c.social || {};
  const diensten = c.diensten || [];
  const voordelen = c.voordelen || [];
  const projecten = c.projecten || [];
  const reviews = c.reviews || [];
  const usps = c.usps || [];
  const cta = c.cta_blok || {};
  const wa = waLink(b.whatsapp || b.telefoon);
  const vars = brandVars(m);
  const naam = String(b.naam || "Bedrijf");

  // Kop: hero.kop met accentwoord; de slogan komt er dan schuin onder.
  // Zonder hero.kop valt hij terug op de gewone kop-logica (slogan of naam).
  let kopBase, kopAcc, sloganRegel = "";
  if (hero.kop) {
    const acc = hero.kop_accent || "";
    const kop = String(hero.kop);
    const i = acc ? kop.toLowerCase().lastIndexOf(acc.toLowerCase()) : -1;
    kopBase = i >= 0 ? kop.slice(0, i) : kop + " ";
    kopAcc = i >= 0 ? kop.slice(i) : acc;
    if (b.slogan && String(b.slogan).trim().toLowerCase() !== kop.trim().toLowerCase()) sloganRegel = String(b.slogan);
  } else {
    [kopBase, kopAcc] = kopDelen(c);
  }

  const kanalen = KANALEN
    .map(([k, label]) => ({ k, label, url: urlVan(k, (b.socials || {})[k]) }))
    .filter((x) => x.url);
  const hoofdKanaal = kanalen[0] || null;
  const hoofdHandle = hoofdKanaal ? handleVan(hoofdKanaal.url) : "";

  const stats = (Array.isArray(social.statistieken) ? social.statistieken : [])
    .filter((s) => s && s.waarde && s.label).slice(0, 3);
  const partners = (Array.isArray(social.partners) ? social.partners : []).filter(Boolean).slice(0, 6);
  const quote = social.quote || "";

  const beeld = (i) => {
    const p = projecten[i];
    return (p && (p.beeld_url || (heeftFases(p) && p.fases[p.fases.length - 1].url))) || nicheFoto(b.branche, i + 1);
  };
  const stapel = [beeld(0), beeld(1), beeld(2)];
  const overFoto = m.persoon_foto || beeld(4) || beeld(0);
  const tegelFoto = beeld(3);

  const regio = b.regio && String(b.regio).split(/,| en /)[0].trim();
  const eyebrow = [b.branche, regio].filter(Boolean).join(" · ") || naam;
  const ctaTekst = hero.cta_tekst || "Offerte aanvragen";
  const band = diensten.length ? diensten.map((d) => d.titel).filter(Boolean) : usps;

  const fonts = "https://fonts.googleapis.com/css2?family=Anton&family=Manrope:wght@400;500;600;700;800&family=Instrument+Serif:ital@1&display=swap";

  // Op brede schermen: grote kaart (2 rijen) + 4 kaarten vullen de eerste twee
  // rijen. Blijft er daarna een halve rij over, dan rekt de laatste kaart op.
  const rest = Math.max(0, diensten.length - 1);
  const rem = rest > 4 ? (rest - 4) % 3 : 0;
  const dienstenStaart = rem ? 4 - rem : 1;

  const css = `
    @import url('${fonts}');
    .so *{box-sizing:border-box;margin:0;padding:0}
    .so{--ink:var(--black);--paper:#F7F4EC;--sand:#EEE8DA;--line:#E6DFD0;font-family:Manrope,system-ui,sans-serif;color:#151A17;background:var(--paper);line-height:1.6;overflow-x:clip}
    .so a{color:inherit;text-decoration:none}
    .so img{display:block;max-width:100%}
    .so{scroll-behavior:smooth}.so section[id]{scroll-margin-top:80px}
    .so .wrap{width:min(1200px,92vw);margin:0 auto}
    .so .dp{font-family:Anton,Impact,sans-serif;font-weight:400;text-transform:uppercase;letter-spacing:.01em;line-height:.95}
    .so .sf{font-family:'Instrument Serif',Georgia,serif;font-style:italic;text-transform:none;letter-spacing:0;font-weight:400}
    .so .eb{display:inline-flex;align-items:center;gap:.6em;font-size:.76rem;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:var(--orange-ink)}
    .so .eb::before{content:"";width:28px;height:2px;background:currentColor}
    .so .donker .eb{color:var(--orange-hero)}
    .so .btn{display:inline-flex;align-items:center;gap:.6em;padding:1rem 1.55rem;border-radius:999px;font-weight:800;font-size:.97rem;transition:transform .2s,box-shadow .2s;white-space:nowrap}
    .so .btn:hover{transform:translateY(-2px)}
    .so .by{background:var(--orange);color:var(--on-orange);box-shadow:0 10px 30px -12px var(--orange)}
    .so .bg{border:2px solid rgba(255,255,255,.3);color:#fff}
    .so .bg:hover{border-color:#fff}
    .so .bd{border:2px solid var(--line);color:#151A17;background:#fff}

    .so .hd{position:absolute;left:0;right:0;top:0;z-index:5}
    .so .hd-in{width:min(1200px,92vw);margin:0 auto;padding:1.1rem 0;display:flex;align-items:center;justify-content:space-between;gap:1rem;color:#fff}
    .so .logo{display:flex;align-items:center;gap:.6rem;font-family:Anton,sans-serif;font-size:1.3rem;text-transform:uppercase;letter-spacing:.02em;line-height:1}
    .so .logo i{width:38px;height:38px;border-radius:11px;background:var(--orange);color:var(--on-orange);display:grid;place-items:center;font-style:normal;font-size:1.05rem}
    .so .logochip{background:#fff;border-radius:10px;padding:6px 10px;display:inline-flex}
    .so .nav{display:flex;gap:1.8rem;font-weight:700;font-size:.92rem}
    .so .nav a{opacity:.8}.so .nav a:hover{opacity:1}
    .so .hd .btn{padding:.65rem 1.1rem;font-size:.88rem}

    .so .hero{position:relative;background:var(--ink);color:#fff;overflow:hidden;padding:7.5rem 0 5rem}
    .so .hero::after{content:"";position:absolute;inset:0;background:radial-gradient(900px 560px at 12% 30%,color-mix(in srgb,var(--orange) 22%,transparent),transparent 62%);pointer-events:none}
    .so .hero .wrap{position:relative;z-index:2;display:grid;grid-template-columns:1fr;gap:3rem;align-items:center}
    .so .hero h1{font-size:clamp(2.9rem,7.2vw,6.3rem);margin:1rem 0 1.3rem}
    .so .hero h1 em{font-style:normal;color:var(--orange-hero)}
    .so .hero h1 .sf{display:block;font-size:.48em;color:rgba(255,255,255,.72);margin-top:.4em;line-height:1.12}
    .so .hero .lead{font-size:1.12rem;max-width:34rem;color:rgba(255,255,255,.78)}
    .so .cta-rij{display:flex;flex-wrap:wrap;gap:.8rem;margin-top:2rem}
    .so .stats{display:flex;flex-wrap:wrap;gap:1.4rem 2.6rem;margin-top:2.6rem;padding-top:1.8rem;border-top:1px solid rgba(255,255,255,.12)}
    .so .stats b{font-family:Anton,sans-serif;font-weight:400;font-size:2.3rem;line-height:1;display:block}
    .so .stats span{font-size:.8rem;color:rgba(255,255,255,.6);font-weight:600}
    .so .vinkjes{display:grid;gap:.55rem;margin-top:2.4rem;padding-top:1.6rem;border-top:1px solid rgba(255,255,255,.12);font-size:.95rem;color:rgba(255,255,255,.82)}
    .so .vinkjes span::before{content:"✓";color:var(--orange-hero);font-weight:800;margin-right:.6rem}
    .so .stapel{position:relative;height:500px;max-width:520px;width:100%;margin:0 auto}
    .so .stapel figure{position:absolute;border-radius:22px;overflow:hidden;box-shadow:0 30px 60px -20px rgba(0,0,0,.7);border:4px solid rgba(255,255,255,.07);background:#222 center/cover no-repeat}
    .so .stapel .s1{width:52%;aspect-ratio:9/16;right:0;top:0;transform:rotate(2.5deg);animation:sofl 7s ease-in-out infinite}
    .so .stapel .s2{width:44%;aspect-ratio:9/16;left:3%;top:11%;transform:rotate(-4deg);animation:sofl 8s ease-in-out infinite reverse}
    .so .stapel .s3{width:34%;aspect-ratio:1/1;left:31%;bottom:-2%;transform:rotate(3deg);z-index:2;animation:sofl 6s ease-in-out infinite}
    @keyframes sofl{50%{translate:0 -10px}}
    .so .live{position:absolute;left:0;bottom:15%;z-index:3;background:#fff;color:#151A17;border-radius:16px;padding:.75rem 1rem;display:flex;gap:.7rem;align-items:center;font-weight:800;font-size:.85rem;box-shadow:0 20px 40px -15px rgba(0,0,0,.6)}
    .so .live i{width:10px;height:10px;border-radius:50%;background:#E5372B;animation:sopu 1.6s infinite}
    .so .live small{display:block;font-weight:600;font-size:.74rem;opacity:.6}
    @keyframes sopu{0%{box-shadow:0 0 0 0 rgba(229,55,43,.6)}70%{box-shadow:0 0 0 10px rgba(229,55,43,0)}100%{box-shadow:0 0 0 0 rgba(229,55,43,0)}}

    .so .band{background:var(--orange);color:var(--on-orange);overflow:hidden;padding:1rem 0;transform:rotate(-1.2deg);margin:-1.3rem -2vw 0;position:relative;z-index:3;border-block:3px solid var(--ink)}
    .so .band-in{display:flex;width:max-content;animation:soband 34s linear infinite}
    .so .band span{font-family:Anton,sans-serif;font-size:1.5rem;text-transform:uppercase;white-space:nowrap;display:flex;align-items:center;gap:2.4rem;padding-right:2.4rem}
    .so .band span::after{content:"✦";font-size:.95rem}
    @keyframes soband{to{transform:translateX(-50%)}}

    .so .sec{padding:6rem 0}
    .so .kop{display:flex;justify-content:space-between;align-items:flex-end;gap:1.5rem 2rem;margin-bottom:3rem;flex-wrap:wrap}
    .so .kop h2{font-size:clamp(2.3rem,5vw,4rem);margin-top:.8rem;max-width:15ch}
    .so .kop p{max-width:30rem;color:#4E5650;font-size:1.03rem}

    .so .dien{display:grid;grid-template-columns:1fr;gap:1.1rem}
    .so .kaart{background:#fff;border-radius:22px;padding:1.9rem;position:relative;overflow:hidden;border:1px solid var(--line);transition:transform .3s,box-shadow .3s;display:flex;flex-direction:column;gap:.5rem}
    .so .kaart:hover{transform:translateY(-4px);box-shadow:0 25px 50px -25px rgba(0,0,0,.3)}
    .so .kaart .nr{position:absolute;right:1.3rem;top:.9rem;font-family:Anton,sans-serif;font-size:3.2rem;color:#F0EBE0;line-height:1}
    .so .kaart h3{font-size:1.2rem;font-weight:800;position:relative;padding-right:3rem}
    .so .kaart p{color:#5A625C;font-size:.96rem;position:relative}
    .so .kaart .ml{margin-top:auto;padding-top:.4rem;font-weight:800;font-size:.88rem;color:var(--orange-ink)}
    .so .kaart.groot{background:var(--ink) center/cover no-repeat;color:#fff;border:0;min-height:380px;justify-content:flex-end;padding:0}
    .so .kaart.groot .in{position:relative;padding:1.9rem;background:linear-gradient(transparent,color-mix(in srgb,var(--ink) 94%,transparent) 42%)}
    .so .kaart.groot h3{padding-right:0}
    .so .kaart.groot p{color:rgba(255,255,255,.78);margin-top:.4rem}
    .so .kaart.groot .ml{color:var(--orange-hero)}

    .so .klus{background:var(--ink);color:#fff}
    .so .klus .kop p{color:rgba(255,255,255,.7)}
    .so .rij{display:flex;gap:1rem;overflow-x:auto;scroll-snap-type:x mandatory;padding:0 calc((100vw - min(1200px,92vw))/2) 1.4rem;scroll-padding-inline:calc((100vw - min(1200px,92vw))/2);scrollbar-width:none}
    .so .rij::-webkit-scrollbar{display:none}
    .so .story{flex:0 0 clamp(215px,22vw,285px);aspect-ratio:9/16;border-radius:22px;overflow:hidden;position:relative;scroll-snap-align:start;background:#000 center/cover no-repeat;transition:transform .4s}
    .so .story:hover{transform:translateY(-4px)}
    .so .story::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.35),transparent 24%,transparent 55%,rgba(0,0,0,.86))}
    .so .story .bar{position:absolute;top:12px;left:12px;right:12px;height:3px;border-radius:3px;background:rgba(255,255,255,.4);z-index:2}
    .so .story .wie{position:absolute;top:24px;left:12px;z-index:2;display:flex;gap:.5rem;align-items:center;font-size:.78rem;font-weight:700}
    .so .story .wie i{width:24px;height:24px;border-radius:50%;background:var(--orange);color:var(--on-orange);display:grid;place-items:center;font-style:normal;font-size:.7rem;font-weight:800;border:2px solid #fff}
    .so .story .cap{position:absolute;left:0;right:0;bottom:0;padding:1.1rem;z-index:2}
    .so .story .cap small{font-size:.68rem;letter-spacing:.14em;text-transform:uppercase;color:var(--orange-hero);font-weight:800}
    .so .story .cap h4{font-size:1.02rem;font-weight:800;line-height:1.25;margin-top:.2rem}
    .so .story .fase{position:absolute;inset:0}
    .so .nieuw{display:inline-block;background:var(--orange);color:var(--on-orange);font-size:.66rem;font-weight:800;padding:.15rem .5rem;border-radius:999px;margin-bottom:.35rem}
    .so .swipe{font-size:.85rem;color:rgba(255,255,255,.55);font-weight:700}

    .so .stappen{display:grid;grid-template-columns:1fr;gap:1.1rem}
    .so .stap{padding:1.9rem 1.6rem;border-radius:22px;background:var(--sand)}
    .so .stap b{font-family:Anton,sans-serif;font-weight:400;font-size:.95rem;color:#fff;background:var(--ink);border-radius:999px;padding:.3rem .8rem;display:inline-block;margin-bottom:1.1rem}
    .so .stap h3{font-size:1.15rem;font-weight:800;margin-bottom:.4rem}
    .so .stap p{font-size:.95rem;color:#545D56}
    .so .stap:last-child{background:var(--orange);color:var(--on-orange)}
    .so .stap:last-child p{color:inherit;opacity:.85}

    .so .over{background:var(--sand)}
    .so .over .wrap{display:grid;grid-template-columns:1fr;gap:3rem;align-items:center}
    .so .ofoto{position:relative}
    .so .ofoto .fo{border-radius:28px;aspect-ratio:4/5;background:#ccc center 30%/cover no-repeat}
    .so .ofoto .tag{position:absolute;right:1rem;bottom:2rem;background:var(--ink);color:#fff;padding:1.1rem 1.3rem;border-radius:18px;max-width:240px;box-shadow:0 25px 40px -20px rgba(0,0,0,.5)}
    .so .ofoto .tag b{font-family:Anton,sans-serif;font-weight:400;font-size:2.1rem;color:var(--orange-hero);display:block;line-height:1}
    .so .ofoto .tag span{font-size:.82rem;opacity:.8}
    .so .over h2{font-size:clamp(2.3rem,4.6vw,3.7rem);margin:.9rem 0 1.4rem}
    .so .over p{font-size:1.05rem;color:#3F4741;margin-bottom:1rem}
    .so .over blockquote{margin-top:1.8rem;padding:1.5rem 1.7rem;border-left:5px solid var(--orange);background:#fff;border-radius:0 18px 18px 0;font-family:'Instrument Serif',serif;font-style:italic;font-size:1.6rem;line-height:1.25}
    .so .over blockquote small{display:block;font-family:Manrope,sans-serif;font-style:normal;font-size:.78rem;font-weight:800;margin-top:.6rem;color:var(--orange-ink);letter-spacing:.1em;text-transform:uppercase}
    .so .partners{display:flex;flex-wrap:wrap;gap:.55rem;margin-top:1.8rem;align-items:center}
    .so .partners em{font-style:normal;font-size:.76rem;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--orange-ink);margin-right:.3rem}
    .so .partners span{padding:.45rem .95rem;border-radius:999px;border:1.5px solid #D9CCB4;font-weight:700;font-size:.86rem;background:var(--paper)}

    .so .revs{display:grid;grid-template-columns:1fr;gap:1rem}
    .so .rev{background:#fff;border:1px solid var(--line);border-radius:20px;padding:1.4rem 1.5rem;display:flex;gap:.9rem}
    .so .rev .av{flex:none;width:42px;height:42px;border-radius:50%;background:var(--ink);color:#fff;display:grid;place-items:center;font-weight:800}
    .so .rev .nm{font-weight:800;font-size:.92rem}
    .so .rev .st{color:var(--orange-ink);font-size:.85rem;letter-spacing:.1em}
    .so .rev q{display:block;margin-top:.3rem;color:#3F4741;quotes:"“" "”"}

    .so .kanalen{background:var(--ink);color:#fff;text-align:center;overflow:hidden}
    .so .kanalen h2{font-size:clamp(2.5rem,6vw,4.8rem);margin:1rem auto 1.1rem;max-width:16ch}
    .so .kanalen h2 em{font-style:normal;color:var(--orange-hero)}
    .so .kanalen p.lead{color:rgba(255,255,255,.7);max-width:36rem;margin:0 auto 2.2rem;font-size:1.05rem}
    .so .plat{display:flex;justify-content:center;gap:.8rem;flex-wrap:wrap}
    .so .plat a{display:flex;align-items:center;gap:.7rem;padding:.85rem 1.3rem;border-radius:999px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.13);font-weight:700}
    .so .plat a:hover{background:rgba(255,255,255,.14)}
    .so .plat small{opacity:.6;font-weight:600}
    .so .grid6{display:grid;grid-template-columns:repeat(3,1fr);gap:.55rem;margin-top:3.2rem}
    .so .grid6 a{aspect-ratio:9/16;border-radius:14px;background:#222 center/cover no-repeat;transition:transform .4s}

    .so .slot .wrap{display:grid;grid-template-columns:1fr;gap:2.5rem;align-items:center}
    .so .slot h2{font-size:clamp(2.5rem,5vw,4.3rem);margin:.9rem 0 1.2rem}
    .so .slot h2 .sf{color:var(--orange-ink)}
    .so .slot p{font-size:1.05rem;color:#4E5650}
    .so .lijnen{background:#fff;border-radius:26px;padding:1.2rem 1.6rem;border:1px solid var(--line);box-shadow:0 40px 80px -40px rgba(0,0,0,.3)}
    .so .lijn{display:flex;gap:1rem;align-items:center;padding:1.05rem 0;border-bottom:1px solid var(--line);font-weight:800}
    .so .lijn:last-child{border-bottom:0}
    .so .lijn .ci{width:46px;height:46px;border-radius:14px;background:var(--ink);color:var(--orange-hero);display:grid;place-items:center;flex:none}
    .so .lijn small{display:block;font-weight:600;color:#6A716B;font-size:.8rem}
    .so .lijn .pl{margin-left:auto;color:var(--orange-ink)}

    .so .ft{background:var(--ink);color:rgba(255,255,255,.62);padding:3rem 0 1.8rem;font-size:.9rem}
    .so .ft .groot{font-family:Anton,sans-serif;text-transform:uppercase;font-size:clamp(2.8rem,10vw,9rem);color:rgba(255,255,255,.06);line-height:.85;text-align:center;margin-bottom:1.8rem;white-space:nowrap;overflow:hidden}
    .so .ft .wrap > div{display:flex;flex-wrap:wrap;gap:.6rem 2rem;justify-content:space-between}
    .so .ft a:hover{color:#fff}

    @media(max-width:760px){.so .nav,.so .hd .btn{display:none}.so .stapel{height:430px}.so .sec{padding:4.5rem 0}.so .live{bottom:6%}}
    @media(min-width:700px){
      .so .dien{grid-template-columns:repeat(2,1fr)}
      .so .kaart.groot{grid-column:span 2}
      .so .stappen{grid-template-columns:repeat(2,1fr)}
      .so .revs{grid-template-columns:repeat(3,1fr)}
      .so .grid6{grid-template-columns:repeat(6,1fr);padding-bottom:1.6rem}
      .so .grid6 a:nth-child(even){transform:translateY(1.6rem)}
    }
    @media(min-width:980px){
      .so .hero .wrap{grid-template-columns:1.05fr 1fr}
      .so .stapel{height:min(76vh,640px)}
      .so .dien{grid-template-columns:repeat(3,1fr)}
      .so .kaart.groot{grid-column:auto;grid-row:span 2;min-height:420px}
      ${dienstenStaart > 1 ? `.so .dien > .kaart:last-child{grid-column:span ${dienstenStaart}}` : ""}
      .so .stappen{grid-template-columns:repeat(${Math.min(4, Math.max(voordelen.length, 1))},1fr)}
      .so .over .wrap{grid-template-columns:.9fr 1.1fr;gap:5rem}
      .so .ofoto .tag{right:-1.4rem}
      .so .slot .wrap{grid-template-columns:1fr 1.05fr;gap:4rem}
    }
    @media(prefers-reduced-motion:reduce){.so *{animation:none!important}}
  `;

  const dienstenEerst = diensten[0];
  const dienstenRest = diensten.slice(1);

  return (
    <div className="so" style={vars}>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      {(isConcept || isReview) && <VoorproefLabel isConcept={isConcept} slug={slug} />}

      <div style={{ position: "relative" }}>
        <header className="hd"><div className="hd-in">
          {m.logo_url
            ? <span className="logochip"><img src={m.logo_url} alt={naam} style={{ height: 32, width: "auto", display: "block" }} /></span>
            : <span className="logo"><i>{naam.trim().charAt(0).toUpperCase()}</i>{naam}</span>}
          <nav className="nav">
            <a href="#diensten">Diensten</a>
            <a href="#werk">Projecten</a>
            <a href="#over">Over</a>
            <a href="#contact">Contact</a>
          </nav>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <a className="btn by" href="#contact">{ctaTekst}</a>
            <MobielMenu tot={760} donker />
          </div>
        </div></header>

        <section className="hero donker" id="home"><div className="wrap">
          <div>
            <span className="eb">{eyebrow}</span>
            <h1 className="dp">{kopBase}{kopAcc ? <em>{kopAcc}</em> : null}{sloganRegel ? <span className="sf">{sloganRegel}</span> : null}</h1>
            {hero.subkop && <p className="lead">{hero.subkop}</p>}
            <div className="cta-rij">
              <a className="btn by" href="#contact">{ctaTekst} {PIJL}</a>
              <a className="btn bg" href="#werk">Bekijk het werk</a>
            </div>
            {stats.length > 0 ? (
              <div className="stats">
                {stats.map((s, i) => <div key={i}><b>{s.waarde}</b><span>{s.label}</span></div>)}
              </div>
            ) : usps.length > 0 ? (
              <div className="vinkjes">{usps.slice(0, 3).map((u, i) => <span key={i}>{u}</span>)}</div>
            ) : null}
          </div>
          <div className="stapel" aria-hidden="true">
            <figure className="s1" style={{ backgroundImage: `url(${JSON.stringify(stapel[0])})` }} />
            <figure className="s2" style={{ backgroundImage: `url(${JSON.stringify(stapel[1])})` }} />
            <figure className="s3" style={{ backgroundImage: `url(${JSON.stringify(stapel[2])})` }} />
            <div className="live"><i /><div>{hoofdHandle ? "Volg de klussen" : "Recent werk"}<small>{hoofdHandle ? `${hoofdHandle} op ${hoofdKanaal.label}` : naam}</small></div></div>
          </div>
        </div></section>
      </div>

      {band.length > 0 && (
        <div className="band" aria-hidden="true"><div className="band-in">
          {[...band, ...band, ...band, ...band].map((t, i) => <span key={i}>{t}</span>)}
        </div></div>
      )}

      {diensten.length > 0 && (
        <section className="sec" id="diensten"><div className="wrap">
          <div className="kop">
            <div><span className="eb">Wat ik doe</span><h2 className="dp">{diensten.length > 1 ? "Waar je mij voor belt" : dienstenEerst.titel}</h2></div>
            {c.over_ons && <p>{String(c.over_ons).split(/(?<=[.!?])\s+/).slice(0, 2).join(" ")}</p>}
          </div>
          <div className="dien">
            <a className="kaart groot" href={`/${slug}/dienst/0${modeQuery}`} style={{ backgroundImage: `url(${JSON.stringify(tegelFoto)})` }}>
              <div className="in">
                <h3>{dienstenEerst.titel}</h3>
                {dienstenEerst.omschrijving && <p>{dienstenEerst.omschrijving}</p>}
                <span className="ml">Lees meer &rarr;</span>
              </div>
            </a>
            {dienstenRest.map((d, i) => (
              <a className="kaart" key={i} href={`/${slug}/dienst/${i + 1}${modeQuery}`}>
                <span className="nr">{String(i + 2).padStart(2, "0")}</span>
                <h3>{d.titel}</h3>
                {d.omschrijving && <p>{d.omschrijving}</p>}
                <span className="ml">Lees meer &rarr;</span>
              </a>
            ))}
          </div>
        </div></section>
      )}

      <section className="sec klus donker" id="werk">
        <div className="wrap">
          <div className="kop">
            <div><span className="eb">Live vanaf de klus</span><h2 className="dp">Geen stockfoto's. Gewoon het echte werk.</h2></div>
            <span className="swipe">Swipe voor meer &rarr;</span>
          </div>
        </div>
        <div className="rij">
          {(projecten.length > 0 ? projecten : [null, null, null, null]).map((p, i) => (
            <a key={i} className="story" href={p ? `/${slug}/project/${i}${modeQuery}` : "#werk"}
               style={p && heeftFases(p) ? undefined : { backgroundImage: `url(${JSON.stringify((p && p.beeld_url) || nicheFoto(b.branche, i + 2))})` }}>
              {p && heeftFases(p) && <FaseFotos fases={p.fases} className="fase" />}
              <span className="bar" />
              <span className="wie"><i>{naam.trim().charAt(0).toUpperCase()}</i>{hoofdHandle ? hoofdHandle.replace(/^@/, "") : naam}</span>
              <div className="cap">
                {p && p.nieuw && <span className="nieuw">Net door jou geplaatst</span>}
                <small>{(p && p.plaats) || `Klus ${String(i + 1).padStart(2, "0")}`}</small>
                <h4>{p ? p.titel : "Hier komt je volgende klus"}</h4>
              </div>
            </a>
          ))}
        </div>
      </section>

      {voordelen.length > 0 && (
        <section className="sec"><div className="wrap">
          <div className="kop"><div><span className="eb">Waarom {naam}</span><h2 className="dp">Zo werk ik</h2></div></div>
          <div className="stappen">
            {voordelen.slice(0, 4).map((v, i) => (
              <div className="stap" key={i}><b>0{i + 1}</b><h3>{v.titel}</h3><p>{v.tekst}</p></div>
            ))}
          </div>
        </div></section>
      )}

      <section className="sec over" id="over"><div className="wrap">
        <div className="ofoto">
          <div className="fo" style={{ backgroundImage: `url(${JSON.stringify(overFoto)})` }} role="img" aria-label={naam} />
          {(stats[0] || b.regio) && (
            <div className="tag">
              {stats[0] ? <><b>{stats[0].waarde}</b><span>{stats[0].label}</span></> : <><b>Regio</b><span>{b.regio}</span></>}
            </div>
          )}
        </div>
        <div>
          <span className="eb">Over {naam}</span>
          <h2 className="dp">Het verhaal achter het werk</h2>
          {c.over_ons && String(c.over_ons).split(/\n+/).map((t, i) => <p key={i}>{t}</p>)}
          {b.regio && <p style={{ fontSize: ".92rem", color: "#6A716B" }}>Werkgebied: {b.regio}</p>}
          {(quote || b.slogan) && <blockquote>“{quote || b.slogan}”<small>{naam}</small></blockquote>}
          {partners.length > 0 && <div className="partners"><em>Bekend van samenwerkingen met</em>{partners.map((p, i) => <span key={i}>{p}</span>)}</div>}
        </div>
      </div></section>

      <section className="sec"><div className="wrap">
        <div className="kop"><div><span className="eb">Reviews</span><h2 className="dp">Wat klanten zeggen</h2></div>
          {b.google_business_url && <a className="btn bd" href={b.google_business_url}>Alle Google-reviews</a>}
        </div>
        <div className="revs">
          {(reviews.length > 0 ? reviews.slice(0, 3) : [null, null, null]).map((r, i) => (
            <div className="rev" key={i} style={r ? undefined : { opacity: 0.75 }}>
              <span className="av">{r ? String(r.naam || "K").charAt(0).toUpperCase() : "?"}</span>
              <div>
                <div className="nm">{r ? r.naam : "Klantnaam"}</div>
                <div className="st">{sterren(r && r.score)}</div>
                <q>{r ? r.tekst : REVIEW_PLEK}</q>
              </div>
            </div>
          ))}
        </div>
        <ReviewBrug content={c} isReview={isReview} />
      </div></section>

      {kanalen.length > 0 && (
        <section className="sec kanalen donker"><div className="wrap">
          <span className="eb">Volg de klussen</span>
          <h2 className="dp">Elke klus <em>live</em> in je feed</h2>
          <p className="lead">Van de eerste schop in de grond tot het eindresultaat. Kijk mee, stel je vraag of haal inspiratie voor je eigen project.</p>
          <div className="plat">
            {kanalen.map((k) => {
              const st = stats.find((s) => String(s.label).toLowerCase().includes(k.label.toLowerCase()));
              return <a key={k.k} href={k.url} target="_blank" rel="noopener"><Icoon soort={k.k} />{k.label}{st ? <small>{st.waarde}</small> : <small>{handleVan(k.url)}</small>}</a>;
            })}
          </div>
          {projecten.length >= 3 && (
            <div className="grid6">
              {projecten.slice(0, 6).map((p, i) => (
                <a key={i} href={hoofdKanaal.url} target="_blank" rel="noopener" aria-label={`Bekijk op ${hoofdKanaal.label}`} style={{ backgroundImage: `url(${JSON.stringify(beeld(i))})` }} />
              ))}
            </div>
          )}
        </div></section>
      )}

      <section className="sec slot" id="contact"><div className="wrap">
        <div>
          <span className="eb">Contact</span>
          <h2 className="dp">{cta.kop || <>Klus in gedachten? <span className="sf">Laat het weten.</span></>}</h2>
          {cta.tekst && <p>{cta.tekst}</p>}
        </div>
        <div className="lijnen">
          {wa && <a className="lijn" href={wa}><span className="ci"><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.5-3.9-4.7-4.1-.1-.2-1.1-1.5-1.1-2.8 0-1.3.7-2 1-2.3.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.3.5-.4.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.6 2 1.1 1 2 1.3 2.3 1.4.3.1.5.1.6-.1l.9-1.1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.2 1.2Z" /></svg></span><span>WhatsApp<small>Stuur een appje met een foto van je klus</small></span><span className="pl">{PIJL}</span></a>}
          {b.telefoon && <a className="lijn" href={`tel:${b.telefoon}`}><span className="ci"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" /></svg></span><span>{b.telefoon}<small>Direct bellen</small></span><span className="pl">{PIJL}</span></a>}
          {hoofdKanaal && <a className="lijn" href={hoofdKanaal.url} target="_blank" rel="noopener"><span className="ci"><Icoon soort={hoofdKanaal.k} /></span><span>{hoofdHandle}<small>Stuur een privébericht op {hoofdKanaal.label}</small></span><span className="pl">{PIJL}</span></a>}
          {b.email && <a className="lijn" href={`mailto:${b.email}`}><span className="ci"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 4h16v16H4z" /><path d="m4 6 8 7 8-7" /></svg></span><span>{b.email}<small>{b.openingstijden || "Mail je vraag"}</small></span><span className="pl">{PIJL}</span></a>}
        </div>
      </div></section>

      <footer className="ft"><div className="wrap">
        <div className="groot">{naam}</div>
        <div>
          <span>{[naam, b.adres].filter(Boolean).join(" · ")}{b.kvk ? ` · KvK ${b.kvk}` : ""}</span>
          {kanalen.length > 0 && <span>{kanalen.map((k, i) => <span key={k.k}>{i > 0 && " · "}<a href={k.url} target="_blank" rel="noopener">{k.label}</a></span>)}</span>}
          <span>&copy; {new Date().getFullYear()} · Website door StudioBaris</span>
        </div>
      </div></footer>
    </div>
  );
}
