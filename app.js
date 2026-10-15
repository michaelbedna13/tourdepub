// Obrazovky a ovládání. Jedna stránka, mezi pohledy se přepíná spodní lištou.
// Lišta a okno stojí mimo překreslovanou část, jinak by při každém zápisu probliklo.
// Při hře se ťuká jednou rukou v hospodě, tak jsou terče velké a hlavní akce jasná.
import { KATEGORIE, ZAKLAD, OBTIZNOST } from "./data.js";
import { ADMIN_KOD } from "./nastaveni.js";
import { LOGO } from "./logo.js";
import {
  stav, naZmenu, tym, body, rozpad, strop, dostupnost, kolikrat, jdePridat,
  prepniZaklad, pridejUkol, uberUkol, nastavHospodu, posunHospodu, hospodaTed, indexHospody,
  pridejTym, upravTym, smazTym, prepniTym, vynulujTym,
  pridejHospodu, upravHospodu, smazHospodu, posunHospoduVPoradi,
  pridejNovyUkol, upravUkol, smazUkol, ukolPodleId, BARVY,
} from "./stav.js";
import { ikona, carky, obtiznost, sklonuj, sklonujUkol, bezpecne, vazat } from "./ui.js";
import { spustSync, stavSyncu, zkusZnovu, smazTymZeServeru } from "./sync.js";

/** Postaví kostru stránky, když chybí.
 *
 *  Service worker umí vydat starou index.html a k ní už novou app.js. Stará
 *  kostra měla jiná id, nová appka je nenašla, spadla na prvním řádku a zůstala
 *  černá plocha. Tohle tomu předejde: appka si kostru v takovém případě postaví
 *  sama a je jedno, jak stará stránka pod ní je. */
function kostra() {
  if (!document.getElementById("obrazovka")) {
    document.body.innerHTML =
      '<div class="app"><div id="obrazovka"></div></div>' +
      '<div class="lista-obal"><nav class="lista" id="lista" aria-label="Hlavní"></nav></div>' +
      '<div id="okno"></div>';
  }
  return {
    obrazovka: document.getElementById("obrazovka"),
    lista: document.getElementById("lista"),
    okno: document.getElementById("okno"),
  };
}
const { obrazovka: elObrazovka, lista: elLista, okno: elOkno } = kostra();

let pohled = "hra";
let kategorieFiltr = "vse";
let okno = null;
let konceptBarvy = null, konceptPiva = null;

/* ---------- režim správce ---------- */
// Zámek proti omylu, ne bezpečnost: web je statický a veřejný, kód si jde přečíst
// ze zdrojáku. Na partu kamarádů to stačí – brání tomu, aby někdo omylem přepsal
// úkoly uprostřed hry.
const KLIC_SPRAVCE = "tourdepub-spravce";
let jeSpravce = false;
try { jeSpravce = localStorage.getItem(KLIC_SPRAVCE) === ADMIN_KOD; } catch {}
function nastavSpravce(zapnuto) {
  jeSpravce = zapnuto;
  try {
    if (zapnuto) localStorage.setItem(KLIC_SPRAVCE, ADMIN_KOD);
    else localStorage.removeItem(KLIC_SPRAVCE);
  } catch {}
}

/* ---------- drobnosti ---------- */

function odmena(text) {
  const d = document.createElement("div");
  d.className = "plusjedna cislo";
  d.textContent = text;
  document.body.appendChild(d);
  setTimeout(() => d.remove(), 900);
  if (navigator.vibrate) navigator.vibrate(10);
}

/** Horní lišta: vlevo nadpis obrazovky (nebo kde zrovna jsme), vpravo tým.
 *  Logo tu nebylo k ničemu — pralo se o místo s nadpisem a jeho rozervaný
 *  okraj neměl vedle úhledné pilulky co zarovnat. Značku nese ikona appky,
 *  úvodní obrazovka a patička Pravidel. */
function hlava(nadpis = "", drobne = "") {
  const t = tym();
  return `<div class="hlava">
    <div class="hlava-text">
      ${drobne ? `<div class="hlava-drobne cislo">${drobne}</div>` : ""}
      ${nadpis ? `<h1>${nadpis}</h1>` : ""}
    </div>
    <button class="prepinac-tymu" data-okno="tymy-rychle" aria-label="Přepnout tým">
      <span class="tecka" style="background:${bezpecne(t?.barva || BARVY[0])}"></span>
      <b>${bezpecne(t?.nazev || "Bez týmu")}</b>
      ${ikona("i-dolu", 13)}
    </button>
  </div>`;
}

/** Pruh o tom, jestli se skóre sdílí. Rozlišuje tři stavy, protože „tváříme se
 *  připojeně, ale nic se neposílá" je ten nejhorší, co může nastat. */
