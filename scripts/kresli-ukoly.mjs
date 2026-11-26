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

/** Tlustý tah po lomené čáře (spirála, oblouky): obrys kolem bodů,
 *  v ohybech se normály zprůměrují, ať se zatáčka nerozpadne. */
function tah(pts, w) {
  const L = [], P = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1];
    const d = Math.hypot(dx, dy) || 1;
    dx /= d; dy /= d;
    const h = (Array.isArray(w) ? w[i] : w) / 2;
    L.push([pts[i][0] - dy * h, pts[i][1] + dx * h]);
    P.push([pts[i][0] + dy * h, pts[i][1] - dx * h]);
  }
  return [...L, ...P.reverse()];
}

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

  // Srostlý budny: dvě boty svázané tkaničkou s mašlí. Tvar jako „H“ (a pak
  // dvě svázané nohy) se četl jako písmeno nebo žebřík.
  budny: () => {
    const bota = (dx, dy) => [[10, 88], [9, 68], [18, 60], [30, 64], [42, 67], [58, 71], [70, 77], [72, 86], [66, 90], [14, 90]]
      .map(([x, y]) => [x + dx, y + dy]);
    return [
      I(cut(bota(22, -18), { ...R, amp: .5, tension: .5 })),
      C(cut(bota(0, 0).map(([x, y]) => [x + (x < 40 ? -3 : 3), y + (y < 75 ? -3 : 3)]), JEMNE)),
      I(cut(bota(0, 0), { ...R, amp: .5, tension: .5 })),
      C(cut(stroke(12, 84, 68, 84, 2.4), JEMNE)),
      C(cut(stroke(34, 66, 37, 72, 2.2), JEMNE)),
      C(cut(stroke(42, 68, 45, 74, 2.2), JEMNE)),
      I(cut(tah([[18, 60], [26, 50], [34, 46], [40, 42]], 3.4), JEMNE)),
      I(cut(rot(ell(26, 36, 9, 5, 16), -35, 26, 36), JEMNE)),
      C(cut(rot(ell(26, 36, 4.5, 1.8, 12), -35, 26, 36), JEMNE)),
      I(cut(rot(ell(42, 34, 9, 5, 16), 30, 42, 34), JEMNE)),
      C(cut(rot(ell(42, 34, 4.5, 1.8, 12), 30, 42, 34), JEMNE)),
      I(cut(ell(34, 40, 4, 4, 12), JEMNE)),
    ];
  },
  // Hajzlovej úlet: cedule WC, panáček a panenka. Dveře s klíčovou dírkou
  // se jako záchod nečetly.
  hajzl: () => [
    I(cut(ell(28, 18, 8, 8, 18), { ...R, amp: .5 })),
    I(cut(rect(18, 30, 38, 62, 3), { ...R, amp: .6 })),
    I(cut(stroke(23, 60, 23, 90, 7), JEMNE)),
    I(cut(stroke(33, 60, 33, 90, 7), JEMNE)),
    I(cut(rect(48, 8, 52, 92, 1), JEMNE)),
    I(cut(ell(72, 18, 8, 8, 18), { ...R, amp: .5 })),
    I(cut([[66, 30], [78, 30], [90, 70], [54, 70]], { ...R, amp: .6 })),
    I(cut(stroke(67, 68, 67, 90, 6), JEMNE)),
    I(cut(stroke(77, 68, 77, 90, 6), JEMNE)),
  ],
  // Pouliční pumpa: klik. Hlava musí mít kolem sebe mezeru, jinak se slije
  // s trupem a z kliku je sedmička.
  pumpa: () => [
    I(cut([[12, 66], [62, 40], [70, 54], [20, 80]], H)),
    hlava(86, 30, 12),
    I(cut(stroke(64, 56, 68, 88, 11), { ...R, amp: .8 })),
    I(cut(stroke(18, 72, 10, 88, 11), { ...R, amp: .8 })),
  ],
  // Živej taxál: auto z boku s taxi cedulí na střeše. Samotná cedule se
  // nedala poznat.
  taxal: () => [
    I(cut([[4, 68], [8, 56], [26, 51], [36, 36], [66, 36], [78, 51], [94, 55], [96, 68]], H)),
    C(cut([[39, 41], [49, 41], [49, 51], [32, 51]], { ...R, amp: .4 })),
    C(cut([[53, 41], [64, 41], [72, 51], [53, 51]], { ...R, amp: .4 })),
    I(cut(ell(26, 70, 11, 11, 20), { ...R, amp: .6 })),
    C(cut(ell(26, 70, 4.5, 4.5, 12), JEMNE)),
    I(cut(ell(74, 70, 11, 11, 20), { ...R, amp: .6 })),
    C(cut(ell(74, 70, 4.5, 4.5, 12), JEMNE)),
    I(cut(rect(38, 22, 64, 34, 2), { ...R, amp: .5 })),
    ...[41.5, 48.5, 55.5].map((x) => C(cut(rect(x, 25, x + 3.5, 28.5, .5), JEMNE))),
    ...[45, 52, 59].map((x) => C(cut(rect(x, 28.5, x + 3.5, 32, .5), JEMNE))),
  ],
  // Vopičí lajna: opičí hlava s kudrlinkou. Velké uši, hladký obrys,
  // obličej do tvaru buráku s lemem kolem, oči a čumák. Původní hlava měla
  // zubatý chochol jako korunku a obličej přes celou hlavu; zkoušely se
  // i banán, otisky dlaní a opice po čtyřech (VARIANTA_LAJNY=a/b/c), ale
  // Mišák chtěl hlavu, jen líp.
  lajna: () => {
    const V = process.env.VARIANTA_LAJNY || "hlava-kudrna";
    if (V === "hlava" || V === "hlava-kudrna") {
      // opičí hlava: velké uši, obličej do tvaru buráku, oči a čumák
      return [
        I(cut(ell(18, 53, 12, 12, 22), { ...R, amp: .35 })),
        I(cut(ell(82, 53, 12, 12, 22), { ...R, amp: .35 })),
        C(cut(ell(18, 54, 6, 6, 16), JEMNE)),
        C(cut(ell(82, 54, 6, 6, 16), JEMNE)),
        I(cut(ell(50, 50, 30, 32, 32), { ...R, amp: .35, step: 5 })),
        C(cut(ell(41, 46, 9.5, 10.5, 20), JEMNE)),
        C(cut(ell(59, 46, 9.5, 10.5, 20), JEMNE)),
        C(cut(ell(50, 63, 16, 11.5, 22), JEMNE)),
        I(cut(ell(41.5, 47, 3.6, 4.6, 12), JEMNE)),
        I(cut(ell(58.5, 47, 3.6, 4.6, 12), JEMNE)),
        I(cut(ell(46.5, 59, 1.8, 1.5, 10), JEMNE)),
        I(cut(ell(53.5, 59, 1.8, 1.5, 10), JEMNE)),
        I(cut(srpek(50, 62, 8, 2.6, 25, 155, 10), JEMNE)),
        ...(V === "hlava-kudrna" ? [I(cut(tah([[46, 19], [44, 12], [48, 6], [55, 7], [56, 13], [51, 14]], [5, 4.6, 4.2, 3.8, 3.4, 3]), JEMNE))] : []),
      ];
    }
    if (V === "a") {
      // banán: oblouk, uprostřed nejširší, na konci stopka
      const body = [];
      for (let i = 0; i <= 12; i++) {
        const u = Math.PI * (0.78 - i * 0.047);
        body.push([50 + Math.cos(u) * 52, 10 + Math.sin(u) * 62]);
      }
      const sirky = body.map((_, i) => 5 + Math.sin((i / 12) * Math.PI) * 17);
      return [
        I(cut(tah(body, sirky), { ...R, amp: .5, step: 4 })),
        C(cut(tah(body.slice(3, 10).map(([x, y]) => [x, y - 4]), 2.4), JEMNE)),
        I(cut(tah([body[0], [body[0][0] - 6, body[0][1] - 10]], [6, 5]), JEMNE)),
      ];
    }
    if (V === "b") {
      // otisky dlaní po čtyřech: dvě ruce šikmo za sebou
      const dlan = (x, y, uhel, m) => {
        const u = (pts) => rot(pts.map(([q, w]) => [x + q * m, y + w * m]), uhel, x, y);
        return [
          I(cut(u(ell(0, 6, 11, 12, 20)), { ...R, amp: .5 })),
          ...[-9, -3, 3, 9].map((fx, i) => I(cut(u(ell(fx, -12 + Math.abs(i - 1.5) * 2, 3.2, 6.5, 12)), JEMNE))),
          I(cut(u(ell(-15, 4, 3.2, 6.5, 12)), JEMNE)),
        ];
      };
      return [...dlan(30, 66, -20, 1.15), ...dlan(68, 32, -20, 1.15)];
    }
    // opice po čtyřech s ocasem do spirály
    const ocas = [];
    for (let t = 0; t <= 2.6 * Math.PI; t += .25) {
      const r = 14 - t * 1.6;
      ocas.push([76 + Math.cos(t + Math.PI) * r, 30 + Math.sin(t + Math.PI) * r]);
    }
    return [
      I(cut(ell(50, 50, 22, 12, 22), H)),
      I(cut(ell(22, 40, 11, 10, 20), { ...R, amp: .6 })),
      I(cut(ell(12, 34, 4, 4, 12), JEMNE)),
      C(cut(ell(19, 42, 6, 5, 14), JEMNE)),
      ...[[34, 58, 30, 84], [44, 60, 42, 86], [60, 58, 64, 84], [68, 56, 74, 82]]
        .map(([q, w, e, r]) => I(cut(tah([[q, w], [e, r]], [7, 5]), JEMNE))),
      I(cut(tah([[70, 46], [62, 30], ...ocas], 4.4), JEMNE)),
    ];
  },
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
  // Bullseye: terč a šipka zapíchnutá do středu. Šipka měla napřed hrot
  // jako vlaječku a potom velký trojúhelník venku na konci dříku, takže
  // letěla z terče pryč a celé to vypadalo jako znak ♂. Teď hrot mizí
  // v černém středu, dřík vede šikmo ven a na konci má letky do V,
  // jak to u šipek je.
  bullseye: () => {
    const osa = (t, k = 0) => [42 + t * .707 + k * .707, 58 - t * .707 + k * .707];
    return [
      I(cut(ell(42, 58, 34, 34, 26), { ...R, amp: 1.2 })),
      C(cut(ell(42, 58, 23, 23, 22), { ...R, amp: .9 })),
      I(cut(ell(42, 58, 11, 11, 18), { ...R, amp: .8 })),
      // spára kolem šipky přes vnější kruh, ať se šipka neslije s terčem
      C(cut([osa(10, -6.5), osa(40, -6.5), osa(40, 6.5), osa(10, 6.5)], JEMNE)),
      I(cut([osa(4, -3), osa(26, -4.5), osa(26, 4.5), osa(4, 3)], { ...R, amp: .6 })),
      I(cut([osa(26, -1.6), osa(46, -1.6), osa(46, 1.6), osa(26, 1.6)], { ...R, amp: .4 })),
      I(cut([osa(42, -1), osa(52, -10), osa(62, -10), osa(58, 0), osa(62, 10), osa(52, 10), osa(42, 1)], { ...R, amp: .5, tension: .25 })),
    ];
  },
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
  // Hospodský Národní: divadelní maska na tyčce
  narodni: () => [
    I(cut([[26, 14], [74, 14], [78, 44], [68, 68], [50, 80], [32, 68], [22, 44]], H)),
    C(cut(ell(39, 40, 8, 6, 18), { ...R, amp: .8 })),
    C(cut(ell(61, 40, 8, 6, 18), { ...R, amp: .8 })),
    C(cut(srpek(50, 50, 15, 5), { ...R, amp: .8, step: 5 })),
    I(cut(rect(45, 78, 55, 96, 2), { ...R, amp: .8 })),
  ],
  // Brněnskej zloděj: lupičská maska přes oči. Lžička se četla jako kyj.
  zlodej: () => [
    I(cut([[6, 46], [18, 34], [36, 33], [50, 40], [64, 33], [82, 34], [94, 46], [88, 62],
           [68, 67], [56, 60], [44, 60], [32, 67], [12, 62]], { ...H, tension: .45 })),
    C(cut(ell(31, 49, 9, 6.5, 18), { ...R, amp: .5 })),
    C(cut(ell(69, 49, 9, 6.5, 18), { ...R, amp: .5 })),
    I(cut(tah([[92, 50], [97, 60], [99, 72]], [5, 4, 3]), JEMNE)),
    I(cut(tah([[90, 54], [92, 66], [91, 78]], [5, 4, 3]), JEMNE)),
  ],
  // Fotka na hovno: foťák
  fotka: () => [
    I(cut(rect(30, 16, 62, 30, 3), { ...R, amp: .9 })),
    I(cut(rect(10, 28, 90, 82, 7), H)),
    C(cut(ell(48, 56, 21, 21, 22), { ...R, amp: 1 })),
    I(cut(ell(48, 56, 10, 10, 18), { ...R, amp: .8 })),
    C(cut(ell(78, 40, 6, 6, 16), JEMNE)),
  ],
  // Živý sochy: socha na podstavci, ruka nahoru s pochodní. Busta se
  // četla jako sedící postava.
  sochy: () => [
    I(cut(ell(46, 16, 7, 7, 16), { ...R, amp: .5 })),
    I(cut([[38, 26], [54, 26], [57, 46], [55, 68], [37, 68], [35, 46]], { ...R, amp: .6 })),
    I(cut(tah([[52, 29], [60, 18], [64, 8]], [6, 5.5, 5]), JEMNE)),
    I(cut(tah([[40, 30], [32, 44], [34, 56]], [6, 5.5, 5]), JEMNE)),
    I(cut(ell(65, 4, 3.4, 4.6, 12), JEMNE)),
    I(cut(rect(26, 68, 66, 74, 1.5), { ...R, amp: .5 })),
    I(cut(rect(30, 74, 62, 90, 2), H)),
    I(cut(rect(24, 90, 68, 96, 1.5), { ...R, amp: .5 })),
  ],
  // Kapela na placku: deska vyjíždí z obalu. Čtyři chlapi na přechodu se
  // v kartě slili do změti čar a samotná deska se pletla s terčem.
  kapela: () => {
    const kruh = (r, w) => [C(cut(ell(62, 50, r, r, 40), JEMNE)), I(cut(ell(62, 50, r - w, r - w, 40), JEMNE))];
    return [
      I(cut(rect(4, 14, 66, 86, 2.5), H)),
      C(cut(ell(62, 50, 39, 39, 44), JEMNE)),
      I(cut(ell(62, 50, 35, 35, 44), { ...R, amp: .6 })),
      ...kruh(29, 1.8), ...kruh(23, 1.8),
      C(cut(ell(62, 50, 13, 13, 28), JEMNE)),
      I(cut(ell(62, 50, 11, 11, 24), JEMNE)),
      C(cut(ell(62, 50, 2.6, 2.6, 12), JEMNE)),
      C(cut(star(22, 30, 7, 3), JEMNE)),
    ];
  },
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
  // Kresby pro Tělo v luftě jsou symboly, ne scény (Mišák: „nemusí to
  // být konkrétně ono, ať je to čitelný“). Napřed to byly doslovné scény:
  // hlavy s rameny v pyramidě, hlava s táckem a obličejem, biceps; v kartě
  // se četly jako emoji nebo jako nic.

  // Lidská pyramida: egyptská pyramida z kvádrů.
  pyramida: () => {
    const radky = [[38, 33, 67], [56, 22, 78], [74, 12, 88]];
    return [
      I(cut([[6, 88], [50, 12], [94, 88]], { ...H, tension: .2 })),
      ...radky.map(([y, x1, x2]) => C(cut(stroke(x1, y, x2, y, 3), JEMNE))),
      ...[[50, 47], [38, 65], [62, 65], [28, 81], [50, 81], [72, 81]]
        .map(([x, y]) => C(cut(stroke(x, y - 6, x, y + 4, 3), JEMNE))),
    ];
  },
  // Točenej mašinfíra: spirála, jak se točí hlava, a dvě hvězdičky.
  tocenej: () => {
    const body = [];
    for (let t = 0; t <= 3.1 * Math.PI; t += .18) {
      const r = 6 + t * 3.55;
      body.push([47 + Math.cos(t) * r, 54 + Math.sin(t) * r]);
    }
    return [
      I(cut(tah(body, body.map((_, i) => 6 + i * .06)), { ...R, amp: .5, step: 4 })),
      I(cut(star(84, 16, 9, 3.6), JEMNE)),
      I(cut(star(16, 18, 6, 2.4), JEMNE)),
    ];
  },
  // Páka s cizákem: býčí hlava, síla a tvrdá palice. Mišák si ji vybral
  // ze seznamu nápadů; před ní pěst, rukavice, blesk, VS a pěsti proti
  // sobě (ty zůstávají přes VARIANTA_PAKY=a/b/c/d). Z tří provedení býka
  // nejlíp fungovaly velké rohy, oči a kroužek v nose dohromady: bez
  // rohů je to kráva. Mišák pak vybral C: jen velké rohy, bez očí
  // a bez kroužku (spojení s očima a kroužkem zůstává jako VARIANTA_PAKY=byk).
  paka: () => {
    const V = process.env.VARIANTA_PAKY || "byk-c";
    if (V.startsWith("byk")) {
      const silne = V === "byk" || V === "byk-c";
      const roh = (smer) => {
        const z = (pts) => pts.map(([x, y]) => [50 + (x - 50) * smer, y]);
        const body = silne ? [[34, 36], [20, 34], [9, 24], [6, 8]] : [[34, 36], [22, 33], [13, 25], [10, 13]];
        return I(cut(tah(z(body), silne ? [12, 10, 7, 3] : [9, 8, 6, 3]), { ...R, amp: .5, step: 4 }));
      };
      const ucho = (smer) => I(cut(rot(ell(50 + 27 * smer, 45, 10, 5, 16), -18 * smer, 50 + 27 * smer, 45), { ...R, amp: .5 }));
      return [
        roh(1), roh(-1), ucho(1), ucho(-1),
        I(cut([[30, 30], [70, 30], [75, 46], [67, 68], [62, 84], [38, 84], [33, 68], [25, 46]], { ...H, tension: .5 })),
        I(cut(ell(50, 80, 17, 11, 20), { ...R, amp: .6 })),
        C(cut(ell(43, 81, 3.2, 4.2, 12), JEMNE)),
        C(cut(ell(57, 81, 3.2, 4.2, 12), JEMNE)),
        ...(V === "byk-a" || V === "byk" ? [C(cut(ell(39, 52, 3.8, 3.2, 12), JEMNE)), C(cut(ell(61, 52, 3.8, 3.2, 12), JEMNE))] : []),
        ...(V === "byk" ? [I(cut(srpek(50, 86, 10, 3.6, 10, 170, 14), JEMNE))] : []),
        ...(V === "byk-a" || V === "byk-b" ? [I(cut(srpek(50, 89, 8, 2.8, 15, 165, 12), JEMNE))] : []),
      ];
    }
    if (V === "b") return [
      // blesk
      I(cut([[58, 6], [24, 54], [46, 54], [36, 94], [78, 40], [55, 40], [68, 6]], { ...H, tension: .15 })),
    ];
    if (V === "c") return [
      // VS v kruhu
      I(cut(ell(50, 50, 42, 42, 32), H)),
      C(cut([[16, 32], [24, 32], [32, 58], [40, 32], [48, 32], [36, 70], [28, 70]], { ...R, amp: .4, tension: .2 })),
      C(cut(tah([[80, 36], [74, 31], [62, 33], [60, 42], [70, 48], [80, 54], [79, 64], [67, 68], [58, 63]], 6.4), { ...R, amp: .4 })),
    ];
    if (V === "d") {
      // dvě pěsti proti sobě
      const pest = (x, smer) => {
        const z = (pts) => pts.map(([a, b]) => [x + a * smer, b]);
        return [
          I(cut(z([[0, 34], [26, 34], [30, 66], [0, 66]]), H)),
          ...[39, 48, 57].map((y) => I(cut(z(ell(30, y, 7, 5.2, 14)), { ...R, amp: .5 }))),
          I(cut(z(ell(28, 30, 7, 5.6, 14)), { ...R, amp: .5 })),
          ...[43.5, 52.5].map((y) => C(cut(z(stroke(22, y, 37, y, 2.2)), JEMNE))),
          I(cut(z(rect(-18, 40, 2, 60, 2)), { ...R, amp: .6 })),
        ];
      };
      return [...pest(14, 1), ...pest(86, -1),
        ...[-120, -90, -60].map((st) => { const a = (st * Math.PI) / 180;
          return I(cut(stroke(50 + Math.cos(a) * 18, 30 + Math.sin(a) * 6, 50 + Math.cos(a) * 26, 30 + Math.sin(a) * 18, 3.2), JEMNE)); })];
    }
    // boxovací rukavice
    return [
      I(cut([[24, 44], [26, 24], [40, 12], [62, 12], [78, 24], [82, 44], [78, 62], [68, 70], [40, 70], [26, 62]], { ...H, tension: .5 })),
      I(cut([[14, 34], [22, 30], [30, 38], [30, 54], [22, 58], [14, 52]], { ...R, amp: .6, tension: .5 })),
      C(cut(tah([[30, 40], [30, 56]], 2.6), JEMNE)),
      I(cut(rect(36, 72, 72, 92, 3), H)),
      C(cut(stroke(38, 79, 70, 79, 3), JEMNE)),
    ];
  },
  // Tácek na palici: kulatý pivní tácek se zubatým okrajem a vystřiženým
  // škopkem, nakloněný, a kolem čárky, jak se kýve. Tácková galerie má
  // tácek hranatý s hvězdou, takže se nepletou.
  palice: () => {
    const okraj = [];
    for (let i = 0; i < 64; i++) {
      const a = (i / 64) * Math.PI * 2, r = 33 + Math.cos(a * 16) * 2.2;
      okraj.push([50 + Math.cos(a) * r, 52 + Math.sin(a) * r]);
    }
    const sklon = (pts) => rot(pts, -12, 50, 52);
    return [
      I(cut(sklon(okraj), { ...R, amp: .4, step: 3 })),
      C(cut(sklon(rect(37, 42, 55, 68, 3)), { ...R, amp: .5 })),
      C(cut(sklon(ell(46, 41, 11, 4.5, 16)), JEMNE)),
      C(cut(sklon(ell(61, 55, 7.5, 7.5, 16)), JEMNE)),
      I(cut(sklon(ell(61, 55, 3.6, 3.6, 12)), JEMNE)),
      I(cut(srpek(50, 52, 46, 3.6, 150, 185, 8), JEMNE)),
      I(cut(srpek(50, 52, 46, 3.6, -5, 30, 8), JEMNE)),
    ];
  },
  // Homo huban: rty. Ve sto bodech se čtou předměty, ne postavičky
  // (dva panáci v pusinkování by byli flíček); rty s rýhou mezi sebou
  // a srdíčko nad nimi jsou pusa i bez čtení.
  hubana: () => [
    I(cut([[6, 56], [16, 44], [28, 35], [40, 32], [50, 39], [60, 32], [72, 35], [84, 44], [94, 56],
           [84, 68], [70, 78], [50, 82], [30, 78], [16, 68]], { ...H, tension: .5 })),
    C(cut([[12, 56], [26, 53], [40, 55], [50, 59], [60, 55], [74, 53], [88, 56],
           [74, 59], [60, 61], [50, 64], [40, 61], [26, 59]], { ...R, amp: .5 })),
    I(cut([[78, 26], [70, 18], [67, 11], [70, 6], [75, 6], [78, 10],
           [81, 6], [86, 6], [89, 11], [86, 18]], { ...JEMNE, tension: .5 })),
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
