// Vygeneruje ikony appky (na plochu, do manifestu) z logo.svg.
// Kreslí se přes HTML obal, kde se SVG roztáhne na celou plochu — snímkovat
// přímo SVG se nesmí, to má vlastní rozměr a místo zmenšení se jen ořízne.
// Spuštění: node scripts/ikony-appky.mjs [--pullitr]   (potřebuje Playwright)
import { chromium } from "playwright";
import { readFileSync, writeFileSync } from "node:fs";

const PODKLAD = "#2B2B23";
const KRESBA = "#F2E7CF";
const pullitr = process.argv.includes("--pullitr");

const logo = readFileSync(new URL("../public/logo.svg", import.meta.url), "utf8");
const { IKONY } = await import("../src/lib/ikony.ts");
const maskaPullitr = IKONY.piva
  .map(([d, p]) => `<path d="${p}" fill="${d === "i" ? "#fff" : "#000"}"/>`).join("");
const pullitrSvg = `<svg viewBox="0 0 100 100" style="width:100%;height:100%;display:block">
  <mask id="m" maskUnits="userSpaceOnUse" x="-10" y="-10" width="120" height="120">${maskaPullitr}</mask>
  <rect x="-10" y="-10" width="120" height="120" fill="${KRESBA}" mask="url(#m)"/></svg>`;

/** podil = jakou část hrany zabere kresba; u maskovatelné ikony musí být menší,
 *  protože systém ji ořízne do kruhu */
function stranka(podil) {
  const kresba = pullitr ? pullitrSvg : logo;
  return `<html><body style="margin:0;width:100vw;height:100vh;background:${PODKLAD};
    display:grid;place-items:center;overflow:hidden">
    <div style="width:${podil * 100}%;color:${KRESBA};display:grid;place-items:center">
      <style>svg{width:100%;height:auto;display:block}</style>${kresba}</div></body></html>`;
}

const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
for (const [soubor, px, podil] of [
  ["ikona-180.png", 180, 0.74],
  ["ikona-192.png", 192, 0.74],
  ["ikona-512.png", 512, 0.74],
  ["ikona-maskable-512.png", 512, 0.52],
]) {
  const p = await b.newPage({ viewport: { width: px, height: px }, deviceScaleFactor: 1 });
  await p.setContent(stranka(podil));
  await p.waitForTimeout(80);
  await p.screenshot({ path: new URL("../public/" + soubor, import.meta.url).pathname });
  await p.close();
  console.log(soubor, px + "×" + px);
}
await b.close();

// stejný tvar i jako SVG pro záložku v prohlížeči
writeFileSync(new URL("../public/ikona.svg", import.meta.url),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
<rect width="100" height="100" fill="${PODKLAD}"/>
<g transform="translate(50,50) scale(0.74) translate(-50,-50)">${
  pullitr
    ? `<mask id="m" maskUnits="userSpaceOnUse" x="-10" y="-10" width="120" height="120">${maskaPullitr}</mask>
<rect x="-10" y="-10" width="120" height="120" fill="${KRESBA}" mask="url(#m)"/>`
    : `<svg x="${(100 - 100) / 2}" y="26" width="100" height="48" viewBox="0 0 450.7 358.8" fill="${KRESBA}" fill-rule="evenodd">${
        logo.replace(/^[\s\S]*?<path/, "<path").replace("</svg>", "")}</svg>`
}</g></svg>\n`);
console.log("ikona.svg");