function pruhSyncu(podrobne = false) {
  const s = stavSyncu();
  if (s.rezim === "ukazka")
    return `<div class="rezim">${ikona("zamek", 16)}
      <span>Zapisuje se jen do tohohle telefonu. Jak zapnout živé pořadí, je v README.</span></div>`;
  if (s.rezim === "chyba") {
    if (s.offline)
      return `<div class="rezim">${ikona("zamek", 16)}
        <span>Jsi offline. Zapisuje se do telefonu a pošle se to, až bude signál.</span></div>`;
    return `<div class="rezim chybny">${ikona("zamek", 16)}
      <span>Živé pořadí se nepřipojilo, hra běží dál jen z telefonu.
        ${s.chyba ? `<br><span class="drobne">${bezpecne(s.chyba)}</span>` : ""}
        <br><button class="tl maly" data-akce="sync-znovu"
          style="margin-top:9px">Zkusit znovu</button></span></div>`;
  }
  if (s.rezim === "zivo" && podrobne)
    return `<div class="rezim zivy">${ikona("check", 16)}
      <span>Živé pořadí běží${s.pocet ? `, vidíš ${s.pocet} ${
        s.pocet === 1 ? "partu" : s.pocet < 5 ? "party" : "part"} z jinejch telefonů` : " – zatím nikdo jinej nepřipojenej"}.</span></div>`;
  return "";
}

/** Všechny týmy (místní i ze serveru) seřazené podle čárek. */
/** Všechny týmy, seřazené podle čárek. Po sloučení se serverem jsou všechny
 *  místní, takže jdou upravovat odkudkoli. */
function poradiTymu() {
  return stav.tymy
    .map((t) => ({
      id: t.id, nazev: t.nazev || "Bez názvu", barva: t.barva, body: body(t),
      rozpad: rozpad(t), hospoda: indexHospody(t) + 1,
    }))
    .sort((a, b) => b.body - a.body || b.rozpad.makacky - a.rozpad.makacky);
}

/* ---------- obrazovka: Hra ---------- */

function hra() {
  const t = tym();
  if (!t) return hlava("Hra") + `<div class="prazdno">Nejdřív si založ tým.</div>`;
  const h = hospodaTed();
  const i = indexHospody();
  const r = rozpad();
  const celkem = body();
  const jePrichod = h && !!t.prichod[h.id];
  const jeSkopek = h && !!t.skopek[h.id];
  const zbyva = stav.ukoly.filter((u) => jdePridat(u, t)).length;

  const trasa = stav.hospody.map((x, j) => {
    const s = x.id === t.hospoda ? " ted" : t.prichod[x.id] ? " splneno" : "";
    return `<div class="trasa-bod${s}" title="${j + 1}. ${bezpecne(x.nazev)}"></div>`;
  }).join("");

  const poradi = poradiTymu();
  const nejvic = poradi[0]?.body || 0;

  return `
    ${hlava("", `ŠTACE ${i + 1} Z ${stav.hospody.length}`)}
    ${pruhSyncu()}

    <div class="staci">
      <button class="ikonove" data-akce="hospoda-min" ${i <= 0 ? "disabled" : ""}
        aria-label="Předchozí špeluňka">${ikona("i-zpet", 17)}</button>
      <div class="staci-text">
        <h1>${bezpecne(h?.nazev || "Žádná špeluňka")}</h1>
      </div>
      <button class="ikonove" data-akce="hospoda-plus" ${i >= stav.hospody.length - 1 ? "disabled" : ""}
        aria-label="Další špeluňka">${ikona("i-zpet", 17, "otocit")}</button>
    </div>
    <div class="trasa">${trasa}</div>

    <div class="akce-bloku">
      <button class="tl ${jePrichod ? "hotovo" : "hlavni"}" data-akce="prichod">
        ${ikona(jePrichod ? "check" : "mista", 20)} ${jePrichod ? "Jsme tady" : "Jsme v špeluňce"}
      </button>
      <button class="tl ${jeSkopek ? "hotovo" : "hlavni"}" data-akce="skopek">
        ${ikona(jeSkopek ? "check" : "piva", 20)} ${jeSkopek ? "Škopky jsme lupnuli" : "Škopky jsme lupnuli"}
      </button>
    </div>

    <div class="sekce">
      <div class="vrstva">
        <div class="skore-velke">
          <div class="skore-cislo cislo">${celkem}</div>
          <div class="skore-vedle">
            ${carky(celkem, 22)}
            <div class="skore-popis cislo">${r.dochazka} za špeluňky · ${r.skopky} za škopky · ${r.ukoly} za srandy</div>
          </div>
        </div>
      </div>
    </div>

    <div class="sekce">
      <div class="sekce-hlava"><h2>JAK NA TOM JSOU</h2>
        <span class="pocet">${poradi.length} ${poradi.length === 1 ? "tým" : poradi.length < 5 ? "týmy" : "týmů"}</span></div>
      <div class="vrstva radky">
        ${poradi.map((p) => {
          const rozdil = p.body - nejvic;
          return `<div class="pruh-tymu${p.id === stav.tymId ? " ja" : ""}">
            <span class="tecka" style="background:${bezpecne(p.barva)}"></span>
            <span class="jmeno">${bezpecne(p.nazev)}</span>
            <span class="odstup cislo">${rozdil === 0 ? "vede" : rozdil}</span>
            <span class="cifra cislo">${p.body}</span>
          </div>`;
        }).join("")}
      </div>
    </div>

    <div class="sekce">
      <button class="tl" data-pohled="ukoly">
        ${ikona("hvezda", 18)} ${zbyva ? `Zbývá ${zbyva} ${sklonujUkol(zbyva)}` : "Projít úkoly"}
      </button>
    </div>
  `;
}

