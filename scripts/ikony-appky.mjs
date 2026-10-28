// Vygeneruje ikony appky: na plochu značku, do prohlížeče čárky.
//
// Na ploše je značka čitelná, protože ikona má 180 bodů. V prohlížeči má
// ikona šestnáct až osmačtyřicet a značka se v nich slije do skvrny — ve
// vyhledávání Safari z „TOUR DE PUB" zbylo „TOU" a kaňka pod tím. Malá
// ikona proto nese čárky: čtyři svislé a jedna přes ně, to, co appka celý
// večer počítá. V šestnácti bodech se to pozná a nic jiného to nepřipomíná.
//
// Kreslí se přes HTML obal, kde se SVG roztáhne na celou plochu — snímkovat
// přímo SVG se nesmí, to má vlastní rozměr a místo zmenšení se jen ořízne.
// Spuštění: node scripts/ikony-appky.mjs   (potřebuje Playwright)
import { chromium } from "/opt/node-tools/node_modules/playwright/index.mjs";
import { readFileSync, writeFileSync } from "node:fs";

const PODKLAD = "#2B2B23";
const KRESBA = "#F2E7CF";
const PROHLIZEC = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

const adr = (s) => new URL(s, import.meta.url);
const logo = readFileSync(adr("../public/logo.svg"), "utf8");

/** IKONY z ikony.ts bez TypeScriptu: je to jeden literál objektu, takže
 *  stačí vyříznout a vyhodnotit. Spouštět kvůli tomu TS loader je zbytečné. */
function nactiIkony() {
  const z = readFileSync(adr("../src/lib/ikony.ts"), "utf8");
  const telo = z.slice(z.indexOf("{", z.indexOf("export const IKONY")));
  return new Function("return " + telo.slice(0, telo.lastIndexOf("}") + 1))();
}

/** Kresba z ikony.ts jako SVG. Plocha je v barvě a výstřižky jsou průhledné,
 *  proto maska, ne dvě barvy (viz Ikona.tsx). */
function znak(jmeno) {
  const vrstvy = nactiIkony()[jmeno]
    .map(([druh, d]) => `<path d="${d}" fill="${druh === "i" ? "#fff" : "#000"}"/>`).join("");
  return `<svg viewBox="0 0 100 100" style="width:100%;height:100%;display:block">
  <mask id="m" maskUnits="userSpaceOnUse" x="-10" y="-10" width="120" height="120">${vrstvy}</mask>
  <rect x="-10" y="-10" width="120" height="120" fill="${KRESBA}" mask="url(#m)"/></svg>`;
}

const carky = znak("carka");

/** podil = jakou část hrany zabere kresba; u maskovatelné ikony musí být
 *  menší, protože systém ji ořízne do kruhu */
const stranka = (kresba, podil) =>
  `<html><body style="margin:0;width:100vw;height:100vh;background:${PODKLAD};
    display:grid;place-items:center;overflow:hidden">
    <div style="width:${podil * 100}%;color:${KRESBA};display:grid;place-items:center">
      <style>svg{width:100%;height:auto;display:block}</style>${kresba}</div></body></html>`;

const b = await chromium.launch({ executablePath: PROHLIZEC });
for (const [soubor, px, podil, kresba] of [
  ["ikona-180.png", 180, 0.74, logo],
  ["ikona-192.png", 192, 0.74, logo],
  ["ikona-512.png", 512, 0.74, logo],
  ["ikona-maskable-512.png", 512, 0.52, logo],
  // do prohlížeče: čárky, a o kus větší, protože mají řídkou kresbu
  ["ikona-48.png", 48, 0.78, carky],
  ["ikona-96.png", 96, 0.78, carky],
]) {
  const p = await b.newPage({ viewport: { width: px, height: px }, deviceScaleFactor: 1 });
  await p.setContent(stranka(kresba, podil));
  await p.waitForTimeout(80);
  await p.screenshot({ path: adr("../public/" + soubor).pathname });
  await p.close();
  console.log(soubor, px + "×" + px);
}
await b.close();

// Záložka a panel v prohlížeči: ta samá čárková značka jako v PNG.
writeFileSync(adr("../public/ikona.svg"),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
<rect width="100" height="100" rx="18" fill="${PODKLAD}"/>
<g transform="translate(50,50) scale(0.78) translate(-50,-50)">${
  carky.replace(/^<svg[^>]*>/, "").replace("</svg>", "")}</g></svg>\n`);
console.log("ikona.svg");
