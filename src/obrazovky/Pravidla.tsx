import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Hlava } from "../components/Hlava";
import { Ikona } from "../components/Ikona";
import { Logo } from "../components/Logo";
import { Obtiznost } from "../components/Obtiznost";
import { Okno } from "../components/Okno";
import { potvrdit } from "../components/Potvrzeni";
import { OBTIZNOST } from "../lib/data";
import { sklonuj, vazat } from "../lib/format";
import { nastavSpravce, sediKod, useSpravce } from "../lib/spravce";
import { strop, tym, useStav, vynulujTym } from "../lib/stav";

/** Pravidla a nastavení. Režim správce se zapíná tady, ať se na hlavních
 *  obrazovkách neplete do hry. */
export function Pravidla() {
  useStav();
  const spravce = useSpravce();
  const kam = useNavigate();
  const [okno, setOkno] = useState<"zadne" | "zapnout" | "vypnout">("zadne");
  const s = strop();
  const t = tym();

  async function vynuluj() {
    if (!spravce) return; // zámek i tady, ne jen schované tlačítko – je to nevratné
    const ok = await potvrdit(`Vynulovat čárky týmu ${t?.nazev || ""}?`,
      "Smaže všechny zápisy týmu. Hospody a úkoly zůstanou. Tohle se nedá vrátit.", "Vynulovat čárky");
    if (!ok) return;
    vynulujTym();
    kam("/");
  }

  return (
    <>
      <Hlava nadpis="Pravidla" />

      <div className="pravidla">
        <p>{vazat("Bacha, to není jenom takový to klasický večerní nasávání v Štatlu. Tady se jede betelná řežba přes brněnský špeluňky, kde čárky nemáš jenom za vyžahnutý pruty, ale hlavně za to, že máš koule, dobrej kšaft a v palici to nemáš vypatlaný.")}</p>
        <p>
          <b>O co jde:</b> {vazat("Nahrabat víc čárek než ty druhý partyje a urvat titul z Tour De Pub.")}<br />
          <b>Vlezné do kotla:</b> Kilo na palici.<br />
          <b>Celej bank:</b> {vazat("První parta bere všecko — všechny love só jejich.")}
        </p>

        <h2>JAK SE TO VALÍ</h2>
        <ol>
          <li><b>Časovej cajk:</b> Valí se to od <b>šesti večer do dvou do rána</b>.{" "}
            {vazat("Co se zvrtne potom, už se do čárek nepočítá.")}</li>
          <li><b>Partyje:</b> Jede se ve dvou až třech partách.</li>
          <li><b>Žádný courání:</b>{" "}
            {vazat("Na každou štaci je zhruba 45 minut. Jak se nějaká parta bude fest loudat a ty druhý na ně budou muset čumět, tak v té špeluňce nebudou mít za ty srandy ani čárku.")}</li>
        </ol>

        <h2>BODOVÁNÍ</h2>
        <ol>
          <li>{vazat("Čárka za každou špeluňku, do který vlezete.")} <b className="cislo">(max. {s.hospody})</b></li>
          <li>{vazat("Čárka, když v tý štaci lupne aspoň půlka partyje jeden škopek.")} <b className="cislo">(max. {s.hospody})</b></li>
          <li>{vazat("Další čárky za plnění srand, rozhozený podle toho, jaká je to haluz:")}</li>
        </ol>
        <div className="legenda">
          {OBTIZNOST.map((o) => (
            <div key={o.piva} className="legenda-radek">
              <Obtiznost piva={o.piva} sNazvem={false} />
              <span>{vazat(`${o.nazev} — ${o.piva} ${sklonuj(o.piva)}`)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="sekce">
        <div className="sekce-hlava"><h2>NASTAVENÍ</h2></div>
        <div className="vrstva radky">
          <button className="radek" onClick={() => setOkno(spravce ? "vypnout" : "zapnout")}>
            <div className="radek-telo">
              <div className="radek-nazev">{spravce ? "Režim správce je zapnutý" : "Režim správce"}</div>
              <div className="radek-pod">{vazat(spravce
                ? "Můžeš upravovat úkoly a hospody. Ťukni pro vypnutí."
                : "Na úpravy úkolů a hospod. Ostatní můžou jenom hrát.")}</div>
            </div>
            <Ikona jmeno={spravce ? "check" : "zamek"} px={18} />
          </button>
          {spravce && (
            <button className="radek" onClick={vynuluj}>
              <div className="radek-telo">
                <div className="radek-nazev spatne">Vynulovat čárky týmu</div>
                <div className="radek-pod">{vazat(`Smaže zápisy týmu ${t?.nazev || ""}. Hospody a úkoly zůstanou.`)}</div>
              </div>
            </button>
          )}
        </div>
      </div>

      <div className="paticka">
        <Logo trida="logo-paticka" />
        <span>© Mišák</span>
      </div>

      {okno === "zapnout" && <OknoSpravce zavri={() => setOkno("zadne")} />}
      {okno === "vypnout" && (
        <Okno nadpis="Vypnout režim správce" pod="Úpravy úkolů a hospod se zase schovají."
          zavri={() => setOkno("zadne")}>
          <div className="okno-akce">
            <button className="tl hlavni" onClick={() => { nastavSpravce(false); setOkno("zadne"); }}>
              <Ikona jmeno="check" px={19} /> Vypnout
            </button>
            <button className="tl tise" onClick={() => setOkno("zadne")}>Zpátky</button>
          </div>
        </Okno>
      )}
    </>
  );
}

function OknoSpravce({ zavri }: { zavri: () => void }) {
  const [kod, setKod] = useState("");
  const [spatne, setSpatne] = useState(false);

  function odemkni() {
    if (sediKod(kod)) { nastavSpravce(true); zavri(); }
    else setSpatne(true);
  }

  return (
    <Okno nadpis="Režim správce" zavri={zavri}
      pod="Odemkne úpravy úkolů a hospod. Je to zámek proti omylu, ne bezpečnost — kdo se podívá do zdrojáku, kód si přečte.">
      <label className="pole">
        <span className="nazev">Kód</span>
        <input type="password" value={kod} autoComplete="off" enterKeyHint="done"
          onChange={(e) => { setKod(e.target.value); setSpatne(false); }}
          onKeyDown={(e) => { if (e.key === "Enter") odemkni(); }} />
        {spatne && <span className="poznamka spatne" style={{ padding: 0 }}>Tenhle kód nesedí.</span>}
      </label>
      <div className="okno-akce">
        <button className="tl hlavni" onClick={odemkni}><Ikona jmeno="check" px={19} /> Odemknout</button>
        <button className="tl tise" onClick={zavri}>Zpátky</button>
      </div>
    </Okno>
  );
}
