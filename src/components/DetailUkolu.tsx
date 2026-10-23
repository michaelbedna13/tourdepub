import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Kategorie, Ukol } from "../lib/data";
import { sklonuj, vazat } from "../lib/format";
import { odmena } from "../lib/odmena";
import { jdePridat, kolikrat, pridejUkol, tipNaStaci, tym, uberUkol } from "../lib/stav";
import { useSvihDolu } from "../lib/svih";
import { Ikona } from "./Ikona";
import { Kresba } from "./Kresba";
import { KRESBY } from "../lib/kresby";
import { Obtiznost } from "./Obtiznost";

interface Props {
  u: Ukol;
  k: Kategorie;
  zavri: () => void;
  /** Ťuknutím se otevře úprava – jen v režimu správce. */
  uprav?: () => void;
}

/** Detail úkolu. Není to stránka ani plachta přes celou obrazovku — je to
 *  ta samá karta, jen větší, a zbytek galerie se za ní rozostří. Ťuknutí
 *  vedle kartu zavře.
 *
 *  Skladba je stejná jako na dlaždici, jen v klidu: nahoře kresba, pod ní
 *  jméno a text. Výška je daná, ne odvozená z délky popisu — karta s dvěma
 *  větami a karta s pěti pak nevypadají jako dva různé druhy okna a kresba
 *  má vždycky stejné místo.
 *
 *  Text se nescrolluje, ale listuje po stránkách: u dlouhého popisu se
 *  v hospodě posouvá hůř, než se ťuká, a půlka věty useknutá okrajem
 *  vypadá jako chyba. Kolik stránek to má, se zjistí z výšky textu —
 *  dělit to ručně by znamenalo hlídat to u každého úkolu zvlášť. */
