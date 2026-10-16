import { memo, useId } from "react";
import { IKONY, type JmenoIkony } from "../lib/ikony";

interface Props {
  jmeno: JmenoIkony;
  /** Velikost v px. */
  px?: number;
  trida?: string;
  /** Popisek pro čtečku. Bez něj je ikona pro čtečku nevidět (dekorace). */
  popis?: string;
}

/** Ikona jako vystřižená z papíru: plocha v barvě textu, výstřižky jsou
 *  průhledné a prosvítá jimi podklad. */
export const Ikona = memo(function Ikona({ jmeno, px = 22, trida, popis }: Props) {
  // useId vrací dvojtečky, které v url(#…) nefungují všude
  const id = `ik${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const vrstvy = IKONY[jmeno];
  return (
    <svg
      className={["ikona", trida].filter(Boolean).join(" ")}
      width={px}
      height={px}
      viewBox="0 0 100 100"
      role={popis ? "img" : undefined}
      aria-label={popis}
      aria-hidden={popis ? undefined : true}
    >
      <mask id={id} maskUnits="userSpaceOnUse" x="-10" y="-10" width="120" height="120">
        {vrstvy.map(([druh, d], i) => (
          <path key={i} d={d} fill={druh === "i" ? "#FFFFFF" : "#000000"} />
        ))}
      </mask>
      <rect x="-10" y="-10" width="120" height="120" fill="currentColor" mask={`url(#${id})`} />
    </svg>
  );
});
