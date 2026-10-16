// Režim správce. Odemkne úpravy úkolů a hospod, ostatní můžou jenom hrát.
//
// POZOR: je to zámek proti omylu, ne bezpečnost. Web je statický a veřejný,
// takže kdo se podívá do zdrojáku, kód si přečte. Na partu kamarádů to stačí –
// brání tomu, aby někdo omylem přepsal úkoly uprostřed hry.
import { useSyncExternalStore } from "react";
import { ADMIN_KOD } from "./nastaveni";

const KLIC = "tourdepub-spravce";

function nacti(): boolean {
  try {
    return localStorage.getItem(KLIC) === ADMIN_KOD;
  } catch {
    return false;
  }
}

let zapnuto = nacti();
const posluchaci = new Set<() => void>();

export function nastavSpravce(stav: boolean) {
  zapnuto = stav;
  try {
    if (stav) localStorage.setItem(KLIC, ADMIN_KOD);
    else localStorage.removeItem(KLIC);
  } catch {
    // bez úložiště se režim jen nezapamatuje do dalšího spuštění
  }
  posluchaci.forEach((f) => f());
}

/** Sedí zadaný kód? */
export const sediKod = (kod: string) => kod === ADMIN_KOD;

/** Je zapnutý režim správce? Obrazovka se překreslí, když se to změní. */
export function useSpravce(): boolean {
  return useSyncExternalStore(
    (f) => { posluchaci.add(f); return () => posluchaci.delete(f); },
    () => zapnuto,
    () => zapnuto,
  );
}