/* ---------- obrazovka: Úkoly ---------- */

function ukoly() {
  const t = tym();
  const r = rozpad();
  const vybrane = kategorieFiltr === "vse"
    ? stav.ukoly
    : stav.ukoly.filter((u) => u.kat === kategorieFiltr);

  const zalozka = (id, nazev, seznam) => {
    const hotovo = seznam.filter((u) => kolikrat(u.id, t) > 0).length;
    return `<button data-kategorie="${id}" role="tab" aria-selected="${kategorieFiltr === id}">
      ${bezpecne(nazev)} <span class="pocet cislo">${hotovo}/${seznam.length}</span></button>`;
  };

  return `
    ${hlava("Úkoly")}
    <p class="podnadpis cislo">Splněno ${r.splneno} z ${stav.ukoly.length} · ${r.ukoly} ${sklonuj(r.ukoly)} za srandy</p>
    <div class="prepinac" role="tablist">
      ${zalozka("vse", "Všechno", stav.ukoly)}
      ${KATEGORIE.map((k) => zalozka(k.id, k.nazev, stav.ukoly.filter((u) => u.kat === k.id))).join("")}
    </div>
    ${vybrane.length
      ? `<div class="vrstva radky">${vybrane.map(radekUkolu).join("")}</div>`
      : `<div class="prazdno">${ikona("hvezda", 40)}<p>V týhle kategorii zatím nic není.</p></div>`}
    ${jeSpravce ? `<div class="sekce">
      <button class="tl" data-okno="ukol-novy">${ikona("plus", 18)} Přidat úkol</button>
    </div>` : ""}
  `;
}

function radekUkolu(u) {
  const t = tym();
  const kolik = kolikrat(u.id, t);
  const dost = dostupnost(u, t);
  const opakovatelny = u.max > 1;
  const splneno = kolik > 0 && (opakovatelny ? kolik >= u.max : true);

  const odznaky = [
    !dost.jde ? `<span class="odznak">${bezpecne(dost.duvod)}</span>` : "",
    u.exkluzivni ? `<span class="odznak">Bere jen jedna parta</span>` : "",
    opakovatelny ? `<span class="odznak cislo">${u.body} ${sklonuj(u.body)} za kus, až ${u.body * u.max}</span>` : "",
    u.jednouZaHospodu && dost.jde && t?.zlodej[t.hospoda]
      ? `<span class="odznak">Z týhle špeluňky už máte</span>` : "",
  ].filter(Boolean).join("");

  const ovladani = opakovatelny
    ? `<div class="pocitadlo">
        <button data-uber="${u.id}" ${kolik <= 0 ? "disabled" : ""} aria-label="Ubrat ${bezpecne(u.nazev)}">${ikona("minus", 13)}</button>
        <span class="kolik cislo">${kolik}</span>
        <button data-pridej="${u.id}" ${!jdePridat(u, t) ? "disabled" : ""} aria-label="Přidat ${bezpecne(u.nazev)}">${ikona("plus", 13)}</button>
      </div>`
    : `<div class="fajfka">${ikona("check", 15)}</div>`;

  return `<div class="ukol${splneno ? " splneno" : ""}${!dost.jde ? " zamceno" : ""}"
      ${!opakovatelny ? `data-prepni="${u.id}" role="button" tabindex="0" aria-pressed="${kolik > 0}"` : ""}>
    <div class="ukol-hlava">
      <span class="ukol-nazev">${bezpecne(u.nazev)}</span>
      ${ovladani}
    </div>
    ${u.popis ? `<p class="ukol-popis">${bezpecne(u.popis)}</p>` : ""}
    ${u.pozn ? `<p class="ukol-pozn">${bezpecne(u.pozn)}</p>` : ""}
    <div class="ukol-stav">
      <div class="ukol-chipy">${obtiznost(u.piva)}${odznaky}</div>
      ${jeSpravce ? `<button class="ikonove holy" data-okno="ukol-uprava" data-id="${u.id}"
        aria-label="Upravit ${bezpecne(u.nazev)}">${ikona("i-tuzka", 16)}</button>` : ""}
    </div>
  </div>`;
}

/* ---------- obrazovka: Týmy ---------- */

