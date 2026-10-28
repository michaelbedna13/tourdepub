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

/** Drží obrazovku pod sebou rozmazanou, dokud je `aktivni`.
 *
 *  Parametr je kvůli zavírání. Vrstva, co odchází s vlastní animací, žije
 *  v DOMu ještě tři desetiny vteřiny potom, co je o ní rozhodnuto — a kdyby
 *  po celou tu dobu držela rozmazání, nová obrazovka by se pod odcházející
 *  nabídkou vynořila rozmazaná a zaostřila by až po ní. Dva přechody za
 *  sebou místo jednoho. Takhle se rozostření pouští ve stejnou chvíli jako
 *  odchod vrstvy a je z toho jeden pohyb. */
export function useRozmazanePozadi(aktivni = true) {
  useEffect(() => {
    if (!aktivni) return;
    otevreno++;
    document.documentElement.classList.add(TRIDA);
    return () => {
      otevreno = Math.max(0, otevreno - 1);
      if (!otevreno) document.documentElement.classList.remove(TRIDA);
    };
  }, [aktivni]);
}
