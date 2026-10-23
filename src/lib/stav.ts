// Stav hry: týmy, hospody, úkoly a kdo má co splněno.
// Hospody i úkoly jsou editovatelné, proto si stav drží vlastní kopii; data.ts je jen
// výchozí sada, ze které se to poprvé naplní.
// Ukládá se do telefonu (localStorage) a volitelně do Supabase, aby ostatní viděli skóre
// živě. Telefon je vždycky zdroj pravdy – bez signálu se zapisuje dál a pošle se to potom.
//
// Je to jeden měnitelný objekt, ne stav v Reactu: zapisuje se do něj odkudkoli
// (z obrazovek, ze synchronizace, z posluchače „online") a obrazovky se na něj
// přihlásí přes useStav(). Kopírovat při každé čárce celý stav by tu bylo k ničemu.
import { useSyncExternalStore } from "react";
import { BARVY_HOSPOD, VYCHOZI_HOSPODY, VYCHOZI_UKOLY, type Hospoda, type Ukol } from "./data";

const KLIC = "tourdepub";
const VERZE = 2;

/** Jedna parta: jak se jmenuje, kde stojí a co má zapsané. */
export interface Tym {
  id: string;
  nazev: string;
  barva: string;
  /** Pracoval s týmem někdo doopravdy? Nepoužívaný se na server neposílá. */
  vlastni: boolean;
  /** Razítko poslední změny – rozhoduje při slučování se serverem. */
  upraveno: string | null;
  /** Byl tým někdy vidět na serveru? Když odtud zmizí, zmizí i tady. */
  bylNaServeru: boolean;
  /** Id hospody, ve které parta zrovna stojí. */
  hospoda: string | null;
  /** Id hospody → jsme tam byli. */
  prichod: Record<string, boolean>;
  /** Id hospody → kdy se zapsal příchod (ms). Jen pro „jste tady dvacet minut“,
   *  na body to nemá vliv. Odepsaný příchod čas smaže. */
  prichodCas: Record<string, number>;
  /** Id hospody → škopek padl. */
  skopek: Record<string, boolean>;
  /** Id úkolu → kolikrát splněno. */
  ukoly: Record<string, number>;
  /** Id hospody → odsud už parta něco šlohla (Brněnskej zloděj). */
  zlodej: Record<string, boolean>;
}

export interface Stav {
  verze: number;
  tymy: Tym[];
  /** Za který tým se na tomhle telefonu zapisuje. */
  tymId: string;
  hospody: Hospoda[];
  ukoly: Ukol[];
}

/** Co se o týmu posílá na server. */
export interface RadekTymu {
  id: string;
  nazev: string;
  barva: string;
  hospoda: number;
  body: number;
  rozpad: Rozpad;
  stav: Pick<Tym, "hospoda" | "prichod" | "prichodCas" | "skopek" | "ukoly" | "zlodej">;
  upraveno: string;
}

export interface Rozpad {
  dochazka: number;
  skopky: number;
  ukoly: number;
  splneno: number;
  makacky: number;
}

/** Druhy čárek, které se nabíhají v každé špeluňce. */
export type Zaklad = "prichod" | "skopek";

/** Barvy part. Všechny jsou z palety appky, ne vedle ní: červená a žlutá
 *  z kategorií, zelená a mořská jako jejich zesvětlené varianty (sytá zeleň
 *  se na tmavém nepřečte), krémová z loga a tmavá zeleň z loga jako šestá.
 *  Dvě zeleně vedle sebe vadit nemusí — liší se světlostí natolik, že se
 *  jako tečka o devíti pixelech nespletou; losos z obtížnosti by se naopak
 *  s červenou pral. */
export const BARVY = ["#E5331F", "#F9A204", "#45B877", "#2E9BB5", "#F2E7CF", "#006633"];

/** Nejbližší barva z palety, ale ne ta, co už někdo má. Party založené dřív
 *  mají uloženou barvu, co v paletě už není (písková, růžová) — ta by v appce
 *  zůstala viset a v přepínači by se nedala znovu vybrat. Bez ohlídání
 *  obsazených by navíc obě skončily na krémové, protože k ní mají nejblíž
 *  obě, a dvě party se stejnou barvou jsou horší než barva mimo paletu. */
function nejblizsiBarva(barva: string, obsazene: Set<string>): string {
  const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [r, g, b] = rgb(barva);
  const podle = BARVY.map((x) => {
    const [xr, xg, xb] = rgb(x);
    return { x, d: (r - xr) ** 2 + (g - xg) ** 2 + (b - xb) ** 2 };
  }).sort((a, b2) => a.d - b2.d);
  // volná z palety; když jsou všechny zabrané, bere se prostě ta nejbližší
  return (podle.find((k) => !obsazene.has(k.x)) ?? podle[0]).x;
}

