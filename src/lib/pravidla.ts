// Pravidla hry na jednom místě.
//
// Stála dřív rozepsaná přímo v obrazovce Pravidla. Jenže je říká i úvod,
// a dvě kopie téhož textu se dřív nebo později rozejdou — změní se jedna
// a druhá o tom neví. Tady je zdroj pro obrazovku Pravidel. Úvod je od
// teď příběh (lib/pribeh.ts) a pravidla jen naznačuje.
//
// Mluví to hantecem a tak to má zůstat: appka, kde se jinde píše o betelný
// řežbě a vypatlaný palici, nemůže mít pravidla psaná jako příbalový leták.

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
export const PARTYJE: Bod = { stitek: "Partyje", text: "Jede se ve dvou partách." };
export const COURANI: Bod = {
  stitek: "Žádný courání",
  text: "Na každou štaci je zhruba 45 minut. Jak se nějaká parta bude fest loudat a ty druhý na ně budou muset čumět, tak v té špeluňce nebudou mít za ty srandy ani čárku.",
};
export const JAK_SE_VALI: Bod[] = [CAJK, PARTYJE, COURANI];

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