export function DetailUkolu({ u, k, zavri, uprav }: Props) {
  const t = tym();
  const kolik = kolikrat(u.id, t);
  const opakovatelny = u.max > 1;
  const splneno = kolik > 0 && (opakovatelny ? kolik >= u.max : true);

  // Zavřít jde křížkem, ťuknutím vedle, Escapem – a švihem dolů, protože
  // na křížek v pravém horním rohu se jednou rukou nedosáhne.
  const dolu = useSvihDolu(zavri);

  const okno = useRef<HTMLDivElement>(null);
  const text = useRef<HTMLDivElement>(null);
  const [stran, setStran] = useState(1);
  const [kde, setKde] = useState(0);

  // kolik stránek text zabere; měří se po vykreslení a znovu při změně velikosti
  useLayoutEffect(() => {
    const spocti = () => {
      const e = text.current;
      if (!e) return;
      const vyska = e.clientHeight || 1;
      setStran(Math.max(1, Math.ceil(e.scrollHeight / vyska)));
    };
    spocti();
    window.addEventListener("resize", spocti);
    return () => window.removeEventListener("resize", spocti);
  }, [u.id]);

  useEffect(() => {
    const klavesa = (e: KeyboardEvent) => { if (e.key === "Escape") zavri(); };
    window.addEventListener("keydown", klavesa);
    okno.current?.focus();
    return () => window.removeEventListener("keydown", klavesa);
  }, [zavri]);

  const odznaky = [
    tipNaStaci(u),
    u.exkluzivni ? "V jedné špeluňce jen jedna parta" : null,
    u.jednouZaHospodu && t?.hospoda && t.zlodej[t.hospoda] ? "Z týhle špeluňky už máte" : null,
  ].filter(Boolean) as string[];

  /** Kartu drží dva: okno kvůli focusu a Escapu, švih kvůli posunu. */
  function spojRefy(e: HTMLDivElement | null) {
    okno.current = e;
    dolu.karta.current = e;
  }

  function prepni() {
    if (kolik > 0 && !opakovatelny) uberUkol(u);
    else if (pridejUkol(u)) odmena("+" + u.body);
  }

  // Portál do <body>, ne na místo v galerii. `position:fixed` se drží okna
  // jen do chvíle, než si kterýkoli předek vytvoří vlastní rámec (transform,
  // will-change, filter) – a obrazovka ho má: přijíždí animací a při švihu
  // se jí posouvá styl. Plachta pak jede s posunutou stránkou, vrch zmizí
  // nad horní hranou a dole zpod ní čouhá galerie. Takhle na předcích
  // nezáleží, stejně jako u Okna.
  return createPortal(
    <div className="detail" onClick={zavri} role="presentation" ref={dolu.pozadi}>
      <div className={`detail-karta${splneno ? " splneno" : ""}`} ref={spojRefy} tabIndex={-1}
        role="dialog" aria-label={u.nazev}
        style={{ "--kat": k.barva,
                 ...(splneno ? { background: k.barva, color: k.naBarve } : {}) } as React.CSSProperties}
        onClick={(e) => e.stopPropagation()} {...dolu.obal}>

        {/* Zavřít jde i ťuknutím vedle, Escapem a švihem dolů; křížek je tu
            pro ty, co gesto nezkusí, proto je tichý a drží se v koutě. */}
        <button className="ikonove holy detail-zavri" onClick={zavri} aria-label="Zavřít">
          <Ikona jmeno="plus" px={15} trida="otocit-kriz" />
        </button>

        {/* Kresba nahoře vlevo, ovládání vpravo — jako datum na kartě,
            jen místo něj to, co se s úkolem dá udělat. */}
        <div className="detail-vrch">
          <div className="detail-obraz">
            {KRESBY[u.id]
              ? <Kresba id={u.id} trida="detail-kresba" />
              : <Ikona jmeno={u.ikona ?? k.ikona} px={104} trida="detail-kresba" />}
          </div>

          {opakovatelny ? (
            <div className="pocitadlo detail-pocitadlo">
              <button onClick={() => uberUkol(u)} disabled={kolik <= 0} aria-label={`Ubrat ${u.nazev}`}>
                <Ikona jmeno="minus" px={14} />
              </button>
              <span className="kolik cislo">{kolik}/{u.max}</span>
              <button onClick={() => { if (pridejUkol(u)) odmena("+" + u.body); }}
                disabled={!jdePridat(u, t)} aria-label={`Přidat ${u.nazev}`}>
                <Ikona jmeno="plus" px={14} />
              </button>
            </div>
          ) : (
            <button className={`detail-check${splneno ? " hotovo" : ""}`} onClick={prepni}
              aria-pressed={splneno} aria-label={`Splněno: ${u.nazev}`}>
              <Ikona jmeno="check" px={22} />
            </button>
          )}
        </div>

        {/* Všechen text drží dole, jako na kartě z plakátu. */}
        <div className="detail-text">
          <h2 className="detail-nazev">{vazat(u.nazev)}</h2>

          <div className="detail-telo" ref={text}
            onClick={() => { if (!dolu.tahlSe.current && stran > 1) setKde((x) => (x + 1) % stran); }}>
            <div className="detail-posuv" style={{ transform: `translateY(${-kde * 100}%)` }}>
              {u.popis && <p className="detail-popis">{vazat(u.popis)}</p>}
              {u.pozn && <p className="detail-pozn">{vazat(u.pozn)}</p>}
              {odznaky.length > 0 && (
                <div className="detail-odznaky">
                  {odznaky.map((o) => <span key={o} className="odznak">{vazat(o)}</span>)}
                </div>
              )}
            </div>
          </div>

          <div className="detail-pata">
            <Obtiznost piva={u.piva} />
            <span className="detail-zaco cislo">
              {opakovatelny ? `+${u.body} za kus, až ${u.body * u.max}`
                            : `+${u.body} ${sklonuj(u.body)}`}
            </span>
            {uprav && (
              <button className="ikonove holy detail-tuzka" aria-label={`Upravit ${u.nazev}`} onClick={uprav}>
                <Ikona jmeno="i-tuzka" px={15} />
              </button>
            )}
            {/* Decentní šipka: popis se listuje ťuknutím, tohle jen říká, že je kam. */}
            {stran > 1 && (
              <span className="detail-dal" role="img" aria-label={`Stránka ${kde + 1} z ${stran}`}>
                <Ikona jmeno="i-zpet" px={14} trida="otocit" />
              </span>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
