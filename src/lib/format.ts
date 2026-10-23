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

/** Rozdělí jméno na dva co nejvyrovnanější řádky. Jednoslovné jméno vrátí
 *  jako jeden řádek — není kde zlomit.
 *
 *  Karty štací jsou stejně vysoké a jméno na nich má mít pokaždé stejný
 *  tvar. Nechat to na prohlížeči znamená, že se „U Ričího" vejde na řádek
 *  a „Na dobré cestě" se zlomí, takže dvě sousední karty vypadají jako dva
 *  různé návrhy. Tady se zlomí všechno, co má aspoň dvě slova, a to v místě,
 *  po kterém jsou oba řádky nejpodobnější. */
export function naDvaRadky(text: string): string[] {
  const slova = text.trim().split(/\s+/);
  if (slova.length < 2) return [text.trim()];
  let nej = 0;
  let nejrozdil = Infinity;
  for (let i = 1; i < slova.length; i++) {
    const vlevo = slova.slice(0, i).join(" ");
    const vpravo = slova.slice(i).join(" ");
    // Samotné „U" na řádku není zlom, ale překlep. Jednopísmenná předložka
    // musí zůstat u svého slova („U Ričího" se proto nezlomí vůbec a zůstane
    // na jednom vycentrovaném řádku).
    if (vlevo.length < 2 || vpravo.length < 2) continue;
    const rozdil = Math.abs(vlevo.length - vpravo.length);
    if (rozdil < nejrozdil) { nejrozdil = rozdil; nej = i; }
  }
  if (!nej) return [text.trim()];
  return [slova.slice(0, nej).join(" "), slova.slice(nej).join(" ")];
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
