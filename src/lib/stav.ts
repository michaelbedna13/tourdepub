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
import { VYCHOZI_HOSPODY, VYCHOZI_UKOLY, type Hospoda, type Ukol } from "./data";
import * as K from "./kniha";

const KLIC = "tourdepub";
const VERZE = 2;

/** Jedna parta: jak se jmenuje, kde stojí a co má zapsané. */
export interface Tym {
  id: string;
  nazev: string;
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
  /** Kniha zápisů (lib/kniha.ts): z ní se pole výš počítají a ona se
   *  slučuje se serverem po položkách, takže za jeden tým můžou zapisovat
   *  dva telefony naráz a nic se neztratí. Pole výš jsou jen výklad. */
  kniha: K.Kniha;
  /** Má tenhle telefon v knize něco, co na serveru ještě není? */
  neodeslano: boolean;
  /** Správce tým přejmenoval a server o tom ještě neví. */
  prejmenovano?: boolean;
}

export interface Stav {
  verze: number;
  tymy: Tym[];
  /** Za který tým se na tomhle telefonu zapisuje. */
  tymId: string;
  hospody: Hospoda[];
  ukoly: Ukol[];
  /** Id výchozích úkolů, které už appka tomuhle telefonu jednou nabídla.
   *  Díky tomu se nový úkol z data.ts doplní i do rozehrané hry, a zároveň
   *  se nevrátí ten, který si parta smazala. */
  znameUkoly: string[];
}

/** Co se o týmu posílá na server. */
export interface RadekTymu {
  id: string;
  /** Do které hry řádek patří, a pozůstatková barva party. Obojí doplňuje
   *  sync.ts, ne kOdeslani(): popis týmu to není. */
  hra?: string;
  barva?: string;
  nazev: string;
  hospoda: number;
  body: number;
  rozpad: Rozpad;
  stav: Pick<Tym, "hospoda" | "prichod" | "prichodCas" | "skopek" | "ukoly" | "zlodej"> & { kniha?: K.Kniha };
  upraveno: string;
  /** Pořadové číslo zápisu na serveru. Zapisuje se jen „pokud je tam pořád
   *  verze N“; když mezitím zapsal někdo jiný, telefon si stáhne nový stav,
   *  sloučí ho se svým a zkusí to znova. Viz posli() v sync.ts. */
  verze?: number;
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

const noveId = () => (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2));

/** `vlastni` říká, jestli tým někdo opravdu založil. Appka si žádný
 *  nezakládá, ale ve starších uložených stavech leží „Naše parta“, kterou
 *  si při prvním spuštění zakládala sama — takový tým se na server neposílá
 *  a při načtení se zahodí, viz nacti(). */
export function novyTym(nazev = "", vlastni = true): Tym {
  return { id: noveId(), nazev, vlastni, upraveno: null, bylNaServeru: false,
           hospoda: null, prichod: {}, prichodCas: {}, skopek: {}, ukoly: {}, zlodej: {},
           kniha: K.prazdnaKniha(), neodeslano: vlastni };
}

/** Jméno tohohle telefonu v knize zápisů. Náhodné a uložené, ať se počty
 *  úkolů z různých telefonů nepletou dohromady. */
const KLIC_ZARIZENI = "tourdepub-zarizeni";
function zarizeni(): string {
  try {
    const z = localStorage.getItem(KLIC_ZARIZENI);
    if (z) return z;
    const nove = noveId();
    localStorage.setItem(KLIC_ZARIZENI, nove);
    return nove;
  } catch {
    return noveId(); // bez úložiště jen na tohle spuštění; nic se nesečte dvakrát
  }
}
const JA = zarizeni();

/** Přepočítá pole týmu z knihy. Štaci (t.hospoda) nechá být: tu si drží
 *  každý telefon sám, viz nastavHospodu. */
function prepocti(t: Tym, hospody: Hospoda[] = stav.hospody) {
  Object.assign(t, K.vyloz(t.kniha));
  if (!t.hospoda || !hospody.some((h) => h.id === t.hospoda)) t.hospoda = kdeStoji(t, hospody);
}

/** Kam postavit tým, který telefon vidí poprvé: do poslední hospody, kde
 *  má parta příchod, jinak do první. */
