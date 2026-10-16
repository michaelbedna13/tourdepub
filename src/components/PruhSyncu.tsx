import { vazat } from "../lib/format";
import { useSync, zkusZnovu } from "../lib/sync";
import { Ikona } from "./Ikona";

interface Props {
  /** Na Týmech se hlásí i to, že živé pořadí běží. Jinde by to bylo kafrání. */
  podrobne?: boolean;
}

const sklonujParty = (n: number) => (n === 1 ? "partu" : n < 5 ? "party" : "part");

/** Pruh o tom, jestli se skóre sdílí. Rozlišuje tři stavy, protože „tváříme se
 *  připojeně, ale nic se neposílá“ je ten nejhorší, co může nastat. */
export function PruhSyncu({ podrobne = false }: Props) {
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

  if (s.rezim === "zivo" && podrobne)
    return (
      <div className="rezim zivy"><Ikona jmeno="check" px={16} />
        <span>{vazat(`Živé pořadí běží${s.pocet
          ? `, vidíš ${s.pocet} ${sklonujParty(s.pocet)} z jinejch telefonů`
          : " – zatím nikdo jinej nepřipojenej"}.`)}</span></div>
    );

  return null;
}
