import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import type { JmenoIkony } from "../lib/ikony";
import { useRozmazanePozadi } from "../lib/vrstvy";
import { Ikona } from "./Ikona";

const POLOZKY: { kam: string; popis: string; ikona: JmenoIkony; sedi: (cesta: string) => boolean }[] = [
  { kam: "/", popis: "Hra", ikona: "i-domu", sedi: (c) => c === "/" },
  // obrazovka jedné kategorie patří pod Úkoly
  { kam: "/ukoly", popis: "Úkoly", ikona: "hvezda", sedi: (c) => c.startsWith("/ukoly") },
  // Jména se drží nadpisů obrazovek, ne hantecu z úkolů: musí sedět slovo,
  // které se objeví hned po ťuknutí.
  { kam: "/tymy", popis: "Týmy", ikona: "trofej", sedi: (c) => c.startsWith("/tymy") },
  { kam: "/hospody", popis: "Hospody", ikona: "hospoda", sedi: (c) => c.startsWith("/hospody") },
  { kam: "/pravidla", popis: "Pravidla", ikona: "i-pravidla", sedi: (c) => c.startsWith("/pravidla") },
];

/** Rozcestník jako FAB menu: kulaté tlačítko v pravém dolním rohu, co se
 *  rozbalí do pěti obrazovek appky.
 *
 *  Je to FAB menu z Material 3 (nahradilo starý „speed dial"): nabídka visí
 *  nad tlačítkem, každá položka má ikonu a jméno a samo tlačítko se při
 *  otevření překlopí na křížek.
 *
 *  Dole vpravo, ne nahoře. Hamburger stával v pravém HORNÍM rohu, tedy
 *  v tom nejhorším kusu obrazovky, jaký palec má — v hospodě se appka drží
 *  jednou rukou a v druhé je škopek. Nabídka se rozbaluje nahoru, takže si
 *  prst nestíní to, co vybírá.
 *
 *  Pět položek je v rozsahu, co komponenta snese (dva až šest), a žádná
 *  z nich není podstránka něčeho jiného, tak nemá co být schovaná hlouběji. */
export function FabMenu() {
  const [otevreno, setOtevreno] = useState(false);

  // Celé to visí na <body>, ne uvnitř .app. Appka má vlastní vrstvení
  // (position:relative, z-index 1), takže cokoli uvnitř — i s z-indexem 99 —
  // zůstane pod plachtou, co se kreslí nad ní. Tlačítko by se při otevření
  // ztmavilo vlastní nabídkou.
  return createPortal(
    <>
      <button type="button"
        className={`fab${otevreno ? " otevreno" : ""}`}
        aria-expanded={otevreno} aria-haspopup="menu"
        aria-label={otevreno ? "Zavřít rozcestník" : "Rozcestník"}
        onClick={() => setOtevreno((x) => !x)}>
        {/* Dvě kresby přes sebe, prolnou se. Otáčet plus na křížek šlo jednou
            kresbou, jenže zavřené tlačítko musí říct „nabídka", ne „přidat". */}
        <Ikona jmeno="i-menu" px={24} trida="fab-znak fab-znak-menu" />
        <Ikona jmeno="plus" px={26} trida="fab-znak fab-znak-krizek" />
      </button>

      {otevreno && <Nabidka zavri={() => setOtevreno(false)} />}
    </>,
    document.body,
  );
}

function Nabidka({ zavri }: { zavri: () => void }) {
  // Pozadí se rozmaže — to samé, co dělá detail úkolu. Nabídka nad ostrou
  // appkou by byla jen další vrstva lístečků.
  useRozmazanePozadi();
  const { pathname } = useLocation();
  const kam = useNavigate();
  const zavrit = useRef(zavri);
  zavrit.current = zavri;

  useEffect(() => {
    const klavesa = (e: KeyboardEvent) => { if (e.key === "Escape") zavrit.current(); };
    window.addEventListener("keydown", klavesa);
    return () => window.removeEventListener("keydown", klavesa);
  }, []);

  function jdi(cesta: string) {
    zavri();
    // Ťuknutí na obrazovku, na které už jsem, vyjede nahoru. Je to to samé,
    // co dělá iOS, a na dlouhé galerii úkolů to ušetří půl minuty tahání.
    if (cesta !== pathname) kam(cesta);
    else window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="fab-plachta" onClick={zavri}>
      <div className="fab-nabidka" role="menu" onClick={(e) => e.stopPropagation()}>
        {POLOZKY.map((p, i) => {
          const ted = p.sedi(pathname);
          return (
            <button key={p.kam} type="button" role="menuitem"
              className={`fab-radek${ted ? " ted" : ""}`}
              aria-current={ted ? "page" : undefined}
              /* Položky nenaskočí naráz, ale jedna po druhé odspoda — oko
                 stihne přečíst, co přibylo. Zpoždění drží pořadí v nabídce. */
              style={{ animationDelay: `${(POLOZKY.length - 1 - i) * 40}ms` }}
              onClick={() => jdi(p.kam)}>
              <Ikona jmeno={p.ikona} px={19} />
              <span>{p.popis}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
