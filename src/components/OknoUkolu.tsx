import { useState } from "react";
import { KATEGORIE, OBTIZNOST } from "../lib/data";
import { vazat } from "../lib/format";
import { pridejNovyUkol, smazUkol, ukolPodleId, upravUkol } from "../lib/stav";
import { Ikona } from "./Ikona";
import { Okno } from "./Okno";
import { potvrdit } from "./Potvrzeni";

interface Props {
  /** Bez id se zakládá nový úkol. */
  id?: string;
  /** Kategorie, do které nový úkol spadne. */
  kat?: string;
  zavri: () => void;
}

/** Formulář úkolu. Jde do něj jen v režimu správce, ať někdo uprostřed hry
 *  omylem nepřepíše zadání. */
export function OknoUkolu({ id, kat, zavri }: Props) {
  const novy = !id;
  const u = id ? ukolPodleId(id) : undefined;
  const [nazev, setNazev] = useState(u?.nazev ?? "");
  const [popis, setPopis] = useState(u?.popis ?? "");
  const [kategorie, setKategorie] = useState(u?.kat ?? kat ?? KATEGORIE[0].id);
  const [piva, setPiva] = useState<1 | 2 | 3>(u?.piva ?? 1);
  const [max, setMax] = useState(String(u?.max ?? 1));

  if (!novy && !u) return null;

  function uloz() {
    const data = { nazev, popis, kat: kategorie, piva, max: parseInt(max, 10) || 1 };
    if (novy) pridejNovyUkol(data);
    else upravUkol(id!, data);
    zavri();
  }

  async function smaz() {
    if (!(await potvrdit("Smazat úkol?", "Čárky, co za něj party mají, zmizí taky.", "Smazat úkol"))) return;
    smazUkol(id!);
    zavri();
  }

  return (
    <Okno nadpis={novy ? "Nový úkol" : "Upravit úkol"} zavri={zavri}>
      <label className="pole">
        <span className="nazev">Název</span>
        <input type="text" value={nazev} onChange={(e) => setNazev(e.target.value)} maxLength={80}
          placeholder="Hádka o čárku" autoComplete="off" />
      </label>
      <label className="pole">
        <span className="nazev">Zadání</span>
        <textarea value={popis} onChange={(e) => setPopis(e.target.value)} maxLength={400}
          placeholder="Co se musí udělat" />
      </label>
      <label className="pole">
        <span className="nazev">Kategorie</span>
        <select value={kategorie} onChange={(e) => setKategorie(e.target.value)}>
          {KATEGORIE.map((k) => <option key={k.id} value={k.id}>{k.nazev}</option>)}
        </select>
      </label>
      <div className="pole">
        <span className="nazev">Obtížnost</span>
        <div className="volba-ob">
          {OBTIZNOST.map((o) => (
            <button key={o.piva} className={`v${o.piva}`} aria-pressed={o.piva === piva}
              onClick={() => setPiva(o.piva)}>
              <span className="piva">
                {Array.from({ length: o.piva }, (_, i) => <Ikona key={i} jmeno="piva" px={14} />)}
              </span>
              {o.nazev}
            </button>
          ))}
        </div>
      </div>
      <label className="pole">
        <span className="nazev">Kolikrát to jde splnit</span>
        <input type="text" inputMode="numeric" value={max} onChange={(e) => setMax(e.target.value)}
          maxLength={2} autoComplete="off" />
        <span className="poznamka" style={{ padding: 0 }}>
          {vazat("Jednou = úkol hodí tolik čárek, jaká je obtížnost. Víckrát = čárka za každý kus.")}
        </span>
      </label>
      <div className="okno-akce">
        <button className="tl hlavni" onClick={uloz}><Ikona jmeno="check" px={19} /> Hotovo</button>
        {!novy && <button className="tl nebezpecne" onClick={smaz}><Ikona jmeno="i-kos" px={18} /> Smazat úkol</button>}
        <button className="tl tise" onClick={zavri}>Zpátky</button>
      </div>
    </Okno>
  );
}
