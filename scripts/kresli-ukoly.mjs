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
  // Vyžebranej chudák: bankovka. Nastavená dlaň s mincí se četla jako
  // ruka s dírou — mince uprostřed dlaně zmizela, ať byla jakkoli velká.
  chudak: () => [
    I(cut(rect(6, 28, 94, 74, 4), H)),
    C(cut(ell(50, 51, 15, 16, 20), { ...R, amp: .9 })),
    C(cut(ell(16, 51, 5, 5, 14), JEMNE)),
    C(cut(ell(84, 51, 5, 5, 14), JEMNE)),
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
  // Rada nad zlato: žárovka. Vlákno bylo dvě svislé čárky a četlo se jako
  // oči, tak je teď do véčka, a kolem baňky jsou paprsky.
  rada: () => [
    I(cut(ell(50, 44, 23, 25, 22), { ...R, amp: 1.1 })),
    C(cut(stroke(42, 54, 50, 36, 5), { ...R, amp: .7 })),
    C(cut(stroke(50, 36, 58, 54, 5), { ...R, amp: .7 })),
    I(cut(rect(40, 66, 60, 80, 3), { ...R, amp: .9 })),
    C(cut(rect(40, 71, 60, 74, 1), JEMNE)),
    I(cut(rect(44, 80, 56, 90, 3), { ...R, amp: .9 })),
    I(cut(stroke(16, 18, 25, 28, 6), { ...R, amp: .7 })),
    I(cut(stroke(84, 18, 75, 28, 6), { ...R, amp: .7 })),
    I(cut(stroke(50, 6, 50, 15, 6), { ...R, amp: .7 })),
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

  // Srostlý budny: dvě nohy, jeden pásek. Boty a druhý pásek dole z toho
  // dělaly dva roboty.
  budny: () => [
    I(cut(rect(24, 8, 44, 90, 7), H)),
    I(cut(rect(56, 8, 76, 90, 7), H)),
    I(cut(rect(12, 44, 88, 62, 6), H)),
    C(cut(rect(12, 50, 88, 56, 1), JEMNE)),
  ],
  // Hajzlovej úlet: cedule s panáčkem v sukni. Dveře s malou cedulkou měly
  // to hlavní velké pár bodů; teď je cedule celá kresba.
  hajzl: () => [
    I(cut(rect(16, 8, 84, 92, 8), H)),
    C(cut(ell(50, 30, 11, 11, 18), { ...R, amp: .8 })),
    C(cut([[33, 78], [42, 44], [58, 44], [67, 78]], { ...R, amp: .9, tension: .3 })),
  ],
  // Pouliční pumpa: klik. Hlava musí mít kolem sebe mezeru, jinak se slije
  // s trupem a z kliku je sedmička.
  pumpa: () => [
    I(cut([[12, 66], [62, 40], [70, 54], [20, 80]], H)),
    hlava(86, 30, 12),
    I(cut(stroke(64, 56, 68, 88, 11), { ...R, amp: .8 })),
    I(cut(stroke(18, 72, 10, 88, 11), { ...R, amp: .8 })),
  ],
  // Živej taxál: taxikářská cedule na střeše. Bota nad zemí nebo dvě
  // postavičky nad sebou se nepovedly ani jednou; tohle je předmět
  // a jméno úkolu říká to samé.
  taxal: () => [
    I(cut(rect(14, 34, 86, 64, 8), H)),
    C(cut(rect(22, 42, 35, 56, 1), JEMNE)),
    C(cut(rect(44, 42, 57, 56, 1), JEMNE)),
    C(cut(rect(66, 42, 79, 56, 1), JEMNE)),
    I(cut(rect(28, 64, 72, 74, 3), { ...R, amp: .8 })),
  ],
  // Vopičí lajna: jeden otisk dlaně. Dlaň i bota vedle sebe byly dva tvary
  // a ten druhý vycházel jako dvě hrudky.
  lajna: () => [
    I(cut(ell(50, 64, 23, 20, 22), H)),
    I(cut(stroke(30, 52, 21, 26, 11), { ...R, amp: .8 })),
    I(cut(stroke(43, 46, 40, 12, 11), { ...R, amp: .8 })),
    I(cut(stroke(57, 46, 62, 12, 11), { ...R, amp: .8 })),
    I(cut(stroke(70, 52, 81, 28, 11), { ...R, amp: .8 })),
  ],
  // Řev jak z JZD: kravská hlava. Megafon ani hlava z profilu se nečetly,
  // a tohle navíc sedí na jméno úkolu.
  rev: () => [
    I(cut([[22, 32], [78, 32], [82, 60], [68, 84], [32, 84], [18, 60]], H)),
    I(cut(stroke(26, 36, 10, 20, 10), { ...R, amp: .8 })),
    I(cut(stroke(74, 36, 90, 20, 10), { ...R, amp: .8 })),
    C(cut(ell(37, 50, 6, 6, 14), JEMNE)),
    C(cut(ell(63, 50, 6, 6, 14), JEMNE)),
    C(cut(ell(50, 71, 15, 9, 18), { ...R, amp: .8 })),
  ],
  // Bullseye: terč se šipkou. Šipka měla hrot jako vlaječku, teď má
  // tenký dřík a křidélka.
  bullseye: () => [
    I(cut(ell(42, 58, 34, 34, 26), { ...R, amp: 1.2 })),
    C(cut(ell(42, 58, 23, 23, 22), { ...R, amp: .9 })),
    I(cut(ell(42, 58, 11, 11, 18), { ...R, amp: .8 })),
    I(cut(stroke(48, 52, 84, 18, 6), { ...R, amp: .7 })),
    I(cut([[74, 8], [96, 6], [92, 28], [80, 22]], { ...R, amp: .9, tension: .25 })),
  ],
  // Betelný bicák: činka. Paže se zkoušela čtyřikrát, pokaždé z ní byl
  // flíček; předmět, co znamená sílu, se pozná na první pohled.
  bicak: () => [
    I(cut(rect(8, 28, 30, 72, 5), H)),
    I(cut(rect(70, 28, 92, 72, 5), H)),
    I(cut(rect(26, 42, 74, 58, 4), H)),
    C(cut(rect(30, 34, 36, 66, 1), JEMNE)),
    C(cut(rect(64, 34, 70, 66, 1), JEMNE)),
  ],

  // Já su výčepní: pípa nad škopkem. Samotná pípa se četla jako trubka,
  // se škopkem pod ní je jasné, co se děje.
  vycepni: () => [
    I(cut(rect(30, 6, 44, 32, 3), { ...R, amp: .9 })),
    I(cut(rect(44, 10, 74, 20, 3), { ...R, amp: .9 })),
    I(cut(rect(32, 32, 42, 46, 2), { ...R, amp: .8 })),
    I(cut([[24, 52], [62, 52], [58, 92], [28, 92]], H)),
    I(cut(ell(68, 66, 12, 12, 18), { ...R, amp: .9 })),
    C(cut(ell(68, 66, 6, 6, 14), JEMNE)),
    C(cut(rect(24, 60, 62, 64, 1), JEMNE)),
  ],
  // Chlastací maturita: panák
  maturita: () => [
    I(cut([[28, 18], [72, 18], [64, 74], [36, 74]], H)),
    C(cut(rect(33, 32, 67, 38, 2), { ...R, amp: .8 })),
    I(cut(rect(26, 74, 74, 88, 4), { ...R, amp: 1 })),
    I(cut(star(84, 18, 11, 4), { ...R, amp: .8, tension: .2 })),
  ],
  // Falešnej jubilant: dort se svíčkou. Měkký dvoupatrový tvar vypadal
  // jak hromada kamení, tak mají patra rovné boky a pod nimi je podnos.
  jubilant: () => [
    I(cut(rect(26, 46, 74, 64, 3), H)),
    I(cut(rect(16, 64, 84, 84, 3), H)),
    I(cut(rect(8, 84, 92, 92, 2), { ...R, amp: 1 })),
    C(cut(rect(16, 62, 84, 66, 1), JEMNE)),
    I(cut(rect(47, 22, 53, 46, 2), { ...R, amp: .7 })),
    I(cut([[50, 4], [58, 15], [50, 22], [42, 15]], { ...R, amp: .8, tension: .3 })),
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
  // Přímej přenos: mikrofon s vlnkami. Vlnky jsou jen na jedné straně,
  // jak u Řevu z JZD: kolem dokola z toho byl ježek.
  prenos: () => [
    I(cut(ell(46, 30, 17, 21, 22), { ...R, amp: 1 })),
    C(cut(rect(31, 24, 61, 27, 1), JEMNE)),
    C(cut(rect(31, 33, 61, 36, 1), JEMNE)),
    I(cut(rect(41, 50, 51, 74, 2), { ...R, amp: .8 })),
    I(cut(rect(30, 76, 62, 86, 3), { ...R, amp: .9 })),
    I(cut(srpek(46, 30, 30, 6, -46, 46), { ...R, amp: .8, step: 5 })),
  ],
  // Královská delegace: koruna. Hroty musí zůstat ostré, proto nižší
  // tension — vyhlazená koruna vypadala jako vlna.
  delegace: () => [
    I(cut([[14, 76], [19, 30], [34, 52], [50, 22], [66, 52], [81, 30], [86, 76]],
          { ...H, tension: .25 })),
    I(cut(rect(14, 72, 86, 90, 3), { ...R, amp: 1 })),
    C(cut(ell(30, 64, 5, 5, 14), JEMNE)),
    C(cut(ell(50, 60, 5, 5, 14), JEMNE)),
    C(cut(ell(70, 64, 5, 5, 14), JEMNE)),
  ],
  // Hospodský Národní: divadelní maska na tyčce
  narodni: () => [
    I(cut([[26, 14], [74, 14], [78, 44], [68, 68], [50, 80], [32, 68], [22, 44]], H)),
    C(cut(ell(39, 40, 8, 6, 18), { ...R, amp: .8 })),
    C(cut(ell(61, 40, 8, 6, 18), { ...R, amp: .8 })),
    C(cut(srpek(50, 50, 15, 5), { ...R, amp: .8, step: 5 })),
    I(cut(rect(45, 78, 55, 96, 2), { ...R, amp: .8 })),
  ],
  // Brněnskej zloděj: lžička. Výstřižek v misce z ní dělal zrcátko,
  // tak je miska plná a krček úzký.
  zlodej: () => [
    I(cut(ell(50, 24, 19, 23, 22), H)),
    I(cut(rect(44, 44, 56, 94, 6), H)),
  ],
  // Fotka na hovno: foťák
  fotka: () => [
    I(cut(rect(30, 16, 62, 30, 3), { ...R, amp: .9 })),
    I(cut(rect(10, 28, 90, 82, 7), H)),
    C(cut(ell(48, 56, 21, 21, 22), { ...R, amp: 1 })),
    I(cut(ell(48, 56, 10, 10, 18), { ...R, amp: .8 })),
    C(cut(ell(78, 40, 6, 6, 16), JEMNE)),
  ],
  // Živý sochy: busta. Panáček na desce vypadal jako panáček na desce;
  // hlava s rameny na podstavci je socha i bez vysvětlování.
  sochy: () => [
    I(cut(ell(50, 26, 17, 19, 22), H)),
    I(cut([[28, 46], [72, 46], [78, 76], [22, 76]], H)),
    I(cut(rect(30, 76, 70, 86, 3), { ...R, amp: .9 })),
    I(cut(rect(20, 86, 80, 96, 3), H)),
  ],
  // Kapela na placku: čtyři chlapi na přechodu, jak na tom slavném obalu.
  //
  // Postavy i pruhy jsou ta samá barva, takže by se slily v jednu plochu.
  // Každá postava proto dostane nejdřív obrys o pár bodů větší jako
  // výstřižek a teprve do něj se nakreslí — kolem ní je tím pádem mezera
  // a na přechodu je vidět. Vystřihnout rovnou postavy z pruhů nešlo:
  // mezery mezi pruhy je rozsekaly a byla z toho mříž.
  kapela: () => {
    // Přechod leží jen v dolní třetině. Když vyplňoval celý čtverec, obrysy
    // postav ho rozkrájely na drobky a vypadalo to, že stojí za mřížemi.
    const pruhy = [60, 77, 94]
      .map((y) => I(cut(rect(0, y, 100, y + 13, 2), { ...R, amp: .9 })));
    const dily = [16, 38, 60, 82].flatMap((x, i) => {
      const d = (i % 2) * 4;
      return [
        [ell(x, 13, 7, 7, 16), ell(x, 13, 10, 10, 16)],
        [[[x - 8, 21], [x + 8, 21], [x + 6, 56], [x - 6, 56]],
         [[x - 10, 19], [x + 10, 19], [x + 8, 59], [x - 8, 59]]],
        [stroke(x - 2, 54, x - 5 - d, 90, 6), stroke(x - 2, 54, x - 5 - d, 93, 11)],
        [stroke(x + 2, 54, x + 5 + d, 90, 6), stroke(x + 2, 54, x + 5 + d, 93, 11)],
      ];
    });
    return [
      ...pruhy,
      ...dily.map(([, obal]) => C(cut(obal, { ...R, amp: .8 }))),
      ...dily.map(([plny]) => I(cut(plny, { ...R, amp: .8 }))),
    ];
  },
  // Dabing naživo: filmová klapka. Bublina by se pletla s Tichou špeluňkou
  // i Veršovaným lokálem, ty už obě bublinu mají.
  dabing: () => [
    I(cut(rect(10, 40, 90, 88, 4), H)),
    I(cut(rot(rect(8, 14, 92, 34, 2), -9, 50, 24), { ...R, amp: 1 })),
    C(cut(rot(rect(26, 14, 34, 34, 1), -9, 50, 24), { ...R, amp: .7 })),
    C(cut(rot(rect(50, 14, 58, 34, 1), -9, 50, 24), { ...R, amp: .7 })),
    C(cut(rot(rect(74, 14, 82, 34, 1), -9, 50, 24), { ...R, amp: .7 })),
  ],
  // Trenér roku: stopky. Píšťalka se zkoušela dvakrát a pokaždé z ní byl
  // v téhle velikosti šnek nebo flaška: tělo s náustkem splyne do jednoho
  // kužele. Stopky mají korunku nahoře a ručičky uvnitř, takže se nedají
  // splést ani s terčem Bullseye.
  trener: () => [
    I(cut(rect(43, 6, 57, 30, 2), { ...R, amp: .8 })),
    I(cut(ell(50, 58, 33, 33, 26), H)),
    C(cut(ell(50, 58, 25, 25, 24), { ...R, amp: .9 })),
    I(cut(stroke(50, 58, 50, 38, 5), { ...R, amp: .7 })),
    I(cut(stroke(50, 58, 66, 66, 5), { ...R, amp: .7 })),
    I(cut(ell(50, 58, 5, 5, 14), JEMNE)),
  ],
  // Tácková galerie: jeden tácek s hvězdou. Dva přes sebe se slily v jeden
  // pomačkaný papír.
  tacky: () => [
    I(cut(rot(rect(12, 12, 88, 88, 6), -7), H)),
    C(cut(star(50, 52, 25, 11), { ...R, amp: .9 })),
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
