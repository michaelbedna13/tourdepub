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
  nadpis: string;
  text: string;
}

export const PRIBEH: Kapitola[] = [
  {
    nadpis: "Sraz ve štatlu",
    text: "Šest večer, zoncna zalezla a ve štatlu se schází parta ogarů a holek, co to v palici nemají vypatlaný. Každej hodí kilo do kotla, rozdělíte se do dvou až tří partyjí a první škopek se ťukne na zdar.",
  },
  {
    nadpis: "Na trase",
    text: "Pak se valí od jedný špeluňky k druhý, celou trasu přes štatl až do dvou do rána. Co se zvrtne potom, už se do čárek nepočítá. Ani když je to ta nejlepší historka večera.",
  },
  {
    nadpis: "Žádný courání",
    text: "Na každou štaci máte tak tři čtvrtě hodiny. Kdo se fest loudá a ostatní na něj musí venku čumět, ten v té špeluňce za srandy čárku nedostane. Takže dopít a mazat dál.",
  },
  {
    nadpis: "Za co čárky",
    text: "Čárka padá za každou špeluňku, kam vlezete, a další za škopek, co v ní lupne aspoň půlka partyje. Nejvíc se ale nahrabe za srandy. Úkoly nosíte v kapse, od brnkaček po betelný makačky, a čím větší haluz, tím víc čárek.",
  },
  {
    nadpis: "Konečná",
    text: "Ve dvě ráno se sečtou čárky. Partyje, co jich nahrabala nejvíc, bere titul Tour De Pub i celej kotel, všechny love só jejich. Ty ostatní si odnesou aspoň historky na celej rok.",
  },
];
