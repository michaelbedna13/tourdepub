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
import { nasad, cut, ell, rect, rot, srpek as usmev, star, stroke } from "./cary.mjs";

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

/** Hlava nasazená na krk: spočítá, kam dát horní hranu obličeje, aby brada
 *  seděla přesně na (kx, ky) i při naklonění. */
function hlavaK(kx, ky, uhel = -9, m = 1.45) {
  const a = (uhel * Math.PI) / 180, bx = 3 * m, by = 19 * m;
  return hlava(kx - (bx * Math.cos(a) - by * Math.sin(a)), ky - (bx * Math.sin(a) + by * Math.cos(a)), uhel, m);
}

/** Celý panák z polohy. Body jsou absolutní; trup = [krk, …, kyčel].
 *  ruce/nohy = lomené čáry, dlane/chodidla = [x, y, směr]. */
function panak({ trup, ruce = [], nohy = [], dlane = [], chodidla = [], hlava: h = -9 }) {
  const [kx, ky] = trup[0];
  return [
    ...nohy.map((n) => kus(n, [5.6, 5.2, 4.8, 4.4].slice(0, n.length))),
    ...chodidla.flatMap(([x, y, sm]) => chodidlo(x, y, sm)),
    kus(trup, [5, 5.2, 5.4, 5.6].slice(0, trup.length)),
    ...ruce.map((r) => kus(r, [4.6, 4.3, 4, 3.7].slice(0, r.length))),
    ...dlane.flatMap(([x, y, sm]) => dlan(x, y, sm)),
    ...hlavaK(kx, ky, h),
  ];
}

/** Zrcadlí vrstvy kolem svislé osy x = o. Dráhy z cut() jsou samé dvojice
 *  čísel, takže stačí přepsat každé x. */
const zrcadli = (vrstvy, o = 50) => vrstvy.map(([druh, d]) => [druh,
  d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, x, y) => `${Math.round((2 * o - x) * 10) / 10} ${y}`)]);

/** Škopek s pěnou a uchem. (x, y) je střed sklenice, uhel ji naklání,
 *  strana říká, na které straně je ucho (1 vpravo, -1 vlevo), m zvětšuje.
 *  Ucho je oblouk do D, ne kolečko: kolečko vedle sklenice se četlo jako
 *  bublina, a hlavně se za něj nedalo viditelně chytit. */
function skopek(x, y, uhel = 0, strana = 1, m = 1) {
  const z = (pts) => pts.map(([a, b]) => [a * strana, b]);
  const u = (pts) => umisti(z(pts), x, y, uhel, m);
  return [
    I(cut(u([[3, -3.8], [7.6, -4.2], [10, -1.8], [10, 2.6], [7.6, 5], [3, 4.8]]), PRST)),
    C(cut(u([[3.8, -1.8], [6.6, -2], [7.6, -.2], [7.5, 2], [6.6, 2.9], [3.8, 2.9]]), PRST)),
    I(cut(u(rect(-4.4, -5, 4.4, 7, 1.2)), PRST)),
    I(cut(u(ell(0, -5.4, 5.6, 2.7, 16)), PRST)),
    C(cut(u(tah([[-1.7, -1.5], [-1.7, 4.6]], 1.2)), PRST)),
    C(cut(u(tah([[1.5, -1.5], [1.5, 4.6]], 1.2)), PRST)),
  ];
}

/** Škopek držený ZA UCHO. (hx, hy) je konec ruky, tam je pěst: sedí na
 *  vnějším oblouku ucha, palec leží navrch, a mezi pěstí a sklem zůstává
 *  vidět díra. Tak je jasné, že panák drží ucho.
 *  Napřed ruka končila uprostřed sklenice (držel to jak kelímek), potom
 *  jen vrůstala do malého kolečka a úchop nebyl vidět ani tak. */
function skopekVRuce(hx, hy, uhel = 0, strana = 1, m = 1.25) {
  const a = (uhel * Math.PI) / 180, dx = 10.6 * strana * m, dy = .6 * m;
  const cx = hx - (dx * Math.cos(a) - dy * Math.sin(a)), cy = hy - (dx * Math.sin(a) + dy * Math.cos(a));
  const u = (pts) => umisti(pts.map(([p, q]) => [p * strana, q]), cx, cy, uhel, m);
  return [
    ...skopek(cx, cy, uhel, strana, m),
    // pěst přes vnější oblouk ucha a palec přes horní hranu
    I(cut(u(ell(10.6, .6, 2.6, 3.4, 14)), PRST)),
    I(cut(u(tah([[10, -2], [7.4, -4.6]], [2.2, 1.6])), PRST)),
  ];
}

