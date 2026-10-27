// Nakreslí čmáranice pro průpravu v úvodu a zapíše je do src/lib/uvod-kresby.ts.
//
// Je to ta samá ruka jako u ikon (scripts/kresli-ikony.mjs): tlusté siluety
// s výstřižky, obrys křivý jako stříhaný tupýma nůžkama. Jen velké — na
// plakátu úvodu zabírají půl obrazovky, takže si můžou dovolit víc dílů
// a obličej.
//
// Spuštění: node scripts/kresli-uvod.mjs (bez závislostí; náhodnost je pevná)
import { writeFileSync } from "node:fs";
import { nasad, cut, ell, rect, srpek as usmev, stroke } from "./cary.mjs";

const I = (d) => ["i", d], C = (d) => ["c", d];
// Mírnější kymácení než u ikon. Amplituda je v souřadnicích čtverce, takže
// se s velikostí nemění — a co v dvaadvaceti bodech vypadá jako střih
// nůžkami, je na plakátu přes půl obrazovky rozmáčklý tvar. Rukopis zůstává,
// jen se ztiší.
const ROUGH = { amp: 1.3, step: 7, tension: 0.42 };
const HRUBE = { amp: 1.7, step: 6, tension: 0.4, nicks: 1 };

// Z těchhle se do appky dostane jen to, co je v POUZITE. Zbytek zůstává
// tady jako zdroj: kreslilo se to pro starou průpravu přes čtyři plakáty
// a může se to hodit, ale vozit čtyři nepoužité kresby v balíku je zbytečné.
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
  // Opilec: panák v půlce vrávorání. Hlava je nakloněná, ruce rozhozené
  // a nohy od sebe, takže silueta sama o sobě říká, že to nestojí rovně.
  // Oči jsou dvě různé — jedno kolečko a jeden křížek — a pusa je otevřená:
  // dvě souměrné tečky z toho dělaly spokojeného panáčka, ne namazaného.
  opilec: () => [
    // hlava, nakloněná doleva
    I(cut(ell(42, 24, 16, 15, 20), { ...ROUGH, amp: 1.1 })),
    // vlasy na ježka, pár chomáčů nahoru
    I(cut([[28, 18], [31, 7], [36, 14], [42, 4], [47, 13], [54, 6], [56, 16], [52, 22], [32, 23]],
          { ...ROUGH, amp: 1.1, tension: .45 })),
    // obličej: kolečko, křížek, otevřená pusa
    C(cut(ell(36, 23, 4.5, 4.5, 22), { ...ROUGH, amp: .4, step: 2 })),
    C(cut(stroke(45, 19, 53, 27, 3), { ...ROUGH, amp: .4, step: 3 })),
    C(cut(stroke(53, 19, 45, 27, 3), { ...ROUGH, amp: .4, step: 3 })),
    /* Pusa je malá a vysoko. Velká sahala až na spodní obrys hlavy, takže
       panákovi nezbyla brada a vypadalo to jak useknuté. */
    C(cut(ell(42, 31, 4.2, 3.4, 20), { ...ROUGH, amp: .4, step: 2 })),
    // trup, podle nakloněné hlavy taky nakřivo
    I(cut([[36, 38], [52, 40], [58, 62], [42, 65], [33, 58]], HRUBE)),
    // ruka nahoru a do strany, s roztaženou dlaní
    I(cut(stroke(54, 44, 82, 26, 7), { ...ROUGH, amp: 1 })),
    I(cut(stroke(82, 26, 93, 14, 4), { ...ROUGH, amp: .7 })),
    I(cut(stroke(82, 26, 96, 26, 4), { ...ROUGH, amp: .7 })),
    I(cut(stroke(82, 26, 90, 38, 4), { ...ROUGH, amp: .7 })),
    // druhá ruka visí dolů dozadu
    I(cut(stroke(36, 46, 19, 57, 7), { ...ROUGH, amp: 1 })),
    I(cut(stroke(19, 57, 6, 52, 4), { ...ROUGH, amp: .7 })),
    I(cut(stroke(19, 57, 8, 66, 4), { ...ROUGH, amp: .7 })),
    // nohy od sebe, každá jinak
    I(cut(stroke(42, 63, 26, 88, 8), { ...ROUGH, amp: 1.1 })),
    I(cut(stroke(54, 63, 70, 84, 8), { ...ROUGH, amp: 1.1 })),
    // chodidla
    I(cut(rect(18, 86, 34, 94, 3), { ...ROUGH, amp: 1 })),
    I(cut(rect(64, 82, 80, 90, 3), { ...ROUGH, amp: 1 })),
  ],
};

/** Co se opravdu zapisuje do src/lib/uvod-kresby.ts. */
const POUZITE = ["opilec", "carky", "snek", "koruna"];

const out = [];
for (const [k, f] of Object.entries(KRESBY)) {
  if (!POUZITE.includes(k)) continue;
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
console.log("src/lib/uvod-kresby.ts:", out.length, "kreseb (ve skriptu", Object.keys(KRESBY).length + ")");