function tymy() {
  const poradi = poradiTymu();
  const s = strop();
  const radky = poradi.map((p, i) => `
    <div class="radek${i === 0 && p.body > 0 ? " vede" : ""}${p.id === stav.tymId ? " ja" : ""}">
      <div class="poradi-cislo cislo">${i + 1}</div>
      <button class="radek-telo" data-prepni-tym="${p.id}" style="text-align:left">
        <div class="radek-nazev">
          <span class="tecka" style="background:${bezpecne(p.barva)}"></span>
          ${bezpecne(p.nazev)}
          ${p.id === stav.tymId ? `<span class="odznak duraz">zapisuju</span>` : ""}
        </div>
        <div class="radek-pod cislo">${p.rozpad?.splneno || 0} ${sklonujUkol(p.rozpad?.splneno || 0)} · ${
          p.rozpad?.makacky || 0} ${(p.rozpad?.makacky || 0) === 1 ? "makačka" : "makaček"} · štace ${p.hospoda}</div>
      </button>
      <div class="radek-body cislo">${p.body}</div>
      <button class="ikonove holy" data-okno="tym-uprava" data-id="${p.id}"
        aria-label="Upravit ${bezpecne(p.nazev)}">${ikona("i-tuzka", 16)}</button>
    </div>`).join("");

  return `
    ${hlava("Týmy")}
    <p class="podnadpis psane">Ťukni na tým, za který chceš zapisovat.</p>
    ${pruhSyncu(true)}
    <div class="vrstva radky">${radky}</div>
    <div class="sekce">
      <button class="tl" data-okno="tym-novy">${ikona("plus", 18)} Přidat tým</button>
    </div>
    <div class="sekce">
      <div class="vrstva prodyseny">
        <h3 style="margin-bottom:10px">Kolik se dá urvat</h3>
        <p class="skore-popis cislo">${s.hospody} za špeluňky · ${s.hospody} za škopky · ${s.ukoly} za srandy</p>
        <p style="margin-top:10px;font-size:15px;color:var(--text-2)" class="psane">Dohromady nejvíc
          <b class="cislo" style="font-family:var(--nadpisy);color:var(--text)">${s.celkem}</b> ${sklonuj(s.celkem)}</p>
      </div>
    </div>
  `;
}

/* ---------- obrazovka: Hospody ---------- */

function hospody() {
  const t = tym();
  const radky = stav.hospody.map((h, i) => `
    <div class="radek${h.id === t?.hospoda ? " ted" : ""}">
      <div class="poradi-cislo cislo">${i + 1}</div>
      <button class="radek-telo" data-skoc="${h.id}" style="text-align:left">
        <div class="radek-nazev">${bezpecne(h.nazev)}</div>
        ${h.id === t?.hospoda ? `<div class="radek-pod">Tady jste teď</div>`
          : t?.prichod[h.id] ? `<div class="radek-pod">Máte odsud čárku</div>` : ""}
      </button>
      ${jeSpravce ? `<div class="radek-vpravo">
        <button class="ikonove holy" data-posun="${h.id}" data-smer="-1" ${i === 0 ? "disabled" : ""}
          aria-label="Posunout ${bezpecne(h.nazev)} nahoru">${ikona("i-nahoru", 15)}</button>
        <button class="ikonove holy" data-posun="${h.id}" data-smer="1" ${i === stav.hospody.length - 1 ? "disabled" : ""}
          aria-label="Posunout ${bezpecne(h.nazev)} dolů">${ikona("i-dolu", 15)}</button>
        <button class="ikonove holy" data-okno="hospoda-uprava" data-id="${h.id}"
          aria-label="Upravit ${bezpecne(h.nazev)}">${ikona("i-tuzka", 16)}</button>
      </div>` : ""}
    </div>`).join("");

  return `
    ${hlava("Hospody")}
    <p class="podnadpis psane">${jeSpravce ? "Pořadí určuje trasu. Šipkami se přehazuje."
                     : "Ťukni na hospodu, ať se tam tým přesune."}</p>
    <div class="vrstva radky">${radky}</div>
    ${jeSpravce ? `<div class="sekce">
      <button class="tl" data-okno="hospoda-nova">${ikona("plus", 18)} Přidat hospodu</button>
    </div>` : ""}
  `;
}

/* ---------- obrazovka: Pravidla ---------- */