const noveId = () => (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2));

/** `vlastni` říká, jestli s týmem někdo opravdu pracoval. Tým, co si appka
 *  založila sama při prvním spuštění a nikdo ho nepojmenoval ani s ním nehrál,
 *  se na server neposílá — jinak by se v pořadí objevila „Naše parta“ z každého
 *  telefonu i prohlížeče, který web jen otevřel. */
export function novyTym(nazev = "", barva = BARVY[0], vlastni = true): Tym {
  return { id: noveId(), nazev, barva, vlastni, upraveno: null, bylNaServeru: false,
           hospoda: null, prichod: {}, prichodCas: {}, skopek: {}, ukoly: {}, zlodej: {} };
}

/** Označí tým za používaný a orazítkuje změnu.
 *  Razítko rozhoduje při slučování se serverem, čí verze je novější. */
function dotknuto(t: Tym | undefined) {
  if (!t) return;
  t.vlastni = true;
  t.upraveno = new Date().toISOString();
}

function prazdnyStav(): Stav {
  // false: dokud ho nikdo nepojmenuje ani s ním nezahraje, zůstane jen tady
  const t = novyTym("Naše parta", BARVY[0], false);
  t.hospoda = VYCHOZI_HOSPODY[0].id;
  return {
    verze: VERZE,
    tymy: [t],
    tymId: t.id,
    hospody: VYCHOZI_HOSPODY.map((h) => ({ ...h })),
    ukoly: VYCHOZI_UKOLY.map((u) => ({ ...u })),
  };
}

/** Co se dá vyčíst z localStorage. Může to být i stav z dřívější verze,
 *  tak se na to kouká jako na neznámý objekt a tvar se dorovná níž. */
type Ulozeno = Record<string, any>;

function nacti(): Stav {
  let ulozeno: Ulozeno | null = null;
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

  const z: Stav = { ...prazdnyStav(), ...(ulozeno as Stav) };
  if (!z.tymy?.length) {
    const t = novyTym("Naše parta", BARVY[0]);
    z.tymy = [t];
    z.tymId = t.id;
  }
  if (!z.tymy.some((t) => t.id === z.tymId)) z.tymId = z.tymy[0].id;
  // starší uložený stav barvy štací nemá; doplní se po řadě z palety
  z.hospody.forEach((h, i) => { if (!h.barva) h.barva = BARVY_HOSPOD[i % BARVY_HOSPOD.length]; });
  srovnejStace(z);
  // starší uložené stavy příznak nemají; tým s vlastním jménem nebo s čárkami
  // je zjevně používaný
  // barvy, co party už mají a v paletě jsou, si drží přednost
  const obsazene = new Set(z.tymy.map((t) => t.barva).filter((b) => BARVY.includes(b)));
  for (const t of z.tymy) {
    // starší uložený stav časy příchodů nemá; karta si pak nemá co ukázat a je to v pořádku
    if (!t.prichodCas) t.prichodCas = {};
    // barvy mimo paletu (z dřívější sady) se překlopí na nejbližší volnou z ní
    if (t.barva && !BARVY.includes(t.barva)) {
      t.barva = nejblizsiBarva(t.barva, obsazene);
      obsazene.add(t.barva);
    }
    if (t.vlastni === undefined) {
      t.vlastni = t.nazev !== "Naše parta"
        || Object.keys(t.prichod).length > 0
        || Object.keys(t.skopek).length > 0
        || Object.keys(t.ukoly).length > 0;
    }
  }
  return z;
}

export const stav: Stav = nacti();

/** Každý tým musí stát v nějaké existující hospodě. Tým se štací null (nový tým)
 *  nebo štací, která se mezitím smazala, by neměl kam zapsat čárku a zápis by tiše propadl. */
function srovnejStace(z: Stav) {
  const prvni = z.hospody[0]?.id || null;
  for (const t of z.tymy) {
    if (!t.hospoda || !z.hospody.some((h) => h.id === t.hospoda)) t.hospoda = prvni;
  }
}

const posluchaci = new Set<() => void>();
export function naZmenu(f: () => void) {
  posluchaci.add(f);
  return () => posluchaci.delete(f);
}

// Číslo verze stavu. React se podle něj dozví, že se něco změnilo – kdyby
// snímek byl sám objekt stavu, nepoznal by to, protože se mění zevnitř.
let revize = 0;

