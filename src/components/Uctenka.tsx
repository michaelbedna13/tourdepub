import { Carky } from "./Carky";
import { Ikona } from "./Ikona";
import { sklonuj, sklonujUkol, vazat } from "../lib/format";
import { RAZITKO } from "../lib/razitko";
import type { Rozpad } from "../lib/stav";

interface Parta {
  id: string;
  nazev: string;
  barva: string;
  body: number;
  rozpad: Rozpad;
}

interface Props {
  poradi: Parta[];
  /** Za koho se na tomhle telefonu zapisuje. */
  tymId: string | null;
  hospod: number;
  ukolu: number;
  strop: number;
  prepni: (id: string) => void;
  /** Bez toho se tužka nekreslí – na Hře se party neupravují. */
  uprav?: (id: string) => void;
}

/** Jedna položka účtenky: popis, tečky a číslo vpravo. */
function Polozka({ nazev, kolik }: { nazev: string; kolik: number }) {
  return (
    <div className="uc-polozka">
      <span>{nazev}</span>
      <span className="uc-tecky" />
      <span className="uc-kus cislo">{kolik}</span>
    </div>
  );
}

/** Pořadí part jako účtenka z hospody.
 *
 *  Rozpad čárek (za špeluňky, za škopky, za srandy) stával u skóre na Hře,
 *  kde se nedal s nikým srovnat. Tady má smysl: party jsou pod sebou a je
 *  vidět, kdo nahrál kde. A účtenka je jediná tabulka, co v hospodě nikoho
 *  nepřekvapí — proto vypadá jako účtenka, ne jako tabulka z appky. */
export function Uctenka({ poradi, tymId, hospod, ukolu, strop, prepni, uprav }: Props) {
  const muj = poradi.find((p) => p.id === tymId);
  return (
    <div className="uctenka">
      <div className="uc-hlava">
        <div className="uc-znacka">TOUR DE PUB</div>
        <div className="uc-pod">
          Brno · {hospod} {hospod === 1 ? "špeluňka" : hospod < 5 ? "špeluňky" : "špeluněk"}
          {" · "}{ukolu} {sklonujUkol(ukolu)}
        </div>
      </div>
      <div className="uc-cara tlusta" />

      {poradi.map((p, i) => (
        <div key={p.id} className="uc-parta">
          {/* Razítko až od první čárky – na začátku večera nikdo nevede. */}
          {i === 0 && p.body > 0 && (
            <div className="uc-razitko" aria-hidden="true">
              <svg viewBox="0 0 172 60"><path d={RAZITKO} fillRule="evenodd" /></svg>
              <span>VEDE</span>
            </div>
          )}
          <div className="uc-nazev">
            <button className="uc-jmeno" onClick={() => prepni(p.id)}>
              <span className="uc-poradi cislo">#{i + 1}</span>
              <span className="uc-znak" style={{ background: p.barva }} />
              <span className="uc-text">{p.nazev}</span>
            </button>
            {uprav && (
              <button className="uc-tuzka" onClick={() => uprav(p.id)} aria-label={`Upravit ${p.nazev}`}>
                <Ikona jmeno="i-tuzka" px={15} />
              </button>
            )}
          </div>
          <Polozka nazev="špeluňky" kolik={p.rozpad.dochazka} />
          <Polozka nazev="škopky" kolik={p.rozpad.skopky} />
          <Polozka nazev="srandy" kolik={p.rozpad.ukoly} />
          <div className="uc-soucet">
            <span>čárek</span>
            <span className="uc-tecky" />
            <span className="uc-kus cislo">{p.body}</span>
          </div>
          {i < poradi.length - 1 && <div className="uc-cara" />}
        </div>
      ))}

      <div className="uc-cara tlusta" />
      <div className="uc-paticka">
        {/* Čárkový kód: skutečné čárky party, za kterou zapisuješ. */}
        {muj && muj.body > 0 && <div className="uc-carky"><Carky kolik={muj.body} vyska={18} /></div>}
        <div className="uc-dik">{vazat(`Dá se urvat nejvíc ${strop} ${sklonuj(strop)}`)}</div>
      </div>
    </div>
  );
}
