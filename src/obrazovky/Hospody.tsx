import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Hlava } from "../components/Hlava";
import { Ikona } from "../components/Ikona";
import { Okno } from "../components/Okno";
import { BARVY_HOSPOD } from "../lib/data";
import { potvrdit } from "../components/Potvrzeni";
import {
  nastavHospodu, pridejHospodu, posunHospoduVPoradi, smazHospodu, stav, tym,
  upravHospodu, useStav, volnaBarvaHospody,
} from "../lib/stav";
import { vazat } from "../lib/format";
import { useSpravce } from "../lib/spravce";

/** Trasa večera. Pořadí určuje, kolikátá je která štace – a podle čísel štací
 *  se píšou i omezení úkolů („jen mezi 3. a 4. štací“). */
export function Hospody() {
  useStav();
  const spravce = useSpravce();
  const kam = useNavigate();
  const [okno, setOkno] = useState<{ id?: string } | null>(null);
  const t = tym();

  return (
    <>
      <Hlava nadpis="Hospody" />
      <p className="podnadpis">
        {vazat(spravce ? "Pořadí určuje trasu. Šipkami se přehazuje." : "Ťukni na hospodu, ať se tam tým přesune.")}
      </p>

      <div className="vrstva radky">
        {stav.hospody.map((h, i) => (
          <div key={h.id} className={`radek${h.id === t?.hospoda ? " ted" : ""}`}>
            <div className="poradi-cislo cislo">{i + 1}</div>
            <button className="radek-telo" onClick={() => { nastavHospodu(h.id); kam("/"); }}>
              <div className="radek-nazev">{h.nazev}</div>
              {h.id === t?.hospoda
                ? <div className="radek-pod">Tady jste teď</div>
                : t?.prichod[h.id] ? <div className="radek-pod">Máte odsud čárku</div> : null}
            </button>
            {spravce && (
              <div className="radek-vpravo">
                <button className="ikonove holy" onClick={() => posunHospoduVPoradi(h.id, -1)}
                  disabled={i === 0} aria-label={`Posunout ${h.nazev} nahoru`}>
                  <Ikona jmeno="i-nahoru" px={15} />
                </button>
                <button className="ikonove holy" onClick={() => posunHospoduVPoradi(h.id, 1)}
                  disabled={i === stav.hospody.length - 1} aria-label={`Posunout ${h.nazev} dolů`}>
                  <Ikona jmeno="i-dolu" px={15} />
                </button>
                <button className="ikonove holy" onClick={() => setOkno({ id: h.id })}
                  aria-label={`Upravit ${h.nazev}`}>
                  <Ikona jmeno="i-tuzka" px={16} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {spravce && (
        <div className="sekce">
          <button className="tl" onClick={() => setOkno({})}><Ikona jmeno="plus" px={18} /> Přidat hospodu</button>
        </div>
      )}

      {okno && <OknoHospody id={okno.id} zavri={() => setOkno(null)} />}
    </>
  );
}

function OknoHospody({ id, zavri }: { id?: string; zavri: () => void }) {
  const nova = !id;
  const h = id ? stav.hospody.find((x) => x.id === id) : undefined;
  const [nazev, setNazev] = useState(h?.nazev ?? "");
  const [barva, setBarva] = useState(h?.barva ?? volnaBarvaHospody());

  if (!nova && !h) return null;

  function uloz() {
    if (nova) pridejHospodu(nazev, barva);
    else upravHospodu(id!, nazev, barva);
    zavri();
  }

  async function smaz() {
    if (!(await potvrdit("Smazat hospodu?", "Čárky, co z ní party mají, zmizí taky.", "Smazat hospodu"))) return;
    smazHospodu(id!);
    zavri();
  }

  return (
    <Okno nadpis={nova ? "Nová hospoda" : "Upravit hospodu"} zavri={zavri}>
      <label className="pole">
        <span className="nazev">Název</span>
        <input type="text" value={nazev} onChange={(e) => setNazev(e.target.value)} maxLength={60}
          placeholder="U Ričího" autoComplete="off" enterKeyHint="done"
          onKeyDown={(e) => { if (e.key === "Enter") uloz(); }} />
      </label>
      <div className="pole">
        <span className="nazev">Barva štace</span>
        <span className="barvy">
          {BARVY_HOSPOD.map((b) => (
            <button key={b} style={{ background: b }} aria-pressed={b === barva}
              aria-label={`Barva ${b}`} onClick={() => setBarva(b)} />
          ))}
        </span>
      </div>
      <div className="okno-akce">
        <button className="tl hlavni" onClick={uloz}><Ikona jmeno="check" px={19} /> Hotovo</button>
        {!nova && stav.hospody.length > 1 && (
          <button className="tl nebezpecne" onClick={smaz}><Ikona jmeno="i-kos" px={18} /> Smazat hospodu</button>
        )}
        <button className="tl tise" onClick={zavri}>Zpátky</button>
      </div>
    </Okno>
  );
}
