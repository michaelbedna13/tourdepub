import { vazat } from "../lib/format";
import type { Bod } from "../lib/pravidla";

/** Jedno pravidlo na plakátu úvodu: popisek, věta, případně tichý dovětek.
 *  Obrazovka Pravidel si je sází po svém (popisek nad větou, hodnoty do
 *  sloupce) — na plakátu je na to málo místa, tak se to vejde do řádky.
 *
 *  Zvýrazňování kusů věty tudy kdysi taky chodilo. Šlo pryč: tučné slovo
 *  uprostřed odstavce nic nezdůrazní, jen to vypadá jako text z Wordu. */
export function Pravidlo({ bod }: { bod: Bod }) {
  const { stitek, text, strop } = bod;
  return (
    <>
      {stitek && <b>{vazat(stitek)}</b>}
      {stitek && " "}
      {vazat(text)}
      {strop && <span className="pravidlo-strop">{vazat(strop)}</span>}
    </>
  );
}
