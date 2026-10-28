// Vygeneruje náhledový obrázek pro sdílení odkazu (public/nahled.png).
//
// Když se odkaz pošle do zprávy, vezme si appka z HTML og:image. Bez něj
// ukáže iMessage i WhatsApp jen holý proužek s názvem — proto tohle.
//
// Je to značka na podkladu appky, nic víc. Žádný vysázený text: Hagrid je
// z Adobe Fonts a při generování se nemusí načíst, kdežto logo je kresba
// v SVG a vyjde pokaždé stejně. Zbytek sdělení nese og:description.
//
// Rozměr 1200×630 je poměr 1,91:1, se kterým počítají Facebook, Twitter
// i iMessage. Menší obrázek si některé z nich zmenší do čtverečku vedle
// textu místo velké karty.
//
// Spuštění: node scripts/nahled.mjs   (potřebuje Playwright)
import { chromium } from "/opt/node-tools/node_modules/playwright/index.mjs";
import { readFileSync } from "node:fs";

const PODKLAD = "#2B2B23";
const KREMOVA = "#F2E7CF";
const CERVENA = "#E5331F";
const PROHLIZEC = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

const adr = (s) => new URL(s, import.meta.url);
const logo = readFileSync(adr("../public/logo.svg"), "utf8");
const zrno = readFileSync(adr("../src/assets/zrno-tisk.svg"), "utf8");

/** Čárka z ikon appky. Je to ta samá kresba, co nese ikona v prohlížeči. */
function carka() {
  const z = readFileSync(adr("../src/lib/ikony.ts"), "utf8");
  const telo = z.slice(z.indexOf("{", z.indexOf("export const IKONY")));
  const ikony = new Function("return " + telo.slice(0, telo.lastIndexOf("}") + 1))();
  const vrstvy = ikony.carka
    .map(([druh, d]) => `<path d="${d}" fill="${druh === "i" ? "#fff" : "#000"}"/>`).join("");
  return `<svg viewBox="0 0 100 100" style="width:100%;height:100%;display:block">
    <mask id="c" maskUnits="userSpaceOnUse" x="-10" y="-10" width="120" height="120">${vrstvy}</mask>
    <rect x="-10" y="-10" width="120" height="120" fill="${CERVENA}" mask="url(#c)"/></svg>`;
}

const stranka = `<html><body style="margin:0;width:100vw;height:100vh;background:${PODKLAD};
  display:grid;place-items:center;overflow:hidden;position:relative">
  <div style="display:grid;justify-items:center;gap:52px">
    <div style="width:560px;color:${KREMOVA}">
      <style>svg{width:100%;height:auto;display:block}</style>${logo}</div>
    <div style="display:flex;gap:30px">${
      Array.from({ length: 5 }, () => `<div style="width:64px;height:64px">${carka()}</div>`).join("")
    }</div>
  </div>
  <!-- Tiskové zrno přes celou plochu, to samé, co nesou karty v appce. -->
  <div style="position:absolute;inset:0;mix-blend-mode:multiply;opacity:.55;
    background-image:url('data:image/svg+xml,${encodeURIComponent(zrno)}');
    background-size:150px 150px"></div>
</body></html>`;

const b = await chromium.launch({ executablePath: PROHLIZEC });
const p = await b.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await p.setContent(stranka);
await p.waitForTimeout(200);
await p.screenshot({ path: new URL("../public/nahled.png", import.meta.url).pathname });
await b.close();
console.log("public/nahled.png 1200×630");
