// Rozdělí slovní značku na jednotlivá písmena.
//
// Logo je jedna dráha s pravidlem evenodd (vzniklo obtažením obrázku, viz
// scripts/prevod-loga.py), takže počítadla — díry v O, U, D, P, B — jsou
// samostatné podcesty. Pro animaci písmeno po písmeni se musí rozdělit tak,
// aby díra zůstala u svého písmene; jinak by se vybarvila.
//
// Zapisuje LOGO_PISMENA do src/lib/logo.ts a rozdělenou značku do index.html.
// Spuštění: node scripts/pismena-loga.mjs   (po každém prevod-loga.py)
import { readFileSync, writeFileSync } from "node:fs";

const zdroj = readFileSync(new URL("../src/lib/logo.ts", import.meta.url), "utf8");
const cesta = zdroj.match(/LOGO_CESTA = "([^"]+)"/)[1];

// podcesty: každá začíná M a končí Z
const podcesty = cesta.match(/M[^M]*/g).map((s) => s.trim());

/** Obálka podcesty. Počítá i s řídicími body křivek — pro třídění do písmen
 *  to stačí a je to o řád jednodušší než počítat průsečíky bézierů. */
function obalka(d) {
  const c = d.match(/-?\d+(?:\.\d+)?/g).map(Number);
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (let i = 0; i + 1 < c.length; i += 2) {
    x0 = Math.min(x0, c[i]); x1 = Math.max(x1, c[i]);
    y0 = Math.min(y0, c[i + 1]); y1 = Math.max(y1, c[i + 1]);
  }
  return { x0, y0, x1, y1 };
}

const kusy = podcesty.map((d) => ({ d, o: obalka(d) }));
const uvnitr = (a, b) => a.x0 >= b.x0 && a.x1 <= b.x1 && a.y0 >= b.y0 && a.y1 <= b.y1;

// písmeno = podcesta, která není uvnitř žádné jiné; díry se k ní přilepí
const pismena = kusy.filter((k) => !kusy.some((j) => j !== k && uvnitr(k.o, j.o)));
for (const k of kusy) {
  if (pismena.includes(k)) continue;
  const rodic = pismena.find((p) => uvnitr(k.o, p.o));
  rodic.d += " " + k.d;
  rodic.o = { x0: Math.min(rodic.o.x0, k.o.x0), y0: Math.min(rodic.o.y0, k.o.y0),
              x1: Math.max(rodic.o.x1, k.o.x1), y1: Math.max(rodic.o.y1, k.o.y1) };
}

// pořadí čtení: po řádcích shora, v řádku zleva. Řádky se poznají podle toho,
// že se obálky svisle překrývají víc než z poloviny.
const stred = (o) => (o.y0 + o.y1) / 2;
pismena.sort((a, b) => stred(a.o) - stred(b.o));
const radky = [];
for (const p of pismena) {
  const r = radky.find((r) => r.some((q) => Math.min(q.o.y1, p.o.y1) - Math.max(q.o.y0, p.o.y0)
    > Math.min(q.o.y1 - q.o.y0, p.o.y1 - p.o.y0) * 0.5));
  if (r) r.push(p); else radky.push([p]);
}
for (const r of radky) r.sort((a, b) => a.o.x0 - b.o.x0);
const serazeno = radky.flat();

// Do src/lib/logo.ts vedle celé dráhy: tu pořád potřebuje ikona appky
// a patička Pravidel, kde se nic neanimuje.
const blok = `export const LOGO_PISMENA: string[] = [\n`
  + serazeno.map((p) => `  "${p.d}",`).join("\n") + `\n];\n`;
const nove = /export const LOGO_PISMENA[\s\S]*?^\];\n/m.test(zdroj)
  ? zdroj.replace(/export const LOGO_PISMENA[\s\S]*?^\];\n/m, blok)
  : zdroj.trimEnd() + "\n\n// Jednotlivá písmena značky, v pořadí čtení. Pro animaci v úvodu.\n" + blok;
writeFileSync(new URL("../src/lib/logo.ts", import.meta.url), nove);

// A do index.html, kde značka svítí od prvního snímku a kde se taky animuje.
const stranka = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const svg = `<svg class="logo" viewBox="0 0 962.6 651.3" fill="#F2E7CF" fill-rule="evenodd"`
  + ` role="img" aria-label="Tour de Pub">`
  + serazeno.map((p, i) => `<path style="--i:${i}" d="${p.d}"/>`).join("") + `</svg>`;
const upravena = stranka.replace(/(<!-- logo:start -->)[\s\S]*?(<!-- logo:end -->)/, `$1${svg}$2`);
if (upravena === stranka) console.error("POZOR: v index.html se značka nevyměnila");
writeFileSync(new URL("../index.html", import.meta.url), upravena);

console.error(`písmen: ${serazeno.length}, řádků: ${radky.length}, v řádcích: ${radky.map((r) => r.length).join("+")}`);
