// Nakreslí rámeček razítka „Hotovo" na hero kartu a zapíše ho do src/lib/razitko.ts.
// Čistý obdélník vypadal jako štítek, ne jako razítko – tohle má okraj od ruky
// a uvnitř díru, takže je z toho nepravidelný kroužek, do kterého se vysází text.
// Spuštění: node scripts/kresli-razitko.mjs (náhodnost je pevná, výstup je pokaždé stejný)
import { writeFileSync } from "node:fs";
import { nasad, cut, rect } from "./cary.mjs";

// Na široký tvar sedí jemnější kymácení než na ikony: na proužku vysokém
// pár jednotek by se silnější rozvlnění slilo a z rámečku by byla klobása.
const VNEJSEK = { amp: 1.3, step: 11, tension: 0.42 };
const VNITREK = { amp: 1.1, step: 10, tension: 0.42 };

nasad(31);
// viewBox 0 0 172 60; tah rámečku je rozdíl mezi obrysy, tedy zhruba 5
const d = cut(rect(3, 3, 169, 57, 10), VNEJSEK) + cut(rect(8.5, 8.5, 163.5, 51.5, 7), VNITREK);

writeFileSync(new URL("../src/lib/razitko.ts", import.meta.url),
  `// Rámeček razítka „Hotovo" na hero kartě. Generuje scripts/kresli-razitko.mjs – needitovat ručně.\n` +
  `// Dvě obkroužení v jedné dráze: s fill-rule evenodd je z toho kroužek s dírou. viewBox 0 0 172 60.\n` +
  `export const RAZITKO = ${JSON.stringify(d)};\n`);
console.log("src/lib/razitko.ts:", d.length, "znaků");
