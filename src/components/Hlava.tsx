import { useState } from "react";
import { Link } from "react-router-dom";
import { body, prepniTym, stav, tym, useStav } from "../lib/stav";
import { Ikona } from "./Ikona";
import { Logo } from "./Logo";
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

/** Horní lišta: vlevo značka, vpravo za koho se zapisuje. Nadpis obrazovky
 *  stojí pod ní, na vlastní řádce.
 *
 *  Dřív byl nadpis v liště a značka nikde — jenže pak se v jedné řádce tlačily
 *  tři věci a na značku nezbylo místo. Takhle je to ten samý zámek jako
 *  v úvodu (značka vlevo, drobnost vpravo) a nadpis má celou šířku pro sebe,
 *  takže může být větší.
 *
 *  Na podstránce je místo značky kolečko zpátky: dvě věci vlevo by se zase
 *  praly a cesta ven je tam potřebnější než logo. */
export function Hlava({ nadpis, drobne, zpet }: Props) {
  useStav();
  const [okno, setOkno] = useState<"zadne" | "prepinac" | "novy">("zadne");
  const t = tym();

  return (
    <>
      <div className="hlava">
        {zpet ? (
          <Link className="ikonove" to={zpet} aria-label="Zpátky na úkoly">
            <Ikona jmeno="i-zpet" px={16} />
          </Link>
        ) : (
          /* Značka je zároveň cesta domů. Na Hře nikam nevede, ale je to to
             první, kam člověk ťukne, když se chce vrátit — a nestojí to nic. */
          <Link className="hlava-znak-odkaz" to="/" aria-label="Tour de Pub, zpátky na Hru">
            <Logo trida="hlava-znak" />
          </Link>
        )}
        <span className="hlava-vypln" />
        <button className="prepinac-tymu" onClick={() => setOkno("prepinac")} aria-label="Přepnout tým">
          <b>{t?.nazev || "Bez týmu"}</b>
          <Ikona jmeno="i-dolu" px={13} />
        </button>
      </div>

      {(nadpis || drobne) && (
        <div className="hlava-text">
          {drobne && <div className="hlava-drobne cislo">{drobne}</div>}
          {nadpis && <h1>{nadpis}</h1>}
        </div>
      )}

      {okno === "prepinac" && (
        <Okno nadpis="Za koho zapisuju" pod="Ťukni na tým. Můžeš zapisovat komukoliv." zavri={() => setOkno("zadne")}>
          <div className="vrstva radky" style={{ marginBottom: 12 }}>
            {stav.tymy.map((x) => (
              <button key={x.id} className="radek" onClick={() => { prepniTym(x.id); setOkno("zadne"); }}>
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
