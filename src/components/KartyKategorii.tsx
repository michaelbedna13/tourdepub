import { Link } from "react-router-dom";
import { KATEGORIE } from "../lib/data";
import { sklonujUkol, vazat } from "../lib/format";
import { jdePridat, kolikrat, stav, tym, useStav } from "../lib/stav";
import { Ikona } from "./Ikona";

/** Tři kategorie jako barevné karty. Stojí na Úkolech i na Hře, takže je to
 *  jedna komponenta — jinak by se dvě kopie dřív nebo později rozešly.
 *
 *  Na Hře jsou nižší (`male`): tam jsou až pod skóre a za celou obrazovkou,
 *  takže si nemůžou vzít tolik místa jako na obrazovce, kde jsou hlavní věc. */
export function KartyKategorii({ male = false }: { male?: boolean }) {
  useStav();
  const t = tym();

  return (
    <div className="kat-karty">
      {KATEGORIE.map((k) => {
        const vse = stav.ukoly.filter((u) => u.kat === k.id);
        const hotovo = vse.filter((u) => kolikrat(u.id, t) > 0).length;
        const naDosah = t ? vse.filter((u) => jdePridat(u, t)).length : 0;
        return (
          <Link key={k.id} to={`/ukoly/${k.id}`} className={`kat-karta${male ? " mala" : ""}`}
            style={{ background: k.karta }}>
            <Ikona jmeno={k.ikona} px={male ? 92 : 116} trida="kat-vodoznak" />
            <div className="kat-vrch">
              <span className="kat-pocet cislo">{hotovo}/{vse.length}</span>
              <Ikona jmeno="i-zpet" px={15} trida="otocit kat-sipka" />
            </div>
            <h2 className="kat-nazev">{vazat(k.nazev)}</h2>
            <span className="kat-pod cislo">
              {naDosah ? `${naDosah} ${sklonujUkol(naDosah)} na dosah` : "tady už nic nezbývá"}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
