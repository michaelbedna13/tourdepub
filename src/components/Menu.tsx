import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { JmenoIkony } from "../lib/ikony";
import { Ikona } from "./Ikona";
import { Okno } from "./Okno";

const POLOZKY: { kam: string; popis: string; ikona: JmenoIkony; sedi: (cesta: string) => boolean }[] = [
  { kam: "/", popis: "Hra", ikona: "i-domu", sedi: (c) => c === "/" },
  // obrazovka jedné kategorie patří pod Úkoly
  { kam: "/ukoly", popis: "Úkoly", ikona: "hvezda", sedi: (c) => c.startsWith("/ukoly") },
  { kam: "/tymy", popis: "Týmy", ikona: "trofej", sedi: (c) => c.startsWith("/tymy") },
  { kam: "/hospody", popis: "Hospody", ikona: "hospoda", sedi: (c) => c.startsWith("/hospody") },
  { kam: "/pravidla", popis: "Pravidla", ikona: "i-mrizka", sedi: (c) => c.startsWith("/pravidla") },
];

/** Hamburger v horní liště a rozcestí pod ním.
 *
 *  Samotné rozcestí vyjíždí zespodu, ne shora od tlačítka: ťuká se do něj
 *  jednou rukou v hospodě a horní roh je pro palec ten nejhorší kus obrazovky.
 *  Tlačítko je nahoře, terče dole. */
export function Menu() {
  const [otevreno, setOtevreno] = useState(false);
  const { pathname } = useLocation();
  const kam = useNavigate();

  function jdi(cesta: string) {
    setOtevreno(false);
    if (cesta !== pathname) kam(cesta);
    else window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <>
      <button className="ikonove menu-tl" onClick={() => setOtevreno(true)}
        aria-label="Menu" aria-expanded={otevreno}>
        <Ikona jmeno="i-menu" px={17} />
      </button>

      {otevreno && (
        <Okno nadpis="Kam dál" zavri={() => setOtevreno(false)}>
          <div className="vrstva radky" style={{ marginBottom: 12 }}>
            {POLOZKY.map((p) => {
              const ted = p.sedi(pathname);
              return (
                <button key={p.kam} className={`radek menu-radek${ted ? " ted" : ""}`}
                  aria-current={ted ? "page" : undefined} onClick={() => jdi(p.kam)}>
                  <Ikona jmeno={p.ikona} px={21} />
                  <div className="radek-telo"><div className="radek-nazev">{p.popis}</div></div>
                  {ted && <Ikona jmeno="check" px={18} />}
                </button>
              );
            })}
          </div>
          <div className="okno-akce">
            <button className="tl tise" onClick={() => setOtevreno(false)}>Zavřít</button>
          </div>
        </Okno>
      )}
    </>
  );
}
