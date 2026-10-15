// Hospody a úkoly podle pravidel Tour de Pub – Brno edition.
// Čárka = bod. "piva" je obtížnost (1 brnkačka, 2 větší haluz, 3 betelná makačka),
// "body" je kolik čárek padne za jedno splnění a "max" kolikrát to jde opakovat.
// U většiny úkolů body = piva; u opakovatelných dávají pravidla čárku za kus, proto se liší.

export const HOSPODY = [
  { c: 1, nazev: "Lucky Bastard" },
  { c: 2, nazev: "Bláhovka" },
  { c: 3, nazev: "Zastávka" },
  { c: 4, nazev: "U Ričího" },
  { c: 5, nazev: "Na dobré cestě" },
  { c: 6, nazev: "U Seminárů" },
  { c: 7, nazev: "U Cajpla" },
  { c: 8, nazev: "Trojka" },
  { c: 9, nazev: "Music Lab / Desert" },
];

export const KATEGORIE = [
  { id: "kecy", nazev: "Kecy a šméčka", ikona: "kecy" },
  { id: "telo", nazev: "Tělo v luftě", ikona: "telo" },
  { id: "zranice", nazev: "Žranice a divadlo", ikona: "zranice" },
];

// Dvě čárky, které se nabíhají v každé špeluňce – nejsou to úkoly, patří k docházce.
export const ZAKLAD = [
  { id: "prichod", nazev: "Jsme v špeluňce", popis: "Čárka za každou špeluňku, do který vlezete.", ikona: "hospoda" },
  { id: "skopek", nazev: "Škopek padl", popis: "Čárka, když v tý štaci lupne aspoň půlka partyje jeden škopek.", ikona: "piva" },
];

