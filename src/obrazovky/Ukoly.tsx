import { useState } from "react";
import { Link } from "react-router-dom";
import { Hlava } from "../components/Hlava";
import { Ikona } from "../components/Ikona";
import { OknoUkolu } from "../components/OknoUkolu";
import { KATEGORIE } from "../lib/data";
import { sklonuj, sklonujUkol, vazat } from "../lib/format";
import { jdePridat, kolikrat, rozpad, stav, tym, useStav } from "../lib/stav";
import { useSpravce } from "../lib/spravce";

/** Rozcestí úkolů: tři kategorie jako barevné karty. Sjet jeden seznam
 *  dvaceti tří úkolů na mobilu nešlo, tohle se vejde na obrazovku celé. */
export function Ukoly() {
  useStav();
  const spravce = useSpravce();
  const [novy, setNovy] = useState(false);
  const t = tym();
  const r = rozpad();

  return (
    <>
      <Hlava nadpis="Úkoly" />
      <p className="podnadpis cislo">
        Splněno {r.splneno} z {stav.ukoly.length} · {r.ukoly} {sklonuj(r.ukoly)} za srandy
      </p>

      <div className="kat-karty">
        {KATEGORIE.map((k) => {
          const vse = stav.ukoly.filter((u) => u.kat === k.id);
          const hotovo = vse.filter((u) => kolikrat(u.id, t) > 0).length;
          const naDosah = t ? vse.filter((u) => jdePridat(u, t)).length : 0;
          return (
            <Link key={k.id} to={`/ukoly/${k.id}`} className="kat-karta" style={{ background: k.barva, color: k.naBarve }}>
              <Ikona jmeno={k.ikona} px={116} trida="kat-vodoznak" />
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

      {spravce && (
        <div className="sekce">
          <button className="tl" onClick={() => setNovy(true)}><Ikona jmeno="plus" px={18} /> Přidat úkol</button>
        </div>
      )}
      {novy && <OknoUkolu zavri={() => setNovy(false)} />}
    </>
  );
}
