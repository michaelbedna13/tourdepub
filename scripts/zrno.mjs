// Vyrobí zrno s průhledným podkladem: src/assets/zrno.png.
//
// Jsou to bílé a černé tečky s nízkou průhledností na průhledném podkladu,
// takže se přes appku jenom normálně překryjí.
//
// Dřív se zrno míchalo přes mix-blend-mode. Míchání je hezčí — je úměrné
// podkladu, takže na tmavém nepřepaluje — jenže kvůli němu musí prohlížeč
// složit CELÝ obsah pod vrstvou do jednoho obrázku, aby měl s čím míchat,
// a takový obrázek iOS při posouvání překresluje v nižším rozlišení: text
// nahoře pak změkne. Je to ta samá příčina, jakou měla maska na záři.
//
// 192 px: dělí se dvěma i třemi, takže na každé hustotě displeje padne
// jeden pixel obrázku přesně na jeden pixel displeje a zrno je ostré.
//
// Spuštění: node scripts/zrno.mjs
import { writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

const N = 192;
const ALFA = 0.052;      // jak silná je jedna tečka
const HUSTOTA = 0.55;    // kolik plochy vůbec nějakou tečku dostane

let semeno = 7310241;
const rnd = () => (semeno = (semeno * 1664525 + 1013904223) >>> 0) / 4294967296;

const px = Buffer.alloc(N * N * 4);
for (let i = 0; i < N * N; i++) {
  const r = rnd();
  if (r > HUSTOTA) continue;               // průhledné místo, podklad zůstane
  const bila = rnd() < 0.5;
  // síla tečky kolísá, ať to není rastr stejných bodů
  const a = Math.round(255 * ALFA * (0.45 + rnd() * 1.1));
  const v = bila ? 255 : 0;
  px[i * 4] = v; px[i * 4 + 1] = v; px[i * 4 + 2] = v; px[i * 4 + 3] = a;
}

const tabulka = [...Array(256)].map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = tabulka[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const kus = (typ, data) => {
  const d = Buffer.concat([Buffer.from(typ, "ascii"), data]);
  const delka = Buffer.alloc(4); delka.writeUInt32BE(data.length);
  const kontrola = Buffer.alloc(4); kontrola.writeUInt32BE(crc(d));
  return Buffer.concat([delka, d, kontrola]);
};
const syrove = Buffer.alloc((N * 4 + 1) * N);
for (let y = 0; y < N; y++) {
  syrove[y * (N * 4 + 1)] = 0;  // bez řádkového filtru: šum se stejně nekomprimuje
  px.copy(syrove, y * (N * 4 + 1) + 1, y * N * 4, (y + 1) * N * 4);
}
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(N, 0); ihdr.writeUInt32BE(N, 4);
ihdr[8] = 8; ihdr[9] = 6;  // 8 bitů, RGBA
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  kus("IHDR", ihdr), kus("IDAT", deflateSync(syrove, { level: 9 })), kus("IEND", Buffer.alloc(0)),
]);
writeFileSync(new URL("../src/assets/zrno.png", import.meta.url), png);
console.log("src/assets/zrno.png:", N, "×", N, "–", Math.round(png.length / 1024), "kB");