function kdeStoji(t: Pick<Tym, "prichod">, hospody: Hospoda[]): string | null {
  const posledni = [...hospody].reverse().find((h) => t.prichod[h.id]);
  return (posledni || hospody[0])?.id || null;
}

/** Kniha z řádku ze serveru. Řádek zapsaný starší verzí appky knihu nemá,
 *  pak se složí z polí s razítkem řádku. */
export function knihaRadku(r: RadekTymu): K.Kniha {
  return K.precti(r.stav?.kniha, casZmeny(r.upraveno)) ?? K.zeStarehoTvaru(r.stav, casZmeny(r.upraveno));
}

/** Označí tým za používaný a orazítkuje změnu. */
function dotknuto(t: Tym | undefined) {
  if (!t) return;
  t.vlastni = true;
  t.neodeslano = true;
  t.upraveno = new Date().toISOString();
}

function prazdnyStav(): Stav {
  // Žádný tým. Appka si ho dřív zakládala sama („Naše parta“) a bylo to
  // k ničemu: kdo web jen otevřel, založil si partu, a jak na cokoli ťukl,
  // vyjela do pořadí všem ostatním. Tým zakládá člověk, ne spuštění.
  return {
    verze: VERZE,
    tymy: [],
    tymId: "",
    hospody: VYCHOZI_HOSPODY.map((h) => ({ ...h })),
    ukoly: VYCHOZI_UKOLY.map((u) => ({ ...u })),
    znameUkoly: VYCHOZI_UKOLY.map((u) => u.id),
  };
}

/** Výchozí sada, jak vypadala, než tohle doplňování vzniklo. Slouží jako
 *  seznam „už nabídnutých" pro stavy, co znameUkoly ještě nemají — bez něj
 *  by se za nenabídnutý považoval i úkol, který si parta smazala, a vrátil
 *  by se jí do galerie. Je to otisk historie, ne seznam k údržbě: nové úkoly
 *  se sem NEPŘIDÁVAJÍ, od nich je právě znameUkoly. */
const PRVNICH_23 = [
  "caluje", "chudak", "smelinar", "baleni", "ticha", "rada", "hokuspokus", "hadka",
  "budny", "hajzl", "pumpa", "taxal", "lajna", "rev", "bullseye", "bicak",
  "vycepni", "maturita", "versovany", "anglan", "narodni", "zlodej", "fotka",
];

/** Doplní do uloženého stavu výchozí úkoly, které v něm ještě nikdy nebyly.
 *
 *  Appka si při prvním spuštění udělá vlastní kopii seznamu úkolů, aby se
 *  dal upravovat v telefonu. Jenže tím se odřízla od data.ts: nový úkol se
 *  nasadil, a kdo už appku jednou otevřel, ho nikdy neuviděl. Tohle je ten
 *  most mezi výchozí sadou a rozehranou hrou.
 *
 *  Smazané úkoly se nevracejí: co už bylo jednou nabídnuto, zůstane
 *  v znameUkoly, i když to parta vyhodí. U starého stavu, který ten seznam
 *  ještě nemá, se za nabídnuté považuje všechno, co v něm zrovna leží —
 *  takže první doplnění přidá jenom to, co v data.ts opravdu přibylo.
 *
 *  Pořadí se drží data.ts: nový úkol se zařadí za ten, za kterým je napsaný,
 *  ne na konec galerie. */
function doplnUkoly(z: Stav, ulozeneZname: unknown) {
  // Čte se seznam z ULOŽENÉHO stavu, ne ze složeného: ten má pod sebou
  // prazdnyStav() s kompletní výchozí sadou, takže by každý úkol vycházel
  // jako dávno nabídnutý a nedoplnilo by se nikdy nic.
  const zname = new Set(Array.isArray(ulozeneZname) && ulozeneZname.length
    ? (ulozeneZname as string[])
    : PRVNICH_23);
  // Co už v galerii leží, se nepřidává znovu. Bez téhle pojistky se každý
  // úkol přidaný po PRVNÍCH_23 zdvojil každému, kdo má uložený stav ještě
  // bez seznamu znameUkoly: ten seznam o něm neví, ale v ukolech ho má.
  const uz = new Set(z.ukoly.map((u) => u.id));
  VYCHOZI_UKOLY.forEach((u, i) => {
    if (zname.has(u.id)) return;
    zname.add(u.id);
    if (uz.has(u.id)) return;
    const pred = VYCHOZI_UKOLY[i - 1]?.id;
    const kam = pred ? z.ukoly.findIndex((x) => x.id === pred) : -1;
    if (kam >= 0) z.ukoly.splice(kam + 1, 0, { ...u });
    else z.ukoly.push({ ...u });
  });
  z.znameUkoly = [...zname];
}