export function uloz() {
  revize++;
  try {
    localStorage.setItem(KLIC, JSON.stringify(stav));
  } catch {
    // plná paměť prohlížeče nesmí shodit zápis – hra běží dál z paměti
  }
  posluchaci.forEach((f) => f());
}

/** Přihlásí obrazovku na změny stavu. Vrací ten jeden a jediný stav. */
export function useStav(): Stav {
  useSyncExternalStore(naZmenu, () => revize, () => revize);
  return stav;
}

/* ---------- týmy ---------- */

export const tym = (): Tym | undefined => stav.tymy.find((t) => t.id === stav.tymId) || stav.tymy[0];

export function pridejTym(nazev: string, barva?: string | null): Tym {
  const t = novyTym(nazev, barva || BARVY[stav.tymy.length % BARVY.length]);
  t.hospoda = stav.hospody[0]?.id || null;
  t.upraveno = new Date().toISOString();
  stav.tymy.push(t);
  uloz();
  return t;
}

export function upravTym(id: string, zmeny: Partial<Pick<Tym, "nazev" | "barva">>) {
  const t = stav.tymy.find((x) => x.id === id);
  if (!t) return;
  if (zmeny.nazev !== undefined) t.nazev = zmeny.nazev;
  if (zmeny.barva !== undefined) t.barva = zmeny.barva;
  dotknuto(t); // pojmenovaný tým už patří ostatním na oči
  uloz();
}

export function smazTym(id: string): boolean {
  if (stav.tymy.length <= 1) return false; // poslední tým nemažeme, hra by neměla za koho zapisovat
  stav.tymy = stav.tymy.filter((t) => t.id !== id);
  if (stav.tymId === id) stav.tymId = stav.tymy[0].id;
  uloz();
  return true;
}

export function prepniTym(id: string) {
  if (!stav.tymy.some((t) => t.id === id)) return;
  stav.tymId = id;
  uloz();
}

/* ---------- hospody ---------- */

export const indexHospody = (t = tym()): number => {
  const i = stav.hospody.findIndex((h) => h.id === t?.hospoda);
  return i < 0 ? 0 : i;
};

export function nastavHospodu(id: string) {
  const t = tym();
  if (!t || t.hospoda === id) return;
  dotknuto(t);
  t.hospoda = id;
  uloz();
}

export function posunHospodu(o: number) {
  const cil = stav.hospody[indexHospody() + o];
  if (cil) nastavHospodu(cil.id);
}

/** První barva, kterou ještě žádná štace nemá. Když dojdou, bere se po řadě
 *  dokola — dvě stejné barvy na trase jsou pořád lepší než žádná. */
export function volnaBarvaHospody(): string {
  const zabrane = new Set(stav.hospody.map((h) => h.barva));
  return BARVY_HOSPOD.find((b) => !zabrane.has(b))
    ?? BARVY_HOSPOD[stav.hospody.length % BARVY_HOSPOD.length];
}

export function pridejHospodu(nazev: string, barva?: string) {
  stav.hospody.push({
    id: noveId(),
    nazev: nazev.trim().slice(0, 60) || "Nová špeluňka",
    barva: barva || volnaBarvaHospody(),
  });
  srovnejStace(stav);
  uloz();
}

export function upravHospodu(id: string, nazev: string, barva?: string) {
  const h = stav.hospody.find((x) => x.id === id);
  if (!h) return;
  h.nazev = nazev.trim().slice(0, 60) || h.nazev;
  if (barva) h.barva = barva;
  uloz();
}

export function smazHospodu(id: string): boolean {
  if (stav.hospody.length <= 1) return false;
  stav.hospody = stav.hospody.filter((h) => h.id !== id);
  // zápisy k té hospodě i štace týmů, co v ní stály, musí jít s ní
  for (const t of stav.tymy) {
    delete t.prichod[id];
    delete t.prichodCas[id];
    delete t.skopek[id];
    delete t.zlodej[id];
    if (t.hospoda === id) t.hospoda = stav.hospody[0]?.id || null;
  }
  uloz();
  return true;
}

export function posunHospoduVPoradi(id: string, o: number) {
  const i = stav.hospody.findIndex((h) => h.id === id);
  const j = i + o;
  if (i < 0 || j < 0 || j >= stav.hospody.length) return;
  const [h] = stav.hospody.splice(i, 1);
  stav.hospody.splice(j, 0, h);
  uloz();
}

/* ---------- úkoly ---------- */

export const ukolPodleId = (id: string): Ukol | undefined => stav.ukoly.find((u) => u.id === id);

