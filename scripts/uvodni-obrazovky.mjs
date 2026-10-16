// Vygeneruje úvodní obrazovky pro iPhone (apple-touch-startup-image) do uvodni/
// a vypíše odpovídající <link> značky do konzole.
// iOS bez nich ukáže při spuštění appky z plochy jen prázdnou barvu.
// Spuštění: node scripts/uvodni-obrazovky.mjs   (potřebuje Playwright)
import { chromium } from "playwright";
import { readFileSync, mkdirSync } from "node:fs";

const PODKLAD = "#070E0A";
const logo = readFileSync(new URL("../public/logo.svg", import.meta.url), "utf8");

// šířka × výška v bodech displeje a poměr pixelů; pokrývá iPhony od SE po 16 Pro Max
const ZARIZENI = [
  [320, 568, 2], [375, 667, 2], [414, 736, 3], [375, 812, 3],
  [414, 896, 2], [414, 896, 3], [390, 844, 3], [428, 926, 3],
  [393, 852, 3], [430, 932, 3], [402, 874, 3], [440, 956, 3],
];

mkdirSync(new URL("../uvodni/", import.meta.url), { recursive: true });
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const znacky = [];

for (const [w, h, r] of ZARIZENI) {
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: r });
  await p.setContent(`<html><body style="margin:0;height:100vh;background:${PODKLAD};
    display:grid;place-items:center">
    <div style="width:${Math.round(w * 0.52)}px;color:#EFEBE0">${logo}</div></body></html>`);
  const soubor = `uvodni/${w}x${h}@${r}x.png`;
  await p.screenshot({ path: new URL("../public/" + soubor, import.meta.url).pathname });
  await p.close();
  znacky.push(`<link rel="apple-touch-startup-image" href="${soubor}"\n  media="(device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${r}) and (orientation: portrait)">`);
}
await b.close();
console.log(znacky.join("\n"));
