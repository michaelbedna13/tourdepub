// Nakreslí čmáranice pro průpravu v úvodu a zapíše je do src/lib/uvod-kresby.ts.
//
// Je to ta samá ruka jako u ikon (scripts/kresli-ikony.mjs): tlusté siluety
// s výstřižky, obrys křivý jako stříhaný tupýma nůžkama. Jen velké — na
// plakátu úvodu zabírají půl obrazovky, takže si můžou dovolit víc dílů
// a obličej.
//
// Jedna kresba na kapitolu pravidel, a každá říká to, o čem ta kapitola je:
// opilec (o co jde), budík (časovej cajk), šnek (žádný courání), čárky
// (bodování), pytel s prachama (celej bank). Škopek a koruna, co tu stály dřív, šly
// pryč — škopek říkal jen „pivo" a koruna „vítěz", ani jedno není pravidlo.
//
// Spuštění: node scripts/kresli-uvod.mjs (bez závislostí; náhodnost je pevná)
import { writeFileSync } from "node:fs";
import { nasad, cut, ell, rect, rot, srpek as usmev, stroke } from "./cary.mjs";

const I = (d) => ["i", d], C = (d) => ["c", d];
// Mírnější kymácení než u ikon. Amplituda je v souřadnicích čtverce, takže
// se s velikostí nemění — a co v dvaadvaceti bodech vypadá jako střih
// nůžkami, je na plakátu přes půl obrazovky rozmáčklý tvar. Rukopis zůstává,
// jen se ztiší.
const ROUGH = { amp: 1.3, step: 7, tension: 0.42 };
const HRUBE = { amp: 1.7, step: 6, tension: 0.4, nicks: 1 };
/* Na malá kolečka: skoro žádné kymácení, jinak z nich jsou kosočtverce. */
const JEMNE = { amp: .5, step: 3, tension: 0.42 };


/** Tlustý tah po lomené čáře: obrys kolem bodů, v ohybech se normály
 *  zprůměrují, ať se loket nerozpadne na dva obdélníky s mezerou. `w` je
 *  tloušťka; může být i pole (tloušťka v každém bodě), štětec se tak na
 *  konci ztenčí. */
function tah(pts, w) {
  const sirka = (i) => (Array.isArray(w) ? w[i] : w) / 2;
  const L = [], R = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1];
    const d = Math.hypot(dx, dy) || 1;
    dx /= d; dy /= d;
    const h = sirka(i);
    L.push([pts[i][0] - dy * h, pts[i][1] + dx * h]);
    R.push([pts[i][0] + dy * h, pts[i][1] - dx * h]);
  }
  return [...L, ...R.reverse()];
}

/** Posune a otočí body hlavy z místních souřadnic do kresby. */
const umisti = (pts, x, y, uhel, m = 1) => rot(pts.map(([a, b]) => [x + a * m, y + b * m]), uhel, x, y);

/* Panák: jedna postavička, která chodí přes všech pět plakátů. Předloha je
   tušová figurka od Mišáka (vějíř vlasů, dlouhý obličej s vykřičníkem místo
   nosu, ruce a nohy jako tahy štětcem). Tady je přepsaná do ruky zbytku
   appky: plná silueta, oči a nos vystřižené, okraj stříhaný.
   Trup, ruce i nohy jsou tahy, ne plochy, takže se postavička neslije do
   flíčku ani menší: drží ji obrys pohybu, ne hmota. */
const TAH = { amp: .45, step: 3, tension: .42 };
const PRST = { amp: .25, step: 2, tension: .42 };

/** Hlava: vějíř vlasů, spára, obličej, oko a vykřičník.
 *  (x, y) je střed horní hrany obličeje, uhel naklání celou hlavu. */
