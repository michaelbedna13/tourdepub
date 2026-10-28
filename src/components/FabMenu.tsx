import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { JmenoIkony } from "../lib/ikony";
import { useRozmazanePozadi } from "../lib/vrstvy";
import { Ikona } from "./Ikona";

export interface AkceFabu {
  /** Co se stane. Vrátí false, když se nestalo nic (nemá co zapsat). */
  udelej: () => void;
  popis: string;
  ikona: JmenoIkony;
  /** Nedá se teď použít — zůstane v nabídce, ale zešedne (viz HIG: položku
   *  nemazat, jen zhasnout, ať nabídka nemění tvar). */
  nejde?: boolean;
}

/** Kulaté tlačítko v pravém dolním rohu, co se rozbalí do nabídky akcí.
 *
 *  Je to FAB menu z Material 3 (nahradilo starý „speed dial"): dva až šest
 *  příbuzných úkonů, co visí nad tlačítkem, každý s ikonou a jménem, a samo
 *  tlačítko se při otevření překlopí na křížek.
 *
 *  Patří do něj AKCE, ne obrazovky — od chození po appce je rozcestník dole.
 *  Tyhle čtyři se dělají každou štaci a dělaly se jedině na Hře: kdo zrovna
 *  četl úkoly, musel se vracet. Odsud jdou odkudkoli.
 *
 *  Dole vpravo, ne nahoře: ťuká se do něj jednou rukou se škopkem v druhé
 *  a nabídka se rozbaluje nahoru, takže si prst nestíní to, co vybírá. */
export function FabMenu({ akce }: { akce: AkceFabu[] }) {
  const [otevreno, setOtevreno] = useState(false);

  // Celé to visí na <body>, ne uvnitř .app. Appka má vlastní vrstvení
  // (position:relative, z-index 1), takže cokoli uvnitř — i s z-indexem 99 —
  // zůstane pod plachtou, co se kreslí nad ní. Tlačítko by se při otevření
  // ztmavilo vlastní nabídkou.
  return createPortal(
    <>
      <button type="button"
        className={`fab${otevreno ? " otevreno" : ""}`}
        aria-expanded={otevreno}
        aria-label={otevreno ? "Zavřít nabídku" : "Rychlý zápis"}
        onClick={() => setOtevreno((x) => !x)}>
        {/* Jedna kresba pro obojí: plus se otočením o 45° stane křížkem,
            takže se tvar opravdu přelije, nepřebliknou dvě ikony. */}
        <Ikona jmeno="plus" px={26} trida="fab-znak" />
      </button>

      {otevreno && <Nabidka akce={akce} zavri={() => setOtevreno(false)} />}
    </>,
    document.body,
  );
}

function Nabidka({ akce, zavri }: { akce: AkceFabu[]; zavri: () => void }) {
  // Pozadí se rozmaže a rozcestník dole odejde — to samé, co dělá detail
  // úkolu. Nabídka nad ostrou appkou by byla jen další vrstva lístečků.
  useRozmazanePozadi();
  const zavrit = useRef(zavri);
  zavrit.current = zavri;

  useEffect(() => {
    const klavesa = (e: KeyboardEvent) => { if (e.key === "Escape") zavrit.current(); };
    window.addEventListener("keydown", klavesa);
    return () => window.removeEventListener("keydown", klavesa);
  }, []);

  return (
    <div className="fab-plachta" onClick={zavri}>
      <div className="fab-nabidka" role="menu" onClick={(e) => e.stopPropagation()}>
        {akce.map((a, i) => (
          <button key={a.popis} type="button" role="menuitem"
            className="fab-radek" disabled={a.nejde}
            /* Položky nenaskočí naráz, ale jedna po druhé odspoda — oko
               stihne přečíst, co přibylo. Zpoždění drží pořadí v nabídce. */
            style={{ animationDelay: `${(akce.length - 1 - i) * 45}ms` }}
            onClick={() => { a.udelej(); zavri(); }}>
            <Ikona jmeno={a.ikona} px={19} />
            <span>{a.popis}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
