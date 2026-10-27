// Nakreslí čmáranice pro průpravu v úvodu a zapíše je do src/lib/uvod-kresby.ts.
//
// Je to ta samá ruka jako u ikon (scripts/kresli-ikony.mjs): tlusté siluety
// s výstřižky, obrys křivý jako stříhaný tupýma nůžkama. Jen velké — na
// plakátu úvodu zabírají půl obrazovky, takže si můžou dovolit víc dílů
// a obličej.
//
// Jedna kresba na kapitolu pravidel, a každá říká to, o čem ta kapitola je:
// opilec (o co jde), budík (časovej cajk), šnek (žádný courání), čárky
// (bodování), kotel (celej bank). Škopek a koruna, co tu stály dřív, šly
// pryč — škopek říkal jen „pivo" a koruna „vítěz", ani jedno není pravidlo.
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
/* Na malá kolečka: skoro žádné kymácení, jinak z nich jsou kosočtverce. */
const JEMNE = { amp: .5, step: 3, tension: 0.42 };

// Z těchhle se do appky dostane jen to, co je v POUZITE. Zbytek zůstává
// tady jako zdroj: kreslilo se to pro starou průpravu přes čtyři plakáty
// a může se to hodit, ale vozit čtyři nepoužité kresby v balíku je zbytečné.
const KRESBY = {
  // Časovej cajk: budík. Kapitola je o tom, odkdy dokdy se valí, takže
  // ciferník, ne škopek — ten by říkal „pivo" a to už říká zbytek appky.
  hodiny: () => [
    I(cut(ell(28, 20, 13, 11, 18), { ...ROUGH, amp: 1.1 })),
    I(cut(ell(72, 20, 13, 11, 18), { ...ROUGH, amp: 1.1 })),
    I(cut(stroke(24, 82, 16, 94, 9), { ...ROUGH, amp: 1 })),
    I(cut(stroke(76, 82, 84, 94, 9), { ...ROUGH, amp: 1 })),
    // spára kolem ciferníku, jinak se zvonky slijí s tělem a je z toho hlava
    C(cut(ell(50, 54, 40, 40, 26), { ...ROUGH, amp: 1 })),
    I(cut(ell(50, 54, 36, 36, 26), { ...ROUGH, amp: 1.3 })),
    // ručičky: šest a dvě, tedy ten cajk, o kterém kapitola je
    C(cut(stroke(50, 54, 50, 82, 7), { ...ROUGH, amp: .7 })),
    C(cut(stroke(50, 54, 74, 40, 7), { ...ROUGH, amp: .7 })),
    C(cut(ell(50, 54, 5, 5, 16), JEMNE)),
  ],

  // Žádný courání: šnek. Překreslený tlustěji než ten z první průpravy —
  // ulita má teď dva závity místo jednoho kroužku, takže je poznat i malá.
  snek: () => [
    I(cut([[10, 74], [26, 64], [52, 62], [76, 66], [90, 74], [92, 84], [74, 90], [30, 90], [12, 86]], HRUBE)),
    I(cut(stroke(84, 70, 90, 44, 8), { ...ROUGH, amp: .9 })),
    I(cut(stroke(70, 68, 64, 44, 8), { ...ROUGH, amp: .9 })),
    I(cut(ell(90, 40, 7, 7, 16), { ...ROUGH, amp: .7 })),
    I(cut(ell(63, 40, 7, 7, 16), { ...ROUGH, amp: .7 })),
    I(cut(ell(42, 46, 30, 30, 24), { ...ROUGH, amp: 1.2 })),
    C(cut(ell(42, 46, 21, 21, 22), { ...ROUGH, amp: .9 })),
    I(cut(ell(42, 46, 13, 13, 20), { ...ROUGH, amp: .8 })),
    C(cut(ell(42, 46, 5, 5, 16), JEMNE)),
  ],

  // Bodování: pět čárek, jak se píšou na zeď. Předchozí kresba měla v sobě
  // obličej a byla z toho postavička — tohle je prostě zápis.
  carky: () => [
    I(cut(stroke(22, 16, 18, 80, 10), { ...ROUGH, amp: 1.1 })),
    I(cut(stroke(40, 14, 38, 80, 10), { ...ROUGH, amp: 1.1 })),
    I(cut(stroke(58, 14, 60, 80, 10), { ...ROUGH, amp: 1.1 })),
    I(cut(stroke(76, 16, 80, 80, 10), { ...ROUGH, amp: 1.1 })),
    I(cut(stroke(10, 74, 90, 22, 10), { ...ROUGH, amp: 1.2 })),
  ],

  // Celej bank: kotel. Pravidla mluví o vlezném do kotla, tak ať to je kotel
  // a ne koruna — koruna říká „vítěz", kotel říká, o co se hraje.
  kotel: () => [
    // mince: plné kotouče, ne kroužky — s dírou uprostřed to byly koblihy
    I(cut(ell(34, 22, 10, 9, 20), { ...ROUGH, amp: .8 })),
    I(cut(ell(54, 14, 11, 10, 20), { ...ROUGH, amp: .8 })),
    I(cut(ell(72, 25, 9, 8, 20), { ...ROUGH, amp: .8 })),
    // spára pod okrajem, ať mince nesplynou s kotlem
    C(cut(rect(6, 36, 94, 54, 5), { ...ROUGH, amp: 1 })),
    I(cut(rect(10, 40, 90, 52, 5), { ...ROUGH, amp: 1.2 })),
    I(cut([[20, 50], [80, 50], [75, 78], [64, 90], [36, 90], [25, 78]], HRUBE)),
    I(cut(stroke(12, 56, 4, 68, 8), { ...ROUGH, amp: .9 })),
    I(cut(stroke(88, 56, 96, 68, 8), { ...ROUGH, amp: .9 })),
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
const POUZITE = ["opilec", "hodiny", "snek", "carky", "kotel"];

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
