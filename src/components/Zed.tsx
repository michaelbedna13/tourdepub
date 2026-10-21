import { body, tym, useStav } from "../lib/stav";

/** Zeď hospody: čárky, co parta urvala, leží za celou appkou.
 *
 *  Není to tapeta na efekt — je jich tam přesně tolik, kolik jich máte, takže
 *  se pozadí za večer samo zaplní. Nová čárka se dokreslí ve chvíli, kdy ji
 *  zapíšete: na obrazovce vyletí „+1“ a na zdi vzadu přibude tah.
 *
 *  Nic tu neběží dokola. Animace je jen u čárek, co zrovna přibyly, takže
 *  appka může svítit celý večer a nic nežere. */

/** Mřížka, do které se skupinky kladou: čtyři sloupce, pak další řádek. */
const SLOUPCU = 4;
/** Víc už je šum, ne zeď. Vejde se tam celý večer i s rezervou. */
const NEJVIC_SKUPIN = 20;

/** Pevná „náhodnost“ podle pořadí — zeď musí po překreslení vypadat stejně. */
const sum = (i: number, k: number) => ((Math.sin(i * 12.9898 + k * 78.233) * 43758.5453) % 1 + 1) % 1;

const ROZESTUP = 8;

/** Jedna skupinka: `n` svislých tahů, u plné pětice ještě pátý napříč.
 *  Kreslí se stejně jako čárky u skóre, jen větší a slabší. */
function Skupina({ n, prect, i }: { n: number; prect: boolean; i: number }) {
  const sirka = n * ROZESTUP + (prect ? 9 : 0) + 4;
  const tahy: string[] = [];
  for (let j = 0; j < n; j++) {
    const x = 4 + j * ROZESTUP;
    const sklon = ((j * 7919) % 5) - 2;
    tahy.push(`M${x + sklon} 4 L${x - sklon} ${34 - ((j * 104729) % 4)}`);
  }
  if (prect) tahy.push(`M1 29 L${n * ROZESTUP + 8} 6`);

  const sloupec = i % SLOUPCU;
  const radek = Math.floor(i / SLOUPCU);
  return (
    <svg
      className="zed-skupina"
      viewBox={`0 0 ${sirka} 38`}
      fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round"
      style={{
        // první řádek až pod lištou: čárky těsně za nadpisem vypadaly jako šmouha
        left: `${5 + sloupec * 23 + sum(i, 1) * 7}%`,
        top: `${15 + radek * 17 + sum(i, 2) * 6}%`,
        height: `${54 + sum(i, 3) * 26}px`,
        rotate: `${(sum(i, 4) - 0.5) * 14}deg`,
      }}
    >
      {/* klíč podle pořadí tahu: existující se při přibytí dalšího nepřekreslí,
          takže se dokresluje opravdu jen ta nová čárka */}
      {tahy.map((d, j) => <path key={j} d={d} />)}
    </svg>
  );
}

export function Zed() {
  useStav();
  const kolik = Math.min(body(tym()), NEJVIC_SKUPIN * 5);
  const plnych = Math.floor(kolik / 5);
  const zbytek = kolik % 5;

  return (
    <div className="zed" aria-hidden="true">
      {Array.from({ length: plnych }, (_, i) => <Skupina key={i} i={i} n={4} prect />)}
      {zbytek > 0 && <Skupina key={plnych} i={plnych} n={zbytek} prect={false} />}
    </div>
  );
}
