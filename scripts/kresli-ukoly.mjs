// Nakreslí kresby úkolů a zapíše je do src/lib/ukol-kresby.ts.
//
// Ta samá ruka jako ikony a jako čmáranice v úvodu (scripts/cary.mjs):
// tlusté siluety s výstřižky, obrys křivý jako stříhaný tupýma nůžkama.
// Kreslí se jen úkoly, ke kterým není obtažená kresba v kresby.ts — ty mají
// přednost, protože jsou od ruky.
//
// Kymácení je mírnější než u ikon: v detailu úkolu je kresba 152 px, a co
// ve dvaadvaceti bodech vypadá jako střih nůžkami, je v té velikosti
// rozmáčklý tvar.
//
// Spuštění: node scripts/kresli-ukoly.mjs
import { writeFileSync } from "node:fs";
import { nasad, cut, ell, rect, rot, srpek, star, stroke } from "./cary.mjs";

const I = (d) => ["i", d], C = (d) => ["c", d];
const R = { amp: 1.3, step: 7, tension: 0.42 };
const H = { amp: 1.7, step: 6, tension: 0.4, nicks: 1 };
const JEMNE = { amp: .6, step: 3, tension: 0.42 };

/** Postavička: hlava a trup. Vrací díly, ať se dá doplnit rukama a nohama. */
const hlava = (x, y, r) => I(cut(ell(x, y, r, r, 20), { ...R, amp: .9 }));

