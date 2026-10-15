// Obrazovky a ovládání. Jedna stránka, mezi pohledy se přepíná spodní lištou –
// při hře se ťuká jednou rukou, tak jsou hlavní akce dole a terče velké.
import { HOSPODY, UKOLY, KATEGORIE, ZAKLAD, STROP_UKOLY } from "./data.js";
import {
  stav, uloz, naZmenu, body, rozpad, dostupnost, kolikrat, jdePridat,
  prepniZaklad, pridejUkol, uberUkol, nastavHospodu, nastavPartu, BARVY,
} from "./stav.js";
import { ikona, carky, pullitry, sklonuj, bezpecne } from "./ui.js";
import { spustSync, stavSyncu, ostatniParty } from "./sync.js";

const el = document.getElementById("app");
let pohled = "hra";
let jenTady = true; // v Úkolech: ukázat jen to, co jde v téhle štaci

/* ---------- pomůcky ---------- */

const hospodaTed = () => HOSPODY.find((h) => h.c === stav.hospoda) || HOSPODY[0];

function odmena(text = "+1") {
  const d = document.createElement("div");
  d.className = "plusjedna";
  d.textContent = text;
  document.body.appendChild(d);
  setTimeout(() => d.remove(), 1000);
  if (navigator.vibrate) navigator.vibrate(12);
}

/* ---------- obrazovka: Hra ---------- */

function hra() {
  const h = hospodaTed();
  const r = rozpad();
  const celkem = body();
  const jePrichod = !!stav.prichod[stav.hospoda];
  const jeSkopek = !!stav.skopek[stav.hospoda];

  const trasa = HOSPODY.map((x) => {
    const t = x.c === stav.hospoda ? " ted" : stav.prichod[x.c] ? " splneno" : "";
    return `<div class="trasa-bod${t}" title="${bezpecne(x.nazev)}"></div>`;
  }).join("");

  // kolik úkolů jde splnit zrovna tady a ještě nejsou odškrtnuté
  const tadyJde = UKOLY.filter((u) => jdePridat(u)).length;

  return `
    ${hlavicka()}
    ${stavSyncu().rezim === "ukazka" ? pruhUkazky() : ""}

    <div class="staci">
      <div class="staci-cislo">${h.c}</div>
      <div class="staci-text">
        <div class="kde">Štace ${h.c} z ${HOSPODY.length}</div>
        <h1>${bezpecne(h.nazev)}</h1>
      </div>
    </div>
    <div class="trasa">${trasa}</div>

    <div class="sekce">
      <div class="tl-rada" style="margin-bottom:10px">
        <button class="tl" data-akce="hospoda-min" ${stav.hospoda <= 1 ? "disabled" : ""}>
          ${ikona("i-zpet", 20)} Zpátky</button>
        <button class="tl" data-akce="hospoda-plus" ${stav.hospoda >= HOSPODY.length ? "disabled" : ""}>
          Další štace ${ikona("i-zpet", 20, "otocit")}</button>
      </div>
      <button class="tl ${jePrichod ? "hotovo" : "hlavni"}" data-akce="prichod" style="margin-bottom:10px">
        ${ikona(jePrichod ? "check" : "mista", 24)} ${jePrichod ? "Jsme tady — čárka padla" : "Jsme v špeluňce"}
      </button>
      <button class="tl ${jeSkopek ? "hotovo" : "hlavni"}" data-akce="skopek">
        ${ikona(jeSkopek ? "check" : "piva", 24)} ${jeSkopek ? "Škopek padl — čárka padla" : "Škopek padl"}
      </button>
      <p class="napis" style="margin-top:11px;text-align:center">
        ${ZAKLAD[1].popis}
      </p>
    </div>

    <div class="sekce">
      <div class="karta">
        <div class="carky-radek">
          <div>
            <div class="skore-popis">Vaše čárky</div>
            <div class="skore-cislo">${celkem}</div>
          </div>
          <div style="flex:1;min-width:0;padding-bottom:6px">${carky(celkem, 30)}</div>
        </div>
        <div style="margin-top:16px;display:grid;gap:7px;font-size:14.5px;color:var(--papir-tm)">
          <div>${r.dochazka} za špeluňky · ${r.skopky} za škopky · ${r.ukoly} za srandy</div>
          <div>Splněno ${r.splneno} z ${UKOLY.length} úkolů, z toho ${r.makacky} ${
            r.makacky === 1 ? "betelná makačka" : "betelnejch makaček"
          }</div>
        </div>
      </div>
    </div>

    <div class="sekce">
      <button class="tl" data-akce="na-ukoly">
        ${ikona("hvezda", 22)} ${tadyJde ? `Tady jde ještě ${tadyJde} ${tadyJde === 1 ? "úkol" : tadyJde < 5 ? "úkoly" : "úkolů"}` : "Projít úkoly"}
      </button>
    </div>
  `;
}