function pravidla() {
  const s = strop();
  return `
    ${hlava("Pravidla")}
    <div class="pravidla">
      <p>Bacha, to není jenom takový to klasický večerní nasávání v Štatlu. Tady se jede
      betelná řežba přes brněnský špeluňky, kde čárky nemáš jenom za vyžahnutý pruty,
      ale hlavně za to, že máš koule, dobrej kšaft a v palici to nemáš vypatlaný.</p>
      <p><b>O co jde:</b> Nahrabat víc čárek než ty druhý partyje a urvat titul z Tour De Pub.<br>
      <b>Vlezné do kotla:</b> Kilo na palici.<br>
      <b>Celej bank:</b> První parta bere všecko — všechny love só jejich.</p>

      <h2>JAK SE TO VALÍ</h2>
      <ol>
        <li><b>Časovej cajk:</b> Valí se to od <b>šesti večer do dvou do rána</b>. Co se zvrtne potom, už se do čárek nepočítá.</li>
        <li><b>Partyje:</b> Jede se ve dvou až třech partách.</li>
        <li><b>Žádný courání:</b> Na každou štaci je zhruba 45 minut. Jak se nějaká parta bude fest loudat a ty druhý na ně budou muset čumět, tak v té špeluňce nebudou mít za ty srandy ani čárku.</li>
      </ol>

      <h2>BODOVÁNÍ</h2>
      <ol>
        <li>Čárka za každou špeluňku, do který vlezete. <b class="cislo">(max. ${s.hospody})</b></li>
        <li>Čárka, když v tý štaci lupne aspoň půlka partyje jeden škopek. <b class="cislo">(max. ${s.hospody})</b></li>
        <li>Další čárky za plnění srand, rozhozený podle toho, jaká je to haluz:</li>
      </ol>
      <div class="legenda">
        ${OBTIZNOST.map((o) => `<div class="legenda-radek">${obtiznost(o.piva, false)}
          <span>${o.nazev} — ${o.piva} ${sklonuj(o.piva)}</span></div>`).join("")}
      </div>
    </div>

    <div class="sekce">
      <div class="sekce-hlava"><h2>NASTAVENÍ</h2></div>
      <div class="vrstva radky">
        <button class="radek" data-okno="${jeSpravce ? "spravce-konec" : "spravce"}">
          <div class="radek-telo">
            <div class="radek-nazev">${jeSpravce ? "Režim správce je zapnutý" : "Režim správce"}</div>
            <div class="radek-pod">${jeSpravce
              ? "Můžeš upravovat úkoly a hospody. Ťukni pro vypnutí."
              : "Na úpravy úkolů a hospod. Ostatní můžou jenom hrát."}</div>
          </div>
          ${jeSpravce ? ikona("check", 18) : ikona("zamek", 17)}
        </button>
        ${jeSpravce ? `<button class="radek" data-akce="vynulovat">
          <div class="radek-telo">
            <div class="radek-nazev" style="color:var(--spatne)">Vynulovat čárky týmu</div>
            <div class="radek-pod">Smaže zápisy týmu ${bezpecne(tym()?.nazev || "")}. Hospody a úkoly zůstanou.</div>
          </div>
        </button>` : ""}
      </div>
    </div>

    <div class="paticka">
      <span class="logo-paticka">${LOGO}</span>
      <span>© Mišák</span>
    </div>
  `;
}

/* ---------- okna ---------- */

const oknoRam = (nadpis, pod, telo) => `<div class="okno" data-prekryv>
  <div class="okno-telo" role="dialog" aria-modal="true" aria-label="${bezpecne(nadpis)}">
    <h2>${nadpis}</h2>${pod ? `<p class="pod">${pod}</p>` : '<div style="height:16px"></div>'}
    ${telo}
  </div></div>`;

