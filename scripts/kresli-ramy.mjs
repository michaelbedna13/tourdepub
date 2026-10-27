// Vystřihne rámy karet a zapíše je do src/lib/ramy.ts.
//
// Karty v appce byly obdélníky se zakulacenými rohy, zatímco všechno
// nakreslené — ikony, kresby úkolů, čmáranice v úvodu — má obrys křivý jako
// stříhaný tupýma nůžkama. Tohle je ta samá ruka, jen na kartě.
//
// Cesty se kreslí v pixelech té karty a teprve pak se podělí její šířkou
// a výškou, takže vyjdou v souřadnicích 0–1 (clipPathUnits="objectBoundingBox")
// a karta se jimi ořízne v jakékoli velikosti. Proto je na každý tvar karty
// vlastní rám: kdyby se jeden roztahoval, kymácení by se na široké kartě
// natáhlo do stran a na vysoké nahoru a dolů.
//
// Kymácení je v absolutních pixelech, ne v procentech karty — střih nůžkami
// je pokaždé stejně velký, ať je papír jakkoli široký.
//
// Spuštění: node scripts/kresli-ramy.mjs
import { writeFileSync } from "node:fs";
import { nasad, cut } from "./cary.mjs";

/** Obdélník se zakulacenými rohy. rect() z cary.mjs dělá roh jedním zkosením
 *  (dva body), což při hustším vzorkování zůstane useknutý jak oktagon; tady
 *  se roh projede po oblouku, takže je kulatý, než do něj sáhnou nůžky. */
function zakulacenyRam(w, h, r, kroku = 6) {
  const rohy = [[w - r, h - r, 0], [r, h - r, 90], [r, r, 180], [w - r, r, 270]];
  const body = [];
  for (const [cx, cy, od] of rohy)
    for (let i = 0; i <= kroku; i++) {
      const a = ((od + (i / kroku) * 90) * Math.PI) / 180;
      body.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
  return body;
}

/** Přepočítá dráhu z pixelů karty na souřadnice 0–1. Čísla v dráze jdou
 *  v párech x y (M jeden pár, C tři), takže stačí střídat dělitele. */
function naPomer(d, w, h) {
  let i = 0;
  return d.replace(/-?\d+(?:\.\d+)?/g, (c) => {
    const v = Number(c) / (i++ % 2 === 0 ? w : h);
    return String(Math.round(v * 10000) / 10000);
  });
}

// Tvary karet: šířka a výška v bodech, jak vycházejí na telefonu.
const KARTY = {
  hero:    [342, 330, 24],   // karta štace na Hře
  kat:     [342, 152, 24],   // karta kategorie na Úkolech
  katMala: [342, 112, 24],   // ta samá na Hře, nižší
  ukol:    [165, 248, 24],   // dlaždice úkolu v galerii
  detail:  [340, 420, 24],   // detail úkolu
};

const out = [];
for (const [jm, [w, h, r]] of Object.entries(KARTY)) {
  nasad(31 + jm.length * 19); // pevná náhodnost na tvar
  // step je dlouhý schválně: střih nůžkami má po hraně pár vln, ne pilu
  const d = cut(zakulacenyRam(w, h, r), { amp: 2.1, step: 16, tension: .5 });
  out.push(`  ${jm}: "${naPomer(d, w, h)}",`);
}
writeFileSync(new URL("../src/lib/ramy.ts", import.meta.url),
  `// Rámy karet: obrys křivý jako stříhaný tupýma nůžkama, ta samá ruka jako\n` +
  `// ikony a kresby. Souřadnice jsou 0–1 (clipPathUnits="objectBoundingBox"),\n` +
  `// takže se cesta přizpůsobí velikosti karty.\n` +
  `// Generuje scripts/kresli-ramy.mjs – needitovat ručně.\n` +
  `export const RAMY = {\n${out.join("\n")}\n} satisfies Record<string, string>;\n`);
console.log("src/lib/ramy.ts:", Object.keys(KARTY).length, "rámů");
