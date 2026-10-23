// Doladění jednotlivých kreseb.
//
// Kresby se do čtverce 0 0 100 100 ořezávají na obálku (viz
// scripts/prevod-kreseb.py), takže každá ho vyplní na doraz — jenže ne každá
// má v tom čtverci stejnou váhu. Štíhlá postava se ve čtvercovém rámečku
// ztratí, rozmáchlá kresba se do něj naopak tlačí. Tady se to srovná okem,
// kresbu po kresbě; žádné pravidlo na to není.
//
// Co tu není, se kreslí tak, jak přišlo.

export interface LadeniKresby {
  /** Násobek velikosti. 1 = jak přišla. */
  zvetseni?: number;
  /** Posun v procentech rámečku, kladné doprava a dolů. */
  x?: number;
  y?: number;
}

export const LADENI_KRESEB: Record<string, LadeniKresby> = {
  // Šmelinář je vysoký a úzký, takže na výšku rámečku dosáhne dřív, než ho
  // zaplní do stran — ve čtverci pak vypadá menší než ostatní.
  smelinar: { zvetseni: 1.16, y: -2 },
  // Borec, co to cáluje: kresba jde doleva dolů, tak se o kousek posune zpět.
  caluje: { zvetseni: 1.06, x: 2 },
};
