// Stav hry: týmy, hospody, úkoly a kdo má co splněno.
// Hospody i úkoly jsou editovatelné, proto si stav drží vlastní kopii; data.js je jen
// výchozí sada, ze které se to poprvé naplní.
// Ukládá se do telefonu (localStorage) a volitelně do Supabase, aby ostatní viděli skóre
// živě. Telefon je vždycky zdroj pravdy – bez signálu se zapisuje dál a pošle se to potom.
import { VYCHOZI_HOSPODY, VYCHOZI_UKOLY } from "./data.js";

const KLIC = "tourdepub";
const VERZE = 2;

// Barvy týmů. Vybrané tak, aby se na černě zeleném podkladu nepletly mezi sebou
// ani s limetkovým akcentem appky.
export const BARVY = ["#C3F53C", "#F2765A", "#5BC8F5", "#F2C14E", "#C78BE0", "#7FD4C1"];

const noveId = () => (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2));

export function novyTym(nazev = "", barva = BARVY[0]) {
  return { id: noveId(), nazev, barva, hospoda: null, prichod: {}, skopek: {}, ukoly: {}, zlodej: {} };
}

function prazdnyStav() {
  const t = novyTym("Naše parta", BARVY[0]);
  t.hospoda = VYCHOZI_HOSPODY[0].id;
  return {
    verze: VERZE,
    tymy: [t],
    tymId: t.id,
    hospody: VYCHOZI_HOSPODY.map((h) => ({ ...h })),
    ukoly: VYCHOZI_UKOLY.map((u) => ({ ...u })),
  };
}

export const stav = nacti();

function nacti() {
  let ulozeno = null;
  try {
    ulozeno = JSON.parse(localStorage.getItem(KLIC) || "null");
  } catch {
    // poškozený zápis radši zahodíme, než aby se web vůbec nespustil
  }
  if (!ulozeno) return prazdnyStav();

  // starší verze měla jednu partu a napevno dané hospody a úkoly
  if (!ulozeno.verze || ulozeno.verze < 2) {
    const t = novyTym(ulozeno.parta?.nazev || "Naše parta", ulozeno.parta?.barva || BARVY[0]);
    t.prichod = ulozeno.prichod || {};
    t.skopek = ulozeno.skopek || {};
    t.ukoly = ulozeno.ukoly || {};
    t.zlodej = ulozeno.zlodej || {};
    // dřív se štace držela jako číslo, teď jako id hospody
    const h = VYCHOZI_HOSPODY[(ulozeno.hospoda || 1) - 1];
    t.hospoda = h ? h.id : null;
    return { ...prazdnyStav(), tymy: [t], tymId: t.id };
  }

  const z = { ...prazdnyStav(), ...ulozeno };
  if (!z.tymy?.length) {
    const t = novyTym("Naše parta", BARVY[0]);
    z.tymy = [t];
    z.tymId = t.id;
  }
  if (!z.tymy.some((t) => t.id === z.tymId)) z.tymId = z.tymy[0].id;
  srovnejStace(z);
  return z;
}

/** Každý tým musí stát v nějaké existující hospodě. Tým se štací null (nový tým)
 *  nebo štací, která se mezitím smazala, by neměl kam zapsat čárku a zápis by tiše propadl. */