function hlava(x, y, uhel = 0, m = 1) {
  const u = (pts) => umisti(pts, x, y, uhel, m);
  // vějíř: špičky a zuby střídavě, od levého ucha přes temeno k pravému
  const vejir = [[-12, 1]];
  const N = 11;
  for (let i = 0; i <= N; i++) {
    const a = (Math.PI * (196 + (148 * i) / N)) / 180;
    const r = i % 2 ? 12 : 16 + (i % 4 ? 0 : 1.5);
    vejir.push([Math.cos(a) * r * 1.2, -3 + Math.sin(a) * r]);
  }
  vejir.push([12, -1]);
  const paprsky = [212, 236, 258, 282, 306, 328].map((st) => {
    const a = (Math.PI * st) / 180;
    return C(cut(u(tah([[Math.cos(a) * 4.5 * 1.2, -3 + Math.sin(a) * 4.5], [Math.cos(a) * 10.5 * 1.2, -3 + Math.sin(a) * 10.5]], [1.2, 1.7])), PRST));
  });
  const oblicej = [[-10, 0], [10, -1.5], [7.5, 8], [3, 19], [0, 18.5], [-5, 8]];
  return [
    I(cut(u(vejir), { amp: .6, step: 3, tension: .42 })),
    ...paprsky,
    // spára mezi vlasy a obličejem, jinak je z toho jedna kaňka
    C(cut(u(tah([[-15, 0.8], [15, -2]], 2.4)), PRST)),
    I(cut(u(oblicej), { amp: .5, step: 3, tension: .42 })),
    // oko: šikmá štěrbina, jako v předloze
    C(cut(u(ell(-3.6, 3.6, 3.2, 1.3, 14, -.25)), PRST)),
    // vykřičník místo nosu a pusy
    C(cut(u(tah([[3.6, 2.8], [2.4, 11.5]], [2.1, 1.5])), PRST)),
    C(cut(u(ell(2.1, 14.6, 1.25, 1.25, 10)), { amp: .15, step: 1.5, tension: .42 })),
  ];
}

/** Ruka s roztaženými prsty. (x, y) je dlaň, smer kam prsty míří (stupně,
 *  nula vpravo, devadesát dolů). */
function dlan(x, y, smer, delka = 6) {
  const out = [I(cut(ell(x, y, 2.4, 2.4, 10), PRST))];
  for (const o of [-62, -24, 12, 48]) {
    const a = (Math.PI * (smer + o)) / 180;
    const k = o === -62 ? .7 : 1;
    out.push(I(cut(tah([[x, y], [x + Math.cos(a) * delka * k, y + Math.sin(a) * delka * k]], [2.2, 1.5]), PRST)));
  }
  return out;
}

/** Chodidlo: krátký tah a dva prsty, ať noha nekončí pahýlem. */
function chodidlo(x, y, smer) {
  const a = (Math.PI * smer) / 180, b = (Math.PI * (smer + 28)) / 180;
  return [
    I(cut(tah([[x, y], [x + Math.cos(a) * 8, y + Math.sin(a) * 8]], [4, 2.6]), PRST)),
    I(cut(tah([[x, y], [x + Math.cos(b) * 7, y + Math.sin(b) * 7]], [3, 2]), PRST)),
  ];
}

const kus = (pts, w = 4.6) => I(cut(tah(pts, w), TAH));

