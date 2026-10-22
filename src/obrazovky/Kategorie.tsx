import { useState } from "react";
import { useParams } from "react-router-dom";
import { Hlava } from "../components/Hlava";
import { Ikona } from "../components/Ikona";
import { OknoUkolu } from "../components/OknoUkolu";
import { DetailUkolu } from "../components/DetailUkolu";
import { KartaUkolu } from "../components/KartaUkolu";
import { KATEGORIE } from "../lib/data";
import { sklonuj, vazat } from "../lib/format";
import { kolikrat, stav, tym, ukolPodleId, useStav } from "../lib/stav";
import { useSpravce } from "../lib/spravce";

/** Úkoly jedné kategorie jako galerie dlaždic. Dřív to byl seznam, ve kterém
 *  měl každý úkol celý popis — osm úkolů dělalo přes dvě obrazovky textu
 *  a nedalo se přehlédnout, co kategorie vlastně nabízí. Na dlaždici jsou
 *  jen půllitry a jméno, zbytek je v detailu.
 *
 *  Barva kategorie vybarvuje splněné dlaždice. Nepřibyl tím žádný význam
 *  navíc: je to ta samá barva, co kategorii nese přes celou appku. */
export function Kategorie() {
  useStav();
  const spravce = useSpravce();
  const { kat } = useParams();
  const [uprava, setUprava] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
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
        <div className="ukol-galerie">
          {vse.map((u) => <KartaUkolu key={u.id} u={u} k={k} otevri={() => setDetail(u.id)} />)}
        </div>
      ) : (
        <div className="prazdno"><Ikona jmeno="hvezda" px={40} /><p>{vazat("V týhle kategorii zatím nic není.")}</p></div>
      )}

      {spravce && (
        <div className="sekce">
          <button className="tl" onClick={() => setNovy(true)}><Ikona jmeno="plus" px={18} /> Přidat úkol</button>
        </div>
      )}

      {detail && ukolPodleId(detail) && (
        <DetailUkolu u={ukolPodleId(detail)!} k={k} zavri={() => setDetail(null)}
          uprav={spravce ? () => { setUprava(detail); setDetail(null); } : undefined} />
      )}

      {novy && <OknoUkolu kat={k.id} zavri={() => setNovy(false)} />}
      {uprava && ukolPodleId(uprava) && <OknoUkolu id={uprava} zavri={() => setUprava(null)} />}
    </>
  );
}
