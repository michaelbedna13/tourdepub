// Vygeneruje náhledový obrázek pro sdílení odkazu (public/nahled.png).
//
// Když se odkaz pošle do zprávy, vezme si appka z HTML og:image. Bez něj
// ukáže iMessage i WhatsApp jen holý proužek s názvem — proto tohle.
//
// Je to značka na podkladu appky, nic víc. Byla pod ní řádka červených
// čárek, ale náhled má být čistý — v seznamu zpráv je malý a každá další
// věc v něm ubírá té jediné, kterou si má člověk spojit s appkou.
//
// Žádný vysázený text: Hagrid je z Adobe Fonts a při generování se nemusí
// načíst, kdežto logo je kresba v SVG a vyjde pokaždé stejně. Zbytek
// sdělení nese og:description.
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
const PROHLIZEC = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

const adr = (s) => new URL(s, import.meta.url);
const logo = readFileSync(adr("../public/logo.svg"), "utf8");
const zrno = readFileSync(adr("../src/assets/zrno-tisk.svg"), "utf8");

const stranka = `<html><body style="margin:0;width:100vw;height:100vh;background:${PODKLAD};
  display:grid;place-items:center;overflow:hidden;position:relative">
  <div style="width:600px;color:${KREMOVA}">
    <style>svg{width:100%;height:auto;display:block}</style>${logo}</div>
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
