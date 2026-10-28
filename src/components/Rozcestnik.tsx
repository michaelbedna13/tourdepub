import { useLocation, useNavigate } from "react-router-dom";
import type { JmenoIkony } from "../lib/ikony";
import { Ikona } from "./Ikona";

const POLOZKY: { kam: string; popis: string; ikona: JmenoIkony; sedi: (cesta: string) => boolean }[] = [
  { kam: "/", popis: "Hra", ikona: "i-domu", sedi: (c) => c === "/" },
  // obrazovka jedné kategorie patří pod Úkoly
  { kam: "/ukoly", popis: "Úkoly", ikona: "hvezda", sedi: (c) => c.startsWith("/ukoly") },
  // Jména se drží nadpisů obrazovek, ne hantecu z úkolů: v rozcestníku musí
  // sedět slovo, které člověk uvidí hned po ťuknutí.
  { kam: "/tymy", popis: "Týmy", ikona: "trofej", sedi: (c) => c.startsWith("/tymy") },
  { kam: "/hospody", popis: "Hospody", ikona: "hospoda", sedi: (c) => c.startsWith("/hospody") },
  { kam: "/pravidla", popis: "Pravidla", ikona: "i-pravidla", sedi: (c) => c.startsWith("/pravidla") },
];

/** Plovoucí rozcestník dole. Pět obrazovek appky, pořád na očích.
 *
 *  Předtím to byl hamburger v pravém horním rohu a rozcestí, co vyjelo
 *  zespodu. Dvě ťuknutí na každý přechod, a to první v tom nejhorším kusu
 *  obrazovky, jaký palec má — v hospodě se appka drží jednou rukou, v té
 *  druhé je škopek. Tady jsou všechny terče rovnou v dosahu palce a je
 *  z nich vidět, kde člověk zrovna je.
 *
 *  Pět je přesně na hraně toho, co se do lišty vejde (Apple doporučuje tři
 *  až pět), ale všech pět se používá celý večer: zapisuje se na Hře, úkoly
 *  se čtou v Úkolech, pořadí se kouká v Partách. Nic z toho není podstránka
 *  něčeho jiného, tak nemá co být schované.
 *
 *  Plave nad obsahem, nelepí se na spodní hranu: appka je papírová a tohle
 *  je lísteček položený přes ni, ne systémová lišta. Proto má taky obrys
 *  stříhaný nůžkama jako karty. */
export function Rozcestnik() {
  const { pathname } = useLocation();
  const kam = useNavigate();

  function jdi(cesta: string) {
    // Ťuknutí na obrazovku, na které už jsem, vyjede nahoru. Je to to samé,
    // co dělá iOS, a na dlouhé galerii úkolů to ušetří půl minuty tahání.
    if (cesta !== pathname) kam(cesta);
    else window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <nav className="rozcestnik" aria-label="Rozcestník">
      <div className="rozcestnik-pas">
        {POLOZKY.map((p) => {
          const ted = p.sedi(pathname);
          return (
            <button key={p.kam} type="button"
              className={`rozcestnik-tl${ted ? " ted" : ""}`}
              aria-current={ted ? "page" : undefined}
              onClick={() => jdi(p.kam)}>
              <Ikona jmeno={p.ikona} px={20} />
              <span className="rozcestnik-popis">{p.popis}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
