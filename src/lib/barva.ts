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

/** Posune světlost tak, aby barva měla zadanou relativní světlost. */
function naSvetlost(z: Hsl, cil: number): Hsl {
  let dolu = 0, nahoru = 1;
  for (let i = 0; i < 20; i++) {
    const stred = (dolu + nahoru) / 2;
    if (svetlost({ ...z, l: stred }) < cil) dolu = stred; else nahoru = stred;
  }
  return { ...z, l: (dolu + nahoru) / 2 };
}

// Na kartě štace se píše krémem, na všech štacích stejně. Barva se tedy musí
// vejít pod mez, kde krém drží kontrast 4,5:1 (relativní světlost 0,139).
const PASMO_OD = .075, PASMO_DO = .132;
// Spodek přechodu je o tenhle díl tmavší než vršek.
const TMAVSI = .55;
// Světlost nejtmavší a nejsvětlejší barvy v paletě hospod. Barva se do pásma
// nesráží na jednu hodnotu, ale přemapuje: kdyby všechny skončily na stejné
// světlosti, florida, zlatý samet a máslová by vyšly jako tři stejné hnědé.
// Takhle si pořadí i rozestupy nesou s sebou.
const PALETA_OD = .19, PALETA_DO = .66;

/** Barva štace rozepsaná na kartu Hry: plná barva nahoře a stejná barva
 *  stažená do tmy dole.
 *
 *  Karta štace byla dřív barva naředěná na devět procent do podkladu, takže
 *  devět hospod vypadalo jako devět stejných karet. Teď je v barvě celá.
 *  Píše se na ni krémem — na všech štacích stejně, protože jméno hospody má
 *  vypadat pokaždé stejně — a to znamená, že barva musí do tmy. Odstín
 *  i sytost zůstávají, takže hospodu pořád poznáš podle barvy; sytost se
 *  u kalných barev naopak přitáhne, protože tmavá a nesytá je šedivá. */
export function tonHospody(barva: string): { plna: string; tma: string } {
  const z = naHsl(barva);
  const dil = Math.min(1, Math.max(0, (svetlost(z) - PALETA_OD) / (PALETA_DO - PALETA_OD)));
  const cil = PASMO_OD + (PASMO_DO - PASMO_OD) * dil;
  const syta = { ...z, s: Math.min(.92, Math.max(z.s * 1.15, .18)) };
  const plna = naSvetlost(syta, cil);
  return { plna: zHsl(plna), tma: zHsl({ ...plna, l: plna.l * TMAVSI }) };
}
