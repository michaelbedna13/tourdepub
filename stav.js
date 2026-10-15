// Stav hry: co má parta splněno, kolik má čárek a ukládání.
// Ukládá se do telefonu (localStorage) a volitelně i do Supabase, aby ostatní party
// viděly skóre živě. Telefon je vždycky zdroj pravdy pro vlastní partu – bez signálu
// se zapisuje dál a pošle se to, až bude signál.
import { HOSPODY, UKOLY, UKOL_PODLE_ID } from "./data.js";

const KLIC = "tourdepub";

export const BARVY = ["#E8A317", "#D9634E", "#6FB3E0", "#9AD17B", "#C78BE0", "#F0906B"];

function prazdnyStav() {
  return {
    parta: { id: crypto.randomUUID(), nazev: "", barva: BARVY[0] },
    hospoda: 1,
    prichod: {},   // { "1": true } – čárka za špeluňku
    skopek: {},    // { "1": true } – čárka za škopek
    ukoly: {},     // { "hadka": 1 } – kolikrát splněno
    zlodej: {},    // { "3": true } – ze kterých hospod už něco šlohli
  };
}

export const stav = nacti();

function nacti() {
  try {
    const ulozeno = JSON.parse(localStorage.getItem(KLIC) || "null");
    if (ulozeno?.parta?.id) return { ...prazdnyStav(), ...ulozeno };
  } catch {
    // poškozený zápis radši zahodíme, než aby se web vůbec nespustil
  }
  return prazdnyStav();
}

const posluchaci = new Set();
export const naZmenu = (f) => (posluchaci.add(f), () => posluchaci.delete(f));

export function uloz() {
  try {
    localStorage.setItem(KLIC, JSON.stringify(stav));
  } catch {
    // plná paměť prohlížeče nesmí shodit zápis – hra běží dál z paměti
  }
  posluchaci.forEach((f) => f());
}

/* ---------- bodování ---------- */

/** Kolik čárek má parta dohromady. */
export function body(s = stav) {
  const zaDochazku = Object.values(s.prichod).filter(Boolean).length;
  const zaSkopky = Object.values(s.skopek).filter(Boolean).length;
  const zaUkoly = Object.entries(s.ukoly).reduce((soucet, [id, kolik]) => {
    const u = UKOL_PODLE_ID[id];
    return u ? soucet + Math.min(kolik, u.max) * u.body : soucet;
  }, 0);
  return zaDochazku + zaSkopky + zaUkoly;
}

/** Rozpad skóre pro přehled. */
export function rozpad(s = stav) {
  return {
    dochazka: Object.values(s.prichod).filter(Boolean).length,
    skopky: Object.values(s.skopek).filter(Boolean).length,
    ukoly: Object.entries(s.ukoly).reduce((c, [id, k]) => {
      const u = UKOL_PODLE_ID[id];
      return u ? c + Math.min(k, u.max) * u.body : c;
    }, 0),
    splneno: Object.entries(s.ukoly).filter(([id, k]) => k > 0 && UKOL_PODLE_ID[id]).length,
    makacky: UKOLY.filter((u) => u.piva === 3 && (s.ukoly[u.id] || 0) > 0).length,
  };
}

/* ---------- co kde jde ---------- */

/** Jestli úkol v téhle štaci vůbec jde splnit. Vrací důvod, proč ne. */
export function dostupnost(u, hospoda = stav.hospoda) {
  if (u.hospoda && u.hospoda !== hospoda)
    return { jde: false, duvod: `Jen ve špeluňce č. ${u.hospoda}` };
  if (u.mezi && hospoda !== u.mezi[0] && hospoda !== u.mezi[1])
    return { jde: false, duvod: `Jen mezi špeluňkou č. ${u.mezi[0]} a ${u.mezi[1]}` };
  return { jde: true };
}

/** Kolikrát je úkol splněný. */
export const kolikrat = (id, s = stav) => s.ukoly[id] || 0;

/** Jestli se dá ještě přidat. */
export function jdePridat(u, s = stav) {
  if (!dostupnost(u, s.hospoda).jde) return false;
  if (kolikrat(u.id, s) >= u.max) return false;
  // Brněnskej zloděj: z každé špeluňky jen jedna věc
  if (u.jednouZaHospodu && s.zlodej[s.hospoda]) return false;
  return true;
}

/* ---------- zápisy ---------- */

export function prepniZaklad(druh, hospoda = stav.hospoda) {
  stav[druh][hospoda] = !stav[druh][hospoda];
  if (!stav[druh][hospoda]) delete stav[druh][hospoda];
  uloz();
}

export function pridejUkol(u) {
  if (!jdePridat(u)) return false;
  stav.ukoly[u.id] = kolikrat(u.id) + 1;
  if (u.jednouZaHospodu) stav.zlodej[stav.hospoda] = true;
  uloz();
  return true;
}

export function uberUkol(u) {
  const ted = kolikrat(u.id);
  if (ted <= 0) return false;
  stav.ukoly[u.id] = ted - 1;
  if (stav.ukoly[u.id] === 0) delete stav.ukoly[u.id];
  // u zloděje pustíme zpátky i tuhle hospodu, ať jde oprava překliku
  if (u.jednouZaHospodu && stav.zlodej[stav.hospoda]) delete stav.zlodej[stav.hospoda];
  uloz();
  return true;
}

export function nastavHospodu(c) {
  stav.hospoda = Math.min(HOSPODY.length, Math.max(1, c));
  uloz();
}

export function nastavPartu(nazev, barva) {
  stav.parta.nazev = nazev.trim().slice(0, 40);
  stav.parta.barva = barva;
  uloz();
}