function oknoObsah() {
  if (!okno) return "";
  switch (okno.druh) {
    case "tymy-rychle":
      return oknoRam("Za koho zapisuju", "Ťukni na tým. Můžeš zapisovat komukoliv.", `
        <div class="vrstva radky" style="margin-bottom:12px">
          ${stav.tymy.map((t) => `
            <button class="radek" data-prepni-tym="${t.id}">
              <span class="tecka" style="background:${bezpecne(t.barva)}"></span>
              <div class="radek-telo"><div class="radek-nazev">${bezpecne(t.nazev || "Bez názvu")}</div></div>
              <div class="radek-body cislo">${body(t)}</div>
              ${t.id === stav.tymId ? ikona("check", 18) : ""}
            </button>`).join("")}
        </div>
        <div class="okno-akce">
          <button class="tl" data-okno="tym-novy">${ikona("plus", 18)} Přidat tým</button>
          <button class="tl tise" data-akce="zavri">Zpátky</button>
        </div>`);

    case "tym-novy":
    case "tym-uprava": {
      const novy = okno.druh === "tym-novy";
      const t = novy ? null : stav.tymy.find((x) => x.id === okno.id);
      if (!novy && !t) return "";
      const barva = konceptBarvy || t?.barva || BARVY[stav.tymy.length % BARVY.length];
      return oknoRam(novy ? "Nový tým" : "Upravit tým", "Jméno uvidí ostatní party v pořadí.", `
        <label class="pole">
          <span class="nazev">Jak si říkáte</span>
          <input type="text" id="pole-nazev" value="${bezpecne(t?.nazev || "")}" maxlength="40"
            placeholder="Borci ze Štatlu" autocomplete="off" enterkeyhint="done">
        </label>
        <label class="pole">
          <span class="nazev">Barva</span>
          <span class="barvy">${BARVY.map((b) => `<button data-barva="${b}" style="background:${b}"
            aria-pressed="${b === barva}" aria-label="Barva ${b}"></button>`).join("")}</span>
        </label>
        <div class="okno-akce">
          <button class="tl hlavni" data-akce="uloz-tym">${ikona("check", 19)} Hotovo</button>
          ${!novy && stav.tymy.length > 1 ? `<button class="tl nebezpecne" data-akce="smaz-tym">
            ${ikona("i-kos", 18)} Smazat tým</button>` : ""}
          <button class="tl tise" data-akce="zavri">Zpátky</button>
        </div>`);
    }

    case "hospoda-nova":
    case "hospoda-uprava": {
      const nova = okno.druh === "hospoda-nova";
      const h = nova ? null : stav.hospody.find((x) => x.id === okno.id);
      if (!nova && !h) return "";
      return oknoRam(nova ? "Nová hospoda" : "Upravit hospodu", "", `
        <label class="pole">
          <span class="nazev">Název</span>
          <input type="text" id="pole-nazev" value="${bezpecne(h?.nazev || "")}" maxlength="60"
            placeholder="U Ričího" autocomplete="off" enterkeyhint="done">
        </label>
        <div class="okno-akce">
          <button class="tl hlavni" data-akce="uloz-hospodu">${ikona("check", 19)} Hotovo</button>
          ${!nova && stav.hospody.length > 1 ? `<button class="tl nebezpecne" data-akce="smaz-hospodu">
            ${ikona("i-kos", 18)} Smazat hospodu</button>` : ""}
          <button class="tl tise" data-akce="zavri">Zpátky</button>
        </div>`);
    }

    case "ukol-novy":
    case "ukol-uprava": {
      const novy = okno.druh === "ukol-novy";
      const u = novy ? null : ukolPodleId(okno.id);
      if (!novy && !u) return "";
      const piva = konceptPiva || u?.piva || 1;
      const kat = u?.kat || KATEGORIE[0].id;
      return oknoRam(novy ? "Nový úkol" : "Upravit úkol", "", `
        <label class="pole">
          <span class="nazev">Název</span>
          <input type="text" id="pole-nazev" value="${bezpecne(u?.nazev || "")}" maxlength="80"
            placeholder="Hádka o čárku" autocomplete="off">
        </label>
        <label class="pole">
          <span class="nazev">Zadání</span>
          <textarea id="pole-popis" maxlength="400" placeholder="Co se musí udělat">${bezpecne(u?.popis || "")}</textarea>
        </label>
        <label class="pole">
          <span class="nazev">Kategorie</span>
          <select id="pole-kat">${KATEGORIE.map((k) =>
            `<option value="${k.id}"${k.id === kat ? " selected" : ""}>${k.nazev}</option>`).join("")}</select>
        </label>
        <div class="pole">
          <span class="nazev">Obtížnost</span>
          <div class="volba-ob">${OBTIZNOST.map((o) => `
            <button class="v${o.piva}" data-piva="${o.piva}" aria-pressed="${o.piva === piva}">
              <span class="piva">${Array.from({ length: o.piva }, () => ikona("piva", 14)).join("")}</span>
              ${o.nazev}</button>`).join("")}</div>
        </div>
        <label class="pole">
          <span class="nazev">Kolikrát to jde splnit</span>
          <input type="text" inputmode="numeric" id="pole-max" value="${u?.max || 1}" maxlength="2" autocomplete="off">
          <span class="poznamka" style="padding:0">Jednou = úkol hodí tolik čárek, jaká je obtížnost.
            Víckrát = čárka za každý kus.</span>
        </label>
        <div class="okno-akce">
          <button class="tl hlavni" data-akce="uloz-ukol">${ikona("check", 19)} Hotovo</button>
          ${!novy ? `<button class="tl nebezpecne" data-akce="smaz-ukol">
            ${ikona("i-kos", 18)} Smazat úkol</button>` : ""}
          <button class="tl tise" data-akce="zavri">Zpátky</button>
        </div>`);
    }

    case "spravce":
      return oknoRam("Režim správce",
        "Odemkne úpravy úkolů a hospod. Je to zámek proti omylu, ne bezpečnost — kdo se podívá do zdrojáku, kód si přečte.", `
        <label class="pole">
          <span class="nazev">Kód</span>
          <input type="password" id="pole-kod" placeholder="" autocomplete="off" enterkeyhint="done">
          <span class="poznamka" id="chyba-kodu" style="padding:0;display:none;color:var(--spatne)">Tenhle kód nesedí.</span>
        </label>
        <div class="okno-akce">
          <button class="tl hlavni" data-akce="zapni-spravce">${ikona("check", 19)} Odemknout</button>
          <button class="tl tise" data-akce="zavri">Zpátky</button>
        </div>`);

    case "spravce-konec":
      return oknoRam("Vypnout režim správce", "Úpravy úkolů a hospod se zase schovají.", `
        <div class="okno-akce">
          <button class="tl hlavni" data-akce="vypni-spravce">${ikona("check", 19)} Vypnout</button>
          <button class="tl tise" data-akce="zavri">Zpátky</button>
        </div>`);
  }
  return "";
}

/* ---------- vykreslení ---------- */

