// Převede obrázek loga na SVG dráhy do logo.svg.
// Běží přes Python (potracer + Pillow), protože v Node obdoba není.
// Spuštění: node scripts/prevod-loga.mjs <cesta-k-obrazku>
import { execFileSync } from "node:child_process";
const zdroj = process.argv[2];
if (!zdroj) { console.error("Použití: node scripts/prevod-loga.mjs <obrazek>"); process.exit(1); }
execFileSync("python3", [new URL("prevod-loga.py", import.meta.url).pathname, zdroj], { stdio: "inherit" });
