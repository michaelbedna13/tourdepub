import { useId } from "react";
import { KRESBY } from "../lib/kresby";
import { LADENI_KRESEB } from "../lib/kresby-ladeni";
import { UKOL_KRESBY } from "../lib/ukol-kresby";

/** Má úkol vlastní kresbu? Volající podle toho sáhne po ikoně kategorie. */
export function maKresbu(id: string): boolean {
  return !!KRESBY[id] || id in UKOL_KRESBY;
}

/** Kresba úkolu, pokud k němu nějaká je. Vrací null, když není — volající
 *  pak sáhne po ikoně kategorie. Kreslí se barvou textu stejně jako ikony,
 *  takže funguje na vybarvené i nevybarvené kartě.
 *
 *  Dva zdroje, a to v tomhle pořadí: nejdřív kresba **obtažená od ruky**
 *  (kresby.ts, jedna dráha z obrázku), teprve pak **kreslená** (ukol-kresby.ts,
 *  vrstvy jako u ikon). Od ruky je vždycky lepší, tak ať ji nic nepřebije.
 *
 *  Velikost a posun si každá kresba může doladit (LADENI_KRESEB): čtvercový
 *  rámeček sedí jedné, ale štíhlá postava se v něm ztratí. */
export function Kresba({ id, trida }: { id: string; trida?: string }) {
  // useId vrací dvojtečky, které v url(#…) nefungují všude
  const maska = `kr${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const obtazena = KRESBY[id];
  const vrstvy = UKOL_KRESBY[id as keyof typeof UKOL_KRESBY];
  if (!obtazena && !vrstvy) return null;

  const l = LADENI_KRESEB[id];
  const styl = l && {
    "--kr-zvet": l.zvetseni ?? 1,
    "--kr-x": `${l.x ?? 0}%`,
    "--kr-y": `${l.y ?? 0}%`,
  } as React.CSSProperties;
  const spolecne = {
    className: ["ikona", "kresba", trida].filter(Boolean).join(" "),
    viewBox: "0 0 100 100",
    "aria-hidden": true as const,
    style: styl,
  };

  if (obtazena) {
    return <svg {...spolecne} fill="currentColor" fillRule="evenodd"><path d={obtazena} /></svg>;
  }
  // Vrstvená kresba se kreslí maskou, aby výstřižky byly opravdu průhledné
  // a prosvítala jimi barva karty — stejně jako u ikon.
  return (
    <svg {...spolecne}>
      <mask id={maska} maskUnits="userSpaceOnUse" x="-10" y="-10" width="120" height="120">
        {vrstvy.map(([druh, d], i) => (
          <path key={i} d={d} fill={druh === "i" ? "#FFFFFF" : "#000000"} />
        ))}
      </mask>
      <rect x="-10" y="-10" width="120" height="120" fill="currentColor" mask={`url(#${maska})`} />
    </svg>
  );
}
