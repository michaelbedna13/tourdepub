import { vazat } from "../lib/format";
import { useSync, zkusZnovu } from "../lib/sync";
import { Ikona } from "./Ikona";

/** Pruh o tom, že se skóre NEsdílí: bez serveru, offline nebo chyba.
 *  Když všechno běží, mlčí. Na Týmech dřív hlásil „Živé pořadí běží,
 *  vidíš 2 party z jinejch telefonů“; Mišákovi to překáželo, a navíc to
 *  počítalo všechny týmy na serveru, i ten vlastní. */
export function PruhSyncu() {
  const s = useSync();

  if (s.rezim === "ukazka")
    return (
      <div className="rezim"><Ikona jmeno="zamek" px={16} />
        <span>{vazat("Zapisuje se jen do tohohle telefonu. Jak zapnout živé pořadí, je v README.")}</span></div>
    );

  if (s.rezim === "chyba" && s.offline)
    return (
      <div className="rezim"><Ikona jmeno="zamek" px={16} />
        <span>{vazat("Jsi offline. Zapisuje se do telefonu a pošle se to, až bude signál.")}</span></div>
    );

  if (s.rezim === "chyba")
    return (
      <div className="rezim chybny"><Ikona jmeno="zamek" px={16} />
        <span>{vazat("Živé pořadí se nepřipojilo, hra běží dál jen z telefonu.")}
          {s.chyba && <><br /><span className="drobne">{vazat(s.chyba)}</span></>}
          <br /><button className="tl maly" style={{ marginTop: 9 }} onClick={() => zkusZnovu()}>Zkusit znovu</button>
        </span></div>
    );

  return null;
}
