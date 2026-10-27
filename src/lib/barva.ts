// Barvy štací. Devět hospod mělo dřív devět nesouvisejících barev z plakátové
// palety — rez, chrpa, pistácie, máslová — a vedle sebe to byl vzorník, ne
// trasa. Teď je to jedna barva: ta z Lucky Bastarda, první štace, rozepsaná
// přes celý večer.
//
// Mění se tři věci naráz a všechny stejným směrem: odstín jde od oranžové
// k vínové, sytost klesá a barva tmavne. Je to tedy ciferník večera —
// z první štace je vidět, že je začátek, z deváté, že už je pozdě.

type Hsl = { h: number; s: number; l: number };

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

// Na kartě štace se píše krémem, na všech štacích stejně. Nejsvětlejší
// barva rampy tedy musí zůstat pod mezí, kde krém drží kontrast 4,5:1
// (relativní světlost 0,139). Naměřeno: první štace vychází na 4,6:1,
// devátá na 7,9:1.
const ZAC = { h: 26, s: .92, svetlo: .136 };
const KON = { h: 4, s: .40, svetlo: .058 };
// Spodek přechodu na kartě je o tenhle díl tmavší než vršek.
const TMAVSI = .55;

const mezi = (a: number, b: number, t: number) => a + (b - a) * t;

/** Barva štace podle místa na trase, rozepsaná na kartu Hry: plná barva
 *  nahoře a stejná barva stažená do tmy dole.
 *
 *  Karta štace byla dřív barva naředěná na devět procent do podkladu, takže
 *  devět hospod vypadalo jako devět stejných karet. Teď je v barvě celá.
 *
 *  Barva se bere z pořadí, ne z hospody: je to údaj o tom, kolik večera je
 *  za tebou, ne značka podniku. Kdo si hospody přeskládá nebo přidá desátou,
 *  dostane rampu přepočítanou, ne díru v ní. */
export function barvaStace(poradi: number, celkem: number): { plna: string; tma: string } {
  const t = celkem > 1 ? Math.min(1, Math.max(0, poradi / (celkem - 1))) : 0;
  const z = { h: mezi(ZAC.h, KON.h, t), s: mezi(ZAC.s, KON.s, t), l: .5 };
  const plna = naSvetlost(z, mezi(ZAC.svetlo, KON.svetlo, t));
  return { plna: zHsl(plna), tma: zHsl({ ...plna, l: plna.l * TMAVSI }) };
}