/** Co přijde z formuláře úkolu. */
export interface KonceptUkolu {
  kat?: string;
  nazev?: string;
  popis?: string;
  piva?: number;
  max?: number;
}

const vObtiznost = (n: unknown): 1 | 2 | 3 =>
  (Math.min(3, Math.max(1, Math.round(Number(n) || 1))) as 1 | 2 | 3);

export function pridejNovyUkol(data: KonceptUkolu): Ukol {
  const piva = vObtiznost(data.piva);
  const max = Math.min(20, Math.max(1, Number(data.max) || 1));
  const u: Ukol = {
    id: noveId(),
    kat: data.kat || "kecy",
    nazev: (data.nazev || "").trim().slice(0, 80) || "Nový úkol",
    popis: (data.popis || "").trim().slice(0, 400),
    piva,
    // u jednorázových je hodnota rovna obtížnosti, u opakovatelných je čárka za kus
    body: max > 1 ? 1 : piva,
    max,
    vlastni: true,
  };
  stav.ukoly.push(u);
  uloz();
  return u;
}

export function upravUkol(id: string, zmeny: KonceptUkolu) {
  const u = ukolPodleId(id);
  if (!u) return;
  if (zmeny.piva != null) u.piva = vObtiznost(zmeny.piva);
  if (zmeny.max != null) u.max = Math.min(20, Math.max(1, Number(zmeny.max) || 1));
  if (zmeny.nazev != null) u.nazev = zmeny.nazev.trim().slice(0, 80) || u.nazev;
  if (zmeny.popis != null) u.popis = zmeny.popis.trim().slice(0, 400);
  if (zmeny.kat != null) u.kat = zmeny.kat;
  u.body = u.max > 1 ? 1 : u.piva;
  // kdyby se strop snížil pod už zapsaný počet, zápisy se ořežou
  for (const t of stav.tymy) if (t.ukoly[id] > u.max) t.ukoly[id] = u.max;
  uloz();
}

export function smazUkol(id: string) {
  stav.ukoly = stav.ukoly.filter((u) => u.id !== id);
  for (const t of stav.tymy) delete t.ukoly[id];
  uloz();
}

/* ---------- bodování ---------- */

export function body(t = tym()): number {
  if (!t) return 0;
  const zaDochazku = Object.values(t.prichod).filter(Boolean).length;
  const zaSkopky = Object.values(t.skopek).filter(Boolean).length;
  const zaUkoly = Object.entries(t.ukoly).reduce((soucet, [id, kolik]) => {
    const u = ukolPodleId(id);
    return u ? soucet + Math.min(kolik, u.max) * u.body : soucet;
  }, 0);
  return zaDochazku + zaSkopky + zaUkoly;
}

