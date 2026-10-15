// Nakreslí ikony Tour de Pub a zapíše je do ikony.js.
// Styl: tlusté černé siluety s bílými výstřižky, obrys křivý jako stříhaný tupýma nůžkama.
// Vrstvy v pořadí: "i" = papír (barva textu), "c" = výstřižek (průhledný).
// Tenké tahy se v malém slijí, proto je všechno tlusté. viewBox 0 0 100 100.
// Spuštění: node scripts/kresli-ikony.mjs (bez závislostí; náhodnost je pevná, výstup je pokaždé stejný)
import { writeFileSync } from "node:fs";

let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const n1 = (v) => Math.round(v * 10) / 10;
const TAU = Math.PI * 2;

/** Dorovná body po obvodu, ať je obrys hustší a dá se na něm rozehrát nepravidelnost. */
function resample(pts, step) {
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length];
    const d = Math.hypot(x2 - x1, y2 - y1), k = Math.max(1, Math.round(d / step));
    for (let j = 0; j < k; j++) out.push([x1 + ((x2 - x1) * j) / k, y1 + ((y2 - y1) * j) / k]);
  }
  return out;
}

/** Uzavřený tvar přes body s křivým okrajem. amp = jak moc se střih kymácí, step = jak hustě. */
function cut(pts, { amp = 2.4, step = 9, tension = 0.42, nicks = 0 } = {}) {
  const p = resample(pts, step);
  const n = p.length;
  // střed kvůli zářezům dovnitř
  const cx = p.reduce((s, q) => s + q[0], 0) / n, cy = p.reduce((s, q) => s + q[1], 0) / n;
  // kymácení je plynulé (součet dvou sinů s náhodnou fází), ne bodový šum – jinak je okraj roztřepený jak pila
  const f1 = 1.5 + rnd() * 2, f2 = 4 + rnd() * 3, ph1 = rnd() * TAU, ph2 = rnd() * TAU;
  const q = p.map(([x, y], i) => {
    const t = (i / n) * TAU;
    let off = Math.sin(t * f1 + ph1) * amp + Math.sin(t * f2 + ph2) * amp * 0.4 + (rnd() - 0.5) * amp * 0.5;
    const dx = x - cx, dy = y - cy, len = Math.hypot(dx, dy) || 1;
    return [x + (dx / len) * off, y + (dy / len) * off];
  });
  // pár zářezů dovnitř, jak když nůžky cvaknou nakřivo
  for (let k = 0; k < nicks; k++) {
    const i = Math.floor(rnd() * n), [x, y] = q[i];
    const dx = x - cx, dy = y - cy, len = Math.hypot(dx, dy) || 1;
    q[i] = [x - (dx / len) * (amp * 1.6), y - (dy / len) * (amp * 1.6)];
  }
  let d = `M${n1(q[0][0])} ${n1(q[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = q[(i - 1 + n) % n], p1 = q[i], p2 = q[(i + 1) % n], p3 = q[(i + 2) % n];
    const c1 = [p1[0] + ((p2[0] - p0[0]) * tension) / 3, p1[1] + ((p2[1] - p0[1]) * tension) / 3];
    const c2 = [p2[0] - ((p3[0] - p1[0]) * tension) / 3, p2[1] - ((p3[1] - p1[1]) * tension) / 3];
    d += `C${n1(c1[0])} ${n1(c1[1])} ${n1(c2[0])} ${n1(c2[1])} ${n1(p2[0])} ${n1(p2[1])}`;
  }
  return d + "Z";
}

const ell = (cx, cy, rx, ry = rx, n = 16, rot = 0) =>
  [...Array(n)].map((_, i) => { const a = (i / n) * TAU + rot; return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]; });
const rect = (x1, y1, x2, y2, r = 3) => [[x1 + r, y1], [x2 - r, y1], [x2, y1 + r], [x2, y2 - r], [x2 - r, y2], [x1 + r, y2], [x1, y2 - r], [x1, y1 + r]];
const rot = (pts, deg, cx = 50, cy = 50) => { const a = (deg * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a); return pts.map(([x, y]) => [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c]); };
const star = (cx, cy, R, r, k = 5, rot0 = -Math.PI / 2) => [...Array(k * 2)].map((_, i) => { const a = rot0 + (i * Math.PI) / k; const rr = i % 2 ? r : R; return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]; });
/** Tlustá čára jako obdélník mezi dvěma body – tahy musí být tlusté, ne vlásek. */
const stroke = (x1, y1, x2, y2, w) => {
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1, nx = (-dy / len) * w / 2, ny = (dx / len) * w / 2;
  return [[x1 + nx, y1 + ny], [x2 + nx, y2 + ny], [x2 - nx, y2 - ny], [x1 - nx, y1 - ny]];
};
const I = (d) => ["i", d], C = (d) => ["c", d];

const ROUGH = { amp: 2.2, step: 8, tension: 0.42 };
const HRUBE = { amp: 3.0, step: 7, tension: 0.4, nicks: 2 };

const IKONY = {
  // ---------- jednotka bodů ----------
  // půllitr: tělo, ucho, pěna navrch, dva výstřižky jako odlesk
  piva: () => [
    // ucho
    I(cut(ell(76, 58, 14, 16, 14), { ...ROUGH, amp: 1.8 })),
    C(cut(ell(76, 58, 6, 8, 12), { ...ROUGH, amp: 1.2 })),
    // tělo
    I(cut([[24, 34], [46, 32], [66, 34], [67, 60], [64, 88], [46, 91], [27, 88], [24, 60]], HRUBE)),
    // pěna přes okraj
    I(cut([[19, 38], [19, 27], [29, 20], [40, 24], [49, 18], [60, 23], [70, 20], [77, 28], [73, 40], [54, 43], [36, 42]], { ...ROUGH, amp: 2, tension: 0.5 })),
    // dva tučné odlesky
    C(cut(rect(33, 50, 41, 80, 3), { ...ROUGH, amp: 1.3, step: 7 })),
    C(cut(rect(49, 55, 57, 82, 3), { ...ROUGH, amp: 1.3, step: 7 })),
  ],

  // ---------- kategorie úkolů ----------
  // Kecy a šmečka: bublina s pusou
  kecy: () => [
    I(cut([[14, 44], [18, 24], [40, 14], [64, 15], [85, 25], [89, 45], [80, 63], [54, 71], [36, 71], [24, 86], [26, 67], [16, 59]], HRUBE)),
    C(cut(ell(40, 40, 7.5, 7.5, 12), { ...ROUGH, amp: 1.3 })),
    C(cut(ell(60, 40, 7.5, 7.5, 12), { ...ROUGH, amp: 1.3 })),
  ],
  // Tělo v luftě: postava ve výskoku, ruce nahoře
  telo: () => [
    I(cut(ell(50, 20, 13, 13, 14), { ...ROUGH, amp: 1.7 })),
    // trup
    I(cut(rect(40, 34, 60, 66, 5), { ...ROUGH, amp: 2 })),
    // ruce nahoru do V
    I(cut(stroke(42, 40, 18, 16, 12), { ...ROUGH, amp: 1.7, step: 7 })),
    I(cut(stroke(58, 40, 82, 16, 12), { ...ROUGH, amp: 1.7, step: 7 })),
    // nohy od sebe
    I(cut(stroke(45, 62, 26, 90, 12), { ...ROUGH, amp: 1.7, step: 7 })),
    I(cut(stroke(55, 62, 74, 90, 12), { ...ROUGH, amp: 1.7, step: 7 })),
  ],
  // Žranice a divadlo: vidlička, všechno tlusté ať to drží i v malém
  zranice: () => [
    // násada
    I(cut(rect(42, 46, 58, 90, 5), { ...ROUGH, amp: 1.9 })),
    // hlava a tři hroty
    I(cut(rect(28, 40, 72, 56, 5), { ...ROUGH, amp: 1.9 })),
    I(cut(rect(28, 10, 40, 46, 4), { ...ROUGH, amp: 1.7 })),
    I(cut(rect(44, 10, 56, 46, 4), { ...ROUGH, amp: 1.7 })),
    I(cut(rect(60, 10, 72, 46, 4), { ...ROUGH, amp: 1.7 })),
  ],

  // ---------- hra ----------
  // hospoda: sud – domek by se pletl s ikonou Dnes
  hospoda: () => [
    I(cut([[26, 16], [50, 12], [74, 16], [84, 50], [74, 88], [50, 92], [26, 88], [16, 50]], HRUBE)),
    C(cut(rect(18, 34, 82, 43, 3), { ...ROUGH, amp: 1.4, step: 7 })),
    C(cut(rect(18, 58, 82, 67, 3), { ...ROUGH, amp: 1.4, step: 7 })),
  ],
  // mapa: špendlík
  mista: () => [
    I(cut([[50, 90], [30, 60], [24, 42], [30, 24], [50, 14], [70, 24], [76, 42], [70, 60]], HRUBE)),
    C(cut(ell(50, 38, 11, 11, 14), { ...ROUGH, amp: 1.6 })),
  ],
  // čárka: čtyři svislé a jedna přes ně, jak se počítá v hospodě
  carka: () => [
    I(cut(stroke(24, 20, 20, 76, 9), { ...ROUGH, amp: 1.6, step: 7 })),
    I(cut(stroke(42, 20, 39, 76, 9), { ...ROUGH, amp: 1.6, step: 7 })),
    I(cut(stroke(60, 21, 58, 77, 9), { ...ROUGH, amp: 1.6, step: 7 })),
    I(cut(stroke(78, 20, 76, 76, 9), { ...ROUGH, amp: 1.6, step: 7 })),
    I(cut(stroke(12, 66, 88, 30, 9), { ...ROUGH, amp: 1.7, step: 7 })),
  ],
  // parta: dvě hlavy a ramena, tři se v malém slily do kaše
  parta: () => [
    I(cut(ell(32, 28, 15, 15, 14), { ...ROUGH, amp: 1.8 })),
    I(cut(ell(70, 32, 13, 13, 14), { ...ROUGH, amp: 1.7 })),
    I(cut([[8, 88], [10, 68], [24, 54], [40, 52], [52, 58], [62, 52], [78, 56], [92, 70], [92, 88]], HRUBE)),
    C(cut(stroke(56, 58, 56, 88, 6), { ...ROUGH, amp: 1.2, step: 6 })),
  ],
  // trofej
  trofej: () => [
    // ucha jako kroužky po stranách
    I(cut(ell(24, 32, 15, 14, 14), { ...ROUGH, amp: 1.7 })),
    C(cut(ell(24, 32, 7, 7, 12), { ...ROUGH, amp: 1.3 })),
    I(cut(ell(76, 32, 15, 14, 14), { ...ROUGH, amp: 1.7 })),
    C(cut(ell(76, 32, 7, 7, 12), { ...ROUGH, amp: 1.3 })),
    // miska
    I(cut([[26, 14], [74, 14], [72, 40], [62, 56], [50, 61], [38, 56], [28, 40]], { ...HRUBE, tension: 0.3 })),
    // nožka a podstavec
    I(cut(rect(42, 58, 58, 76, 4), { ...ROUGH, amp: 1.7 })),
    I(cut(rect(26, 76, 74, 90, 5), HRUBE)),
  ],

  koruna: () => [
    I(cut([[12, 76], [16, 24], [32, 44], [50, 16], [68, 44], [84, 24], [88, 76]], { ...HRUBE, tension: 0.18 })),
    C(cut(ell(50, 58, 6, 6, 10), { ...ROUGH, amp: 1.2 })),
    C(cut(rect(22, 66, 78, 72, 2), { ...ROUGH, amp: 1.1, step: 7 })),
  ],
  hvezda: () => [I(cut(star(50, 52, 40, 17), { ...HRUBE, tension: 0.2 }))],
  // šipka do terče
  sipka: () => [
    I(cut(ell(50, 50, 38, 38, 18), { ...ROUGH, amp: 2.2 })),
    C(cut(ell(50, 50, 26, 26, 16), { ...ROUGH, amp: 1.8 })),
    I(cut(ell(50, 50, 14, 14, 14), { ...ROUGH, amp: 1.5 })),
    C(cut(ell(50, 50, 5, 5, 10), { ...ROUGH, amp: 1 })),
  ],
  zamek: () => [
    I(cut([[32, 48], [32, 32], [40, 22], [50, 19], [60, 22], [68, 32], [68, 48], [59, 48], [59, 34], [54, 29], [46, 29], [41, 34], [41, 48]], { ...ROUGH, amp: 1.7, tension: 0.3 })),
    I(cut(rect(24, 46, 76, 86, 6), HRUBE)),
    C(cut(ell(50, 62, 7, 7, 12), { ...ROUGH, amp: 1.3 })),
    C(cut(rect(46, 64, 54, 76, 2), { ...ROUGH, amp: 1.1, step: 6 })),
  ],
  ohen: () => [
    I(cut([[50, 10], [64, 28], [72, 24], [76, 44], [84, 56], [78, 76], [58, 90], [38, 89], [22, 76], [20, 54], [32, 38], [38, 44]], HRUBE)),
    C(cut([[50, 50], [60, 64], [58, 78], [48, 84], [38, 76], [40, 62]], { ...ROUGH, amp: 1.7 })),
  ],
  check: () => [
    I(cut([...stroke(16, 54, 40, 76, 15), ...stroke(40, 76, 86, 22, 15)].slice(0), { ...ROUGH, amp: 1.6, tension: 0.25 })),
  ],
  plus: () => [
    I(cut(rect(42, 14, 58, 86, 3), { ...ROUGH, amp: 1.8 })),
    I(cut(rect(14, 42, 86, 58, 3), { ...ROUGH, amp: 1.8 })),
  ],
  minus: () => [I(cut(rect(14, 42, 86, 58, 3), { ...ROUGH, amp: 1.8 }))],

  // ---------- ovládání ----------
  "i-domu": () => [
    I(cut([[50, 12], [92, 48], [82, 48], [82, 88], [18, 88], [18, 48], [8, 48]], { ...HRUBE, tension: 0.2 })),
    C(cut(rect(40, 60, 60, 88, 3), { ...ROUGH, amp: 1.4 })),
  ],
  "i-mrizka": () => {
    const b = (x, y) => I(cut(rect(x, y, x + 30, y + 30, 5), { ...ROUGH, amp: 1.9 }));
    return [b(12, 12), b(58, 12), b(12, 58), b(58, 58)];
  },
  "i-zpet": () => [
    I(cut([[52, 14], [62, 24], [38, 48], [62, 72], [52, 84], [16, 48]], { ...ROUGH, amp: 1.8, tension: 0.25 })),
    I(cut(rect(30, 40, 86, 56, 4), { ...ROUGH, amp: 1.7 })),
  ],
  "i-uzivatel": () => [
    I(cut(ell(50, 32, 18, 18, 16), { ...ROUGH, amp: 2 })),
    I(cut([[14, 90], [16, 70], [32, 58], [50, 54], [68, 58], [84, 70], [86, 90]], HRUBE)),
  ],
};

const out = [];
for (const [k, f] of Object.entries(IKONY)) {
  seed = 7 + k.length * 13; // pevná náhodnost na ikonu, ať se změnou jedné nepřekreslí ostatní
  out.push(`  ${/^[a-z][a-zA-Z0-9]*$/.test(k) ? k : JSON.stringify(k)}: ${JSON.stringify(f())},`);
}
writeFileSync(new URL("../ikony.js", import.meta.url),
  `// Ikony Tour de Pub: tlusté siluety s výstřižky, okraj křivý jako stříhaný tupýma nůžkama.\n` +
  `// Generuje scripts/kresli-ikony.mjs – needitovat ručně.\n` +
  `// Vrstvy: "i" = papír (barva textu), "c" = výstřižek (průhledný). viewBox 0 0 100 100.\n` +
  `export const IKONY = {\n${out.join("\n")}\n};\n`);
console.log("ikony.js:", Object.keys(IKONY).length, "ikon");
