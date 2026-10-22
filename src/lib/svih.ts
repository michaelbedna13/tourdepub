// Švih prstem: do boku mezi obrazovkami a dolů na zavření karty.
//
// Posun se píše rovnou do DOM, ne přes stav Reactu. Dřív každý pohyb prstu
// překreslil celou obrazovku (setPosun → render Kostry → Outlet → celý seznam
// úkolů) a naměřeno to bylo 127 ms skriptu na jeden tah při čtyřnásobně
// zpomaleném procesoru. Na telefonu je to přesně ta sekaná, co je vidět.
// Takhle tah Reactu nestojí nic: mění se jedna vlastnost na jednom prvku.
//
// Nepoužívá scroll-snap pás se všemi obrazovkami vedle sebe: obrazovky si drží
// svůj posun a svůj stav a vykreslovat je všechny naráz by znamenalo pět kopií
// seznamů v paměti. Místo toho se táhne jen ta současná a po puštění dojede
// tím směrem, kam se táhlo; nová přijede z druhé strany.
import { useRef, type PointerEvent as ReactPointerEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/** Odkud musí být jasné, že jde o švih do boku, ne o posun stránky. */
const PRAH = 12;
/** Jak moc musí být švih vodorovnější než svislý, aby se chytil. */
const POMER = 1.5;
/** Kolik se musí utáhnout, aby se obrazovka přehodila. */
const PREKLOPIT = 64;
/** Za kraji seznamu se táhne ztuha, ať je poznat, že dál nic není. */
const ODPOR = 0.28;
/** Rychlost (px/ms), od které se to bere jako cuknutí a přehodí i na krátké
 *  dráze. Bez toho se musí pokaždé táhnout přes půl displeje a v ruce to pak
 *  působí jako zadrhnutí, ne jako gesto. */
const CUKNUTI = 0.45;
/** Cuknutí musí mít aspoň tohle, ať se za něj nepočítá ťuknutí. */
const CUKNUTI_DRAHA = 20;
/** Jak dlouho jede obrazovka pryč. Drží se .odchazi v app.css. */
const ODCHOD = 170;
/** Jak dlouho se vrací, když se švih nedotáhl. Drží se .vraci v app.css. */
const NAVRAT = 220;
/** Okno, ze kterého se počítá rychlost. Kratší by chytalo šum prstu. */
const OKNO = 60;

export type Smer = "vlevo" | "vpravo" | null;

interface Tah {
  x: number;
  y: number;
  osa: null | "x" | "y";
  posun: number;
  /** Starší vzorek, proti kterému se při puštění počítá rychlost. */
  vzorek: number;
  vzorekCas: number;
}

function novyTah(x: number, y: number): Tah {
  return { x, y, osa: null, posun: 0, vzorek: 0, vzorekCas: performance.now() };
}

/** Posune vzorek, jakmile je starší než OKNO – rychlost se pak počítá
 *  z posledního kousku tahu, ne z celého gesta. */
function vzorkuj(t: Tah, ted: number) {
  if (ted - t.vzorekCas > OKNO) { t.vzorek = t.posun; t.vzorekCas = ted; }
}

/** px/ms, se znaménkem. */
function rychlost(t: Tah) {
  return (t.posun - t.vzorek) / Math.max(1, performance.now() - t.vzorekCas);
}

type Doklouzani = "vraci" | "odchazi" | null;

/** Přepne třídu jen když se opravdu mění. Sahat na classList při každém
 *  pohybu prstu znamená pokaždé zneplatnit styl prvku – a to je přesně ta
 *  práce, kvůli které se tah píše rovnou do stylu. */
function trida(e: Element, drzi: { ted: Doklouzani }, nova: Doklouzani) {
  if (drzi.ted === nova) return;
  if (drzi.ted) e.classList.remove(drzi.ted);
  if (nova) e.classList.add(nova);
  drzi.ted = nova;
}

export function useSvih(poradi: string[]) {
  const { pathname } = useLocation();
  const kam = useNavigate();
  const vrstva = useRef<HTMLElement | null>(null);
  const tah = useRef<Tah | null>(null);
  const prichod = useRef<Smer>(null);
  const odchazi = useRef(false);
  const cekani = useRef<number | undefined>(undefined);
  const drzi = useRef<{ ted: Doklouzani }>({ ted: null });

  const kde = poradi.indexOf(pathname);

  /** Posun rovnou do stylu prvku. `null` inline styl smaže — zbylý transform
   *  by z obrazovky udělal posunutou vrstvu a lišta uvnitř (position:sticky)
   *  by se v Safari přestala držet okna. */
  function kresli(posun: number | null, doklouzani: Doklouzani = null, zmizet = false) {
    const e = vrstva.current;
    if (!e) return;
    trida(e, drzi.current, doklouzani);
    if (posun === null) {
      e.style.transform = "";
      e.style.opacity = "";
      e.style.willChange = "";
    } else {
      e.style.transform = `translate3d(${Math.round(posun)}px,0,0)`;
      e.style.opacity = zmizet ? "0" : "";
    }
  }

  function konec() {
    tah.current = null;
    kresli(null);
  }

  function naStisk(e: ReactPointerEvent) {
    if (kde < 0 || e.pointerType === "mouse" || odchazi.current) return;
    // vodorovné pásy uvnitř obrazovky (hero karty) si švih řeší samy
    if ((e.target as Element).closest?.("[data-vodorovne]")) return;
    clearTimeout(cekani.current);
    tah.current = novyTah(e.clientX, e.clientY);
  }

  function naTah(e: ReactPointerEvent) {
    const t = tah.current;
    if (!t) return;
    const dx = e.clientX - t.x;
    const dy = e.clientY - t.y;

    if (!t.osa) {
      if (Math.abs(dx) < PRAH && Math.abs(dy) < PRAH) return;
      // jakmile se jednou rozhodne, že se jede svisle, švih se už nechytí –
      // jinak by šikmý tah hýbal obrazovkou i při obyčejném scrollování
      t.osa = Math.abs(dx) > Math.abs(dy) * POMER ? "x" : "y";
      if (t.osa === "x" && vrstva.current) vrstva.current.style.willChange = "transform";
    }
    if (t.osa !== "x") return;

    const zaKrajem = (dx > 0 && kde === 0) || (dx < 0 && kde === poradi.length - 1);
    t.posun = zaKrajem ? dx * ODPOR : dx;
    vzorkuj(t, performance.now());
    kresli(t.posun);
  }

  function naPusteni() {
    const t = tah.current;
    tah.current = null;
    if (!t || t.osa !== "x") return konec();

    const v = rychlost(t);
    const dost = Math.abs(t.posun) > PREKLOPIT
      || (Math.abs(v) > CUKNUTI && Math.abs(t.posun) > CUKNUTI_DRAHA
          && Math.sign(v) === Math.sign(t.posun));
    const dalsi = t.posun < 0 ? kde + 1 : kde - 1;

    if (dost && poradi[dalsi]) {
      // obrazovka dojede tam, kam se táhlo, a teprve pak se přehodí adresa –
      // dřív skočila zpátky na nulu a nová se zjevila odjinud, což je ten
      // cuk, co je v ruce cítit
      odchazi.current = true;
      const sirka = vrstva.current?.offsetWidth ?? 320;
      kresli(t.posun < 0 ? -sirka * 0.35 : sirka * 0.35, "odchazi", true);
      cekani.current = window.setTimeout(() => {
        odchazi.current = false;
        prichod.current = dalsi > kde ? "vlevo" : "vpravo";
        kam(poradi[dalsi]);
      }, ODCHOD);
      return;
    }

    kresli(0, "vraci");
    cekani.current = window.setTimeout(() => kresli(null), NAVRAT);
  }

  return {
    /** Patří na obal obrazovky. */
    obal: {
      onPointerDown: naStisk,
      onPointerMove: naTah,
      onPointerUp: naPusteni,
      onPointerCancel: konec,
    },
    /** Patří na vrstvu, která se má táhnout. */
    vrstva,
    /** Z které strany nová obrazovka přijela. */
    prichod: prichod.current,
  };
}

/** Odkud je jasné, že se táhne dolů, a ne že se jen ťuklo. */
const DOLU_PRAH = 8;
/** Jak moc musí být tah svislejší než vodorovný, aby se chytil. */
const DOLU_POMER = 1.2;
/** Kolik se musí utáhnout, aby se zavřelo. */
const DOLU_ZAVRIT = 110;
/** Nahoru se táhne ztuha – karta nemá kam odjet. */
const DOLU_ODPOR = 0.25;
/** Jak dlouho karta padá pryč. Drží se .odchazi v app.css. */
const DOLU_ODCHOD = 200;

/** Švih dolů, kterým se zavírá karta vytažená přes obrazovku.
 *
 *  Karta jede pod prstem a pozadí za ní zároveň slábne, takže je od začátku
 *  vidět, že se zavírá. Po puštění buď dopadne a zmizí, nebo se vrátí.
 *  Stejně jako u švihu do boku se posun píše rovnou do DOM.
 *
 *  `tahlSe` je pro ťukání uvnitř karty: po tahu nesmí doběhnout klik, jinak
 *  by se detailu při každém zavření ještě přelistoval text. */
export function useSvihDolu(zavri: () => void) {
  const karta = useRef<HTMLDivElement | null>(null);
  const pozadi = useRef<HTMLDivElement | null>(null);
  const tah = useRef<Tah | null>(null);
  const tahlSe = useRef(false);
  const odchazi = useRef(false);
  const cekani = useRef<number | undefined>(undefined);
  const drzi = useRef<{ ted: Doklouzani }>({ ted: null });

  function kresli(posun: number | null, doklouzani: Doklouzani = null) {
    const k = karta.current;
    if (!k) return;
    trida(k, drzi.current, doklouzani);
    if (posun === null) {
      k.style.transform = "";
      k.style.willChange = "";
      if (pozadi.current) {
        pozadi.current.classList.remove("odchazi");
        pozadi.current.style.opacity = "";
      }
      return;
    }
    k.style.transform = `translate3d(0,${Math.round(posun)}px,0)`;
    // pozadí slábne s tím, jak karta odjíždí – ne víc než na polovinu, ať
    // se pod ní uprostřed gesta nezačne číst obsah za ní
    if (pozadi.current) {
      const dil = Math.min(1, Math.max(0, posun) / (DOLU_ZAVRIT * 2));
      pozadi.current.style.opacity = String(1 - dil * 0.5);
    }
  }

  function konec() {
    tah.current = null;
    kresli(null);
  }

  function naStisk(e: ReactPointerEvent) {
    if (e.pointerType === "mouse" || odchazi.current) return;
    clearTimeout(cekani.current);
    tahlSe.current = false;
    tah.current = novyTah(e.clientX, e.clientY);
  }

  function naTah(e: ReactPointerEvent) {
    const t = tah.current;
    if (!t) return;
    const dx = e.clientX - t.x;
    const dy = e.clientY - t.y;

    if (!t.osa) {
      if (Math.abs(dx) < DOLU_PRAH && Math.abs(dy) < DOLU_PRAH) return;
      t.osa = Math.abs(dy) > Math.abs(dx) * DOLU_POMER ? "y" : "x";
      if (t.osa === "y") {
        tahlSe.current = true;
        if (karta.current) karta.current.style.willChange = "transform";
      }
    }
    if (t.osa !== "y") return;

    t.posun = dy < 0 ? dy * DOLU_ODPOR : dy;
    vzorkuj(t, performance.now());
    kresli(t.posun);
  }

  function naPusteni() {
    const t = tah.current;
    tah.current = null;
    if (!t || t.osa !== "y") return konec();

    const v = rychlost(t);
    const dost = t.posun > DOLU_ZAVRIT || (v > CUKNUTI && t.posun > CUKNUTI_DRAHA);
    if (!dost) {
      kresli(0, "vraci");
      cekani.current = window.setTimeout(() => kresli(null), NAVRAT);
      return;
    }

    // karta dopadne pod spodní hranu a teprve pak se detail odklidí – mizet
    // uprostřed gesta vypadá jako chyba, ne jako zavření
    odchazi.current = true;
    const vrch = karta.current?.getBoundingClientRect().top ?? 0;
    kresli(window.innerHeight - vrch + 24, "odchazi");
    if (pozadi.current) {
      pozadi.current.classList.add("odchazi");
      pozadi.current.style.opacity = "0";
    }
    cekani.current = window.setTimeout(() => { odchazi.current = false; zavri(); }, DOLU_ODCHOD);
  }

  return {
    /** Patří na kartu, která se má táhnout. */
    obal: {
      onPointerDown: naStisk,
      onPointerMove: naTah,
      onPointerUp: naPusteni,
      onPointerCancel: konec,
    },
    karta,
    /** Ztmavené pozadí za kartou; slábne s ní. */
    pozadi,
    /** Táhlo se? Pak se nesmí brát klik, co po tahu doběhne. */
    tahlSe,
  };
}
