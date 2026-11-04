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
    text: "Šest večer, zoncna zalezla a ve štatlu se schází parta ogarů a holek, co to v palici nemají vypatlaný. Každej hodí kilo do kotla, rozpadnete se do dvou až tří partyjí a začíná betelná řežba.",
  },
  {
    nadpis: "Na trase",
    text: "Před váma je trasa přes brněnský špeluňky, jedna za druhou. Valí se to celej večer až do dvou do rána. Co se zvrtne potom, to už nikdo nepočítá. Ani čárky.",
  },
  {
    nadpis: "Žádný courání",
    text: "Na každou štaci máte tak tři čtvrtě hodiny, pak se zvedá kotva. Kdo se loudá jak šnek a ty druhý na něj musí čumět, nemá v té špeluňce za srandy ani čárku.",
  },
  {
    nadpis: "Čárky na zeď",
    text: "Čárka padá za každou špeluňku, kam vlezete, a za škopek, co lupne aspoň půlka partyje. Ty nejlepší ale padají za srandy: v appce čekají úkoly od brnkačky po betelnou makačku a čím větší haluz, tím víc čárek.",
  },
  {
    nadpis: "Celej bank",
    text: "Ve dvě ráno se sečte, kdo má na zdi nejvíc čárek. Ta partyje bere titul Tour De Pub i celej kotel, všechny love só jejich. Ostatní si aspoň můžou říct, že to byla betelná řežba.",
  },
];
