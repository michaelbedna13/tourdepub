// Přepínače na hledání chyb, co se dají zapnout jen na tom zařízení, kde se
// projevují. Rozmazaná lišta v appce z plochy se tady otestovat nedá —
// v kontejneru je jenom Chromium, žádné WebKit — a hádat počtvrté nemá cenu.
// Tohle je místo hádání: Mišák na telefonu přepne jednu věc a hned vidí,
// jestli to bylo ono.
//
// Drží se to v localStorage zvlášť, ne ve stavu hry: s partou ani čárkami to
// nemá co dělat a nemá se to synchronizovat na server.
const KLIC = "tourdepub-ladeni";

/** Jak se kreslí filmové zrno. */
export type Zrno =
  /** mix-blend-mode:overlay – jak to je dneska */
  | "micha"
  /** průhledná dlaždice jen překrytá, bez míchání */
  | "alfa"
  /** vůbec */
  | "ne";

export interface Ladeni {
  zrno: Zrno;
  /** Teplá záře nad obsahem (.app::after). */
  zare: boolean;
  /** Neprůhledný pruh přes horní hranu v appce z plochy (body::before). */
  pruh: boolean;
}

export const VYCHOZI: Ladeni = { zrno: "micha", zare: true, pruh: true };

export function nactiLadeni(): Ladeni {
  try {
    return { ...VYCHOZI, ...JSON.parse(localStorage.getItem(KLIC) || "null") };
  } catch {
    return { ...VYCHOZI };
  }
}

/** Promítne nastavení do tříd na <html>. CSS si pak samo vybere.
 *  Volá se co nejdřív při startu, ať se nic nepřekresluje podruhé. */
export function nasadLadeni(l: Ladeni = nactiLadeni()) {
  const k = document.documentElement.classList;
  k.toggle("zrno-alfa", l.zrno === "alfa");
  k.toggle("zrno-ne", l.zrno === "ne");
  k.toggle("zare-ne", !l.zare);
  k.toggle("pruh-ne", !l.pruh);
}

export function ulozLadeni(l: Ladeni) {
  try { localStorage.setItem(KLIC, JSON.stringify(l)); } catch { /* plná paměť: nevadí */ }
  nasadLadeni(l);
}