// Z těchhle se do appky dostane jen to, co je v POUZITE. Zbytek zůstává
// tady jako zdroj: kreslilo se to pro starou průpravu přes čtyři plakáty
// a může se to hodit, ale vozit čtyři nepoužité kresby v balíku je zbytečné.
const KRESBY = {

  // Jak se to valí: panák drží budík na natažené ruce, druhou má v bok.
  // Ručičky ukazujou šest a dvě, tedy ten cajk, o kterém kapitola je.
  cajk: () => [
    kus([[42, 35], [43, 47], [46, 62]], [5, 5.2, 5.6]),
    kus([[43, 43], [55, 40], [66, 37]], [4.6, 4.4, 4]),
    kus([[42, 45], [33, 51], [39, 59]], [4.6, 4.2, 4]),
    kus([[46, 61], [40, 76], [36, 90]], [5.6, 5.2, 4.6]),
    ...chodidlo(36, 91, 185),
    kus([[46, 61], [54, 76], [58, 90]], [5.6, 5.2, 4.6]),
    ...chodidlo(58, 91, -5),
    ...hlava(35, 10, -9, 1.45),
    I(cut(ell(74, 13, 5.5, 4.5, 14), PRST)),
    I(cut(ell(92, 13, 5.5, 4.5, 14), PRST)),
    C(cut(ell(83, 30, 16, 16, 24), TAH)),
    I(cut(ell(83, 30, 14, 14, 24), { amp: .5, step: 3, tension: .42 })),
    C(cut(tah([[83, 30], [83, 40]], [2.6, 2]), PRST)),
    C(cut(tah([[83, 30], [91, 25]], [2.6, 2]), PRST)),
    ...dlan(68, 36, -10, 5),
  ],

  // Žádný courání: panák táhne šneka na šňůře. Dva tvary od sebe,
  // spojené jen tenkou čárou, takže se nic neslije.
  courani: () => [
    kus([[66, 34], [63, 48], [59, 62]], [5, 5.2, 5.6]),
    kus([[64, 42], [74, 49], [82, 45]], [4.6, 4.2, 3.8]),
    ...dlan(84, 44, -30, 5),
    kus([[63, 44], [53, 51], [44, 56]], [4.6, 4.2, 3.8]),
    kus([[59, 61], [69, 75], [74, 89]], [5.6, 5.2, 4.6]),
    ...chodidlo(74, 90, -5),
    kus([[59, 61], [52, 75], [45, 87]], [5.6, 5.2, 4.6]),
    ...chodidlo(45, 88, 175),
    ...hlava(59, 10, -4, 1.45),
    I(cut(ell(42, 57, 2.6, 2.6, 10), PRST)),
    // šňůra: prověšená, tenká, ať je jasné, že to táhne
    I(cut(tah([[42, 57], [36, 66], [31, 72], [28, 76]], 1.7), PRST)),
    // šnek
    I(cut([[0, 92], [5, 85], [18, 82], [28, 80], [33, 84], [32, 90], [24, 93], [6, 94]], { amp: .6, step: 3, tension: .42 })),
    I(cut(tah([[29, 81], [32, 70]], [2.6, 2]), PRST)),
    I(cut(tah([[26, 81], [25, 71]], [2.6, 2]), PRST)),
    I(cut(ell(32.4, 69, 2, 2, 10), PRST)),
    I(cut(ell(25, 70, 2, 2, 10), PRST)),
    C(cut(ell(14, 76, 14, 14, 22), TAH)),
    I(cut(ell(14, 76, 12, 12, 22), { amp: .5, step: 3, tension: .42 })),
    C(cut(ell(14, 76, 8, 8, 18), PRST)),
    I(cut(ell(14, 76, 5, 5, 16), PRST)),
    C(cut(ell(14, 76, 1.8, 1.8, 10), PRST)),
  ],

  // Bodování: panák dělá křídou poslední čárku přes pětku na zdi.
  zapis: () => [
    kus([[31, 35], [32, 48], [34, 62]], [5, 5.2, 5.6]),
    kus([[32, 43], [45, 47], [57, 48]], [4.6, 4.2, 3.8]),
    ...dlan(59, 48, -15, 5),
    kus([[31, 46], [25, 55], [23, 64]], [4.6, 4.2, 3.6]),
    ...dlan(22, 66, 105),
    kus([[34, 61], [27, 76], [23, 90]], [5.6, 5.2, 4.6]),
    ...chodidlo(23, 91, 185),
    kus([[34, 61], [41, 76], [44, 90]], [5.6, 5.2, 4.6]),
    ...chodidlo(44, 91, -5),
    ...hlava(24, 10, -9, 1.45),
    I(cut(tah([[70, 18], [69, 58]], [5, 4.4]), TAH)),
    I(cut(tah([[78, 17], [78, 58]], [5, 4.4]), TAH)),
    I(cut(tah([[86, 17], [87, 58]], [5, 4.4]), TAH)),
    I(cut(tah([[94, 18], [96, 58]], [5, 4.4]), TAH)),
    C(cut(tah([[100, 26], [63, 48]], 8.5), TAH)),
    I(cut(tah([[100, 26], [63, 48]], [4.4, 5]), TAH)),
  ],

  // Celej bank: panák se opírá o pytel prachů. Ten je jeho.
  bank: () => {
    const T = (pts) => pts.map(([x, y]) => [48 + x * .56, 40 + y * .56]);
    return [
      I(cut(T(ell(40, 12, 11, 9, 18)), PRST)),
      I(cut(T(ell(61, 10, 10, 8, 18)), PRST)),
      I(cut(T(rect(34, 18, 67, 32, 4)), PRST)),
      C(cut(T(rect(32, 24, 69, 28, 2)), PRST)),
      I(cut(T([[38, 30], [20, 43], [11, 62], [14, 80], [30, 93], [50, 96],
               [70, 93], [86, 80], [89, 62], [80, 43], [63, 30]]), { amp: .9, step: 4, tension: .42 })),
      C(cut(T(ell(50, 60, 13, 12, 20)), PRST)),
      I(cut(T(ell(50, 60, 8, 7, 18)), PRST)),
      // spára kolem panáka, kde se o pytel opírá
      C(cut(tah([[33, 43], [45, 47], [56, 66]], 8), TAH)),
      kus([[31, 35], [32, 48], [34, 62]], [5, 5.2, 5.6]),
      kus([[33, 43], [45, 47], [55, 64]], [4.6, 4.2, 3.8]),
      ...dlan(56, 67, 80, 5),
      kus([[31, 46], [22, 52], [28, 59]], [4.6, 4.2, 4]),
      kus([[34, 61], [27, 76], [23, 90]], [5.6, 5.2, 4.6]),
      ...chodidlo(23, 91, 185),
      kus([[34, 61], [40, 76], [42, 90]], [5.6, 5.2, 4.6]),
      ...chodidlo(42, 91, -5),
      ...hlava(24, 10, -9, 1.45),
    ];
  },

  // Betelná řežba: panák, co to roztočil. Předloha od Mišáka skoro tah
  // po tahu: ruka nahoru s roztaženou dlaní, druhá dolů, nohy v podřepu.
  tanec: () => [
    kus([[42, 35], [43, 46], [45, 54], [48, 63]], [5, 5.2, 5.4, 5.6]),
    kus([[44, 43], [58, 42], [70, 32], [76, 25]], [4.6, 4.4, 4, 3.6]),
    ...dlan(77, 23, -60),
    kus([[43, 45], [37, 54], [33, 62]], [4.6, 4.2, 3.6]),
    ...dlan(32, 64, 120),
    kus([[48, 62], [38, 71], [31, 80], [29, 91]], [5.6, 5.2, 5, 4.4]),
    ...chodidlo(29, 92, 185),
    kus([[48, 62], [60, 69], [67, 77], [69, 89]], [5.6, 5.2, 5, 4.4]),
    ...chodidlo(69, 90, -5),
    ...hlava(35, 10, -9, 1.45),
  ],
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



  // Celej bank: pytel s prachama. Kotel s mincemi tu stál dřív a ve zmenšení
  // z něj byl hrnec s knedlíkama. Pytel s uzlem je tvar, co se pozná i
  // v náprstku; mince na břiše je malá a posazená výš, aby zůstal vidět tvar
  // pytle. Zkoušel se i větší kroužek uprostřed (četl se jako díra nebo
  // objektiv), mince u paty (slily se s obrysem), škopek s bankovkama
  // (dvojí sdělení) a hromada bankovek (vypadalo to jako cihly).
  pytel: () => [
    I(cut(ell(40, 12, 11, 9, 18), { ...ROUGH, amp: 1.1 })),
    I(cut(ell(61, 10, 10, 8, 18), { ...ROUGH, amp: 1.1 })),
    I(cut(rect(34, 18, 67, 32, 4), { ...ROUGH, amp: 1.1 })),
    C(cut(rect(32, 24, 69, 28, 2), { ...ROUGH, amp: .7 })),
    I(cut([[38, 30], [20, 43], [11, 62], [14, 80], [30, 93], [50, 96],
           [70, 93], [86, 80], [89, 62], [80, 43], [63, 30]], HRUBE)),
    C(cut(ell(50, 60, 13, 12, 20), { ...ROUGH, amp: .8 })),
    I(cut(ell(50, 60, 8, 7, 18), { ...ROUGH, amp: .8 })),
  ],



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
const POUZITE = ["tanec", "cajk", "courani", "zapis", "bank"];

/** Obálka kresby: nejmenší rámeček, do kterého se vejde inkoust.
 *
 *  Kreslí se do čtverce 0 0 100 100, jenže ho žádná kresba nevyplní celý
 *  a každá jinak: čárky zabraly sedmdesát procent výšky, panák skoro všechno.
 *  Na plakátu, kde mají všechny kresby stejně vysoký rámeček, se ten rozdíl
 *  projevil jako jinak velká mezera pod kresbou — u čárek skoro dvakrát větší
 *  než u panáka. S obálkou vyplní rámeček každá kresba na doraz a mezera pod
 *  ní je všude stejná.
 *
 *  Počítá se ze VŠECH čísel v dráze, tedy i z řídicích bodů Bézierů. Ty
 *  můžou trochu přesahovat skutečnou křivku, takže obálka vyjde o chlup
 *  větší než samotný inkoust — což je na plakátu spíš dobře, kresba se
 *  nedotýká hrany. Výstřižky („c") se nepočítají, ty leží uvnitř. */
function obalka(vrstvy) {
  let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
  for (const [druh, d] of vrstvy) {
    if (druh !== "i") continue;
    const c = d.match(/-?\d+(?:\.\d+)?/g).map(Number);
    for (let i = 0; i < c.length; i += 2) {
      x1 = Math.min(x1, c[i]); x2 = Math.max(x2, c[i]);
      y1 = Math.min(y1, c[i + 1]); y2 = Math.max(y2, c[i + 1]);
    }
  }
  const o = 1; // kousek vzduchu, ať se obrys neotírá o hranu
  const z = (n) => Math.round(n * 10) / 10;
  return `${z(x1 - o)} ${z(y1 - o)} ${z(x2 - x1 + 2 * o)} ${z(y2 - y1 + 2 * o)}`;
}

const out = [];
for (const [k, f] of Object.entries(KRESBY)) {
  if (!POUZITE.includes(k)) continue;
  nasad(11 + k.length * 17); // pevná náhodnost na kresbu, ať se změnou jedné nepřekreslí ostatní
  const vrstvy = f();
  out.push(`  ${k}: { box: ${JSON.stringify(obalka(vrstvy))}, vrstvy: ${JSON.stringify(vrstvy)} },`);
}
writeFileSync(new URL("../src/lib/uvod-kresby.ts", import.meta.url),
  `// Čmáranice pro průpravu v úvodu: tlusté siluety s výstřižky, obrys křivý\n` +
  `// jako stříhaný tupýma nůžkama — ta samá ruka jako ikony, jen velké.\n` +
  `// Generuje scripts/kresli-uvod.mjs – needitovat ručně.\n` +
  `// Vrstvy: "i" = papír (barva textu), "c" = výstřižek (průhledný).\n` +
  `// box je obálka inkoustu, ne celý čtverec: kresby ho nevyplní stejně\n` +
  `// a na plakátu by z toho byla pod každou jinak velká mezera.\n` +
  `import type { Vrstva } from "./ikony";\n\n` +
  `export const UVOD_KRESBY = {\n${out.join("\n")}\n} satisfies Record<string, { box: string; vrstvy: Vrstva[] }>;\n`);
console.log("src/lib/uvod-kresby.ts:", out.length, "kreseb (ve skriptu", Object.keys(KRESBY).length + ")");
