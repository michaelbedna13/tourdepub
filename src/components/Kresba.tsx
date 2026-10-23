import { KRESBY } from "../lib/kresby";
import { LADENI_KRESEB } from "../lib/kresby-ladeni";

/** Kresba úkolu, pokud k němu nějaká je. Vrací null, když není — volající
 *  pak sáhne po ikoně kategorie. Kreslí se barvou textu stejně jako ikony,
 *  takže funguje na vybarvené i nevybarvené kartě.
 *
 *  Velikost a posun si každá kresba může doladit (LADENI_KRESEB): čtvercový
 *  rámeček sedí jedné, ale štíhlá postava se v něm ztratí. */
export function Kresba({ id, trida }: { id: string; trida?: string }) {
  const d = KRESBY[id];
  if (!d) return null;
  const l = LADENI_KRESEB[id];
  return (
    <svg className={["ikona", "kresba", trida].filter(Boolean).join(" ")} viewBox="0 0 100 100"
      fill="currentColor" fillRule="evenodd" aria-hidden="true"
      style={l && {
        "--kr-zvet": l.zvetseni ?? 1,
        "--kr-x": `${l.x ?? 0}%`,
        "--kr-y": `${l.y ?? 0}%`,
      } as React.CSSProperties}>
      <path d={d} />
    </svg>
  );
}