const POHLEDY = { hra, ukoly, tymy, hospody, pravidla };
const LISTA = [
  { id: "hra", popis: "Hra", ikona: "i-domu" },
  { id: "ukoly", popis: "Úkoly", ikona: "hvezda" },
  { id: "tymy", popis: "Týmy", ikona: "trofej" },
  { id: "hospody", popis: "Hospody", ikona: "hospoda" },
  { id: "pravidla", popis: "Pravidla", ikona: "i-mrizka" },
];

/** Lišta se kreslí jednou. Při překreslení obsahu se jen přepíná třída,
 *  jinak by při každém zápisu zmizela a naskočila znovu. */
function vykresliListu() {
  elLista.innerHTML = LISTA.map((p) => `<button data-pohled="${p.id}"
    class="${p.id === pohled ? "ted" : ""}" aria-current="${p.id === pohled ? "page" : "false"}">
    ${ikona(p.ikona, 19)}<span class="popis">${p.popis}</span></button>`).join("");
}
function oznacListu() {
  elLista.querySelectorAll("[data-pohled]").forEach((b) => {
    const ted = b.dataset.pohled === pohled;
    b.classList.toggle("ted", ted);
    b.setAttribute("aria-current", ted ? "page" : "false");
  });
}

export function vykresli() {
  const posun = window.scrollY;
  elObrazovka.innerHTML = vazat(`<div class="obrazovka">${POHLEDY[pohled]()}</div>`);
  elOkno.innerHTML = vazat(oknoObsah());
  window.scrollTo(0, posun);
  if (okno) setTimeout(() => elOkno.querySelector("#pole-nazev, #pole-kod")?.focus(), 30);
  // vybraná kategorie může být mimo obraz, přitáhneme ji
  elObrazovka.querySelector('[role=tab][aria-selected=true]')
    ?.scrollIntoView({ block: "nearest", inline: "center" });
}

const otevri = (druh, id) => { okno = { druh, id }; konceptBarvy = null; konceptPiva = null; vykresli(); };
const zavri = () => { okno = null; vykresli(); };
const hodnota = (id) => elOkno.querySelector("#" + id)?.value ?? "";

function naPohled(id) {
  pohled = id;
  okno = null;
  oznacListu();
  vykresli();
  window.scrollTo(0, 0);
}

/* ---------- ovládání ---------- */

function obsluha(e) {
  const c = (s) => e.target.closest(s);

  const naOkno = c("[data-okno]");
  if (naOkno) { otevri(naOkno.dataset.okno, naOkno.dataset.id); return; }

  const pohledTl = c("[data-pohled]");
  if (pohledTl) { naPohled(pohledTl.dataset.pohled); return; }

  const kat = c("[data-kategorie]");
  if (kat) { kategorieFiltr = kat.dataset.kategorie; vykresli(); window.scrollTo(0, 0); return; }

  const prep = c("[data-prepni-tym]");
  if (prep) { prepniTym(prep.dataset.prepniTym); zavri(); return; }

  const skoc = c("[data-skoc]");
  if (skoc) { nastavHospodu(skoc.dataset.skoc); naPohled("hra"); return; }

  const posun = c("[data-posun]");
  if (posun) { posunHospoduVPoradi(posun.dataset.posun, +posun.dataset.smer); return; }

  const pridej = c("[data-pridej]");
  if (pridej) {
    const u = ukolPodleId(pridej.dataset.pridej);
    if (u && pridejUkol(u)) odmena("+" + u.body);
    return;
  }
  const uber = c("[data-uber]");
  if (uber) { const u = ukolPodleId(uber.dataset.uber); if (u) uberUkol(u); return; }

  const prepni = c("[data-prepni]");
  if (prepni) {
    const u = ukolPodleId(prepni.dataset.prepni);
    if (!u) return;
    if (kolikrat(u.id) > 0) uberUkol(u);
    else if (pridejUkol(u)) odmena("+" + u.body);
    return;
  }

  const barva = c("[data-barva]");
  if (barva) {
    konceptBarvy = barva.dataset.barva;
    elOkno.querySelectorAll("[data-barva]").forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.barva === konceptBarvy)));
    return;
  }
  const pivo = c("[data-piva]");
  if (pivo) {
    konceptPiva = +pivo.dataset.piva;
    elOkno.querySelectorAll("[data-piva]").forEach((b) =>
      b.setAttribute("aria-pressed", String(+b.dataset.piva === konceptPiva)));
    return;
  }

  const akce = c("[data-akce]")?.dataset.akce;
  if (!akce) { if (e.target.matches("[data-prekryv]")) zavri(); return; }

  switch (akce) {
    case "prichod": if (prepniZaklad("prichod")) odmena("+1"); break;
    case "skopek": if (prepniZaklad("skopek")) odmena("+1"); break;
    case "hospoda-plus": posunHospodu(1); window.scrollTo(0, 0); break;
    case "hospoda-min": posunHospodu(-1); window.scrollTo(0, 0); break;
    case "zavri": zavri(); break;
    case "sync-znovu": zkusZnovu(); break;

    case "uloz-tym": {
      const nazev = hodnota("pole-nazev").trim().slice(0, 40);
      if (okno.druh === "tym-novy") prepniTym(pridejTym(nazev || "Nová parta", konceptBarvy).id);
      else upravTym(okno.id, { nazev: nazev || "Bez názvu", barva: konceptBarvy || undefined });
      zavri();
      break;
    }
    case "smaz-tym":
      if (confirm("Smazat tým i s jeho čárkami? Tohle se nedá vrátit.")) {
        const id = okno.id;
        smazTym(id);
        smazTymZeServeru(id); // ať nezůstane viset ostatním v pořadí
        zavri();
      }
      break;

    case "uloz-hospodu": {
      const nazev = hodnota("pole-nazev");
      if (okno.druh === "hospoda-nova") pridejHospodu(nazev);
      else upravHospodu(okno.id, nazev);
      zavri();
      break;
    }
    case "smaz-hospodu":
      if (confirm("Smazat hospodu? Čárky, co z ní týmy mají, zmizí taky.")) { smazHospodu(okno.id); zavri(); }
      break;

    case "uloz-ukol": {
      const data = {
        nazev: hodnota("pole-nazev"),
        popis: hodnota("pole-popis"),
        kat: hodnota("pole-kat"),
        piva: konceptPiva || (okno.druh === "ukol-uprava" ? ukolPodleId(okno.id)?.piva : 1),
        max: parseInt(hodnota("pole-max"), 10) || 1,
      };
      if (okno.druh === "ukol-novy") pridejNovyUkol(data);
      else upravUkol(okno.id, data);
      zavri();
      break;
    }
    case "smaz-ukol":
      if (confirm("Smazat úkol? Čárky, co za něj týmy mají, zmizí taky.")) { smazUkol(okno.id); zavri(); }
      break;

    case "zapni-spravce": {
      const zadano = hodnota("pole-kod");
      if (zadano === ADMIN_KOD) { nastavSpravce(true); zavri(); }
      else {
        const ch = elOkno.querySelector("#chyba-kodu");
        if (ch) ch.style.display = "block";
        elOkno.querySelector("#pole-kod")?.focus();
      }
      break;
    }
    case "vypni-spravce": nastavSpravce(false); zavri(); break;

    case "vynulovat":
      // zámek i tady, ne jen schované tlačítko – je to nevratné
      if (!jeSpravce) break;
      if (confirm(`Vynulovat čárky týmu ${tym()?.nazev || ""}? Tohle se nedá vrátit.`)) {
        vynulujTym();
        naPohled("hra");
      }
      break;
  }
}