export function rozpad(t = tym()): Rozpad {
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

/** Pořadí všech týmů podle čárek. Po sloučení se serverem jsou všechny místní,
 *  takže jdou upravovat odkudkoli. */
export function poradiTymu() {
  return stav.tymy
    .map((t) => ({
      id: t.id, nazev: t.nazev || "Bez názvu", barva: t.barva, body: body(t),
      rozpad: rozpad(t), hospoda: indexHospody(t) + 1,
    }))
    .sort((a, b) => b.body - a.body || b.rozpad.makacky - a.rozpad.makacky);
}

/* ---------- co kde jde ---------- */

/** Kam se úkol hodí nejvíc. Je to **jenom tip, ne zámek**: hra se nedá
 *  naplánovat tak, aby trasa vyšla na minutu, a zamčený úkol, který parta
 *  zrovna splnila, znamená hádku u stolu. Kdo je kde, si party pohlídají samy.
 *
 *  Štace se píše pořadím, ne názvem hospody. Čeština by názvy musela skloňovat
 *  („mezi Zastávkou a U Ričího“) a to automaticky nejde. */
export function tipNaStaci(u: Ukol): string | null {
  const cislo = (id: string) => stav.hospody.findIndex((x) => x.id === id) + 1;
  if (u.hospoda) {
    const c = cislo(u.hospoda);
    return c ? `Nejlíp ve ${c}. štaci` : null; // hospoda byla smazaná, tip tím padá
  }
  if (u.mezi) {
    const c = u.mezi.map(cislo).filter(Boolean);
    return c.length === 2 ? `Nejlíp mezi ${c[0]}. a ${c[1]}. štací` : null;
  }
  return null;
}

export const kolikrat = (id: string, t = tym()): number => t?.ukoly[id] || 0;

export function jdePridat(u: Ukol, t = tym()): boolean {
  if (!t) return false;
  if (kolikrat(u.id, t) >= u.max) return false;
  if (u.jednouZaHospodu && t.hospoda && t.zlodej[t.hospoda]) return false;
  return true;
}

/* ---------- zápisy ---------- */

/** Zapíše nebo smaže čárku za špeluňku / škopek. `kde` je id hospody; bez něj
 *  se bere ta, ve které tým zrovna stojí. Hero karta ho posílá vždycky,
 *  ať se ťuknutí doprostřed švihu nezapíše vedle. */
export function prepniZaklad(druh: Zaklad, kde?: string): boolean {
  const t = tym();
  const h = kde || t?.hospoda;
  if (!t || !h) return false;
  dotknuto(t);
  if (t[druh][h]) delete t[druh][h];
  else t[druh][h] = true;
  // čas příchodu drží jen kvůli „jste tady dvacet minut“; odepsaný příchod ho bere s sebou
  if (druh === "prichod") {
    if (t.prichod[h]) t.prichodCas[h] = Date.now();
    else delete t.prichodCas[h];
  }
  uloz();
  return !!t[druh][h];
}

export function pridejUkol(u: Ukol): boolean {
  const t = tym();
  if (!t || !jdePridat(u, t)) return false;
  dotknuto(t);
  t.ukoly[u.id] = kolikrat(u.id, t) + 1;
  if (u.jednouZaHospodu && t.hospoda) t.zlodej[t.hospoda] = true;
  uloz();
  return true;
}

export function uberUkol(u: Ukol): boolean {
  const t = tym();
  const ted = kolikrat(u.id, t);
  if (!t || ted <= 0) return false;
  dotknuto(t);
  t.ukoly[u.id] = ted - 1;
  if (t.ukoly[u.id] === 0) delete t.ukoly[u.id];
  if (u.jednouZaHospodu && t.hospoda && t.zlodej[t.hospoda]) delete t.zlodej[t.hospoda];
  uloz();
  return true;
}

export function vynulujTym(id = stav.tymId) {
  const t = stav.tymy.find((x) => x.id === id);
  if (!t) return;
  Object.assign(t, { prichod: {}, skopek: {}, ukoly: {}, zlodej: {}, hospoda: stav.hospody[0]?.id || null });
  dotknuto(t);
  uloz();
}

/* ---------- slučování se serverem ---------- */

/** Co se o týmu posílá ostatním. Posílá se celý stav, ne jen výsledek —
 *  jinak by tým šlo upravovat jenom na telefonu, kde vznikl. */
export function kOdeslani(t: Tym): RadekTymu {
  return {
    id: t.id,
    nazev: t.nazev || "Bezejmenná parta",
    barva: t.barva,
    hospoda: indexHospody(t) + 1,
    body: body(t),
    rozpad: rozpad(t),
    stav: { hospoda: t.hospoda, prichod: t.prichod, prichodCas: t.prichodCas,
            skopek: t.skopek, ukoly: t.ukoly, zlodej: t.zlodej },
    upraveno: t.upraveno || new Date().toISOString(),
  };
}

/** Sloučí týmy ze serveru do místních. Novější razítko vyhrává; tým, který
 *  ze serveru zmizel, zmizí i tady, pokud tam někdy byl. */
export function slucZeServeru(radky: RadekTymu[]) {
  const naServeru = new Set(radky.map((r) => r.id));

  for (const r of radky) {
    const zeServeru = {
      nazev: r.nazev, barva: r.barva, vlastni: true, upraveno: r.upraveno,
      bylNaServeru: true,
      hospoda: r.stav?.hospoda ?? stav.hospody[0]?.id ?? null,
      prichod: r.stav?.prichod || {}, prichodCas: r.stav?.prichodCas || {},
      skopek: r.stav?.skopek || {},
      ukoly: r.stav?.ukoly || {}, zlodej: r.stav?.zlodej || {},
    };
    const mistni = stav.tymy.find((t) => t.id === r.id);
    if (!mistni) stav.tymy.push({ id: r.id, ...zeServeru });
    else if (!mistni.upraveno || (r.upraveno && r.upraveno > mistni.upraveno))
      Object.assign(mistni, zeServeru);
    else mistni.bylNaServeru = true;
  }

  // tým smazaný na jiném telefonu musí zmizet i tady
  stav.tymy = stav.tymy.filter((t) => !t.bylNaServeru || naServeru.has(t.id));
  if (!stav.tymy.length) stav.tymy = [novyTym("Naše parta", BARVY[0], false)];
  if (!stav.tymy.some((t) => t.id === stav.tymId)) stav.tymId = stav.tymy[0].id;

  srovnejStace(stav);
  uloz();
}
