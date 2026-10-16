// Úvod po každém spuštění: logo, pak krátká průprava. Vždycky jde přeskočit.
//
// Logo nekreslí React, ale rovnou index.html (#uvod). Dokud se stáhne a spustí
// skript, je už vidět – a navazuje na obrázek, který iPhone ukazuje při spuštění
// z plochy. React nad ním drží jen tlačítko Přeskočit a pak ho odklidí.
import { useEffect, useRef, useState } from "react";
import { vazat } from "../lib/format";
import type { JmenoIkony } from "../lib/ikony";
import { Ikona } from "./Ikona";

/** Jak dlouho se ukazuje jedna stránka průpravy, než se přehodí sama. */
const NA_STRANKU = 2400;
/** Nejmíň takhle dlouho zůstane logo, ať to na rychlém telefonu jen neprobleskne. */
const LOGO_NEJMIN = 1100;
/** Kdyby se logo nenačetlo vůbec, nečeká se na něj věčně. */
const LOGO_NEJVIC = 1800;

interface Stranka {
  ikona: JmenoIkony;
  nadpis: string;
  text: string;
}

const PRUPRAVA: Stranka[] = [
  { ikona: "mista", nadpis: "Devět špeluněk, jedna noc",
    text: "Valí se to od šesti večer do dvou do rána. Na každou štaci je tak 45 minut, courat se nevyplácí." },
  { ikona: "carka", nadpis: "Čárky nejsou za pivo",
    text: "Čárka za každou špeluňku, čárka za škopek — a pak hlavně za srandy. Čím větší haluz, tím víc čárek." },
  { ikona: "koruna", nadpis: "První parta bere všecko",
    text: "Vlezné je kilo na palici a celej bank bere ta parta, co nahrabe nejvíc čárek." },
];

/** Odklidí úvodní obrazovku z index.html. Nechat ji tam by znamenalo
 *  krémové logo přes celou appku. */
function odklidLogo() {
  const el = document.getElementById("uvod");
  if (!el) return;
  el.classList.add("odchazi");
  el.addEventListener("transitionend", () => el.remove(), { once: true });
  setTimeout(() => el.remove(), 900); // kdyby přechod neproběhl
}

export function Uvod({ hotovo }: { hotovo: () => void }) {
  // -1 = ještě svítí logo z index.html
  const [kde, setKde] = useState(-1);
  const svih = useRef<number | null>(null);

  // Logo odejde, až je všechno hotové: stihlo se ukázat, písma jsou načtená
  // (jinak by text průpravy po jejich dotažení přeskočil) a uběhla chvilka
  // od spuštění.
  useEffect(() => {
    let platne = true;
    const obrazek = document.querySelector<HTMLImageElement>("#uvod img");
    const nacteno = !obrazek || obrazek.dataset.nacteno
      ? Promise.resolve()
      : new Promise<void>((h) => {
          obrazek.addEventListener("load", () => h(), { once: true });
          obrazek.addEventListener("error", () => h(), { once: true });
          setTimeout(h, LOGO_NEJVIC);
        });
    const pockej = (ms: number) => new Promise((h) => setTimeout(h, ms));

    Promise.all([
      nacteno,
      pockej(Math.max(0, LOGO_NEJMIN - performance.now())),
      document.fonts?.ready ?? Promise.resolve(),
    ]).then(() => {
      if (!platne) return;
      odklidLogo();
      setKde(0);
    });
    return () => { platne = false; };
  }, []);

  // stránky se přehazují samy; z poslední se vejde do appky
  useEffect(() => {
    if (kde < 0) return;
    const t = setTimeout(() => dal(), NA_STRANKU);
    return () => clearTimeout(t);
  }, [kde]);

  function dal() {
    if (kde + 1 >= PRUPRAVA.length) konec();
    else setKde(kde + 1);
  }

  function konec() {
    odklidLogo(); // při přeskočení ještě svítí
    hotovo();
  }

  const s = PRUPRAVA[Math.max(0, kde)];

  return (
    <div className={`uvod-vrstva${kde < 0 ? " pod-logem" : ""}`} role="dialog" aria-label="Úvod"
      onPointerDown={(e) => { svih.current = e.clientX; }}
      onPointerUp={(e) => {
        const z = svih.current;
        svih.current = null;
        if (z === null || kde < 0) return;
        const dx = e.clientX - z;
        if (dx < -40) dal();
        else if (dx > 40) setKde(Math.max(0, kde - 1));
        else dal(); // ťuknutí kamkoli posune dál, ať se nemusí čekat
      }}
    >
      <button className="uvod-preskocit" onClick={konec}
        onPointerUp={(e) => e.stopPropagation()}>Přeskočit</button>

      {kde >= 0 && (
        <>
          <div className="uvod-stranka" key={kde}>
            <Ikona jmeno={s.ikona} px={96} trida="uvod-ikona" />
            <h1 className="uvod-nadpis">{vazat(s.nadpis)}</h1>
            <p className="uvod-text psane">{vazat(s.text)}</p>
          </div>

          <div className="uvod-spodek">
            <div className="uvod-tecky" role="img" aria-label={`Stránka ${kde + 1} z ${PRUPRAVA.length}`}>
              {PRUPRAVA.map((_, i) => (
                <span key={i} className={`uvod-tecka${i === kde ? " ted" : ""}${i < kde ? " bylo" : ""}`} />
              ))}
            </div>
            {kde + 1 === PRUPRAVA.length && (
              <button className="tl hlavni" onClick={konec} onPointerUp={(e) => e.stopPropagation()}>
                <Ikona jmeno="piva" px={19} /> Jedeme</button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