const KRESBY = {
  // ---------- Kecy a šméčka ----------
  // Vyžebranej chudák: nastavená dlaň a v ní mince. Mince nad dlaní vypadala
  // jako hlava a dlaň jako trup — z žebrání byla busta.
  chudak: () => [
    I(cut(stroke(28, 46, 26, 16, 11), { ...R, amp: .8 })),
    I(cut(stroke(43, 44, 42, 12, 11), { ...R, amp: .8 })),
    I(cut(stroke(58, 44, 59, 12, 11), { ...R, amp: .8 })),
    I(cut(stroke(73, 46, 75, 16, 11), { ...R, amp: .8 })),
    I(cut(stroke(22, 54, 8, 40, 11), { ...R, amp: .8 })),
    I(cut(rect(16, 44, 86, 80, 9), H)),
    C(cut(ell(51, 62, 13, 13, 22), { ...R, amp: .8 })),
    I(cut(ell(51, 62, 5, 5, 16), JEMNE)),
  ],
  // Balení starýho kusu: srdce. Růže se nepovedla ani jednou — soustředné
  // kroužky uprostřed květu vyšly jako terč a oblouky zase jako obličej.
  baleni: () => [
    I(cut([[50, 90], [26, 68], [14, 50], [14, 32], [26, 20], [40, 22], [50, 34],
           [60, 22], [74, 20], [86, 32], [86, 50], [74, 68]],
          { ...H, tension: .5 })),
  ],
  // Tichá špeluňka: bublina s křížkem. Přeškrtnutá přes celou plochu se
  // rozpadla na dva kusy a vypadala jako list.
  ticha: () => [
    I(cut([[12, 46], [16, 24], [38, 12], [64, 13], [86, 24], [90, 46], [80, 64], [54, 72], [36, 72], [24, 88], [26, 68], [14, 60]], H)),
    C(cut(stroke(34, 26, 66, 58, 10), { ...R, amp: .8 })),
    C(cut(stroke(66, 26, 34, 58, 10), { ...R, amp: .8 })),
  ],
  // Rada nad zlato: žárovka
  rada: () => [
    I(cut(ell(50, 40, 24, 26, 22), { ...R, amp: 1.1 })),
    I(cut(rect(38, 62, 62, 78, 3), { ...R, amp: .9 })),
    C(cut(rect(38, 67, 62, 71, 1), JEMNE)),
    I(cut(rect(42, 78, 58, 90, 3), { ...R, amp: .9 })),
    C(cut(stroke(44, 30, 44, 54, 5), { ...R, amp: .7 })),
    C(cut(stroke(56, 30, 56, 54, 5), { ...R, amp: .7 })),
  ],
  // Trapnej hókuspókus: cylindr a hvězdička
  hokuspokus: () => [
    I(cut(rect(30, 14, 70, 60, 4), { ...R, amp: 1 })),
    C(cut(rect(30, 44, 70, 54, 2), { ...R, amp: .8 })),
    I(cut(rect(12, 58, 88, 70, 5), H)),
    I(cut(star(80, 20, 13, 5), { ...R, amp: .9, tension: .2 })),
  ],
  // Hádka o čárku: škopek a vykřičník
  hadka: () => [
    I(cut([[16, 30], [36, 28], [56, 30], [57, 54], [54, 78], [36, 81], [19, 78], [16, 54]], H)),
    I(cut([[14, 30], [14, 20], [23, 14], [31, 18], [38, 12], [46, 17], [55, 14], [59, 22], [57, 31], [36, 34], [18, 33]], { ...R, amp: 1 })),
    I(cut(ell(58, 50, 11, 12, 16), { ...R, amp: .9 })),
    C(cut(ell(58, 50, 5, 6, 14), JEMNE)),
    I(cut(rect(74, 18, 86, 56, 3), { ...R, amp: .9 })),
    I(cut(ell(80, 68, 7, 7, 18), JEMNE)),
  ],

  // ---------- Tělo v luftě ----------
  // Srostlý budny: dvě nohy svázané k sobě
  budny: () => [
    I(cut(stroke(34, 10, 30, 78, 13), { ...R, amp: .9 })),
    I(cut(stroke(66, 10, 70, 78, 13), { ...R, amp: .9 })),
    I(cut([[18, 76], [40, 74], [42, 92], [16, 92]], { ...R, amp: 1 })),
    I(cut([[60, 74], [82, 76], [84, 92], [58, 92]], { ...R, amp: 1 })),
    C(cut(rect(22, 42, 78, 50, 2), { ...R, amp: .8 })),
    I(cut(ell(50, 46, 9, 9, 18), { ...R, amp: .8 })),
  ],
  // Hajzlovej úlet: panáček a panenka na dveřích
  hajzl: () => [
    hlava(28, 18, 11),
    I(cut(rect(19, 32, 37, 62, 4), { ...R, amp: .9 })),
    I(cut(stroke(24, 62, 22, 88, 8), { ...R, amp: .8 })),
    I(cut(stroke(33, 62, 35, 88, 8), { ...R, amp: .8 })),
    hlava(72, 18, 11),
    I(cut([[72, 32], [86, 64], [58, 64]], { ...R, amp: 1, tension: .25 })),
    I(cut(stroke(67, 64, 65, 88, 8), { ...R, amp: .8 })),
    I(cut(stroke(77, 64, 79, 88, 8), { ...R, amp: .8 })),
  ],
  // Pouliční pumpa: klik
  pumpa: () => [
    I(cut(stroke(16, 58, 72, 38, 15), H)),
    hlava(82, 32, 12),
    I(cut(stroke(66, 44, 70, 78, 9), { ...R, amp: .8 })),
    I(cut(stroke(22, 56, 14, 80, 9), { ...R, amp: .8 })),
    I(cut(rect(58, 78, 82, 88, 3), { ...R, amp: .9 })),
    I(cut(rect(6, 78, 28, 88, 3), { ...R, amp: .9 })),
  ],
  // Živej taxál: bota, co se nedotkne země. Dvě postavičky nad sebou se
  // v téhle velikosti slily do jednoho flíčku a nikdo z toho nepoznal,
  // kdo koho nese.
  taxal: () => [
    I(cut([[22, 30], [52, 28], [62, 44], [78, 50], [82, 62], [24, 64]], H)),
    C(cut(stroke(30, 36, 30, 60, 5), { ...R, amp: .7 })),
    I(cut(rect(30, 72, 48, 78, 2), { ...R, amp: .7 })),
    I(cut(rect(56, 72, 74, 78, 2), { ...R, amp: .7 })),
    I(cut(rect(8, 86, 92, 94, 3), { ...R, amp: 1 })),
  ],
  // Vopičí lajna: po všech čtyřech
  lajna: () => [
    I(cut(rect(18, 34, 76, 52, 6), H)),
    hlava(84, 42, 13),
    I(cut(stroke(26, 52, 22, 84, 9), { ...R, amp: .8 })),
    I(cut(stroke(44, 52, 46, 84, 9), { ...R, amp: .8 })),
    I(cut(stroke(62, 52, 60, 84, 9), { ...R, amp: .8 })),
    I(cut(stroke(74, 52, 78, 84, 9), { ...R, amp: .8 })),
  ],
  // Řev jak z JZD: hlava z profilu s dokořán otevřenou hubou a vlnky zvuku.
  rev: () => [
    I(cut(ell(32, 50, 27, 28, 24), H)),
    C(cut([[30, 50], [62, 34], [62, 66]], { ...R, amp: 1, tension: .2 })),
    C(cut(ell(24, 36, 6, 6, 16), JEMNE)),
    I(cut(srpek(32, 50, 44, 7, -42, 42), { ...R, amp: .8, step: 5 })),
    I(cut(srpek(32, 50, 60, 7, -36, 36), { ...R, amp: .8, step: 5 })),
  ],
  // Bullseye: šipka v terči
  bullseye: () => [
    I(cut(ell(44, 54, 34, 34, 24), { ...R, amp: 1.2 })),
    C(cut(ell(44, 54, 23, 23, 22), { ...R, amp: .9 })),
    I(cut(ell(44, 54, 12, 12, 18), { ...R, amp: .8 })),
    I(cut(stroke(52, 46, 90, 14, 8), { ...R, amp: .8 })),
    I(cut([[82, 8], [96, 6], [92, 22]], { ...R, amp: .9, tension: .25 })),
  ],
  // Betelný bicák: škopek na natažené pazóře
  bicak: () => [
    I(cut(rect(6, 60, 60, 76, 7), H)),
    I(cut(ell(64, 68, 13, 13, 18), { ...R, amp: .9 })),
    I(cut([[44, 16], [62, 14], [78, 16], [79, 32], [76, 46], [62, 49], [47, 46], [44, 32]], H)),
    I(cut([[42, 16], [42, 8], [50, 4], [56, 8], [63, 3], [70, 7], [77, 4], [81, 10], [79, 18], [61, 21], [44, 19]], { ...R, amp: .9 })),
    I(cut(ell(82, 30, 10, 10, 16), { ...R, amp: .9 })),
    C(cut(ell(82, 30, 4.5, 5, 14), JEMNE)),
  ],

  // ---------- Žranice a divadlo ----------
  // Já su výčepní: pípa
  vycepni: () => [
    I(cut(rect(38, 10, 56, 42, 3), { ...R, amp: .9 })),
    I(cut(rect(42, 42, 52, 58, 2), { ...R, amp: .8 })),
    I(cut(stroke(56, 16, 84, 10, 8), { ...R, amp: .8 })),
    I(cut(ell(87, 9, 8, 8, 16), JEMNE)),
    I(cut(rect(43, 58, 51, 74, 2), { ...R, amp: .7 })),
    I(cut([[28, 66], [66, 66], [62, 92], [32, 92]], H)),
  ],
  // Chlastací maturita: panák
  maturita: () => [
    I(cut([[28, 18], [72, 18], [64, 74], [36, 74]], H)),
    C(cut(rect(33, 32, 67, 38, 2), { ...R, amp: .8 })),
    I(cut(rect(26, 74, 74, 88, 4), { ...R, amp: 1 })),
    I(cut(star(84, 18, 11, 4), { ...R, amp: .8, tension: .2 })),
  ],
  // Falešnej jubilant: dort s jednou svíčkou. Jedna svíčka, ne věnec —
  // ve dvaadvaceti bodech se z víc svíček stane hřeben.
  jubilant: () => [
    I(cut([[50, 4], [57, 13], [55, 23], [45, 23], [43, 13]], { ...R, amp: .8 })),
    I(cut(rect(45, 20, 55, 40, 2), { ...R, amp: .8 })),
    I(cut(rect(22, 40, 78, 60, 5), H)),
    C(cut(rect(22, 48, 78, 52, 1), JEMNE)),
    I(cut(rect(13, 60, 87, 84, 6), H)),
    C(cut(rect(13, 70, 87, 74, 1), JEMNE)),
    I(cut(rect(6, 84, 94, 93, 4), { ...R, amp: .9 })),
  ],
  // Vrchní na zkoušku: motýlek. Podnos s půllitrem je zepředu jen ovál
  // a splyne s ostatními kresbami; motýlek je poznat i jako dlaždice.
  vrchni: () => [
    I(cut([[8, 28], [42, 44], [42, 62], [8, 78], [12, 53]], H)),
    I(cut([[92, 28], [58, 44], [58, 62], [92, 78], [88, 53]], H)),
    C(cut(stroke(22, 42, 22, 64, 5), { ...R, amp: .7 })),
    C(cut(stroke(78, 42, 78, 64, 5), { ...R, amp: .7 })),
    I(cut(rect(40, 38, 60, 68, 5), { ...R, amp: 1 })),
  ],

  // Veršovanej lokál: bublina s notou
  versovany: () => [
    I(cut([[12, 46], [16, 24], [38, 12], [64, 13], [86, 24], [90, 46], [80, 64], [54, 72], [36, 72], [24, 88], [26, 68], [14, 60]], H)),
    C(cut(ell(40, 52, 10, 8, 18), { ...R, amp: .8 })),
    C(cut(rect(47, 24, 53, 54, 2), { ...R, amp: .7 })),
    C(cut([[53, 24], [72, 18], [72, 30], [53, 36]], { ...R, amp: .8 })),
  ],
  // Falešnej Anglán: šálek čaje
  anglan: () => [
    I(cut([[20, 40], [70, 40], [64, 76], [26, 76]], H)),
    I(cut(ell(78, 54, 13, 13, 18), { ...R, amp: .9 })),
    C(cut(ell(78, 54, 6, 6, 14), JEMNE)),
    I(cut(rect(10, 78, 84, 90, 4), { ...R, amp: 1 })),
    I(cut(stroke(36, 10, 34, 32, 6), { ...R, amp: .9 })),
    I(cut(stroke(54, 8, 56, 30, 6), { ...R, amp: .9 })),
  ],
  // Hospodský Národní: divadelní maska na tyčce
  narodni: () => [
    I(cut([[26, 14], [74, 14], [78, 44], [68, 68], [50, 80], [32, 68], [22, 44]], H)),
    C(cut(ell(39, 40, 8, 6, 18), { ...R, amp: .8 })),
    C(cut(ell(61, 40, 8, 6, 18), { ...R, amp: .8 })),
    C(cut(srpek(50, 50, 15, 5), { ...R, amp: .8, step: 5 })),
    I(cut(rect(45, 78, 55, 96, 2), { ...R, amp: .8 })),
  ],
  // Brněnskej zloděj: ruka se lžičkou
  zlodej: () => [
    I(cut(ell(72, 18, 15, 19, 20), { ...R, amp: 1 })),
    C(cut(ell(72, 18, 8, 11, 18), { ...R, amp: .7 })),
    I(cut(rect(67, 34, 77, 62, 3), { ...R, amp: .8 })),
    I(cut([[16, 56], [40, 50], [62, 56], [64, 76], [40, 84], [18, 78]], H)),
    C(cut(stroke(28, 56, 26, 78, 5), { ...R, amp: .7 })),
    C(cut(stroke(44, 53, 44, 80, 5), { ...R, amp: .7 })),
  ],
  // Fotka na hovno: foťák
  fotka: () => [
    I(cut(rect(30, 16, 62, 30, 3), { ...R, amp: .9 })),
    I(cut(rect(10, 28, 90, 82, 7), H)),
    C(cut(ell(48, 56, 21, 21, 22), { ...R, amp: 1 })),
    I(cut(ell(48, 56, 10, 10, 18), { ...R, amp: .8 })),
    C(cut(ell(78, 40, 6, 6, 16), JEMNE)),
  ],
  // Živý sochy: figura na dvoustupňovém podstavci. Ruka nahoru a mezera mezi
  // paží a trupem — bez ní se ruka slila do siluety a zbyl panák.
  sochy: () => [
    hlava(48, 16, 11),
    I(cut([[40, 28], [58, 28], [61, 56], [37, 56]], H)),
    I(cut(stroke(58, 32, 78, 12, 9), { ...R, amp: .9 })),
    I(cut(stroke(38, 32, 26, 54, 8), { ...R, amp: .9 })),
    C(cut(stroke(36, 38, 36, 56, 4), JEMNE)),
    I(cut(rect(42, 56, 58, 72, 2), { ...R, amp: .9 })),
    I(cut(rect(30, 72, 70, 80, 2), { ...R, amp: .9 })),
    I(cut(rect(20, 80, 80, 94, 3), H)),
  ],
  // Tácková galerie: dva tácky přes sebe, na předním čmáranice. Kulaté tácky
  // se slily v myší hlavu, tak jsou hranaté a pootočené jako na stole;
  // mezi nimi je vystřižená spára, jinak je z nich jeden kus papíru.
  tacky: () => [
    I(cut(rot(rect(30, 12, 88, 70, 5), -13, 50, 50), H)),
    C(cut(rot(rect(14, 24, 76, 86, 5), 9, 50, 50), { ...R, amp: .9 })),
    I(cut(rot(rect(18, 28, 72, 82, 5), 9, 50, 50), H)),
    C(cut(ell(36, 48, 4, 4, 14), JEMNE)),
    C(cut(ell(55, 45, 4, 4, 14), JEMNE)),
    C(cut(srpek(45, 58, 13, 4), { ...R, amp: .7, step: 5 })),
  ],
};

const out = [];
for (const [k, f] of Object.entries(KRESBY)) {
  nasad(23 + k.length * 29); // pevná náhodnost na kresbu
  out.push(`  ${k}: ${JSON.stringify(f())},`);
}
writeFileSync(new URL("../src/lib/ukol-kresby.ts", import.meta.url),
  `// Kresby úkolů: tlusté siluety s výstřižky, obrys křivý jako stříhaný\n` +
  `// tupýma nůžkama — ta samá ruka jako ikony, jen velké.\n` +
  `// Generuje scripts/kresli-ukoly.mjs – needitovat ručně.\n` +
  `// Obtažené kresby od ruky (kresby.ts) mají přednost, tyhle jsou pro úkoly,\n` +
  `// ke kterým ještě žádná není.\n` +
  `// Vrstvy: "i" = papír (barva textu), "c" = výstřižek (průhledný). viewBox 0 0 100 100.\n` +
  `import type { Vrstva } from "./ikony";\n\n` +
  `export const UKOL_KRESBY = {\n${out.join("\n")}\n} satisfies Record<string, Vrstva[]>;\n`);
console.log("src/lib/ukol-kresby.ts:", Object.keys(KRESBY).length, "kreseb");
