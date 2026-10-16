import { useState } from "react";
import { Hlava } from "../components/Hlava";
import { Ikona } from "../components/Ikona";
import { OknoTymu } from "../components/OknoTymu";
import { PruhSyncu } from "../components/PruhSyncu";
import { sklonuj, sklonujUkol, vazat } from "../lib/format";
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
      <p className="podnadpis psane">{vazat("Ťukni na tým, za který chceš zapisovat.")}</p>
      <PruhSyncu podrobne />

      <div className="vrstva radky">
        {poradi.map((p, i) => (
          <div key={p.id} className={`radek${i === 0 && p.body > 0 ? " vede" : ""}${p.id === stav.tymId ? " ja" : ""}`}>
            <div className="poradi-cislo cislo">{i + 1}</div>
            <button className="radek-telo" onClick={() => prepniTym(p.id)}>
              <div className="radek-nazev">
                <span className="tecka" style={{ background: p.barva }} />
                {p.nazev}
                {p.id === stav.tymId && <span className="odznak duraz">zapisuju</span>}
              </div>
              <div className="radek-pod cislo">
                {p.rozpad.splneno} {sklonujUkol(p.rozpad.splneno)} ·{" "}
                {p.rozpad.makacky} {p.rozpad.makacky === 1 ? "makačka" : "makaček"} · štace {p.hospoda}
              </div>
            </button>
            <div className="radek-body cislo">{p.body}</div>
            <button className="ikonove holy" onClick={() => setUprava(p.id)} aria-label={`Upravit ${p.nazev}`}>
              <Ikona jmeno="i-tuzka" px={16} />
            </button>
          </div>
        ))}
      </div>

      <div className="sekce">
        <button className="tl" onClick={() => setNovy(true)}><Ikona jmeno="plus" px={18} /> Přidat tým</button>
      </div>

      <div className="sekce">
        <div className="vrstva prodyseny">
          <h3 style={{ marginBottom: 10 }}>Kolik se dá urvat</h3>
          <p className="skore-popis cislo">{s.hospody} za špeluňky · {s.hospody} za škopky · {s.ukoly} za srandy</p>
          <p className="psane" style={{ marginTop: 10, fontSize: 15, color: "var(--text-2)" }}>
            Dohromady nejvíc <b className="cislo strop-cislo">{s.celkem}</b> {sklonuj(s.celkem)}
          </p>
        </div>
      </div>

      {novy && <OknoTymu zavri={() => setNovy(false)} />}
      {uprava && <OknoTymu id={uprava} zavri={() => setUprava(null)} />}
    </>
  );
}