function pruhUkazky() {
  return `<div class="rezim">${ikona("zamek", 18)}
    <span>Ukázkový režim — zapisuje se jen do tohohle telefonu. Jak zapnout živé pořadí, je v README.</span></div>`;
}

function hlavicka() {
  const p = stav.parta;
  return `<div class="hlava">
    <div class="znacka"><span>Tour de Pub</span><span class="maly">Brno edition</span></div>
    <button class="parta-zn" data-akce="nastaveni">
      <span class="parta-tecka" style="background:${bezpecne(p.barva)}"></span>
      <b>${p.nazev ? bezpecne(p.nazev) : "Nastavit partu"}</b>
    </button>
  </div>`;
}

/* ---------- obrazovka: Úkoly ---------- */

function ukoly() {
  const sekce = KATEGORIE.map((k) => {
    let vKategorii = UKOLY.filter((u) => u.kat === k.id);
    if (jenTady) vKategorii = vKategorii.filter((u) => dostupnost(u).jde);
    if (!vKategorii.length) return "";
    return `
      <div class="sekce">
        <div class="sekce-hlava">
          ${ikona(k.ikona, 24)}
          <h2>${k.nazev}</h2>
          <span class="pocet">${vKategorii.filter((u) => kolikrat(u.id) > 0).length}/${vKategorii.length}</span>
        </div>
        <div class="karta" style="padding:4px 10px">
          ${vKategorii.map(radekUkolu).join("")}
        </div>
      </div>`;
  }).join("");

  const skryto = UKOLY.length - UKOLY.filter((u) => dostupnost(u).jde).length;

  return `
    ${hlavicka()}
    <div class="sekce-hlava" style="margin-bottom:14px">
      <h2 style="font-size:26px">Úkoly</h2>
      <span class="pocet">${rozpad().splneno}/${UKOLY.length} splněno</span>
    </div>
    <div class="tl-rada" style="margin-bottom:4px">
      <button class="tl maly" data-akce="filtr" aria-pressed="${jenTady}"
        style="${jenTady ? "background:var(--pivo);color:var(--cerna);border-color:transparent" : ""}">
        Jen co jde tady</button>
      <button class="tl maly" data-akce="filtr-vse" aria-pressed="${!jenTady}"
        style="${!jenTady ? "background:var(--pivo);color:var(--cerna);border-color:transparent" : ""}">
        Všechny úkoly</button>
    </div>
    ${jenTady && skryto ? `<p class="napis" style="margin-top:10px">Schováno ${skryto} ${
      skryto === 1 ? "úkol" : skryto < 5 ? "úkoly" : "úkolů"
    }, co jdou jen v jiný štaci.</p>` : ""}
    ${sekce || `<div class="prazdno">${ikona("hvezda", 46)}<p>Tady už není co plnit. Přepni na všechny úkoly.</p></div>`}
  `;
}

