import { NavLink, useLocation } from "react-router-dom";
import type { JmenoIkony } from "../lib/ikony";
import { Ikona } from "./Ikona";

const POLOZKY: { kam: string; popis: string; ikona: JmenoIkony; sedi: (cesta: string) => boolean }[] = [
  { kam: "/", popis: "Hra", ikona: "i-domu", sedi: (c) => c === "/" },
  // obrazovka jedné kategorie patří pod Úkoly
  { kam: "/ukoly", popis: "Úkoly", ikona: "hvezda", sedi: (c) => c.startsWith("/ukoly") },
  { kam: "/tymy", popis: "Týmy", ikona: "trofej", sedi: (c) => c.startsWith("/tymy") },
  { kam: "/hospody", popis: "Hospody", ikona: "hospoda", sedi: (c) => c.startsWith("/hospody") },
  { kam: "/pravidla", popis: "Pravidla", ikona: "i-mrizka", sedi: (c) => c.startsWith("/pravidla") },
];

/** Plovoucí pilulka ze skla, ne pruh s ikonami přes celou šířku.
 *  Aktivní položka je světlá pilulka s tmavou ikonou a názvem. */
export function Lista() {
  const { pathname } = useLocation();
  return (
    <div className="lista-obal">
      <nav className="lista" aria-label="Hlavní">
        {POLOZKY.map((p) => {
          const ted = p.sedi(pathname);
          return (
            <NavLink key={p.kam} to={p.kam} className={ted ? "ted" : undefined}
              aria-current={ted ? "page" : undefined} aria-label={p.popis}
              onClick={() => window.scrollTo({ top: 0, behavior: ted ? "smooth" : "auto" })}>
              <Ikona jmeno={p.ikona} px={19} />
              <span className="popis">{p.popis}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
