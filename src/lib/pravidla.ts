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
  /** Popisek nad větou — čeho se pravidlo týká. */
  stitek?: string;
  text: string;
  /** Tichý dovětek na konci, typicky strop. Není to součást věty. */
  strop?: string;
}

/** Úvodní odstavec: čte se jako text, ne jako pravidlo. */
export const UVODNIK =
  "Bacha, to není jenom takový to klasický večerní nasávání v Štatlu. Tady se jede betelná řežba přes brněnský špeluňky, kde čárky nemáš jenom za vyžahnutý pruty, ale hlavně za to, že máš koule, dobrej kšaft a v palici to nemáš vypatlaný.";

/** O co se hraje a za co se platí. */
export const ZAKLAD: Bod[] = [
  { stitek: "O co jde", text: "Nahrabat víc čárek než ty druhý partyje a urvat titul z Tour De Pub." },
  { stitek: "Vlezné do kotla", text: "Kilo na palici." },
  { stitek: "Celej bank", text: "První parta bere všecko. Všechny love só jejich." },
];

/** Jak večer běží. */
export const CAJK: Bod = {
  stitek: "Časovej cajk",
  text: "Valí se to od šesti večer do dvou do rána. Co se zvrtne potom, už se do čárek nepočítá.",
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
 *  Štítek je tady hodnota, ne jméno pravidla: na obrazovce Pravidel z toho
 *  je sloupec čísel vlevo a věta vpravo, takže je na první pohled vidět, co
 *  kolik nese. Strop je zvlášť, aby nemusel viset v závorce uprostřed věty. */
export const bodovani = (hospod: number): Bod[] => [
  { stitek: "+1", text: "Za každou špeluňku, do který vlezete.", strop: `nejvíc ${hospod}` },
  { stitek: "+1", text: "Za škopek ve štaci. Stačí, když ho lupne aspoň půlka partyje.", strop: `nejvíc ${hospod}` },
  { stitek: "+1 až 3", text: "Za srandy podle toho, jaká je to haluz." },
];

/* Plakáty úvodu. Každý je jeden souvislý odstavec, ne pravidla pod sebou se
   štítkama. Rozsekané na „Časovej cajk / Partyje" to vypadalo jako formulář
   a oko skákalo mezi drobnýma popiskama a větama; plakát se má přečíst
   jedním dechem. Obrazovka Pravidel je na hledání, tam štítky zůstávají.
   Věty jsou poskládané z týchž kusů, takže se obojí nerozejde: kde se dá,
   bere se text přímo z bodů výš, čísla z OBTIZNOST a z počtu štací. */
export const UVOD_VALI = `${CAJK.text} ${PARTYJE.text}`;
export const UVOD_COURANI = COURANI.text;
export const uvodBodovani = (hospod: number) =>
  `Za každou špeluňku, do který vlezete, padá čárka. Další je za škopek ve štaci, ` +
  `stačí, když ho lupne aspoň půlka partyje. Obojí jednou na štaci, takže nejvíc ${hospod}. ` +
  `K tomu jedna až tři za srandy podle toho, jaká je to haluz: ${HALUZE()}.`;
export const UVOD_BANK =
  `Jde o to nahrabat víc čárek než ty druhý partyje a urvat titul z Tour De Pub. Do kotla se hodí kilo na palici ` +
  `a první parta bere celej bank. Všechny love só jejich.`;
