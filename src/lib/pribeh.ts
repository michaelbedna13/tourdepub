// Úvod jako příběh: jak se večer sejde parta a projede šňůru špeluněk.
//
// Dřív úvod doslova opakoval pravidla (bral je z lib/pravidla.ts). Četlo se
// to jako příbalový leták rozdělený na pět stránek. Teď je to vyprávění
// o jednom večeru a pravidla v něm jen probleskujou: kdy se začíná, kolik
// se hází do kotla, že se nemá courat, za co padají čárky a kdo bere bank.
// Přesné znění a stropy jsou na obrazovce Pravidel, tady se to nepočítá.
//
// Počet hospod tu schválně není. Trasa se dá v appce změnit a příběh by
// pak lhal.
//
// Když se změní pravidla (cajk, vlezné, partyje, čas na štaci), musí se
// sem kouknout ručně: čísla tu jsou napsaná slovy, ne natažená z pravidel.

export interface Kapitola {
  /** Nadpis vždycky na dva řádky, zlomený natvrdo: pět plakátů za sebou
   *  stojí stejně a nadpis neskáče mezi jedním a dvěma řádky. */
  nadpis: [string, string];
  text: string;
}

export const PRIBEH: Kapitola[] = [
  {
    nadpis: ["Sraz", "ve štatlu"],
    text: "Šest večer, zoncna zalezla a ve štatlu se schází parta ogarů a holek. Každej hodí kilo do kotla, parta se rozdělí na dvě partyje a první škopek se ťukne na zdar.",
  },
  {
    nadpis: ["Od špeluňky", "ke špeluňce"],
    text: "Pak se valí od jedný špeluňky k druhý, přes celej štatl až do dvou do rána. Co se zvrtne potom, se do čárek nepočítá, i kdyby to byla nejlepší historka večera.",
  },
  {
    nadpis: ["Žádný", "courání"],
    text: "Na každou štaci máte zhruba tři čtvrtě hodiny. Kdo se fest loudá a ostatní na něj musí venku čumět, nedostane v tý špeluňce za srandy ani čárku. Takže dopít a mazat dál.",
  },
  {
    nadpis: ["Za co", "padaj čárky"],
    text: "Čárka padá za každou špeluňku, kam vlezete, a další, když v ní aspoň půlka partyje lupne škopek. Nejvíc se ale nahrabe za srandy, od brnkaček po betelný makačky. Čím větší haluz, tím víc čárek.",
  },
  {
    nadpis: ["Kdo bere", "kotel"],
    text: "Ve dvě ráno se sečtou čárky. Partyja, co jich nahrabala nejvíc, bere titul Tour De Pub i celej kotel, všechny love só její. Ostatní si odnesou aspoň historky na celej rok.",
  },
];
