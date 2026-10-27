// Pravidla hry na jednom místě.
//
// Stála dřív rozepsaná přímo v obrazovce Pravidla. Jenže je říká i úvod,
// a dvě kopie téhož textu se dřív nebo později rozejdou — změní se jedna
// a druhá o tom neví. Tady je zdroj; obrazovka i úvod si je jen vykreslí.
//
// Mluví to hantecem a tak to má zůstat: appka, kde se jinde píše o betelný
// řežbě a vypatlaný palici, nemůže mít pravidla psaná jako příbalový leták.

import { OBTIZNOST } from "./data";

export interface Bod {
  /** Tučný štítek na začátku řádky. */
  stitek?: string;
  text: string;
  /** Kus textu, co se má zvýraznit. Musí v textu doslova být. */
  duraz?: string;
}

/** Úvodní odstavec: čte se jako text, ne jako pravidlo. */
export const UVODNIK =
  "Bacha, to není jenom takový to klasický večerní nasávání v Štatlu. Tady se jede betelná řežba přes brněnský špeluňky, kde čárky nemáš jenom za vyžahnutý pruty, ale hlavně za to, že máš koule, dobrej kšaft a v palici to nemáš vypatlaný.";

/** O co se hraje a za co se platí. */
export const ZAKLAD: Bod[] = [
  { stitek: "O co jde", text: "Nahrabat víc čárek než ty druhý partyje a urvat titul z Tour De Pub." },
  { stitek: "Vlezné do kotla", text: "Kilo na palici." },
  { stitek: "Celej bank", text: "První parta bere všecko — všechny love só jejich." },
];

/** Jak večer běží. */
export const CAJK: Bod = {
  stitek: "Časovej cajk",
  text: "Valí se to od šesti večer do dvou do rána. Co se zvrtne potom, už se do čárek nepočítá.",
  duraz: "šesti večer do dvou do rána",
};
export const PARTYJE: Bod = { stitek: "Partyje", text: "Jede se ve dvou až třech partách." };
export const COURANI: Bod = {
  stitek: "Žádný courání",
  text: "Na každou štaci je zhruba 45 minut. Jak se nějaká parta bude fest loudat a ty druhý na ně budou muset čumět, tak v té špeluňce nebudou mít za ty srandy ani čárku.",
};
export const JAK_SE_VALI: Bod[] = [CAJK, PARTYJE, COURANI];

/** Stupnice haluzí vypsaná do řádky: „brnkačka 1, větší haluz 2…".
 *  Čte se z OBTIZNOST, takže čísla nemůžou utéct tomu, co appka počítá. */
const HALUZE = () =>
  OBTIZNOST.map((o) => `${o.nazev.toLowerCase()} ${o.piva}`).join(", ");

/** Za co padají čárky. Strop se odvíjí od počtu štací, takže se předává.
 *
 *  `shrnuti` je pro úvod: na obrazovce Pravidel pod třetím bodem následuje
 *  legenda s půllitry, kdežto na plakátu by dvojtečka visela do prázdna,
 *  tak se stupnice dopíše rovnou do věty. Čísla jsou v obou případech
 *  z OBTIZNOST, takže se rozejít nemůžou. */
export const bodovani = (hospod: number, shrnuti = false): Bod[] => [
  { text: `Čárka za každou špeluňku, do který vlezete. (max. ${hospod})`, duraz: `(max. ${hospod})` },
  { text: `Čárka, když v tý štaci lupne aspoň půlka partyje jeden škopek. (max. ${hospod})`, duraz: `(max. ${hospod})` },
  shrnuti
    ? { text: `Další čárky za plnění srand podle toho, jaká je to haluz: ${HALUZE()}.`, duraz: HALUZE() }
    : { text: "Další čárky za plnění srand, rozhozený podle toho, jaká je to haluz:" },
];
