// Vyrobí mapu zmuchlaného papíru pro účtenku: src/assets/papir-zmuchlany.png.
//
// Předtím to byl feTurbulence nasvícený feDiffuseLighting. Fraktální šum je
// ale oblý, takže z toho byly boule, ne přehyby — a zmuchlaný papír jsou
// rovné plošky oddělené ostrou hranou.
//
// Tady se výška počítá jako vzdálenost k nejbližšímu bodu (Worleyho buňky).
// Uvnitř buňky roste rovnoměrně, takže je ploška rovná; na hranici buněk se
// směr zlomí a vznikne ostrý hřbet. Přesně to dělá papír, co byl v kapse.
// Dvě vrstvy: velké plochy a přes ně drobnější vrásky.
//
// Z výšky se spočítá normála a nasvítí se zleva shora. Výsledek je šedá mapa
// se středem na 128, takže se v CSS míchá přes overlay: rovná plocha papír
// nechá být a vidět jsou jenom přehyby.
//
// Spuštění: node scripts/zmuchlani.mjs
import { writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

const W = 240, H = 620;

// pevná náhodnost, ať je papír po každém spuštění stejný
let semeno = 20260427;
const rnd = () => (semeno = (semeno * 1664525 + 1013904223) >>> 0) / 4294967296;

/** Jedna vrstva zmuchlání. Každá buňka dostane vlastní náklon, takže je
 *  uvnitř rovná jako ploška papíru; na hranici dvou buněk se náklon zlomí
 *  a tam je přehyb. Vrací pro každý bod náklon plošky. */
function plosky(pocet, sila) {
  const body = [...Array(pocet)].map(() => {
    const a = rnd() * Math.PI * 2;
    const k = (0.35 + rnd() * 0.65) * sila;
    return { x: rnd() * W, y: rnd() * H, dx: Math.cos(a) * k, dy: Math.sin(a) * k };
  });
  const nx = new Float32Array(W * H), ny = new Float32Array(W * H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      let d1 = Infinity, i1 = 0;
      for (let i = 0; i < body.length; i++) {
        const d = (x - body[i].x) ** 2 + (y - body[i].y) ** 2;
        if (d < d1) { d1 = d; i1 = i; }
      }
      const j = y * W + x;
      nx[j] = body[i1].dx; ny[j] = body[i1].dy;
    }
  return { nx, ny };
}

/** Rozmázne pole. Bez toho je hranice buněk ostrá jak střep a z papíru je
 *  rozbité sklo; papír se v přehybu ohne, takže přes pár bodů přejde. */
function rozmaz(pole, r) {
  const a = new Float32Array(pole.length), b = new Float32Array(pole.length);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      let s = 0, n = 0;
      for (let i = -r; i <= r; i++) { const u = x + i; if (u >= 0 && u < W) { s += pole[y * W + u]; n++; } }
      a[y * W + x] = s / n;
    }
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      let s = 0, n = 0;
      for (let i = -r; i <= r; i++) { const u = y + i; if (u >= 0 && u < H) { s += a[u * W + x]; n++; } }
      b[y * W + x] = s / n;
    }
  return b;
}

const hrube = plosky(22, 0.24);   // velké plochy
const jemne = plosky(90, 0.12);  // vrásky přes ně
for (const [v, r] of [[hrube, 2], [jemne, 1]]) { v.nx = rozmaz(v.nx, r); v.ny = rozmaz(v.ny, r); }

// Světlo zleva shora, jako na fotce z hospody.
const SVETLO = (() => { const v = [-0.52, -0.62, 0.59]; const l = Math.hypot(...v); return v.map((c) => c / l); })();
// Kreslí se jenom stíny: ploška natočená od světla ztmavne, natočená ke
// světlu zůstane bílá. Papír je krémový, takže světlo navíc stejně není vidět
// a overlay by rozdíly na světlém podkladu smáčkl do neznatelného oparu —
// multiply se stínem drží přehyby vidět.
const SILA = 0.85;  // jak hluboký je stín v přehybu

// Nejdřív nasvícení plošek, pak z něj horní propust: od nasvícení se odečte
// jeho vlastní rozmazání. Zůstane jenom to, co se mění na krátkou vzdálenost,
// tedy přehyby — široké plochy se vyruší. Bez toho z papíru byly maskáče:
// velké tmavé a světlé kusy, ale ani jeden přehyb vidět nebyl.
const svit = new Float32Array(W * H);
const rovna = SVETLO[2]; // nasvícení rovné plochy – od něj se počítá odchylka
for (let j = 0; j < W * H; j++) {
  const gx = hrube.nx[j] + jemne.nx[j], gy = hrube.ny[j] + jemne.ny[j];
  const d = Math.hypot(gx, gy, 1);
  svit[j] = (-gx * SVETLO[0] - gy * SVETLO[1] + SVETLO[2]) / d - rovna;
}
const siroky = rozmaz(svit, 14);

const px = new Uint8Array(W * H);
for (let j = 0; j < W * H; j++)
  px[j] = Math.max(0, Math.min(255, Math.round(255 * (1 - Math.max(0, siroky[j] - svit[j]) * SILA))));

// ---- PNG, šedý 8bit, řádkový filtr „Up" (hladké přechody se tím zkrátí) ----
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
const syrove = Buffer.alloc((W + 1) * H);
for (let y = 0; y < H; y++) {
  syrove[y * (W + 1)] = 2;
  for (let x = 0; x < W; x++)
    syrove[y * (W + 1) + 1 + x] = (px[y * W + x] - (y ? px[(y - 1) * W + x] : 0)) & 0xff;
}
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; ihdr[9] = 0; // 8 bitů, šedá
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  kus("IHDR", ihdr),
  kus("IDAT", deflateSync(syrove, { level: 9 })),
  kus("IEND", Buffer.alloc(0)),
]);
const kam = new URL("../src/assets/papir-zmuchlany.png", import.meta.url);
writeFileSync(kam, png);
console.log("src/assets/papir-zmuchlany.png:", W, "×", H, "–", Math.round(png.length / 1024), "kB");
