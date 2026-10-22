import { useState } from "react";
import { Hlava } from "../components/Hlava";
import { KartyKategorii } from "../components/KartyKategorii";
import { Ikona } from "../components/Ikona";
import { OknoUkolu } from "../components/OknoUkolu";
import { sklonuj } from "../lib/format";
import { rozpad, stav, useStav } from "../lib/stav";
import { useSpravce } from "../lib/spravce";

/** Rozcestí úkolů: tři kategorie jako barevné karty. Sjet jeden seznam
 *  dvaceti tří úkolů na mobilu nešlo, tohle se vejde na obrazovku celé. */
export function Ukoly() {
  useStav();
  const spravce = useSpravce();
  const [novy, setNovy] = useState(false);
  const r = rozpad();

  return (
    <>
      <Hlava nadpis="Úkoly" />
      <p className="podnadpis cislo">
        Splněno {r.splneno} z {stav.ukoly.length} · {r.ukoly} {sklonuj(r.ukoly)} za srandy
      </p>

      <KartyKategorii />

      {spravce && (
        <div className="sekce">
          <button className="tl" onClick={() => setNovy(true)}><Ikona jmeno="plus" px={18} /> Přidat úkol</button>
        </div>
      )}
      {novy && <OknoUkolu zavri={() => setNovy(false)} />}
    </>
  );
}