elObrazovka.addEventListener("click", obsluha);
elLista.addEventListener("click", obsluha);
elOkno.addEventListener("click", obsluha);

document.addEventListener("keydown", (e) => {
  if ((e.key === "Enter" || e.key === " ") && e.target.matches("[data-prepni]")) {
    e.preventDefault();
    e.target.click();
  }
  if (e.key === "Enter" && e.target.matches("#pole-kod")) {
    e.preventDefault();
    elOkno.querySelector("[data-akce='zapni-spravce']")?.click();
  }
  if (e.key === "Escape" && okno) zavri();
});

/* ---------- start ---------- */

/** Poslední záchrana: když se cokoli rozsype, ať tam není černá plocha bez
 *  vysvětlení. V hospodě po pár pivech je hláška s tlačítkem k nezaplacení. */
function hlaskaOPaduApp(e) {
  const d = document.getElementById("obrazovka") || document.body;
  d.innerHTML = `<div class="obrazovka"><div class="prazdno">
    <p style="margin-bottom:6px">Appka se zasekla.</p>
    <p class="drobne" style="font-size:13px;color:var(--text-3)">${
      String(e?.message || e).replace(/[<>&]/g, "")}</p>
    <button class="tl hlavni" style="margin-top:18px" onclick="location.reload()">Načíst znovu</button>
  </div></div>`;
}
addEventListener("error", (e) => { if (!document.getElementById("obrazovka")?.children.length) hlaskaOPaduApp(e.error || e); });

try {
  naZmenu(vykresli);
  vykresliListu();
  vykresli();
  spustSync(vykresli);
} catch (e) {
  hlaskaOPaduApp(e);
  throw e;
}

/** Úvodní obrazovka zmizí, až když je appka vykreslená A zároveň uběhla
 *  chvilka od spuštění. Bez té chvilky by na rychlém telefonu jen bliklo. */
(function schovejUvod() {
  const uvod = document.getElementById("uvod");
  if (!uvod) return;
  const NEJMIN = 1150; // ms od načtení stránky
  const zbyva = Math.max(0, NEJMIN - performance.now());
  setTimeout(() => {
    uvod.classList.add("odchazi");
    uvod.addEventListener("transitionend", () => uvod.remove(), { once: true });
    setTimeout(() => uvod.remove(), 800); // kdyby přechod neproběhl
  }, zbyva);
})();
