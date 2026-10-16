import { useState } from "react";
import { Link } from "react-router-dom";
import { body, prepniTym, stav, tym, useStav } from "../lib/stav";
import { Ikona } from "./Ikona";
import { Okno } from "./Okno";
import { OknoTymu } from "./OknoTymu";

interface Props {
  /** Nadpis obrazovky. Na Hře zůstává prázdný, tam vede název špeluňky. */
  nadpis?: string;
  /** Drobná řádka nad nadpisem. */
  drobne?: string;
  /** Adresa, kam vede kolečko se šipkou vlevo od nadpisu. */
  zpet?: string;
}

/** Horní lišta: vlevo nadpis obrazovky, vpravo za koho se zapisuje.
 *  Logo tu není — pralo se o místo s nadpisem a jeho rozervaný okraj neměl
 *  vedle úhledné pilulky co zarovnat. Značku nese ikona appky,
 *  úvodní obrazovka a patička Pravidel. */
export function Hlava({ nadpis, drobne, zpet }: Props) {
  useStav();
  const [okno, setOkno] = useState<"zadne" | "prepinac" | "novy">("zadne");
  const t = tym();

  return (
    <>
      <div className="hlava">
        {zpet && (
          <Link className="ikonove" to={zpet} aria-label="Zpátky na úkoly">
            <Ikona jmeno="i-zpet" px={16} />
          </Link>
        )}
        <div className="hlava-text">
          {drobne && <div className="hlava-drobne cislo">{drobne}</div>}
          {nadpis && <h1>{nadpis}</h1>}
        </div>
        <button className="prepinac-tymu" onClick={() => setOkno("prepinac")} aria-label="Přepnout tým">
          <span className="tecka" style={{ background: t?.barva }} />
          <b>{t?.nazev || "Bez týmu"}</b>
          <Ikona jmeno="i-dolu" px={13} />
        </button>
      </div>

      {okno === "prepinac" && (
        <Okno nadpis="Za koho zapisuju" pod="Ťukni na tým. Můžeš zapisovat komukoliv." zavri={() => setOkno("zadne")}>
          <div className="vrstva radky" style={{ marginBottom: 12 }}>
            {stav.tymy.map((x) => (
              <button key={x.id} className="radek" onClick={() => { prepniTym(x.id); setOkno("zadne"); }}>
                <span className="tecka" style={{ background: x.barva }} />
                <div className="radek-telo"><div className="radek-nazev">{x.nazev || "Bez názvu"}</div></div>
                <div className="radek-body cislo">{body(x)}</div>
                {x.id === stav.tymId && <Ikona jmeno="check" px={18} />}
              </button>
            ))}
          </div>
          <div className="okno-akce">
            <button className="tl" onClick={() => setOkno("novy")}><Ikona jmeno="plus" px={18} /> Přidat tým</button>
            <button className="tl tise" onClick={() => setOkno("zadne")}>Zpátky</button>
          </div>
        </Okno>
      )}

      {okno === "novy" && <OknoTymu zavri={() => setOkno("zadne")} />}
    </>
  );
}