/** Krátké čárky kolem něčeho: ťuknutí, záblesk, kapky. */
const jiskry = (x, y, r1, r2, uhly, w = 2.2) =>
  uhly.map((st) => { const a = (st * Math.PI) / 180;
    return I(cut(tah([[x + Math.cos(a) * r1, y + Math.sin(a) * r1], [x + Math.cos(a) * r2, y + Math.sin(a) * r2]], [w, w * .7]), PRST)); });

/** Hospoda: přízemní budova se sedlovou střechou, okno s křížem, dveře
 *  a vývěsní štít se škopkem na rameni. x je levá hrana zdi, zem je y,
 *  na kterém budova stojí,
 *  m zvětšuje, strana = 1 štít vlevo (hospoda stojí vpravo a štít visí
 *  směrem k panákovi), -1 zrcadlově. Kreslí se v místních souřadnicích
 *  0…40 × 0…44 (štít a střecha přesahují do minusu). */
const ZEM = 92;

function hospodaTvar(x, zem, m = 1, strana = 1) {
  const W = 40;
  const y = zem - 44 * m;
  const t = (pts) => pts.map(([a, b]) => [x + (strana > 0 ? a : W - a) * m, y + b * m]);
  const ZED = { amp: .5, step: 4, tension: .42 };
  // škopek ve štítu jako výstřižek: střed štítu je v místních (-9.5, 20)
  const sx = x + (strana > 0 ? -9.5 : W + 9.5) * m - 1.6 * m, sy = y + 20.4 * m;
  const mug = skopek(sx, sy, 0, 1, .5 * m).map(([d, p]) => [d === "i" ? "c" : "i", p]);
  return [
    I(cut(t(rect(0, 8, W, 44, 1)), ZED)),
    I(cut(t([[-3, 10], [20, -6], [43, 10]]), ZED)),
    I(cut(t(rect(28, -6, 33, 4, .8)), PRST)),
    C(cut(t(rect(4, 16, 17, 29, 1.2)), PRST)),
    I(cut(t(tah([[10.5, 16], [10.5, 29]], 1.6)), PRST)),
    I(cut(t(tah([[4, 22.5], [17, 22.5]], 1.6)), PRST)),
    C(cut(t(rect(23, 20, 35, 44, 5)), PRST)),
    I(cut(t(ell(32.5, 33, 1, 1, 8)), JEMNE)),
    I(cut(t(tah([[0, 10], [-16, 10]], 2.2)), PRST)),
    I(cut(t(tah([[-3, 10], [-3, 13]], 1)), PRST)),
    I(cut(t(tah([[-15, 10], [-15, 13]], 1)), PRST)),
    I(cut(t(rect(-19, 13, 0, 28, 1.5)), PRST)),
    ...mug,
  ];
}

/** Panák, co jde: krok, předklon, škopek v ruce před sebou, druhá ruka
 *  máchá dozadu. x posouvá celou postavu (40 = střed čtverce), nahoru =
 *  škopek zvedá nad hlavu (odchází z hospody a připíjí). */
function panakJde(x, nahoru = false) {
  const y = 0;
  const p = (body) => body.map(([a, b]) => [a + x - 40, b + y]);
  const vrstvy = [
    ...panak({
      trup: p([[40, 37], [39, 50], [38, 63]]),
      ruce: [nahoru ? p([[40, 44], [47, 37], [52, 27]]) : p([[40, 44], [48, 49], [55, 45]]), p([[39, 45], [32, 52], [28, 59]])],
      nohy: [p([[38, 62], [45, 75], [50, 90]]), p([[38, 62], [32, 76], [26, 89]])],
      chodidla: [[x + 10, 91 + y, -5], [x - 15, 90 + y, 200]], dlane: [[x - 13, 61 + y, 110]], hlava: 10,
    }),
    ...(nahoru ? skopekVRuce(x + 12, 27 + y, -20, -1) : skopekVRuce(x + 15, 45 + y, -8, -1)),
  ];
  return vrstvy;
}