function radekUkolu(u) {
  const kolik = kolikrat(u.id);
  const dost = dostupnost(u);
  const opakovatelny = u.max > 1;
  const splneno = kolik > 0 && (opakovatelny ? kolik >= u.max : true);

  // kolik to hodí: u jednorázových rovnou, u opakovatelných za kus a kolik nejvíc
  const zaCo = opakovatelny
    ? `${u.body} ${sklonuj(u.body)} za kus, až ${u.body * u.max}`
    : `${u.body} ${sklonuj(u.body)}`;

  const odznaky = [
    !dost.jde ? `<span class="odznak">${dost.duvod}</span>` : "",
    u.exkluzivni ? `<span class="odznak varovani">Bere jen jedna parta</span>` : "",
    u.jednouZaHospodu && dost.jde
      ? `<span class="odznak${stav.zlodej[stav.hospoda] ? "" : " ano"}">${
          stav.zlodej[stav.hospoda] ? "Z týhle špeluňky už máte" : "Jedna věc za špeluňku"}</span>`
      : "",
  ].filter(Boolean).join("");

  const ovladani = opakovatelny
    ? `<div class="pocitadlo">
        <button data-uber="${u.id}" ${kolik <= 0 ? "disabled" : ""} aria-label="Ubrat ${bezpecne(u.nazev)}">${ikona("minus", 15)}</button>
        <span class="kolik">${kolik}</span>
        <button data-pridej="${u.id}" ${!jdePridat(u) ? "disabled" : ""} aria-label="Přidat ${bezpecne(u.nazev)}">${ikona("plus", 15)}</button>
      </div>`
    : `<div class="fajfka">${ikona("check", 17)}</div>`;

  // u jednorázových se ťuká na celý řádek, u opakovatelných jen na + a −
  return `<div class="ukol${splneno ? " splneno" : ""}${!dost.jde ? " zamceno" : ""}"
      ${!opakovatelny ? `data-prepni="${u.id}" role="button" tabindex="0"
        aria-pressed="${kolik > 0}"` : ""}>
    <div class="ukol-hlava">
      <span class="ukol-nazev">${bezpecne(u.nazev)}</span>
      ${ovladani}
    </div>
    <p class="ukol-popis">${bezpecne(u.popis)}</p>
    ${u.pozn ? `<p class="ukol-pozn">${bezpecne(u.pozn)}</p>` : ""}
    <div class="ukol-stav">
      ${pullitry(u.piva, !dost.jde)}
      <span class="napis">${zaCo}</span>
      ${odznaky}
    </div>
  </div>`;
}

/* ---------- obrazovka: Pořadí ---------- */

function poradi() {
  const sync = stavSyncu();
  const ja = { id: stav.parta.id, nazev: stav.parta.nazev || "Vaše parta", barva: stav.parta.barva,
               body: body(), rozpad: rozpad() };
  const vsechny = [ja, ...ostatniParty()].sort((a, b) => b.body - a.body || b.rozpad.makacky - a.rozpad.makacky);

  const radky = vsechny.map((p, i) => `
    <div class="poradi-radek${i === 0 ? " prvni" : ""}${p.id === ja.id ? " ja" : ""}">
      <div class="poradi-misto">${i + 1}.</div>
      <div class="poradi-telo">
        <div class="poradi-jmeno">
          <span class="parta-tecka" style="background:${bezpecne(p.barva)}"></span>
          ${bezpecne(p.nazev)}
          ${i === 0 && p.body > 0 ? ikona("koruna", 19) : ""}
        </div>
        <div class="poradi-detail">${p.rozpad.splneno} úkolů · ${p.rozpad.makacky} ${
          p.rozpad.makacky === 1 ? "makačka" : "makaček"
        } · štace ${p.hospoda || stav.hospoda}</div>
      </div>
      <div class="poradi-body">${p.body}</div>
    </div>`).join("");

  return `
    ${hlavicka()}
    <div class="sekce-hlava" style="margin-bottom:16px">
      ${ikona("trofej", 26)}<h2 style="font-size:26px">Pořadí</h2>
    </div>
    ${sync.rezim === "ukazka" ? pruhUkazky() : ""}
    <div class="karta">${radky}</div>
    ${vsechny.length === 1 ? `<div class="prazdno">${ikona("parta", 42)}
      <p>Zatím hrajete sami. Jedna parta se taky počítá — jde o to nasbírat co nejvíc.</p></div>` : ""}

    <div class="sekce">
      <div class="karta">
        <h3>Kolik se dá urvat</h3>
        <div style="display:grid;gap:8px;font-size:14.5px;color:var(--papir-tm)">
          <div>${HOSPODY.length} za špeluňky · ${HOSPODY.length} za škopky · ${STROP_UKOLY} za srandy</div>
          <div style="color:var(--papir)">Dohromady nejvíc <b style="font-family:var(--nadpisy);color:var(--pivo);font-size:20px">${
            HOSPODY.length * 2 + STROP_UKOLY}</b> ${sklonuj(HOSPODY.length * 2 + STROP_UKOLY)}</div>
        </div>
      </div>
    </div>
  `;
}

/* ---------- obrazovka: Pravidla ---------- */

