import { vazat } from "../lib/format";
import type { Bod } from "../lib/pravidla";

/** Jedno pravidlo: tučný štítek, text a v něm případně zvýrazněný kus.
 *  Kreslí ho obrazovka Pravidel i úvod, aby obojí vypadalo stejně. */
export function Pravidlo({ bod }: { bod: Bod }) {
  const { stitek, text, duraz } = bod;
  const i = duraz ? text.indexOf(duraz) : -1;
  return (
    <>
      {stitek && <b>{vazat(stitek)}:</b>}
      {stitek && " "}
      {i < 0
        ? vazat(text)
        : <>{vazat(text.slice(0, i))}<b>{vazat(duraz!)}</b>{vazat(text.slice(i + duraz!.length))}</>}
    </>
  );
}
