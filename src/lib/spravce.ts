// Režim správce. Odemkne úpravy úkolů a hospod a mazání týmů.
//
// Dřív to byl kód napsaný ve zdrojáku, takže si ho mohl přečíst kdokoli.
// Teď je to přihlášení účtem správce: heslo ověřuje Supabase a mazat týmy
// na serveru dovolí pravidla jen tomuhle účtu, ať appka ukazuje cokoli.
//
// Vypnutí režimu správce účet neodhlásí, jen schová úpravy. Správce je
// zároveň hráč, a kdyby se odhlásil, musel by zadávat heslo hry. Zapnout
// znova jde zase jen s heslem správce.
import { useSyncExternalStore } from "react";
import { prihlas, useUcet } from "./prihlaseni";

const KLIC = "tourdepub-spravce-schovany";

function nacti(): boolean {
  try {
    return localStorage.getItem(KLIC) === "1";
  } catch {
    return false;
  }
}

let schovany = nacti();
const posluchaci = new Set<() => void>();

function nastavSchovany(stav: boolean) {
  schovany = stav;
  try {
    if (stav) localStorage.setItem(KLIC, "1");
    else localStorage.removeItem(KLIC);
  } catch {
    // bez úložiště se to jen nezapamatuje do dalšího spuštění
  }
  posluchaci.forEach((f) => f());
}

/** Ověří heslo správce na serveru a zapne režim. Vrací prázdný řetězec,
 *  když to prošlo, jinak větu pro člověka. */
export async function zapniSpravce(heslo: string): Promise<string> {
  const chyba = await prihlas("spravce", heslo);
  if (!chyba) nastavSchovany(false);
  return chyba;
}

export function vypniSpravce() {
  nastavSchovany(true);
}

/** Kdo zadá heslo správce rovnou do brány, chce být správce, i kdyby
 *  si režim na tomhle telefonu dřív vypnul. */
export function odkryjSpravce() {
  nastavSchovany(false);
}

/** Je zapnutý režim správce? Obrazovka se překreslí, když se to změní. */
export function useSpravce(): boolean {
  const ucet = useUcet();
  const skryto = useSyncExternalStore(
    (f) => { posluchaci.add(f); return () => posluchaci.delete(f); },
    () => schovany,
    () => schovany,
  );
  return ucet === "spravce" && !skryto;
}