function pravidla() {
  const seznamHospod = HOSPODY.map((h) => `
    <div class="hospoda-radek${h.c === stav.hospoda ? " ted" : ""}${stav.prichod[h.c] ? " splneno" : ""}">
      <div class="hospoda-cislo">${h.c}</div>
      <div class="hospoda-nazev">${bezpecne(h.nazev)}</div>
      ${stav.prichod[h.c] ? ikona("check", 19) : ""}
      <button class="tl maly" data-skoc="${h.c}">Sem</button>
    </div>`).join("");

  return `
    ${hlavicka()}
    <div class="pravidla">
      <h2 style="font-size:26px">Pravidla</h2>
      <p>Bacha, to není jenom takový to klasický večerní nasávání v Štatlu. Tady se jede
      betelná řežba přes devět brněnskejch špeluněk, kde čárky nemáš jenom za vyžahnutý pruty,
      ale hlavně za to, že máš koule, dobrej kšaft a v palici to nemáš vypatlaný.</p>
      <p><b>O co jde:</b> Nahrabat víc čárek než ty druhý partyje a urvat titul z Tour De Pub.<br>
      <b>Vlezné do kotla:</b> Kilo na palici.<br>
      <b>Celej bank:</b> První parta bere všecko — všechny love só jejich.</p>

      <h2>Jak se to valí</h2>
      <ol>
        <li><b>Časovej cajk:</b> Valí se to od <b>šesti večer do dvou do rána</b>. Co se zvrtne potom, už se do čárek nepočítá.</li>
        <li><b>Partyje:</b> Jede se ve dvou až třech partách.</li>
        <li><b>Žádný courání:</b> Na každou štaci je zhruba 45 minut. Jak se nějaká parta bude fest loudat a ty druhý na ně budou muset čumět, tak v té špeluňce nebudou mít za ty srandy ani čárku.</li>
      </ol>

      <h2>Bodování</h2>
      <ol>
        <li>Čárka za každou špeluňku, do který vlezete. <b>(max. ${HOSPODY.length})</b></li>
        <li>Pokud v každý štaci lupne aspoň půlka partyje jeden škopek, máte čárku v kapse. <b>(max. ${HOSPODY.length})</b></li>
        <li>Další čárky nahrabete za plnění srand. Ty só pak rozhozený podle toho, jaká je to haluz:</li>
      </ol>
      <div class="legenda">
        <div class="legenda-radek">${pullitry(1)}<span>Brnkačka</span></div>
        <div class="legenda-radek">${pullitry(2)}<span>Větší haluz</span></div>
        <div class="legenda-radek">${pullitry(3)}<span>Betelná makačka</span></div>
      </div>

      <h2>Trasa</h2>
      <p>Vykopáváme v Lucky Bastardovi a do cílový rovinky se dovalí buď v Music Labu, nebo
      v Desertu — podle nálady. Celý to po svejch zabere asi tak pade minut čistýho času.</p>
    </div>
    <div class="sekce">
      <div class="karta" style="padding:4px 12px">${seznamHospod}</div>
    </div>
    <div class="sekce">
      <button class="tl" data-akce="vynulovat">${ikona("minus", 20)} Vynulovat naši hru</button>
    </div>
  `;
}

/* ---------- nastavení party ---------- */

function oknoNastaveni() {
  const p = stav.parta;
  return `<div class="okno" data-okno>
    <div class="okno-telo" role="dialog" aria-modal="true" aria-label="Nastavení party">
      <h2>Vaše parta</h2>
      <p class="pod">Jméno uvidí ostatní party v pořadí.</p>
      <label class="pole">
        <span class="nazev">Jak si říkáte</span>
        <input type="text" id="jmeno-party" value="${bezpecne(p.nazev)}" maxlength="40"
          placeholder="Borci ze Štatlu" autocomplete="off">
      </label>
      <label class="pole">
        <span class="nazev">Barva</span>
        <span class="barvy">${BARVY.map((b) => `<button data-barva="${b}" style="background:${b}"
          aria-pressed="${b === p.barva}" aria-label="Barva ${b}"></button>`).join("")}</span>
      </label>
      <button class="tl hlavni" data-akce="uloz-partu" style="margin-top:6px">${ikona("check", 22)} Hotovo</button>
      <button class="tl" data-akce="zavri-okno" style="margin-top:9px">Zpátky</button>
    </div>
  </div>`;
}

/* ---------- vykreslení ---------- */

const POHLEDY = { hra, ukoly, poradi, pravidla };
const LISTA = [
  { id: "hra", popis: "Hra", ikona: "i-domu" },
  { id: "ukoly", popis: "Úkoly", ikona: "hvezda" },
  { id: "poradi", popis: "Pořadí", ikona: "trofej" },
  { id: "pravidla", popis: "Pravidla", ikona: "i-mrizka" },
];

let oknoOtevrene = false;
let vybranaBarva = null;

