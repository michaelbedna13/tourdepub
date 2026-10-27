import { useState } from "react";
import { Hlava } from "../components/Hlava";
import { nactiLadeni, ulozLadeni, VYCHOZI, type Ladeni as Nastaveni, type Zrno } from "../lib/ladeni";

/** Skrytá obrazovka na #/ladeni. Není v menu a nikdo na ni nenarazí.
 *  Je tu kvůli jedné věci: zjistit, co v appce na ploše rozmazává horní
 *  lištu. Každý přepínač vypne jednu vrstvu, co by za to mohla. */
export function Ladeni() {
  const [l, setL] = useState<Nastaveni>(nactiLadeni);
  const zmen = (zm: Partial<Nastaveni>) => { const n = { ...l, ...zm }; setL(n); ulozLadeni(n); };

  return (
    <>
      <Hlava nadpis="Ladění" zpet="/pravidla" />
      <p className="podnadpis">
        Přepni jednu věc, vrať se na Hru a zascrolluj. Když je lišta nahoře
        najednou ostrá, máme viníka. Nastavení zůstane i po zavření appky.
      </p>

      <div className="vrstva ladeni-blok">
        <h2>Filmové zrno</h2>
        <p className="ladeni-popis">
          Míchané zrno nutí prohlížeč složit celou stránku do jednoho obrázku,
          aby s ní měl co míchat. Právě takový obrázek iOS při posouvání
          překresluje v nižším rozlišení.
        </p>
        <div className="ladeni-volby">
          {([["micha", "Míchané (teď)"], ["alfa", "Průhledné"], ["ne", "Vypnuté"]] as [Zrno, string][])
            .map(([v, popisek]) => (
              <button key={v} className={`ladeni-volba${l.zrno === v ? " ted" : ""}`}
                onClick={() => zmen({ zrno: v })}>{popisek}</button>
            ))}
        </div>
      </div>

      <div className="vrstva ladeni-blok">
        <h2>Teplá záře</h2>
        <p className="ladeni-popis">Přechod přes celou obrazovku nad obsahem.</p>
        <div className="ladeni-volby">
          <button className={`ladeni-volba${l.zare ? " ted" : ""}`} onClick={() => zmen({ zare: true })}>Zapnutá</button>
          <button className={`ladeni-volba${!l.zare ? " ted" : ""}`} onClick={() => zmen({ zare: false })}>Vypnutá</button>
        </div>
      </div>

      <div className="vrstva ladeni-blok">
        <h2>Pruh přes horní hranu</h2>
        <p className="ladeni-popis">
          Neprůhledný proužek vysoký jako safe-area. Měl zakrýt systémové
          rozostření iOS 26. Vidět je jen v appce z plochy.
        </p>
        <div className="ladeni-volby">
          <button className={`ladeni-volba${l.pruh ? " ted" : ""}`} onClick={() => zmen({ pruh: true })}>Zapnutý</button>
          <button className={`ladeni-volba${!l.pruh ? " ted" : ""}`} onClick={() => zmen({ pruh: false })}>Vypnutý</button>
        </div>
      </div>

      <button className="ladeni-reset" onClick={() => zmen(VYCHOZI)}>Vrátit všechno jak bylo</button>
    </>
  );
}
