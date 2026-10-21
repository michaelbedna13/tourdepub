// Drobnosti kolem textu a čísel.
//
// Escapování tu schválně není: v Reactu se text do stránky dostává jako text,
// ne jako HTML, takže se o to nemusíme starat. Ve staré verzi to byla funkce
// navíc, na kterou se dalo zapomenout.

/** Správný tvar slova „čárka“ podle počtu. */
export function sklonuj(n: number): string {
  const a = Math.abs(n);
  if (a === 1) return "čárka";
  if (a >= 2 && a <= 4) return "čárky";
  return "čárek";
}

/** Správný tvar slova „úkol“ podle počtu. */
export function sklonujUkol(n: number): string {
  const a = Math.abs(n);
  if (a === 1) return "úkol";
  if (a >= 2 && a <= 4) return "úkoly";
  return "úkolů";
}

/** Správný tvar slova „tým“ podle počtu. */
export function sklonujTym(n: number): string {
  const a = Math.abs(n);
  if (a === 1) return "tým";
  if (a >= 2 && a <= 4) return "týmy";
  return "týmů";
}

/** Trojice tvarů podle počtu: 1 / 2–4 / zbytek. */
const tvar = (n: number, jeden: string, par: string, hodne: string): string => {
  const a = Math.abs(n);
  return a === 1 ? jeden : a >= 2 && a <= 4 ? par : hodne;
};

/** Jak dlouho už to trvá, česky a ve čtvrtém pádu – věta zní „jste tady dvacet
 *  minut“, ne „0:20“. Pod minutu se nic nepočítá: v hospodě nikoho nezajímá,
 *  jestli je to čtyřicet vteřin. */
export function jakDlouho(odMs: number, ted = Date.now()): string {
  const minut = Math.max(0, Math.floor((ted - odMs) / 60000));
  if (minut < 1) return "chvilku";
  if (minut < 60) return minut === 1 ? "minutu" : `${minut} ${tvar(minut, "minutu", "minuty", "minut")}`;
  const h = Math.floor(minut / 60), m = minut % 60;
  const hodiny = h === 1 ? "hodinu" : `${h} ${tvar(h, "hodinu", "hodiny", "hodin")}`;
  if (!m) return hodiny;
  return `${hodiny} a ${m === 1 ? "minutu" : `${m} ${tvar(m, "minutu", "minuty", "minut")}`}`;
}

// Jednopísmenné předložky a spojky (k, s, v, z, o, u, a, i) nesmí v češtině
// zůstat na konci řádku. Opakuje se, dokud se text mění: u dvou krátkých slov
// za sebou („a v palici“) spotřebuje první průchod mezeru před druhým slovem
// a to by zůstalo nesvázané.
const KRATKA = /(^|[\s([„"'—])([ksvzouaiKSVZOUAI])[ \t]+/g;

/** Sváže krátká slova nedělitelnou mezerou s dalším slovem. */
export function vazat(text: string): string {
  let drive: string;
  let t = text;
  do {
    drive = t;
    t = t.replace(KRATKA, "$1$2\u00A0");
  } while (t !== drive);
  return t;
}