export function vykresli() {
  const posun = window.scrollY;
  el.innerHTML = `
    <div class="obrazovka">${POHLEDY[pohled]()}</div>
    <nav class="lista" aria-label="Hlavní">
      ${LISTA.map((p) => `<button data-pohled="${p.id}" class="${p.id === pohled ? "ted" : ""}"
        aria-current="${p.id === pohled ? "page" : "false"}">
        ${ikona(p.ikona, 22)}<span class="popis">${p.popis}</span></button>`).join("")}
    </nav>
    ${oknoOtevrene ? oknoNastaveni() : ""}`;
  // při překreslení po zápisu nechceme skočit na začátek stránky
  window.scrollTo(0, posun);
  if (oknoOtevrene) document.getElementById("jmeno-party")?.focus();
}

/* ---------- ovládání ---------- */

el.addEventListener("click", (e) => {
  const cil = (s) => e.target.closest(s);

  const naPohled = cil("[data-pohled]");
  if (naPohled) { pohled = naPohled.dataset.pohled; vykresli(); window.scrollTo(0, 0); return; }

  const skoc = cil("[data-skoc]");
  if (skoc) { nastavHospodu(+skoc.dataset.skoc); pohled = "hra"; vykresli(); window.scrollTo(0, 0); return; }

  const pridej = cil("[data-pridej]");
  if (pridej) {
    const u = UKOLY.find((x) => x.id === pridej.dataset.pridej);
    if (pridejUkol(u)) odmena(`+${u.body}`);
    return;
  }
  const uber = cil("[data-uber]");
  if (uber) { uberUkol(UKOLY.find((x) => x.id === uber.dataset.uber)); return; }

  const prepni = cil("[data-prepni]");
  if (prepni) {
    const u = UKOLY.find((x) => x.id === prepni.dataset.prepni);
    if (kolikrat(u.id) > 0) uberUkol(u);
    else if (pridejUkol(u)) odmena(`+${u.body}`);
    return;
  }

  const barva = cil("[data-barva]");
  if (barva) {
    vybranaBarva = barva.dataset.barva;
    el.querySelectorAll("[data-barva]").forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.barva === vybranaBarva)));
    return;
  }

  const akce = cil("[data-akce]")?.dataset.akce;
  if (!akce) {
    // ťuknutí vedle okna ho zavře
    if (e.target.matches("[data-okno]")) { oknoOtevrene = false; vykresli(); }
    return;
  }
  switch (akce) {
    case "prichod":
      prepniZaklad("prichod");
      if (stav.prichod[stav.hospoda]) odmena();
      break;
    case "skopek":
      prepniZaklad("skopek");
      if (stav.skopek[stav.hospoda]) odmena();
      break;
    case "hospoda-plus": nastavHospodu(stav.hospoda + 1); window.scrollTo(0, 0); break;
    case "hospoda-min": nastavHospodu(stav.hospoda - 1); window.scrollTo(0, 0); break;
    case "na-ukoly": pohled = "ukoly"; vykresli(); window.scrollTo(0, 0); break;
    case "filtr": jenTady = true; vykresli(); break;
    case "filtr-vse": jenTady = false; vykresli(); break;
    case "nastaveni": oknoOtevrene = true; vybranaBarva = stav.parta.barva; vykresli(); break;
    case "zavri-okno": oknoOtevrene = false; vykresli(); break;
    case "uloz-partu": {
      const jmeno = document.getElementById("jmeno-party")?.value || "";
      nastavPartu(jmeno, vybranaBarva || stav.parta.barva);
      oknoOtevrene = false;
      vykresli();
      break;
    }
    case "vynulovat":
      if (confirm("Vynulovat všechny čárky a začít znovu? Tohle se nedá vrátit.")) {
        stav.prichod = {}; stav.skopek = {}; stav.ukoly = {}; stav.zlodej = {}; stav.hospoda = 1;
        uloz();
        pohled = "hra";
        vykresli();
        window.scrollTo(0, 0);
      }
      break;
  }
});

// odškrtnutí úkolu jde i z klávesnice
el.addEventListener("keydown", (e) => {
  if ((e.key === "Enter" || e.key === " ") && e.target.matches("[data-prepni]")) {
    e.preventDefault();
    e.target.click();
  }
  if (e.key === "Escape" && oknoOtevrene) { oknoOtevrene = false; vykresli(); }
});

/* ---------- start ---------- */

naZmenu(vykresli);
vykresli();
spustSync(vykresli);

// první spuštění: rovnou se zeptáme, jak si parta říká
if (!stav.parta.nazev) {
  oknoOtevrene = true;
  vybranaBarva = stav.parta.barva;
  vykresli();
}