export const UKOLY = [
  // ---------- Kecy a šméčka ----------
  { id: "caluje", kat: "kecy", piva: 1, body: 1, max: 5, nazev: "Borec, co to cáluje",
    popis: "Hoďte do nějakýho náhodnýho borca nebo baby panduláka. Za každou palici jedna čárka.",
    pozn: "Max. 5 různejch palic." },
  { id: "chudak", kat: "kecy", piva: 1, body: 1, max: 1, nazev: "Vyžebranej chudák",
    popis: "Ukecejte cizího člověka, ať vám něco zacáluje." },
  { id: "smelinar", kat: "kecy", piva: 2, body: 2, max: 1, nazev: "Šmelinář",
    popis: "Střelte někomu v lokále nějakou volovinu (tužku, ubrousek, cokoliv). Ani muk, že je to hra." },
  { id: "baleni", kat: "kecy", piva: 2, body: 2, max: 1, nazev: "Balení starýho kusu",
    popis: "Jeden z vás musí fest na voko a ze srandy balit někoho, kdo by mu mohl dělat fotra nebo máti." },
  { id: "ticha", kat: "kecy", piva: 2, body: 2, max: 1, nazev: "Tichá špeluňka",
    popis: "V jedný hospodě celá parta ani muk. I objednávku musíte dát beze slov (rukama, nohama, na papír)." },
  { id: "rada", kat: "kecy", piva: 2, body: 2, max: 1, nazev: "Rada za všechny prachy",
    popis: "Vytáhněte z nějakýho cizáka radu na hustej fejlovej problém (např. „Su těhotná, co mám dělat?“). Musíte to vykómat do detailu." },
  { id: "hokuspokus", kat: "kecy", piva: 3, body: 3, max: 1, nazev: "Trapnej hókuspókus",
    popis: "Rozbalte u cizího stolu nějaký kouzlo tak, aby bylo jasný, že to je totální šméčko. Nebo jinej trapas. Ani muk, že valíte nějakou hru." },
  { id: "hadka", kat: "kecy", piva: 3, body: 3, max: 1, nazev: "Hádka o čárku",
    popis: "Dělejte u vrchního borčus, že to pivo je pod čáru nebo to není správnej šnyt. Furt jim to vracejte a chtějte nový, dokud nepřiznaj barvu.",
    pozn: "Ale s citem, ať vás nevyhodijó!" },

  // ---------- Tělo v luftě ----------
  { id: "budny", kat: "telo", piva: 1, body: 1, max: 1, nazev: "Srostlý budny",
    popis: "Dva z vás si musí svázat glajdy k sobě a tak dovalit na další štaci.", mezi: [3, 4] },
  { id: "hajzl", kat: "telo", piva: 1, body: 1, max: 1, nazev: "Hajzlovej úlet",
    popis: "Jeden z vás musí jít na hajzl opačnýho pohlaví." },
  { id: "pumpa", kat: "telo", piva: 1, body: 1, max: 1, nazev: "Pouliční pumpa",
    popis: "Odchytněte na ulici nějakýho flanďáka a chtějte po něm, ať vám vočumí, jak dáváte kliky, dřepy nebo balet." },
  { id: "taxal", kat: "telo", piva: 2, body: 2, max: 1, nazev: "Živej taxál",
    popis: "Jeden z partyje nesmí na cestě šlápnout na zem. Jak ho tam dopravíte (na hřbetě, v pazórách), je na vás.", mezi: [4, 5] },
  { id: "lajna", kat: "telo", piva: 2, body: 2, max: 1, nazev: "Vopičí lajna",
    popis: "Jak zacálujete, valí celá parta z lokálu pryč po všech čtyřech." },
  { id: "rev", kat: "telo", piva: 2, body: 2, max: 1, nazev: "Řev jak z JZD",
    popis: "Někdo z vás musí v hospodě hodit betelnýho říha a pak na celej lokál zařvat „SORÁČ, LIDI!“." },
  { id: "bullseye", kat: "telo", piva: 3, body: 1, max: 3, nazev: "Bullseye!", ikona: "sipka",
    popis: "Napalte šipku do středu. Za první je čárka, za každou další taky.",
    pozn: "Max. 3 čárky.", hospoda: 4 },
  { id: "bicak", kat: "telo", piva: 3, body: 3, max: 1, nazev: "Betelný bicák",
    popis: "Až 3 borci z partyje musí čumět na plnej škopek na nataženej pazóře celou minutu.",
    pozn: "Jak to jeden podělá, celá parta má hovno." },

  // ---------- Žranice a divadlo ----------
  { id: "vycepni", kat: "zranice", piva: 1, body: 1, max: 1, nazev: "Já su výčepní",
    popis: "Ukecejte vrchního, ať vás nechá si načepovat vlastní škopek." },
  { id: "maturita", kat: "zranice", piva: 1, body: 1, max: 1, nazev: "Chlastací maturita",
    popis: "V jedný špeluňce musíte celá partyja hodit do sebe jednoho z těhlech zabijáků: flusanec, mozek, semafor, čert, krámy yettiho mamy, plameňák, vítr z hor, vodníkovo sperma nebo magické oko." },
  { id: "versovany", kat: "zranice", piva: 2, body: 2, max: 1, nazev: "Veršovanej lokál",
    popis: "Hoďte objednávku u obsluhy do rýmů." },
  { id: "anglan", kat: "zranice", piva: 2, body: 2, max: 1, nazev: "Falešnej Anglán",
    popis: "Nahoďte pokec s cizím stolem anglicky, jak když bičem mrská. Po chvilce na ně vybalte česky a vypadněte." },
  { id: "narodni", kat: "zranice", piva: 3, body: 3, max: 1, nazev: "Hospodský Národní", ikona: "zamek",
    popis: "Nachystejte si krátký divadlo a rozbalte to v lokále.",
    pozn: "Čárku bere jenom jedna parta na hospodu – kdo první, ten bere.", exkluzivni: true },
  { id: "zlodej", kat: "zranice", piva: 3, body: 1, max: 9, nazev: "Brněnskej zloděj",
    popis: "Z každý špeluňky šlohněte jednu věc (tácek, lžičku…). Nesmíte mít nic dvakrát. Za každou věc je čárka.",
    pozn: "Je to sranda, tak ať vás u toho nečapnó!", jednouZaHospodu: true },
  { id: "fotka", kat: "zranice", piva: 3, body: 3, max: 1, nazev: "Fotka na hovno",
    popis: "Nechte se jako parta vyblejsknout od cizáka. Furt do něj ale valte, že je levej, že ta fotka stojí za hovno a ať se snaží (s hopsáním, bez hopsání, ksichty…)." },
];

export const UKOL_PODLE_ID = Object.fromEntries(UKOLY.map((u) => [u.id, u]));

/** Kolik čárek jde z úkolů nasbírat nejvíc (bez docházky a škopků). */
export const STROP_UKOLY = UKOLY.reduce((s, u) => s + u.body * u.max, 0);
