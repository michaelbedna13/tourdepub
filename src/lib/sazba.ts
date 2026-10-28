import { useSyncExternalStore } from "react";
import { vazat } from "./format";

/** Sazba jména na dlaždici úkolu.
 *
 *  Jméno delší, než kolik se na kartu vejde na dva řádky, se musí stáhnout.
 *  Dřív se to odhadovalo z počtu znaků: devatenáct písmen byla hranice
 *  a všechno delší dostalo menší písmo. Jenže počet znaků o šířce
 *  nerozhoduje (ve stejné sazbě je „Rada za všechny" širší než „všechny
 *  prachy", i když má o písmeno víc) a odhad byl skoro dvakrát přísnější,
 *  než bylo potřeba. Výsledek šlo vedle sousední karty poznat na první
 *  pohled a vypadalo to jako chyba.
 *
 *  Tady se nehádá: jméno se změří na plátně v tom písmu, které se opravdu
 *  načetlo, a stáhne se přesně o to, co chybí. Nejdřív prostrkáním, teprve
 *  potom velikostí — stažená řádka je vedle sousední karty k nepoznání,
 *  kdežto o bod menší písmo je vidět hned. Ve většině písem tak nezbyde
 *  žádné stahování vůbec. */

/** Základní velikost. Musí sedět s .ukol-karta-nazev v app.css. */
export const ZAKLAD = 16.5;
/** Normální prostrkání a to stažené, co se zkusí dřív než menší písmo. */
const VOLNE = -0.012;
const STAZENE = -0.042;
/** Pod tohle písmo nejde; z dlouhého jména by byl drobnopis. */
const DNO = 0.88;

export interface Sazba {
  /** Řádky, na které se jméno rozpadne. Lámání si držíme sami, ať je render
   *  přesně to, co jsme změřili. */
  radky: string[];
  sazba: number;
  prostrkani: number;
}

/** letterSpacing na plátně umí Chrome i Safari (16.4+), ale do typů se to
 *  ještě nedostalo. Kde chybí, přičte se prostrkání ručně. */
type Platno = CanvasRenderingContext2D & { letterSpacing?: string };

const platno: Platno | null = typeof document === "undefined"
  ? null : document.createElement("canvas").getContext("2d");

function sirkaTextu(text: string, pismo: string, prostrkani: number): number {
  if (!platno) return 0;
  platno.font = pismo;
  if (platno.letterSpacing !== undefined) {
    platno.letterSpacing = `${prostrkani}em`;
    return platno.measureText(text).width;
  }
  // Prostrkání sedí za každým znakem, takže je to prostý součin.
  return platno.measureText(text).width + text.length * prostrkani * ZAKLAD;
}

/** Rozdělí jméno na dva řádky tak, aby byl ten delší co nejkratší. Měří se,
 *  nepočítají se písmena. Dělí se jen v obyčejné mezeře: nedělitelné mezery
 *  z vazat() drží krátká slova u toho svého. */
function rozdel(text: string, pismo: string): string[] {
  const slova = text.split(" ");
  if (slova.length < 2) return [text];
  let nej = [text];
  let nejsirka = Infinity;
  for (let i = 1; i < slova.length; i++) {
    const a = slova.slice(0, i).join(" ");
    const b = slova.slice(i).join(" ");
    const s = Math.max(sirkaTextu(a, pismo, VOLNE), sirkaTextu(b, pismo, VOLNE));
    if (s < nejsirka) { nejsirka = s; nej = [a, b]; }
  }
  return nej;
}

type Mira = { sirka: number; pismo: string };
let mira: Mira | null = null;
let verze = 0;
let vzor: HTMLElement | null = null;
const posluchaci = new Set<() => void>();
const pamet = new Map<string, Sazba>();

function ohlas() {
  verze++;
  pamet.clear();
  for (const f of posluchaci) f();
}

/** Změří sloupec jména na jedné dlaždici. Všechny jsou stejně široké, takže
 *  jedna stačí — číst rozvržení u všech třiačtyřiceti by jen škubalo. */
function zmer(znovu = false) {
  if (!vzor || !vzor.isConnected) return;
  const s = getComputedStyle(vzor);
  const nova: Mira = { sirka: vzor.clientWidth, pismo: `${s.fontWeight} ${ZAKLAD}px ${s.fontFamily}` };
  if (!nova.sirka) return;
  if (!znovu && mira && mira.sirka === nova.sirka && mira.pismo === nova.pismo) return;
  mira = nova;
  ohlas();
}

/** Ref na jméno. První dlaždice, co se objeví, se stane vzorem k měření. */
export function vzorJmena(el: HTMLElement | null) {
  if (el && !vzor?.isConnected) { vzor = el; zmer(); }
}

if (typeof window !== "undefined") {
  let cas: ReturnType<typeof setTimeout>;
  window.addEventListener("resize", () => {
    clearTimeout(cas);
    cas = setTimeout(() => zmer(), 120);
  });
  // Dokud se nenačte Hagrid, měří se v záložním písmu — a to je o kus užší,
  // takže by stahování vyšlo jinak. Po doručení písma se měří znovu;
  // znovu=true proto, že se jméno rodiny nezmění, jen jeho metriky.
  document.fonts?.ready.then(() => zmer(true));
  document.fonts?.addEventListener("loadingdone", () => zmer(true));
}

function spocti(nazev: string): Sazba {
  const text = vazat(nazev);
  if (!mira || !platno) return { radky: [text], sazba: 1, prostrkani: VOLNE };
  const { sirka, pismo } = mira;
  // Co se vejde na jeden řádek, na něm zůstane.
  if (sirkaTextu(text, pismo, VOLNE) <= sirka) return { radky: [text], sazba: 1, prostrkani: VOLNE };

  const radky = rozdel(text, pismo);
  const nejsirsi = (p: number) => Math.max(...radky.map((r) => sirkaTextu(r, pismo, p)));
  if (nejsirsi(VOLNE) <= sirka) return { radky, sazba: 1, prostrkani: VOLNE };
  const s = nejsirsi(STAZENE);
  if (s <= sirka) return { radky, sazba: 1, prostrkani: STAZENE };
  return { radky, sazba: Math.max(DNO, sirka / s), prostrkani: STAZENE };
}

export function useSazbaJmena(nazev: string): Sazba {
  useSyncExternalStore(
    (f) => { posluchaci.add(f); return () => { posluchaci.delete(f); }; },
    () => verze,
    () => verze,
  );
  let v = pamet.get(nazev);
  if (!v) { v = spocti(nazev); pamet.set(nazev, v); }
  return v;
}
