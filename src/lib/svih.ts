// Švih do boku mezi obrazovkami.
//
// Nepoužívá scroll-snap pás se všemi obrazovkami vedle sebe: obrazovky si drží
// svůj posun a svůj stav a vykreslovat je všechny naráz by znamenalo pět kopií
// seznamů v paměti. Místo toho se táhne jen ta současná a po puštění se
// překlopí adresa; nová přijede z druhé strany.
import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/** Odkud musí být jasné, že jde o švih do boku, ne o posun stránky. */
const PRAH = 12;
/** Jak moc musí být švih vodorovnější než svislý, aby se chytil. */
const POMER = 1.5;
/** Kolik se musí utáhnout, aby se obrazovka přehodila. */
const PREKLOPIT = 64;
/** Za kraji seznamu se táhne ztuha, ať je poznat, že dál nic není. */
const ODPOR = 0.28;

export type Smer = "vlevo" | "vpravo" | null;

export function useSvih(poradi: string[]) {
  const { pathname } = useLocation();
  const kam = useNavigate();
  const [posun, setPosun] = useState(0);
  const [tahne, setTahne] = useState(false);
  const zacatek = useRef<{ x: number; y: number; osa: null | "x" | "y" } | null>(null);
  const prichod = useRef<Smer>(null);

  const kde = poradi.indexOf(pathname);

  function konec() {
    zacatek.current = null;
    setTahne(false);
    setPosun(0);
  }

  function naStisk(e: ReactPointerEvent) {
    if (kde < 0 || e.pointerType === "mouse") return;
    // vodorovné pásy uvnitř obrazovky (hero karty) si švih řeší samy
    if ((e.target as Element).closest?.("[data-vodorovne]")) return;
    zacatek.current = { x: e.clientX, y: e.clientY, osa: null };
  }

  function naTah(e: ReactPointerEvent) {
    const z = zacatek.current;
    if (!z) return;
    const dx = e.clientX - z.x;
    const dy = e.clientY - z.y;

    if (!z.osa) {
      if (Math.abs(dx) < PRAH && Math.abs(dy) < PRAH) return;
      // jakmile se jednou rozhodne, že se jede svisle, švih se už nechytí –
      // jinak by šikmý tah hýbal obrazovkou i při obyčejném scrollování
      z.osa = Math.abs(dx) > Math.abs(dy) * POMER ? "x" : "y";
      if (z.osa === "x") setTahne(true);
    }
    if (z.osa !== "x") return;

    const zaKrajem = (dx > 0 && kde === 0) || (dx < 0 && kde === poradi.length - 1);
    setPosun(zaKrajem ? dx * ODPOR : dx);
  }

  function naPusteni() {
    const z = zacatek.current;
    if (!z || z.osa !== "x") return konec();
    const dalsi = posun < -PREKLOPIT ? kde + 1 : posun > PREKLOPIT ? kde - 1 : kde;
    if (dalsi !== kde && poradi[dalsi]) {
      prichod.current = dalsi > kde ? "vlevo" : "vpravo";
      kam(poradi[dalsi]);
    }
    konec();
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
    styl: posun
      ? { transform: `translate3d(${Math.round(posun)}px,0,0)`, transition: tahne ? "none" : undefined }
      : undefined,
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

/** Švih dolů, kterým se zavírá karta vytažená přes obrazovku.
 *
 *  Karta pod prstem jede s ním a po puštění se buď vrátí, nebo zmizí.
 *  `tahlSe` je pro ťukání uvnitř karty: po tahu nesmí doběhnout klik,
 *  jinak by se detailu při každém zavření ještě přelistoval text. */
export function useSvihDolu(zavri: () => void) {
  const [posun, setPosun] = useState(0);
  const [tahne, setTahne] = useState(false);
  const [dotkl, setDotkl] = useState(false);
  const zacatek = useRef<{ x: number; y: number; osa: null | "x" | "y" } | null>(null);
  const tahlSe = useRef(false);

  function konec() {
    zacatek.current = null;
    setTahne(false);
    setPosun(0);
  }

  function naStisk(e: ReactPointerEvent) {
    if (e.pointerType === "mouse") return;
    tahlSe.current = false;
    zacatek.current = { x: e.clientX, y: e.clientY, osa: null };
  }

  function naTah(e: ReactPointerEvent) {
    const z = zacatek.current;
    if (!z) return;
    const dx = e.clientX - z.x;
    const dy = e.clientY - z.y;

    if (!z.osa) {
      if (Math.abs(dx) < DOLU_PRAH && Math.abs(dy) < DOLU_PRAH) return;
      z.osa = Math.abs(dy) > Math.abs(dx) * DOLU_POMER ? "y" : "x";
      if (z.osa === "y") { setTahne(true); setDotkl(true); tahlSe.current = true; }
    }
    if (z.osa !== "y") return;

    setPosun(dy < 0 ? dy * DOLU_ODPOR : dy);
  }

  function naPusteni() {
    const z = zacatek.current;
    if (z?.osa === "y" && posun > DOLU_ZAVRIT) { zavri(); return; }
    konec();
  }

  return {
    /** Patří na kartu, která se má táhnout. */
    obal: {
      onPointerDown: naStisk,
      onPointerMove: naTah,
      onPointerUp: naPusteni,
      onPointerCancel: konec,
    },
    styl: dotkl
      ? { transform: `translate3d(0,${Math.round(posun)}px,0)`,
          transition: tahne ? "none" : "transform .22s var(--krok)" }
      : undefined,
    /** Táhlo se? Pak se nesmí brát klik, co po tahu doběhne. */
    tahlSe,
  };
}
