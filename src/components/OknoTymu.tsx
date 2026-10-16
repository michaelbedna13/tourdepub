import { useState } from "react";
import { BARVY, pridejTym, prepniTym, smazTym, stav, upravTym } from "../lib/stav";
import { smazTymZeServeru } from "../lib/sync";
import { Ikona } from "./Ikona";
import { Okno } from "./Okno";
import { potvrdit } from "./Potvrzeni";

interface Props {
  /** Bez id se zakládá nový tým. */
  id?: string;
  zavri: () => void;
}

/** Formulář týmu: jméno a barva. Tým jde upravovat z každého telefonu,
 *  protože se na server posílá celý jeho stav, ne jen výsledek. */
export function OknoTymu({ id, zavri }: Props) {
  const novy = !id;
  const t = id ? stav.tymy.find((x) => x.id === id) : undefined;
  const [nazev, setNazev] = useState(t?.nazev ?? "");
  const [barva, setBarva] = useState(t?.barva ?? BARVY[stav.tymy.length % BARVY.length]);

  if (!novy && !t) return null;

  function uloz() {
    const jmeno = nazev.trim().slice(0, 40);
    if (novy) prepniTym(pridejTym(jmeno || "Nová parta", barva).id);
    else upravTym(id!, { nazev: jmeno || "Bez názvu", barva });
    zavri();
  }

  async function smaz() {
    if (!(await potvrdit("Smazat tým?", "Zmizí i s čárkami, co má nasbírané. Tohle se nedá vrátit.", "Smazat tým"))) return;
    smazTym(id!);
    smazTymZeServeru(id!); // ať nezůstane viset ostatním v pořadí
    zavri();
  }

  return (
    <Okno nadpis={novy ? "Nový tým" : "Upravit tým"} pod="Jméno uvidí ostatní party v pořadí." zavri={zavri}>
      <label className="pole">
        <span className="nazev">Jak si říkáte</span>
        <input type="text" value={nazev} onChange={(e) => setNazev(e.target.value)} maxLength={40}
          placeholder="Borci ze Štatlu" autoComplete="off" enterKeyHint="done"
          onKeyDown={(e) => { if (e.key === "Enter") uloz(); }} />
      </label>
      <div className="pole">
        <span className="nazev">Barva</span>
        <span className="barvy">
          {BARVY.map((b) => (
            <button key={b} style={{ background: b }} aria-pressed={b === barva}
              aria-label={`Barva ${b}`} onClick={() => setBarva(b)} />
          ))}
        </span>
      </div>
      <div className="okno-akce">
        <button className="tl hlavni" onClick={uloz}><Ikona jmeno="check" px={19} /> Hotovo</button>
        {!novy && stav.tymy.length > 1 && (
          <button className="tl nebezpecne" onClick={smaz}><Ikona jmeno="i-kos" px={18} /> Smazat tým</button>
        )}
        <button className="tl tise" onClick={zavri}>Zpátky</button>
      </div>
    </Okno>
  );
}
