// Nakreslí čmáranice pro průpravu v úvodu a zapíše je do src/lib/uvod-kresby.ts.
//
// Je to ta samá ruka jako u ikon (scripts/kresli-ikony.mjs): tlusté siluety
// s výstřižky, obrys křivý jako stříhaný tupýma nůžkama. Jen velké — na
// plakátu úvodu zabírají půl obrazovky, takže si můžou dovolit víc dílů
// a obličej.
//
// Spuštění: node scripts/kresli-uvod.mjs (bez závislostí; náhodnost je pevná)
import { writeFileSync } from "node:fs";
import { nasad, cut, ell, rect, stroke } from "./cary.mjs";

const I = (d) => ["i", d], C = (d) => ["c", d];
// Mírnější kymácení než u ikon. Amplituda je v souřadnicích čtverce, takže
// se s velikostí nemění — a co v dvaadvaceti bodech vypadá jako střih
// nůžkami, je na plakátu přes půl obrazovky rozmáčklý tvar. Rukopis zůstává,
// jen se ztiší.
const ROUGH = { amp: 1.3, step: 7, tension: 0.42 };
const HRUBE = { amp: 1.7, step: 6, tension: 0.4, nicks: 1 };

/** Úsměv jako vystřižený srpek: vnější oblouk tam, vnitřní zpátky. */
function usmev(cx, cy, r, w, od = 25, do_ = 155) {
  const rad = (d) => (d * Math.PI) / 180;
  const ven = [], zpet = [];
  for (let i = 0; i <= 10; i++) {
    const a = rad(od + ((do_ - od) * i) / 10);
    ven.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    zpet.push([cx + Math.cos(a) * (r - w), cy + Math.sin(a) * (r - w)]);
  }
  return [...ven, ...zpet.reverse()];
}

