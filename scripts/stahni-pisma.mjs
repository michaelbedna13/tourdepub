// Stáhne Bevan a Outfit z Google Fonts do pisma/, aby web fungoval offline
// a nic se nenačítalo z Googlu. Subsety se poznají podle unicode-range, ne podle
// pořadí – Bevan jich má tři (vietnamese, latin-ext, latin) a snadno se splete.
// Spuštění: node scripts/stahni-pisma.mjs
import { writeFileSync, mkdirSync } from "node:fs";

const UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36";
const CHCI = [
  ["Bevan", 400, "bevan"],
  ["Outfit", 400, "outfit-400"],
  ["Outfit", 500, "outfit-500"],
  ["Outfit", 600, "outfit-600"],
];

mkdirSync(new URL("../pisma/", import.meta.url), { recursive: true });

for (const [rodina, vaha, zaklad] of CHCI) {
  const css = await (await fetch(
    `https://fonts.googleapis.com/css2?family=${rodina.replace(/ /g, "+")}:wght@${vaha}&display=swap`,
    { headers: { "User-Agent": UA } })).text();

  // každý blok @font-face nese svůj unicode-range a svou adresu
  for (const blok of css.split("@font-face").slice(1)) {
    const url = blok.match(/url\((https:[^)]+)\)/)?.[1];
    const rozsah = blok.match(/unicode-range:\s*([^;]+);/)?.[1] || "";
    if (!url) continue;
    // latin = U+0000-00FF, latin-ext = U+0100-02BA; ostatní (vietnamese, cyrilice…) nepotřebujeme
    const druh = rozsah.includes("U+0000-00FF") ? "lat"
      : rozsah.includes("U+0100-02BA") ? "ext" : null;
    if (!druh) continue;
    const data = Buffer.from(await (await fetch(url, { headers: { "User-Agent": UA } })).arrayBuffer());
    const soubor = `${zaklad}-${druh}.woff2`;
    writeFileSync(new URL(`../pisma/${soubor}`, import.meta.url), data);
    console.log(soubor.padEnd(22), String(data.length).padStart(6), "B");
  }
}