function srovnejStace(z) {
  const prvni = z.hospody[0]?.id || null;
  for (const t of z.tymy) {
    if (!t.hospoda || !z.hospody.some((h) => h.id === t.hospoda)) t.hospoda = prvni;
  }
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

/* ---------- týmy ---------- */

export const tym = () => stav.tymy.find((t) => t.id === stav.tymId) || stav.tymy[0];

export function pridejTym(nazev, barva) {
  const t = novyTym(nazev, barva || BARVY[stav.tymy.length % BARVY.length]);
  t.hospoda = stav.hospody[0]?.id || null;
  stav.tymy.push(t);
  uloz();
  return t;
}

export function upravTym(id, zmeny) {
  const t = stav.tymy.find((x) => x.id === id);
  if (!t) return;
  Object.assign(t, zmeny);
  uloz();
}

export function smazTym(id) {
  if (stav.tymy.length <= 1) return false; // poslední tým nemažeme, hra by neměla za koho zapisovat
  stav.tymy = stav.tymy.filter((t) => t.id !== id);
  if (stav.tymId === id) stav.tymId = stav.tymy[0].id;
  uloz();
  return true;
}

export function prepniTym(id) {
  if (!stav.tymy.some((t) => t.id === id)) return;
  stav.tymId = id;
  uloz();
}

/* ---------- hospody ---------- */

export const hospodaTed = (t = tym()) =>
  stav.hospody.find((h) => h.id === t?.hospoda) || stav.hospody[0] || null;

export const indexHospody = (t = tym()) => {
  const i = stav.hospody.findIndex((h) => h.id === t?.hospoda);
  return i < 0 ? 0 : i;
};

export function nastavHospodu(id) {
  const t = tym();
  if (!t) return;
  t.hospoda = id;
  uloz();
}

export function posunHospodu(o) {
  const i = indexHospody(), cil = stav.hospody[i + o];
  if (cil) nastavHospodu(cil.id);
}

export function pridejHospodu(nazev) {
  stav.hospody.push({ id: noveId(), nazev: nazev.trim().slice(0, 60) || "Nová špeluňka" });
  srovnejStace(stav);
  uloz();
}

export function upravHospodu(id, nazev) {
  const h = stav.hospody.find((x) => x.id === id);
  if (!h) return;
  h.nazev = nazev.trim().slice(0, 60) || h.nazev;
  uloz();
}

export function smazHospodu(id) {
  if (stav.hospody.length <= 1) return false;
  stav.hospody = stav.hospody.filter((h) => h.id !== id);
  // zápisy k té hospodě i štace týmů, co v ní stály, musí jít s ní
  for (const t of stav.tymy) {
    delete t.prichod[id];
    delete t.skopek[id];
    delete t.zlodej[id];
    if (t.hospoda === id) t.hospoda = stav.hospody[0]?.id || null;
  }
  uloz();
  return true;
}

export function posunHospoduVPoradi(id, o) {
  const i = stav.hospody.findIndex((h) => h.id === id), j = i + o;
  if (i < 0 || j < 0 || j >= stav.hospody.length) return;
  const [h] = stav.hospody.splice(i, 1);
  stav.hospody.splice(j, 0, h);
  uloz();
}

/* ---------- úkoly ---------- */

export const ukolPodleId = (id) => stav.ukoly.find((u) => u.id === id);

export function pridejNovyUkol(data) {
  const u = {
    id: noveId(),
    kat: data.kat || "kecy",
    nazev: (data.nazev || "").trim().slice(0, 80) || "Nový úkol",
    popis: (data.popis || "").trim().slice(0, 400),
    piva: Math.min(3, Math.max(1, +data.piva || 1)),
    max: Math.min(20, Math.max(1, +data.max || 1)),
    vlastni: true,
  };
  // u jednorázových je hodnota rovna obtížnosti, u opakovatelných je čárka za kus
  u.body = u.max > 1 ? 1 : u.piva;
  stav.ukoly.push(u);
  uloz();
  return u;
}

export function upravUkol(id, zmeny) {
  const u = ukolPodleId(id);
  if (!u) return;
  if (zmeny.piva != null) u.piva = Math.min(3, Math.max(1, +zmeny.piva));
  if (zmeny.max != null) u.max = Math.min(20, Math.max(1, +zmeny.max));
  if (zmeny.nazev != null) u.nazev = zmeny.nazev.trim().slice(0, 80) || u.nazev;
  if (zmeny.popis != null) u.popis = zmeny.popis.trim().slice(0, 400);
  if (zmeny.kat != null) u.kat = zmeny.kat;
  u.body = u.max > 1 ? 1 : u.piva;
  // kdyby se strop snížil pod už zapsaný počet, zápisy se ořežou
  for (const t of stav.tymy) if (t.ukoly[id] > u.max) t.ukoly[id] = u.max;
  uloz();
}

export function smazUkol(id) {
  stav.ukoly = stav.ukoly.filter((u) => u.id !== id);
  for (const t of stav.tymy) delete t.ukoly[id];
  uloz();
}

/* ---------- bodování ---------- */

export function body(t = tym()) {
  if (!t) return 0;
  const zaDochazku = Object.values(t.prichod).filter(Boolean).length;
  const zaSkopky = Object.values(t.skopek).filter(Boolean).length;
  const zaUkoly = Object.entries(t.ukoly).reduce((soucet, [id, kolik]) => {
    const u = ukolPodleId(id);
    return u ? soucet + Math.min(kolik, u.max) * u.body : soucet;
  }, 0);
  return zaDochazku + zaSkopky + zaUkoly;
}

export function rozpad(t = tym()) {
  if (!t) return { dochazka: 0, skopky: 0, ukoly: 0, splneno: 0, makacky: 0 };
  return {
    dochazka: Object.values(t.prichod).filter(Boolean).length,
    skopky: Object.values(t.skopek).filter(Boolean).length,
    ukoly: Object.entries(t.ukoly).reduce((c, [id, k]) => {
      const u = ukolPodleId(id);
      return u ? c + Math.min(k, u.max) * u.body : c;
    }, 0),
    splneno: Object.entries(t.ukoly).filter(([id, k]) => k > 0 && ukolPodleId(id)).length,
    makacky: stav.ukoly.filter((u) => u.piva === 3 && (t.ukoly[u.id] || 0) > 0).length,
  };
}

/** Nejvyšší možné skóre: docházka + škopky + všechny úkoly na strop. */
export function strop() {
  const zaUkoly = stav.ukoly.reduce((s, u) => s + u.body * u.max, 0);
  return { hospody: stav.hospody.length, ukoly: zaUkoly, celkem: stav.hospody.length * 2 + zaUkoly };
}

/* ---------- co kde jde ---------- */

/** Jestli úkol v téhle štaci vůbec jde splnit. Vrací i důvod, proč ne. */
export function dostupnost(u, t = tym()) {
  const kde = t?.hospoda;
  if (u.hospoda) {
    const h = stav.hospody.find((x) => x.id === u.hospoda);
    if (!h) return { jde: true }; // hospoda byla smazaná, omezení tím padá
    if (u.hospoda !== kde) return { jde: false, duvod: `Jen v ${h.nazev}` };
  }
  if (u.mezi) {
    const jmena = u.mezi.map((id) => stav.hospody.find((x) => x.id === id)).filter(Boolean);
    if (jmena.length < 2) return { jde: true };
    if (!u.mezi.includes(kde)) return { jde: false, duvod: `Jen mezi ${jmena[0].nazev} a ${jmena[1].nazev}` };
  }
  return { jde: true };
}

export const kolikrat = (id, t = tym()) => t?.ukoly[id] || 0;

export function jdePridat(u, t = tym()) {
  if (!t) return false;
  if (!dostupnost(u, t).jde) return false;
  if (kolikrat(u.id, t) >= u.max) return false;
  if (u.jednouZaHospodu && t.zlodej[t.hospoda]) return false;
  return true;
}

/* ---------- zápisy ---------- */

export function prepniZaklad(druh) {
  const t = tym(), kde = t?.hospoda;
  if (!t || !kde) return false;
  t[druh][kde] = !t[druh][kde];
  if (!t[druh][kde]) delete t[druh][kde];
  uloz();
  return !!t[druh][kde];
}

export function pridejUkol(u) {
  const t = tym();
  if (!jdePridat(u, t)) return false;
  t.ukoly[u.id] = kolikrat(u.id, t) + 1;
  if (u.jednouZaHospodu) t.zlodej[t.hospoda] = true;
  uloz();
  return true;
}

export function uberUkol(u) {
  const t = tym(), ted = kolikrat(u.id, t);
  if (ted <= 0) return false;
  t.ukoly[u.id] = ted - 1;
  if (t.ukoly[u.id] === 0) delete t.ukoly[u.id];
  if (u.jednouZaHospodu && t.zlodej[t.hospoda]) delete t.zlodej[t.hospoda];
  uloz();
  return true;
}

export function vynulujTym(id = stav.tymId) {
  const t = stav.tymy.find((x) => x.id === id);
  if (!t) return;
  Object.assign(t, { prichod: {}, skopek: {}, ukoly: {}, zlodej: {}, hospoda: stav.hospody[0]?.id || null });
  uloz();
}