/** Výstřižek z plného tvaru: obrátí papír a díru (škopek vystřižený ze
 *  štítu nebo ze šipky). */
const naruby = (vrstvy) => vrstvy.map(([d, p]) => [d === "i" ? "c" : "i", p]);

/** Obrys oblouku: rovné boky a půlkruh nahoře (portál, klenba). */
function oblouk(x1, y1, x2, y2) {
  const r = (x2 - x1) / 2, cx = x1 + r, cy = y1 + r;
  const vrch = [...Array(13)].map((_, i) => { const a = Math.PI + (i * Math.PI) / 12;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; });
  return [[x1, y2], ...vrch, [x2, y2]];
}

/** Obrys sudu: boky vypouklé, dno a víko rovné. */
function sud(x1, y1, x2, y2) {
  const v = (x2 - x1) * .1, n = 8, L = [], R = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, y = y1 + (y2 - y1) * t, o = Math.sin(t * Math.PI) * v;
    L.push([x1 + v - o, y]); R.push([x2 - v + o, y]);
  }
  return [...L, ...R.reverse()];
}

// Z těchhle se do appky dostane jen to, co je v POUZITE. Zbytek zůstává
// tady jako zdroj: kreslilo se to pro starou průpravu přes čtyři plakáty
// a může se to hodit, ale vozit čtyři nepoužité kresby v balíku je zbytečné.
const KRESBY = {

  // Sraz: dva panáci si ťukají škopkem. Druhý je zrcadlo prvního, ale
  // v jiné poloze, ať to nevypadá jako odraz v okně. Stojí od sebe tak,
  // aby se vějíře vlasů nedotkly, a škopky se potkají mezi nima.
  sraz: () => {
    const levy = (x) => x - 8;
    const posun = (body) => body.map(([x, y]) => [levy(x), y]);
    return [
      ...panak({
        trup: posun([[26, 36], [27, 49], [29, 62]]),
        ruce: [posun([[27, 43], [33, 42], [38, 35]]), posun([[26, 45], [18, 51], [24, 58]])],
        nohy: [posun([[29, 61], [23, 76], [20, 90]]), posun([[29, 61], [36, 75], [38, 90]])],
        chodidla: [[levy(20), 91, 185], [levy(38), 91, -5]], hlava: -6,
      }),
      ...skopekVRuce(levy(38), 35, -10, -1),
      ...zrcadli([
        ...panak({
          trup: posun([[27, 37], [27, 50], [28, 63]]),
          ruce: [posun([[28, 44], [34, 43], [38, 35]]), posun([[26, 46], [18, 40], [13, 31]])],
          nohy: [posun([[28, 62], [20, 72], [22, 86], [18, 91]]), posun([[28, 62], [34, 76], [34, 90]])],
          chodidla: [[levy(17), 92, 190], [levy(34), 91, -10]], dlane: [[levy(12), 29, -110]], hlava: -2,
        }),
        ...skopekVRuce(levy(38), 35, -10, -1),
      ]),
      ...jiskry(50, 22, 5, 11, [-90, -130, -50]),
    ];
  },

  // Na trase: panák visí na lucerně se škopkem v ruce, nohy zakřížené.
  // Lucerna je štatl v noci: jedna čára, rameno a stínítko. Stojí tak
  // daleko, aby jí vějíř vlasů nepíchal do obličeje; ruka ji drží.
  lucerna: () => [
    I(cut(tah([[84, 98], [84, -2]], [4.4, 3.4]), TAH)),
    I(cut(tah([[84, -1], [85, -8], [91, -11], [100, -10]], [3.2, 3, 2.8, 2.6]), TAH)),
    I(cut([[94, -9], [106, -9], [109, 0], [91, 0]], { amp: .4, step: 3, tension: .42 })),
    I(cut(rect(77, 94, 91, 99, 1.5), PRST)),
    ...jiskry(100, 1, 5, 10, [60, 90, 120], 1.8),
    ...panak({
      trup: [[50, 37], [47, 50], [44, 63]],
      ruce: [[[51, 43], [62, 40], [74, 41], [84, 44]], [[49, 45], [40, 44], [33, 36]]],
      nohy: [[[44, 62], [49, 76], [54, 90]], [[44, 62], [44, 77], [37, 91]]],
      chodidla: [[55, 91, -5], [37, 92, 185]], hlava: 6,
    }),
    ...skopekVRuce(33, 36, 14, 1),
  ],

  // Od špeluňky ke špeluňce: panák jde se škopkem ke sklepní hospodě.
  // Dřív visel na lucerně. Mišák chtěl hospodu, pak ať se o ni neopírá,
  // a domky se střechou a komínem (hospodaTvar) byly „hnusný“: četly se
  // jako dětská kresba domu. Hospoda je proto předmět, ne dům, stejně
  // jako tabule u čárek: velký plochý tvar s ostře vystřiženým detailem.
  // Výchozí B: masivní zeď s klenutým vchodem, kameny kolem klenby
  // a vývěsní štít se škopkem. A (rozcestník se dvěma šipkami a škopky)
  // a C (pivní sud s pípou) přes VARIANTA=a / c.
  hospoda: () => {
    const V = process.env.VARIANTA || "b";
    const PLOCHA = { amp: .6, step: 4, tension: .42 };
    if (V === "b") return [
      // klenutý vchod do sklepní hospody: masivní zeď, v ní vystřižená
      // klenba s kameny kolem, nad vchodem štít se škopkem
      ...panakJde(18),
      I(cut(rect(62, 10, 112, 92, 1.5), PLOCHA)),
      C(cut(oblouk(73, 30, 101, 92), PRST)),
      ...[[-150, -122], [-115, -88], [-80, -52], [-45, -18], [-10, 18]].map(([a, b]) => {
        const r1 = 16.5, r2 = 22, c = [87, 44];
        const bod = (r, st) => [c[0] + Math.cos((st * Math.PI) / 180) * r, c[1] + Math.sin((st * Math.PI) / 180) * r];
        const kamen = [bod(r1, a + 4), bod(r2, a + 4), bod(r2, b - 4), bod(r1, b - 4)];
        return C(cut(kamen, PRST));
      }),
      I(cut(rect(58, 89, 116, 95, 1), PRST)),
      I(cut(tah([[112, 22], [130, 22]], 2.6), PRST)),
      I(cut(tah([[115, 22], [115, 27]], 1.2), PRST)),
      I(cut(tah([[127, 22], [127, 27]], 1.2), PRST)),
      I(cut(rect(111, 26, 133, 46, 1.8), PRST)),
      ...naruby(skopek(120, 36, 0, 1, .75)),
    ];
    if (V === "c") return [
      // pivní sud s obručemi, dole pípa, z ní kápne
      ...panakJde(18),
      I(cut(sud(66, 30, 114, 92), PLOCHA)),
      C(cut(tah([[67, 44], [113, 44]], 3), PRST)),
      C(cut(tah([[67, 78], [113, 78]], 3), PRST)),
      C(cut(ell(90, 61, 4.5, 4.5, 12), JEMNE)),
      I(cut(tah([[67, 70], [58, 70], [58, 76]], [3.4, 3.4, 2.8]), PRST)),
      I(cut(rect(55, 64, 61, 67, .8), PRST)),
      I(cut(ell(58, 82, 1.6, 2.4, 10), JEMNE)),
    ];
    // rozcestník: vysoký sloup, šipka doprava nahoře, doleva níž, v obou
    // vystřižený škopek
    return [
      ...panakJde(14),
      I(cut(tah([[92, 4], [92, 92]], [4.4, 4.8]), PRST)),
      I(cut(rect(85, 89, 99, 95, 1.2), PRST)),
      I(cut([[88, 8], [122, 8], [133, 20], [122, 32], [88, 32]], PLOCHA)),
      ...naruby(skopek(105, 20, 0, 1, .85)),
      I(cut([[96, 40], [96, 64], [64, 64], [53, 52], [64, 40]], PLOCHA)),
      ...naruby(skopek(76, 52, 0, -1, .85)),
    ];
  },

  // Žádný courání: panák běží, předklon, škopek před sebou, pěna
  // odlétá. Čárky za ním říkají, že to valí.
  beh: () => [
    ...[[[4, 42], [20, 42]], [[0, 54], [18, 54]], [[8, 66], [22, 66]]].map((t) => I(cut(tah(t, [2.8, 2]), PRST))),
    ...panak({
      trup: [[52, 36], [47, 49], [42, 61]],
      ruce: [[[51, 43], [60, 50], [69, 45]], [[49, 45], [40, 50], [35, 42]]],
      nohy: [[[42, 60], [56, 67], [54, 83]], [[42, 60], [34, 73], [22, 79]]],
      chodidla: [[54, 84, 5], [21, 79, 230]], dlane: [[34, 40, 230]], hlava: 18,
    }),
    ...skopekVRuce(69, 45, -8, -1),
    I(cut(ell(84, 32, 2.2, 2.2, 10), PRST)),
    I(cut(ell(89, 37, 1.6, 1.6, 10), PRST)),
    I(cut(ell(80, 27, 1.5, 1.5, 10), PRST)),
  ],

  // Čárky na tabuli: plná tabule s vystřiženými čárkami a panák na ni
  // ukazuje z kousku dál. Napřed na ni sahal křídou a ruka přes tabuli
  // potřebovala spáru, kolem které zůstalo prázdno bez smyslu. Pak se
  // zkoušela tabule jako rám s křídou; Mišák chtěl jednodušší cestu:
  // panáka odsunout, ať ukazuje z dálky a na tabuli vůbec nesahá.
  zed: () => [
    I(cut(rect(56, 12, 100, 64, 2.5), { amp: .6, step: 4, tension: .42 })),
    I(cut(tah([[62, 64], [59, 92]], 3.4), PRST)),
    I(cut(tah([[94, 64], [97, 92]], 3.4), PRST)),
    C(cut(tah([[67, 21], [66, 54]], [3.6, 3.2]), PRST)),
    C(cut(tah([[75, 20], [75, 54]], [3.6, 3.2]), PRST)),
    C(cut(tah([[83, 20], [84, 54]], [3.6, 3.2]), PRST)),
    C(cut(tah([[91, 21], [92, 54]], [3.6, 3.2]), PRST)),
    C(cut(tah([[62, 47], [96, 26]], [3.2, 3.6]), PRST)),
    ...panak({
      trup: [[25, 37], [26, 50], [28, 63]],
      ruce: [[[26, 44], [36, 41], [45, 36]], [[25, 46], [18, 54], [14, 62]]],
      nohy: [[[28, 62], [21, 77], [18, 91]], [[28, 62], [35, 77], [38, 91]]],
      chodidla: [[18, 92, 185], [38, 92, -5]], dlane: [[47, 35, -25]], hlava: -12,
    }),
    ...skopekVRuce(14, 62, 4, 1),
  ],

  // Konečná: vítěz ve skoku, ruce do V, v jedné pohár vysoko nad hlavou.
  // Stín pod ním říká, že je ve vzduchu.
  vitez: () => [
    I(cut(ell(48, 99, 15, 1.8, 18), PRST)),
    ...panak({
      trup: [[48, 40], [47, 53], [48, 66]],
      ruce: [[[47, 46], [37, 37], [27, 27]], [[49, 46], [62, 38], [76, 26]]],
      nohy: [[[48, 65], [39, 73], [41, 86]], [[48, 65], [58, 71], [62, 84]]],
      chodidla: [[41, 87, 170], [62, 85, 10]], dlane: [[26, 25, -130]], hlava: -8,
    }),
    // pohár: kalich, dvě ucha, noha a podstavec; drží ho za podstavec
    I(cut(ell(70, 2, 3.6, 3.6, 12), PRST)), C(cut(ell(70, 2, 1.8, 1.8, 10), PRST)),
    I(cut(ell(90, 2, 3.6, 3.6, 12), PRST)), C(cut(ell(90, 2, 1.8, 1.8, 10), PRST)),
    I(cut([[70, -3], [90, -3], [88, 5], [83, 10], [77, 10], [72, 5]], { amp: .4, step: 3, tension: .42 })),
    C(cut(star(80, 2.5, 3.6, 1.6, 5), PRST)),
    I(cut(tah([[80, 9], [80, 16]], 3), PRST)),
    I(cut(rect(74, 15, 86, 19.5, 1.2), PRST)),
    I(cut(tah([[76, 26], [79, 19]], 3.6), PRST)),
  ],

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
const POUZITE = ["sraz", "hospoda", "beh", "zed", "vitez"];

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
