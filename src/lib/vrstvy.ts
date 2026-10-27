// Rozmazání obrazovky pod otevřenou vrstvou (detail úkolu, spodní okno).
//
// Dřív to dělal backdrop-filter na samotné plachtě. Vypadalo to stejně, ale
// Safari si podklad pro rozostření vzorkuje zvlášť, a jakmile po dojetí
// animace vrstvu překreslilo, zůstal u levého okraje úzký pruh, který
// rozostřený nebyl. Přetažení plachty přes okraj obrazovky to nespravilo.
//
// Tohle se vzorkování vyhýbá úplně: rozmazává se obsah sám (filter na
// .obrazovka), ne to, co prosvítá vrstvou. Žádná hrana, kterou by šlo
// netrefit, tím pádem neexistuje — a že je rozmazané pozadí vykreslené
// hruběji, je úplně jedno, protože rozmazané má být.
import { useEffect } from "react";

const TRIDA = "rozmazat";
/** Kolik vrstev je zrovna otevřených. Okno se dá otevřít nad detailem,
 *  takže zavření té horní nesmí rozmazání sundat. */
let otevreno = 0;

/** Po dobu života komponenty drží obrazovku pod ní rozmazanou. */
export function useRozmazanePozadi() {
  useEffect(() => {
    otevreno++;
    document.documentElement.classList.add(TRIDA);
    return () => {
      otevreno = Math.max(0, otevreno - 1);
      if (!otevreno) document.documentElement.classList.remove(TRIDA);
    };
  }, []);
}
