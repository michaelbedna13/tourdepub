// Stáhne písma z Google Fonts do src/assets/fonts/, aby se nic nenačítalo z Googlu
// a appka šla i bez signálu. Subsety se poznají podle unicode-range, ne podle
// pořadí – některá písma jich mají tři (vietnamese, latin-ext, latin) a snadno se splete:
// vzít první dva by znamenalo web bez Č, Ř, Š a Ů.
// Spuštění: node scripts/stahni-pisma.mjs
import { writeFileSync, mkdirSync } from "node:fs";

const UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36";
const CHCI = [
  // Nadpisy: těžký, ale úzký grotesk. Archivo Black ani Unbounded se nevešly –
  // „Lucky Bastard" i „Na dobré cestě" lámaly na dva řádky i v hero kartě,
  // Syne dokonce uprostřed slova („BLÁHOVK / A"). Bricolage se vejde na jeden.
  ["Bricolage Grotesque", 800, "nadpisy"],
  // Vyprávění v úvodu a v Pravidlech: psaná ruka. Jinde v appce není –
  // tři písma na jedné obrazovce vypadala jako nepořádek, ne jako záměr.
  // Architects Daughter nejde – nemá ť ani ď, a ty jsou v textech úkolů všude.
  ["Gloria Hallelujah", 400, "psaci"],
  // Všechno ostatní: ovládání, popisy, čísla.
  ["Outfit", 400, "outfit-400"],
  ["Outfit", 500, "outfit-500"],
  ["Outfit", 600, "outfit-600"],
];

mkdirSync(new URL("../src/assets/fonts/", import.meta.url), { recursive: true });

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
    writeFileSync(new URL(`../src/assets/fonts/${soubor}`, import.meta.url), data);
    console.log(soubor.padEnd(22), String(data.length).padStart(6), "B");
  }
}
