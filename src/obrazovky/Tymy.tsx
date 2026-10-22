import { useState } from "react";
import { Hlava } from "../components/Hlava";
import { Ikona } from "../components/Ikona";
import { OknoTymu } from "../components/OknoTymu";
import { PruhSyncu } from "../components/PruhSyncu";
import { Uctenka } from "../components/Uctenka";
import { vazat } from "../lib/format";
import { poradiTymu, prepniTym, stav, strop, useStav } from "../lib/stav";

/** Kdo jak stojí. Ťuknutím se přepne, za koho se na tomhle telefonu zapisuje —
 *  jeden telefon klidně zapisuje všem partám. */
export function Tymy() {
  useStav();
  const [uprava, setUprava] = useState<string | null>(null);
  const [novy, setNovy] = useState(false);
  const poradi = poradiTymu();
  const s = strop();

  return (
    <>
      <Hlava nadpis="Týmy" />
      <p className="podnadpis">{vazat("Ťukni na tým, za který chceš zapisovat.")}</p>
      <PruhSyncu podrobne />

      <Uctenka
        poradi={poradi}
        tymId={stav.tymId}
        hospod={stav.hospody.length}
        ukolu={stav.ukoly.length}
        strop={s.celkem}
        prepni={prepniTym}
        uprav={setUprava}
      />

      <div className="sekce">
        <button className="tl" onClick={() => setNovy(true)}><Ikona jmeno="plus" px={18} /> Přidat tým</button>
      </div>

      {novy && <OknoTymu zavri={() => setNovy(false)} />}
      {uprava && <OknoTymu id={uprava} zavri={() => setUprava(null)} />}
    </>
  );
}
