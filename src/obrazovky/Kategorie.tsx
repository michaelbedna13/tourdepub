import { useState } from "react";
import { useParams } from "react-router-dom";
import { Hlava } from "../components/Hlava";
import { Ikona } from "../components/Ikona";
import { OknoUkolu } from "../components/OknoUkolu";
import { RadekUkolu } from "../components/RadekUkolu";
import { KATEGORIE } from "../lib/data";
import { sklonuj, vazat } from "../lib/format";
import { kolikrat, stav, tym, ukolPodleId, useStav } from "../lib/stav";
import { useSpravce } from "../lib/spravce";

/** Úkoly jedné kategorie. Barva kategorie je tu jen jako čára nad nadpisem –
 *  v seznamu nesou význam barvy obtížnosti a dvě barevné soustavy vedle sebe
 *  by se pletly. */
export function Kategorie() {
  useStav();
  const spravce = useSpravce();
  const { kat } = useParams();
  const [uprava, setUprava] = useState<string | null>(null);
  const [novy, setNovy] = useState(false);
  const k = KATEGORIE.find((x) => x.id === kat);
  const t = tym();

  if (!k) return (
    <>
      <Hlava nadpis="Úkoly" zpet="/ukoly" />
      <div className="prazdno"><Ikona jmeno="hvezda" px={40} /><p>Tahle kategorie tu není.</p></div>
    </>
  );

  const vse = stav.ukoly.filter((u) => u.kat === k.id);
  const hotovo = vse.filter((u) => kolikrat(u.id, t) > 0).length;
  const zaNe = vse.reduce((s, u) => s + Math.min(kolikrat(u.id, t), u.max) * u.body, 0);

  return (
    <>
      <Hlava nadpis="Úkoly" zpet="/ukoly" />
      <div className="kat-hlavicka">
        <div className="kat-cara" style={{ background: k.barva }} />
        <h1>{vazat(k.nazev)}</h1>
      </div>
      <p className="podnadpis cislo">Splněno {hotovo} z {vse.length} · {zaNe} {sklonuj(zaNe)}</p>

      {vse.length ? (
        <div className="vrstva radky">
          {vse.map((u) => (
            <RadekUkolu key={u.id} u={u} uprav={spravce ? () => setUprava(u.id) : undefined} />
          ))}
        </div>
      ) : (
        <div className="prazdno"><Ikona jmeno="hvezda" px={40} /><p>{vazat("V týhle kategorii zatím nic není.")}</p></div>
      )}

      {spravce && (
        <div className="sekce">
          <button className="tl" onClick={() => setNovy(true)}><Ikona jmeno="plus" px={18} /> Přidat úkol</button>
        </div>
      )}

      {novy && <OknoUkolu kat={k.id} zavri={() => setNovy(false)} />}
      {uprava && ukolPodleId(uprava) && <OknoUkolu id={uprava} zavri={() => setUprava(null)} />}
    </>
  );
}