const KRESBY = {
  // Škopek, co si to šlape po štacích.
  skopek: () => [
    // ucho: kroužek napravo od těla, ať se s ním neslije
    I(cut(ell(76, 54, 14, 15, 16), { ...ROUGH, amp: 1.1 })),
    C(cut(ell(76, 54, 7, 8, 14), { ...ROUGH, amp: .9 })),
    // tělo
    I(cut([[22, 26], [46, 24], [68, 26], [69, 52], [66, 78], [46, 81], [25, 78], [22, 52]], HRUBE)),
    // pěna: sedí na okraji, přetéká jen kousek do stran
    I(cut([[22, 28], [22, 18], [31, 12], [40, 16], [49, 10], [58, 15], [68, 12], [73, 20], [70, 30], [50, 33], [30, 32]],
          { ...ROUGH, amp: 1.2, tension: 0.5 })),
    // Odlesky skla tu nejsou schválně: vedly přesně přes oči a pusu
    // a obličej se v nich ztrácel. Buď sklo, nebo tvář — ne obojí.
    // Obličej. Kolečka musí mít hodně bodů a skoro žádné kymácení, jinak
    // z nich jsou kosočtverce — na malé ploše je výchylka vidět nejvíc.
    C(cut(ell(39, 48, 5, 5, 22), { ...ROUGH, amp: .45, step: 2 })),
    C(cut(ell(53, 48, 5, 5, 22), { ...ROUGH, amp: .45, step: 2 })),
    C(cut(usmev(46, 58, 12, 4.5), { ...ROUGH, amp: .7, step: 4 })),
    // nohy a chodidla
    I(cut(stroke(37, 76, 33, 92, 8), { ...ROUGH, amp: 1.1, step: 7 })),
    I(cut(stroke(55, 76, 59, 92, 8), { ...ROUGH, amp: 1.1, step: 7 })),
    I(cut(stroke(35, 91, 24, 94, 8), { ...ROUGH, amp: 1.1, step: 7 })),
    I(cut(stroke(57, 91, 68, 94, 8), { ...ROUGH, amp: 1.1, step: 7 })),
  ],

  // Čtyři čárky, pátá přes ně — a culí se to.
  carky: () => [
    I(cut(stroke(25, 12, 21, 58, 9), { ...ROUGH, amp: 1.6, step: 7 })),
    I(cut(stroke(42, 12, 39, 58, 9), { ...ROUGH, amp: 1.6, step: 7 })),
    I(cut(stroke(59, 13, 57, 59, 9), { ...ROUGH, amp: 1.6, step: 7 })),
    I(cut(stroke(76, 12, 74, 58, 9), { ...ROUGH, amp: 1.6, step: 7 })),
    I(cut(stroke(13, 50, 85, 20, 9), { ...ROUGH, amp: 1.7, step: 7 })),
    // obličej pod čárkami
    I(cut(ell(37, 73, 5.5, 5.5, 12), { ...ROUGH, amp: 1.2 })),
    I(cut(ell(63, 73, 5.5, 5.5, 12), { ...ROUGH, amp: 1.2 })),
    I(cut(usmev(50, 80, 14, 5), { ...ROUGH, amp: 1.2, step: 6 })),
  ],

  // Šnek: kdo se loudá, ten nemá.
  snek: () => [
    // tykadla s bambulemi na koncích
    I(cut(stroke(82, 60, 86, 30, 5.5), { ...ROUGH, amp: .8, step: 7 })),
    I(cut(stroke(74, 62, 68, 34, 5.5), { ...ROUGH, amp: .8, step: 7 })),
    I(cut(ell(87, 25, 6, 6, 20), { ...ROUGH, amp: .5, step: 3 })),
    I(cut(ell(67, 29, 6, 6, 20), { ...ROUGH, amp: .5, step: 3 })),
    // Noha i hlava jsou jeden kus: napravo se pruh zvedne do hlavy, ze které
    // teprve vyrůstají tykadla. Dokud byla hlava zvlášť, plavala vedle těla.
    I(cut([[6, 88], [10, 78], [26, 72], [52, 70], [68, 68], [78, 58], [88, 56], [93, 66], [92, 80], [88, 90], [10, 90]], HRUBE)),
    C(cut(ell(84, 66, 2.8, 2.8, 16), { ...ROUGH, amp: .4, step: 2 })),
    // ulita jako terč: tři kola přes sebe dají závit. Mezery musí být široké,
    // jinak se prstence při kymácení slijí do koláče.
    I(cut(ell(38, 42, 26, 25, 22), { ...ROUGH, amp: 1.1, step: 6 })),
    C(cut(ell(38, 42, 17, 16, 20), { ...ROUGH, amp: .8, step: 5 })),
    I(cut(ell(38, 42, 8, 8, 18), { ...ROUGH, amp: .6, step: 4 })),
  ],

  // Koruna: celej bank bere jedna.
  koruna: () => [
    I(cut([[13, 78], [17, 22], [33, 46], [50, 14], [67, 46], [83, 22], [87, 78]],
          { ...HRUBE, tension: 0.18 })),
    // Bez obličeje: oči vystřižené do koruny vypadaly jako kočka, ne jako
    // koruna. Kámen uprostřed a čelenka pod ním je to, co z toho dělá korunu.
    C(cut(ell(50, 54, 7, 7, 22), { ...ROUGH, amp: .5, step: 3 })),
    C(cut(rect(20, 66, 80, 71, 2), { ...ROUGH, amp: .8, step: 7 })),
    C(cut(ell(28, 56, 4, 4, 18), { ...ROUGH, amp: .4, step: 2 })),
    C(cut(ell(72, 56, 4, 4, 18), { ...ROUGH, amp: .4, step: 2 })),
  ],
};

const out = [];
for (const [k, f] of Object.entries(KRESBY)) {
  nasad(11 + k.length * 17); // pevná náhodnost na kresbu, ať se změnou jedné nepřekreslí ostatní
  out.push(`  ${k}: ${JSON.stringify(f())},`);
}
writeFileSync(new URL("../src/lib/uvod-kresby.ts", import.meta.url),
  `// Čmáranice pro průpravu v úvodu: tlusté siluety s výstřižky, obrys křivý\n` +
  `// jako stříhaný tupýma nůžkama — ta samá ruka jako ikony, jen velké.\n` +
  `// Generuje scripts/kresli-uvod.mjs – needitovat ručně.\n` +
  `// Vrstvy: "i" = papír (barva textu), "c" = výstřižek (průhledný). viewBox 0 0 100 100.\n` +
  `import type { Vrstva } from "./ikony";\n\n` +
  `export const UVOD_KRESBY = {\n${out.join("\n")}\n} satisfies Record<string, Vrstva[]>;\n`);
console.log("src/lib/uvod-kresby.ts:", Object.keys(KRESBY).length, "kreseb");
