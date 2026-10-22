// Maakt public/documenten/algemene-voorwaarden.pdf uit lib/voorwaarden-tekst.mjs.
// Gebruik (vanuit de map studiobaris-preview):
//   node scripts/voorwaarden-pdf.mjs > /tmp/voorwaarden.html
//   python3 -c "import weasyprint,sys; weasyprint.HTML('/tmp/voorwaarden.html', base_url='.').write_pdf('public/documenten/algemene-voorwaarden.pdf')"
import { VERSIE, DATUM, BEDRIJF, INLEIDING, ARTIKELEN, BIJLAGE } from "../lib/voorwaarden-tekst.mjs";
import { pathToFileURL } from "node:url";
import path from "node:path";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const font = pathToFileURL(path.resolve("public/fonts/plus-jakarta-sans/PlusJakartaSans-VF.woff2")).href;

function leden(a, n) {
  let h = "";
  if (a.definities) {
    h += "<ul class='def'>" + a.definities.map((d) => `<li><strong>${esc(d.term)}</strong>: ${esc(d.uitleg)}</li>`).join("") + "</ul>";
  }
  const strings = (a.leden || []).filter((x) => typeof x === "string").length;
  let t = 0;
  for (const l of a.leden || []) {
    if (typeof l !== "string") {
      h += "<ul class='sub'>" + l.lijst.map((x) => `<li>${esc(x)}</li>`).join("") + "</ul>";
      continue;
    }
    t += 1;
    h += strings > 1 ? `<p class='lid'><span class='nr'>${n}.${t}</span>${esc(l)}</p>` : `<p>${esc(l)}</p>`;
  }
  return h;
}

const voet = `${BEDRIJF.naam} · ${BEDRIJF.adres} · KvK ${BEDRIJF.kvk} · ${BEDRIJF.email} · ${BEDRIJF.website}`;

const html = `<!doctype html><html lang="nl"><head><meta charset="utf-8"><style>
@font-face { font-family: 'PJS'; src: url('${font}'); font-weight: 200 800; }
@page { size: A4; margin: 22mm 20mm 22mm 20mm;
  @bottom-center { content: "Algemene voorwaarden StudioBaris · versie ${VERSIE} · pagina " counter(page) " van " counter(pages); font-family: 'PJS'; font-size: 8pt; color: #888; } }
body { font-family: 'PJS', sans-serif; font-size: 9.6pt; line-height: 1.5; color: #222; }
.merk { font-size: 8pt; letter-spacing: 2px; text-transform: uppercase; color: #888; margin: 0; }
h1 { font-size: 20pt; margin: 2pt 0 2pt; }
.versie { color: #888; margin: 0 0 10pt; }
h2 { font-size: 11.5pt; margin: 14pt 0 4pt; page-break-after: avoid; }
h2.bijlage { font-size: 15pt; page-break-before: always; margin-top: 0; }
h3 { font-size: 10.5pt; margin: 11pt 0 3pt; page-break-after: avoid; }
p { margin: 0 0 4pt; }
p.lid { padding-left: 24pt; text-indent: -24pt; }
.nr { display: inline-block; width: 24pt; text-indent: 0; color: #888; }
ul.def { margin: 0 0 4pt; padding-left: 14pt; } ul.def li { margin-bottom: 2pt; }
ul.sub { margin: 0 0 4pt; padding-left: 38pt; }
.voet { margin-top: 18pt; color: #888; font-size: 8pt; }
</style></head><body>
<p class='merk'>StudioBaris</p>
<h1>Algemene voorwaarden</h1>
<p class='versie'>Versie ${VERSIE} · ${DATUM}</p>
<p>${esc(INLEIDING)}</p>
${ARTIKELEN.map((a, i) => `<h2>Artikel ${i + 1} — ${esc(a.titel)}</h2>${leden(a, i + 1)}`).join("\n")}
<h2 class='bijlage'>${esc(BIJLAGE.titel)}</h2>
<p>${esc(BIJLAGE.intro)}</p>
${BIJLAGE.artikelen.map((a, i) => `<h3>${i + 1}. ${esc(a.titel)}</h3>${leden(a, i + 1)}`).join("\n")}
<p class='voet'>${esc(voet)}</p>
</body></html>`;

process.stdout.write(html);