/** Doplnila se výchozí sada? Pak se musí hned zapsat – viz níž. */
let zapisPoDoplneni = false;

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
    const t = novyTym(ulozeno.parta?.nazev || "Naše parta");
    t.prichod = ulozeno.prichod || {};
    t.skopek = ulozeno.skopek || {};
    t.ukoly = ulozeno.ukoly || {};
    t.zlodej = ulozeno.zlodej || {};
    // dřív se štace držela jako číslo, teď jako id hospody
    const h = VYCHOZI_HOSPODY[(ulozeno.hospoda || 1) - 1];
    t.hospoda = h ? h.id : null;
    t.kniha = K.zeStarehoTvaru(t, Date.now());
    // Prázdný zápis ze staré verze žádnou partu nenese. Převádět ho na
    // „Naši partu“ by znamenalo založit tým za někoho, kdo si ho nezaložil.
    const maCo = !!ulozeno.parta?.nazev
      || Object.keys(t.prichod).length > 0
      || Object.keys(t.skopek).length > 0
      || Object.keys(t.ukoly).length > 0;
    return maCo ? { ...prazdnyStav(), tymy: [t], tymId: t.id } : prazdnyStav();
  }

  const z: Stav = { ...prazdnyStav(), ...(ulozeno as Stav) };
  doplnUkoly(z, ulozeno.znameUkoly);
  // Doplnění se musí zapsat hned, ne až s první čárkou: dokud leží jenom
  // v paměti, znameUkoly nikde není a mazání úkolu by se při dalším spuštění
  // neudrželo — smazaný by se vrátil.
  if (!Array.isArray(ulozeno.znameUkoly)) zapisPoDoplneni = true;
  if (!z.tymy) z.tymy = [];
  // starší uložené stavy příznak nemají; tým s vlastním jménem nebo s čárkami
  // je zjevně používaný
  for (const t of z.tymy) {
    // starší uložený stav časy příchodů nemá; karta si pak nemá co ukázat a je to v pořádku
    if (!t.prichodCas) t.prichodCas = {};
    // Stav z doby před knihou zápisů: kniha se složí z polí a tým se pošle,
    // ať se sloučí se serverem. Sloučení je bezpečné i opakovaně.
    const k = K.precti(t.kniha, casZmeny(t.upraveno));
    if (!k) {
      t.kniha = K.zeStarehoTvaru(t, casZmeny(t.upraveno));
      t.neodeslano = !!t.vlastni;
    } else if (k !== t.kniha) {
      t.kniha = k; // kniha v1 → v2
      t.neodeslano = !!t.vlastni;
    }
    if (t.neodeslano === undefined) t.neodeslano = false;
    if (t.vlastni === undefined) {
      t.vlastni = t.nazev !== "Naše parta"
        || Object.keys(t.prichod).length > 0
        || Object.keys(t.skopek).length > 0
        || Object.keys(t.ukoly).length > 0;
    }
  }
  // „Naše parta“, kterou si dřív zakládalo samo spuštění a nikdo se jí
  // nedotkl, se zahodí. Nic se tím neztratí: vlastni:false znamená bez jména
  // i bez jediné čárky. Pojmenovaná nebo rozehraná parta má vlastni:true.
  z.tymy = z.tymy.filter((t) => t.vlastni !== false);
  for (const t of z.tymy) prepocti(t, z.hospody);
  if (!z.tymy.some((t) => t.id === z.tymId)) z.tymId = z.tymy[0]?.id || "";
  srovnejStace(z);
  return z;
}

export const stav: Stav = nacti();
// Mikroúloha, ne rovnou: uloz() si sahá na věci, které se v tomhle souboru
// zavádějí až pod námi.
if (zapisPoDoplneni) queueMicrotask(uloz);

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

