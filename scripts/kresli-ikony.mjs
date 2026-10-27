// Nakreslí ikony Tour de Pub a zapíše je do src/lib/ikony.ts.
// Styl: tlusté černé siluety s bílými výstřižky, obrys křivý jako stříhaný tupýma nůžkama.
// Vrstvy v pořadí: "i" = papír (barva textu), "c" = výstřižek (průhledný).
// Tenké tahy se v malém slijí, proto je všechno tlusté. viewBox 0 0 100 100.
// Spuštění: node scripts/kresli-ikony.mjs (bez závislostí; náhodnost je pevná, výstup je pokaždé stejný)
import { writeFileSync } from "node:fs";

import { nasad, cut, ell, rect, rot, star, stroke } from "./cary.mjs";

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
  // Žranice a divadlo: zkřížený příbor. Samotná vidlička tu stála dřív a se
  // třemi tlustými hroty na bloku vypadala jako kaktus — hroty se slily
  // a z vidličky zbyl trs. Tenhle kříž je poznat i jako vodoznak za textem:
  // dvě věci přes sebe mají čitelnou siluetu, jedna svislá nemá.
  //
  // Nůž se kreslí první, pak se do něj vystřihne vidlička nafouknutá o kus
  // (spára), a teprve pak vidlička sama. Bez té spáry se v místě křížení
  // slijí v jeden hranol.
  // Žranice a divadlo: divadelní maska. Nejdřív tu stála vidlička a se třemi
  // tlustými hroty na bloku vypadala jako kaktus, pak zkřížený příbor — jenže
  // ta kategorie je z devíti úkolů osmkrát divadlo: hrát vrchního, sehrát
  // scénku, dělat živou sochu, vysvětlovat něco anglicky. Příbor mluvil
  // o žrádle, kterého tam skoro není.
  //
  // Zkoušela se i opona (ve zmenšení z ní byla jeskyně) a dvě masky přes
  // sebe (na dvaceti bodech kaše). Jedna maska je čitelná ve všech velikostech.
  zranice: () => {
    // široké čelo, úzká brada – aby to byla maska, ne koláč
    const obrys = [
      [-28, -34], [-16, -42], [0, -44], [16, -42], [28, -34], [32, -16],
      [28, 4], [18, 22], [6, 34], [0, 38], [-6, 34], [-18, 22], [-28, 4], [-32, -16],
    ].map(([x, y]) => [50 + x, 48 + y]);
    return [
      I(cut(obrys, HRUBE)),
      // oči šikmo, ne kulatá kolečka: kolečka dělají z masky obličej panáka
      C(cut(rot(ell(36, 40, 11, 6, 20), -14, 36, 40), { ...ROUGH, amp: 1.1 })),
      C(cut(rot(ell(64, 40, 11, 6, 20), 14, 64, 40), { ...ROUGH, amp: 1.1 })),
      C(cut(ell(50, 66, 14, 9, 22), { ...ROUGH, amp: 1.2 })),
    ];
  },

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
  // Jeden tah, ne dva pruty přes sebe. Složená ze dvou obdélníků měla fajfka
  // v lokti ostruhu — roh spodního prutu koukal ven a v malém to vypadalo jako
  // chyba vykreslení, ne jako kresba. Takhle je to jedna dráha, v lokti tlustá
  // a ke špičce se ztenčuje, jak když se táhne perem.
  check: () => [
    I(cut([[8, 48], [36, 86], [90, 18], [74, 12], [36, 60], [20, 38]],
          { ...ROUGH, amp: 2.4, tension: 0.2 })),
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
  // Pravidla: popsaný papír. Čtyři čtverečky tu stály dřív a neříkaly nic –
  // mřížka je „přehled všeho“, ne „přečti si, jak se to hraje“. Nahoře kratší
  // tah jako nadpis, pod ním dva plné: ve dvaceti bodech je z toho na první
  // pohled psaný text, ne mříž ani stoh.
  "i-pravidla": () => {
    const pruh = (x1, y1, x2, y2) => C(cut(rect(x1, y1, x2, y2, 3), { ...ROUGH, amp: 1, step: 14 }));
    return [
      I(cut(rect(16, 12, 84, 88, 6), { ...ROUGH, amp: 1.9 })),
      pruh(27, 25, 57, 38), pruh(27, 48, 73, 58), pruh(27, 65, 73, 75),
    ];
  },
  "i-zpet": () => [
    I(cut([[52, 14], [62, 24], [38, 48], [62, 72], [52, 84], [16, 48]], { ...ROUGH, amp: 1.8, tension: 0.25 })),
    I(cut(rect(30, 40, 86, 56, 4), { ...ROUGH, amp: 1.7 })),
  ],
  "i-nahoru": () => [
    I(cut([[50, 10], [86, 46], [74, 58], [58, 42], [58, 90], [42, 90], [42, 42], [26, 58], [14, 46]], { ...ROUGH, amp: 1.8, tension: 0.2 })),
  ],
  "i-dolu": () => [
    I(cut([[50, 90], [86, 54], [74, 42], [58, 58], [58, 10], [42, 10], [42, 58], [26, 42], [14, 54]], { ...ROUGH, amp: 1.8, tension: 0.2 })),
  ],
  "i-tuzka": () => [
    // tělo tužky našikmo
    I(cut(rot(rect(40, 8, 60, 74, 2), 38), { ...ROUGH, amp: 1.9 })),
    // hrot
    I(cut(rot([[40, 74], [60, 74], [50, 92]], 38), { ...ROUGH, amp: 1.4, tension: 0.2 })),
    // proužek, kde končí dřevo
    C(cut(rot(rect(40, 64, 60, 69, 1), 38), { ...ROUGH, amp: 1, step: 6 })),
  ],
  "i-kos": () => [
    I(cut(rect(36, 8, 64, 20, 3), { ...ROUGH, amp: 1.6 })),
    I(cut(rect(14, 20, 86, 34, 3), { ...ROUGH, amp: 1.8 })),
    I(cut([[22, 34], [78, 34], [72, 92], [28, 92]], { ...HRUBE, tension: 0.2 })),
    C(cut(rect(38, 44, 46, 82, 2), { ...ROUGH, amp: 1.1, step: 6 })),
    C(cut(rect(54, 44, 62, 82, 2), { ...ROUGH, amp: 1.1, step: 6 })),
  ],
  // tři natrhané proužky – hamburger, ale vystřižený, ne vysázený.
  // Tři natržené proužky, ne tři stejné linky. Předtím to byl jediný prvek
  // v appce, co vypadal strojově: kymácení stažené na amp 1, všechny pruhy
  // stejně dlouhé a přesně vodorovné. Teď je každý jinak dlouhý a lehce
  // nakřivo — v sedmnácti bodech, což je velikost v liště, je to pořád
  // čitelný hamburger, ale kreslila to ta samá ruka jako zbytek.
  "i-menu": () => {
    const pruh = (y1, x2, uhel) =>
      I(cut(rot(rect(11, y1, x2, y1 + 16, 3), uhel), { ...ROUGH, amp: 1.9, step: 10 }));
    return [pruh(16, 89, -1.5), pruh(42, 80, 1.2), pruh(68, 86, -0.8)];
  },
  "i-uzivatel": () => [
    I(cut(ell(50, 32, 18, 18, 16), { ...ROUGH, amp: 2 })),
    I(cut([[14, 90], [16, 70], [32, 58], [50, 54], [68, 58], [84, 70], [86, 90]], HRUBE)),
  ],
};

const out = [];
for (const [k, f] of Object.entries(IKONY)) {
  nasad(7 + k.length * 13); // pevná náhodnost na ikonu, ať se změnou jedné nepřekreslí ostatní
  out.push(`  ${/^[a-z][a-zA-Z0-9]*$/.test(k) ? k : JSON.stringify(k)}: ${JSON.stringify(f())},`);
}
writeFileSync(new URL("../src/lib/ikony.ts", import.meta.url),
  `// Ikony Tour de Pub: tlusté siluety s výstřižky, okraj křivý jako stříhaný tupýma nůžkama.\n` +
  `// Generuje scripts/kresli-ikony.mjs – needitovat ručně.\n` +
  `// Vrstvy: "i" = papír (barva textu), "c" = výstřižek (průhledný). viewBox 0 0 100 100.\n` +
  `export type Vrstva = ["i" | "c", string];\n` +
  `export type JmenoIkony = keyof typeof IKONY;\n\n` +
  `export const IKONY = {\n${out.join("\n")}\n} satisfies Record<string, Vrstva[]>;\n`);
console.log("src/lib/ikony.ts:", Object.keys(IKONY).length, "ikon");
