import { sklonuj } from "../lib/format";

interface Props {
  kolik: number;
  /** Výška jedné skupinky v px. */
  vyska?: number;
}

const ROZESTUP = 8;

/** Jedna skupinka: `n` svislých čárek, u plné pětice ještě pátá napříč.
 *  Každá je jinak nakloněná a jinak dlouhá, ať to vypadá psané rukou. */
function skupina(n: number, prect: boolean, vyska: number, klic: number) {
  const w = n * ROZESTUP + (prect ? 9 : 0) + 4;
  const dratky: string[] = [];
  for (let i = 0; i < n; i++) {
    const x = 4 + i * ROZESTUP;
    const sklon = ((i * 7919) % 5) - 2;
    const delta = (i * 104729) % 4;
    dratky.push(`M${x + sklon} 4 L${x - sklon} ${34 - delta}`);
  }
  if (prect) dratky.push(`M1 29 L${n * ROZESTUP + 8} 6`);
  return (
    <svg key={klic} width={(w / 38) * vyska} height={vyska} viewBox={`0 0 ${w} 38`} fill="none"
      stroke="currentColor" strokeWidth={3.4} strokeLinecap="round">
      {dratky.map((d, i) => <path key={i} d={d} />)}
    </svg>
  );
}

/** Čárky, jak se počítaly v hospodě: čtyři svislé a pátá přes ně. */
export function Carky({ kolik, vyska = 26 }: Props) {
  if (kolik <= 0) return <span className="znacka-text">zatím nic</span>;
  const skupin = Math.floor(kolik / 5);
  const zbytek = kolik % 5;
  return (
    <span className="carky" role="img" aria-label={`${kolik} ${sklonuj(kolik)}`}>
      {Array.from({ length: skupin }, (_, i) => skupina(4, true, vyska, i))}
      {zbytek > 0 && skupina(zbytek, false, vyska, skupin)}
    </span>
  );
}