export function pridejTym(nazev: string): Tym {
  const t = novyTym(nazev);
  t.hospoda = stav.hospody[0]?.id || null;
  prepocti(t);
  t.upraveno = new Date().toISOString();
  stav.tymy.push(t);
  uloz();
  return t;
}

export function upravTym(id: string, zmeny: Partial<Pick<Tym, "nazev">>) {
  const t = stav.tymy.find((x) => x.id === id);
  if (!t) return;
  if (zmeny.nazev !== undefined && zmeny.nazev !== t.nazev) {
    t.nazev = zmeny.nazev;
    t.prejmenovano = true;
  }
  dotknuto(t); // pojmenovaný tým už patří ostatním na oči
  uloz();
}

/** Smaže tým. Jde smazat i poslední: bez týmu se prostě nezapisuje a Hra
 *  si řekne o založení. Dřív tu stála pojistka, že poslední tým zůstane,
 *  jenže ta jen držela při životě partu, kterou nikdo nechtěl. */
export function smazTym(id: string): boolean {
  if (!stav.tymy.some((t) => t.id === id)) return false;
  stav.tymy = stav.tymy.filter((t) => t.id !== id);
  if (stav.tymId === id) stav.tymId = stav.tymy[0]?.id || "";
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

/** Posune štaci. Jen v tomhle telefonu: nikam se neposílá a ostatním
 *  z party se obrazovka nepohne. Kde kdo zapisuje, si řídí každý sám. */
export function nastavHospodu(id: string) {
  const t = tym();
  if (!t || t.hospoda === id) return;
  t.hospoda = id;
  uloz();
}

export function posunHospodu(o: number) {
  const cil = stav.hospody[indexHospody() + o];
  if (cil) nastavHospodu(cil.id);
}

export function pridejHospodu(nazev: string) {
  stav.hospody.push({
    id: noveId(),
    nazev: nazev.trim().slice(0, 60) || "Nová špeluňka",
  });
  srovnejStace(stav);
  uloz();
}

export function upravHospodu(id: string, nazev: string) {
  const h = stav.hospody.find((x) => x.id === id);
  if (!h) return;
  h.nazev = nazev.trim().slice(0, 60) || h.nazev;
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
  const r = rozpad(t);
  return r.dochazka + r.skopky + r.ukoly;
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
      id: t.id, nazev: t.nazev || "Bez názvu", body: body(t),
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
  // Čas příchodu (kvůli „jste tady dvacet minut“) je čas zápisu v knize;
  // odepsaný příchod ho bere s sebou.
  K.nastavPrepinac(t.kniha, druh, h, !t[druh][h], JA);
  prepocti(t);
  uloz();
  return !!t[druh][h];
}

export function pridejUkol(u: Ukol): boolean {
  const t = tym();
  if (!t || !jdePridat(u, t)) return false;
  dotknuto(t);
  K.pricti(t.kniha, u.id, 1, JA);
  if (u.jednouZaHospodu && t.hospoda) K.nastavPrepinac(t.kniha, "zlodej", t.hospoda, true, JA);
  prepocti(t);
  uloz();
  return true;
}

export function uberUkol(u: Ukol): boolean {
  const t = tym();
  const ted = kolikrat(u.id, t);
  if (!t || ted <= 0) return false;
  dotknuto(t);
  K.pricti(t.kniha, u.id, -1, JA);
  if (u.jednouZaHospodu && t.hospoda && t.zlodej[t.hospoda]) K.nastavPrepinac(t.kniha, "zlodej", t.hospoda, false, JA);
  prepocti(t);
  uloz();
  return true;
}

export function vynulujTym(id = stav.tymId) {
  const t = stav.tymy.find((x) => x.id === id);
  if (!t) return;
  // Vynuluje se v knize, ne smazáním polí: smazané by druhý telefon při
  // sloučení vrátil. Co mezitím přidá jiný telefon, zůstane (viz vynuluj).
  dotknuto(t);
  K.vynuluj(t.kniha, JA);
  t.hospoda = stav.hospody[0]?.id || null;
  prepocti(t);
  uloz();
}

/* ---------- slučování se serverem ---------- */

/** Co se o týmu posílá ostatním: kniha zápisů a z ní spočítaný výklad
 *  (body, štace) pro pořadí. `kniha` je sloučená kniha, která se zapisuje,
 *  když se liší od té v telefonu. */
export function kOdeslani(t: Tym, kniha: K.Kniha = t.kniha): RadekTymu {
  const v: Tym = { ...t, kniha };
  prepocti(v);
  // Sloupec hospoda: kam parta naposledy dorazila (příchod), ne štace,
  // na kterou se zrovna kouká tenhle telefon.
  const dorazila = stav.hospody.findIndex((h) => h.id === kdeStoji(v, stav.hospody));
  return {
    id: t.id,
    nazev: t.nazev || "Bezejmenná parta",
    hospoda: Math.max(0, dorazila) + 1,
    body: body(v),
    rozpad: rozpad(v),
    stav: { hospoda: stav.hospody[dorazila]?.id ?? null, prichod: v.prichod, prichodCas: v.prichodCas,
            skopek: v.skopek, ukoly: v.ukoly, zlodej: v.zlodej, kniha },
    upraveno: new Date().toISOString(),
  };
}

/** Telefon zapsal na server sloučenou knihu `odeslana`. Kniha v telefonu se
 *  mezitím mohla změnit (ťuknutí během čekání na server), proto se slučuje,
 *  ne přepisuje, a tým zůstane k odeslání, pokud v něm je něco navíc. */
export function poOdeslani(id: string, odeslana: K.Kniha, nazev: string) {
  const t = stav.tymy.find((x) => x.id === id);
  if (!t) return;
  t.kniha = K.sluc(t.kniha, odeslana);
  t.neodeslano = !K.stejne(t.kniha, odeslana);
  if (t.nazev === nazev) t.prejmenovano = false;
  t.bylNaServeru = true;
  prepocti(t);
  uloz();
}

/** Razítko změny jako číslo. Porovnávat ho jako text nejde: telefon píše
 *  „…10:00:00.123Z", Postgres vrací „…10:00:00.123+00:00" a někdy bez
 *  tisícin, takže by o novějším rozhodovalo pořadí znaků, ne čas. */
// Deklarace funkce, ne const: volá ji nacti() při startu modulu, tedy dřív,
// než by se const pod ní stihla zavést (ReferenceError a appka nenaběhne).
export function casZmeny(r: string | null | undefined): number {
  return r ? Date.parse(r) || 0 : 0;
}

/** Sloučí týmy ze serveru do místních. Novější razítko vyhrává; tým, který
 *  ze serveru zmizel, zmizí i tady, pokud tam někdy byl. */
export function slucZeServeru(radky: RadekTymu[]) {
  const naServeru = new Set(radky.map((r) => r.id));

  for (const r of radky) {
    const k = knihaRadku(r);
    const mistni = stav.tymy.find((t) => t.id === r.id);
    if (!mistni) {
      const t: Tym = { ...novyTym(r.nazev, true), id: r.id, upraveno: r.upraveno,
        bylNaServeru: true, kniha: k, neodeslano: false, hospoda: null };
      prepocti(t);
      stav.tymy.push(t);
      continue;
    }
    // Sloučit, ne vybrat novější: v knize ze serveru může být zápis
    // z jiného telefonu a v té místní zápis, který ještě neodešel.
    const m = K.sluc(mistni.kniha, k);
    mistni.kniha = m;
    if (!mistni.prejmenovano) mistni.nazev = r.nazev;
    mistni.neodeslano = !K.stejne(m, k) || (!!mistni.prejmenovano && mistni.nazev !== r.nazev);
    if (casZmeny(r.upraveno) > casZmeny(mistni.upraveno)) mistni.upraveno = r.upraveno;
    mistni.bylNaServeru = true;
    prepocti(mistni);
  }

  // tým smazaný na jiném telefonu musí zmizet i tady
  stav.tymy = stav.tymy.filter((t) => !t.bylNaServeru || naServeru.has(t.id));
  // a když po tom nezbyde žádný, žádný tu ani není. Dřív se tu dopisovala
  // „Naše parta“ a vypadalo to, že si ji appka vyrobila sama ze vzduchu.
  if (!stav.tymy.some((t) => t.id === stav.tymId)) stav.tymId = stav.tymy[0]?.id || "";

  srovnejStace(stav);
  uloz();
}
