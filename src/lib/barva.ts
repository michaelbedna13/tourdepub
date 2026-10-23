// Počítání s barvami. Potřebujeme to na jedno jediné: z barvy štace udělat
// plochu, na které se dá číst. Paleta hospod (BARVY_HOSPOD) jde od tmavé
// rzi po světle růžovou a karta štace je ve všech devíti případech stejná
// — krémový text na barevném podkladu. Kdyby se barva vzala tak, jak je,
// „máslová" a „nádech růžové" by byly nečitelné.

type Hsl = { h: number; s: number; l: number };

/** #RRGGBB (i zkrácené #RGB) na HSL. Mimo rozsah vrací šedou. */
function naHsl(hex: string): Hsl {
  const h = hex.replace("#", "");
  const plny = h.length === 3 ? h.split("").map((z) => z + z).join("") : h;
  const c = parseInt(plny, 16);
  if (plny.length !== 6 || Number.isNaN(c)) return { h: 0, s: 0, l: .5 };
  const r = ((c >> 16) & 255) / 255, g = ((c >> 8) & 255) / 255, b = (c & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  const l = (max + min) / 2;
  if (!d) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  const uhel = max === r ? ((g - b) / d + (g < b ? 6 : 0))
    : max === g ? (b - r) / d + 2
    : (r - g) / d + 4;
  return { h: uhel * 60, s, l };
}

function slozka(p: number, q: number, t: number): number {
  let x = t;
  if (x < 0) x += 1;
  if (x > 1) x -= 1;
  if (x < 1 / 6) return p + (q - p) * 6 * x;
  if (x < 1 / 2) return q;
  if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6;
  return p;
}

/** HSL zpátky na #RRGGBB. */
function zHsl({ h, s, l }: Hsl): string {
  const q = l < .5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const t = h / 360;
  const slozky = s === 0 ? [l, l, l] : [slozka(p, q, t + 1 / 3), slozka(p, q, t), slozka(p, q, t - 1 / 3)];
  return "#" + slozky.map((x) => Math.round(x * 255).toString(16).padStart(2, "0")).join("");
}

/** Relativní světlost podle WCAG – to, z čeho se počítá kontrast. */
function svetlost({ h, s, l }: Hsl): number {
  const hex = zHsl({ h, s, l }).slice(1);
  const kanaly = [0, 2, 4].map((i) => {
    const x = parseInt(hex.slice(i, i + 2), 16) / 255;
    return x <= .03928 ? x / 12.92 : Math.pow((x + .055) / 1.055, 2.4);
  });
  return .2126 * kanaly[0] + .7152 * kanaly[1] + .0722 * kanaly[2];
}

/** Zvedne světlost, dokud barva nemá zadanou relativní světlost. */
function naSvetlostNahoru(z: Hsl, cil: number): Hsl {
  let dolu = z.l, nahoru = 1;
  if (svetlost(z) >= cil) return z;
  for (let i = 0; i < 18; i++) {
    const stred = (dolu + nahoru) / 2;
    if (svetlost({ ...z, l: stred }) < cil) dolu = stred; else nahoru = stred;
  }
  return { ...z, l: (dolu + nahoru) / 2 };
}

/** Stáhne světlost, dokud barva nemá zadanou relativní světlost. */
function naSvetlostDolu(z: Hsl, cil: number): Hsl {
  let dolu = 0, nahoru = z.l;
  if (svetlost(z) <= cil) return z;
  for (let i = 0; i < 18; i++) {
    const stred = (dolu + nahoru) / 2;
    if (svetlost({ ...z, l: stred }) > cil) nahoru = stred; else dolu = stred;
  }
  return { ...z, l: (dolu + nahoru) / 2 };
}

// Dva inkousty, mezi kterými se vybírá — tytéž dvě barvy, kterými jsou
// popsané karty kategorií.
const TMAVY = "#2B2B23";
const KREM = "#F2E7CF";
// Meze, kde inkoust drží kontrast 4,5:1: pod tmavým se barva musí dostat
// nad DNO, pod krémem pod STROP. Druhá hodnota je spodek přechodu, aby text
// neslábnul ani v dolním rohu karty.
const DNO = .34, DNO_TMA = .285;
const STROP = .105, STROP_TMA = .05;
// Kolik světlosti se barvě ještě smí přidat, než se místo rozsvícení raději
// stáhne do hloubky. Rez a chrpa jsou tmavé barvy; rozsvícené na mez pro
// tmavý inkoust z nich je lososová a bledý fialek, zatímco stažené do tmy
// zůstanou rzí a chrpou.
const JESTE_ROZSVITIT = .075;
const TMAVSI = .84;

/** Barva štace rozepsaná na kartu Hry: plná barva nahoře, stejná barva
 *  o kus tmavší dole a inkoust, kterým se na ni píše.
 *
 *  Karta štace byla dřív barva naředěná na devět procent do podkladu, takže
 *  devět hospod vypadalo jako devět stejných karet. Teď je v barvě celá,
 *  jako karty kategorií. Paleta hospod jde od tmavé rzi po světle růžovou,
 *  takže jedna pevná barva textu nemůže fungovat: podle barvy se vybere
 *  inkoust a barva se k němu posune na mez čitelnosti. Posouvá se vždycky
 *  tím kratším směrem, aby zůstala sama sebou — odstín i sytost se nemění. */
export function tonHospody(barva: string): { plna: string; tma: string; inkoust: string } {
  const z = naHsl(barva);
  const naTmavy = DNO - svetlost(z);

  if (naTmavy <= JESTE_ROZSVITIT) {
    // světlá barva (nebo skoro): necháme ji svítit a píšeme na ni natmavo
    const plna = naSvetlostNahoru(z, DNO);
    let dno = { ...plna, l: plna.l * TMAVSI };
    if (svetlost(dno) < DNO_TMA) dno = naSvetlostNahoru(dno, DNO_TMA);
    return { plna: zHsl(plna), tma: zHsl(dno), inkoust: TMAVY };
  }

  // tmavá barva: stáhne se do hloubky a píše se na ni krémem. Sytost se
  // přitom přitáhne, protože tmavá barva o sobě vypadá šedivě.
  const syta = { ...z, s: Math.min(.92, Math.max(z.s * 1.1, .26)) };
  const plna = naSvetlostDolu(syta, STROP);
  let dno = { ...plna, l: plna.l * TMAVSI };
  if (svetlost(dno) < STROP_TMA) dno = naSvetlostNahoru(dno, STROP_TMA);
  return { plna: zHsl(plna), tma: zHsl(dno), inkoust: KREM };
}
