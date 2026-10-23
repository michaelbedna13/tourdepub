# Design

Zdroj pravdy v kódu: `src/styles/app.css` (tokeny jako CSS proměnné),
`src/components/` (čárky, štítky obtížnosti, ikony),
`scripts/kresli-ikony.mjs` → `src/lib/ikony.ts`.
Ergonomii ověřují Apple HIG skilly v `.claude/skills/` (kontext v
`.claude/apple-design-context.md`); vzhled si ale řídí tenhle soubor, HIG ho nepřepisuje.

## Scéna

Appka se používá **v noci, v hlučné hospodě, jednou rukou a po pár pivech.**
Z toho plyne všechno ostatní: tmavý podklad bez světlé varianty, velké terče,
nic schovaného pod dlouhým stiskem a žádná obrazovka, kde by se dalo něco splést.

## Barvy

Paleta je retro: tlumený podklad do modra a na něm čtyři syté barvy, které
si appka nevymýšlí — jsou z plakátové estetiky, ze které vychází celá hra.
Text je krémový, stejný jako logo.

| token | hodnota | kde |
|---|---|---|
| `--podklad` | `#151A20` | pozadí appky |
| `--vrstva` | `#1C222A` | plochy se seznamy a karty |
| `--vrstva-2` | `#242B34` | tlačítka, pole, kulatá tlačítka |
| `--text` | `#F2E7CF` | text, krémová z loga |
| `--text-2` | 66 % textu | popisy |
| `--text-3` | 47 % textu | drobnosti |
| `--linka` | 11 % textu | vlasové předěly |
| `--akce` | `#F2E7CF` | hlavní tlačítko, splněné odškrtávátko |
| `--na-akci` | `#151A20` | text na světlé ploše |

Podklad byl dřív skoro černý v jednom tónu (`#070E0A` až `#1C2D22`) a appka
z toho vycházela ponurá — mezi vrstvami nebyl rozdíl, co by se dal vidět.
Teď je základ znatelně světlejší a každá vrstva je o schod výš, takže je
poznat, co na čem leží.

Nižší úrovně textu jsou tónované do podkladu, ne do šedi.

### Obtížnost úkolu

První ze dvou míst, kde barva nese význam:

| | barva | |
|---|---|---|
| 1 půllitr | `--ob1` `#45B877` | Brnkačka |
| 2 půllitry | `--ob2` `#F9A204` | Větší haluz |
| 3 půllitry | `--ob3` `#FF6D54` | Betelná makačka |

Barva sama nikdy nestačí: vedle ní je vždycky **počet půllitrů i název**.
Kdo barvy nerozliší, pozná obtížnost stejně dobře (HIG: inclusive color).

Jsou to zesvětlené varianty barev kategorií — sytá zelená ani červená se na
tmavém podkladu nepřečte. **Obtížnost nemá vlastní odstín navíc** a nikdy
netónuje nic většího než svůj štítek: Mišák to výslovně nechtěl.

Všechny mají na podkladu kontrast hluboko nad WCAG AA. Při změně to musí projít znovu.

### Barva kategorie

Druhé místo, a tady barva nedrží jen štítek — **prostupuje celou obrazovkou
kategorie.**

| kategorie | barva | text na ní |
|---|---|---|
| Kecy a šméčka | `#006633` | `#F2E7CF` |
| Tělo v luftě | `#F9A204` | `#151A20` |
| Žranice a divadlo | `#E5331F` | `#F2E7CF` |

Bydlí v `KATEGORIE` v `src/lib/data.ts` (`barva` a `naBarve`), ne v CSS:
kategorie se dají měnit v appce, takže barva patří k datům. Obrazovka si ji
vezme jako `--kat` a dál se z ní míchá všechno ostatní (`color-mix`):

- nasvícení pozadí shora (14 %, dolů se ztrácí),
- dlaždice úkolů a karta detailu (18 % do vrstvy),
- kresba na nich (55 % do textu),
- tlačítko *Splněno* a počítadlo (36 %),
- barevná plocha v průpravě (70 %).

Barva textu nemůže být pro všechny tři stejná: zelená a červená jsou tmavé,
žlutá světlá. Proto má každá kategorie u sebe i `naBarve`.

Dvě barvy jsou v obou soustavách stejné (`#F9A204`). Aby se významy nepletly,
nestojí nikdy vedle sebe: na kartě kategorie není ani jeden štítek obtížnosti.

I tady platí, že barva sama nestačí: na kartě je vedle ní ikona kategorie,
její jméno i počet splněných úkolů.

### Barvy týmů

Třetí soustava, `BARVY` v `src/lib/stav.ts`. Nese jediné: čí je která parta.
Kreslí se jako tečka v liště a čtvereček na účtence, nikde jinde.

| | barva | odkud |
|---|---|---|
| 1 | `#E5331F` | červená z kategorie Žranice |
| 2 | `#F9A204` | žlutá z kategorie Tělo |
| 3 | `#45B877` | zelená, zesvětlená `#006633` |
| 4 | `#2E9BB5` | mořská, zesvětlená `#026C80` |
| 5 | `#F2E7CF` | krémová z loga |
| 6 | `#006633` | tmavá zeleň z loga |

Všechny jsou z palety appky, ne vedle ní. Dvě zeleně vedle sebe vadit
nemusí — liší se světlostí natolik, že se jako tečka o devíti pixelech
nespletou; losos z obtížnosti (`#FF6D54`) by se naopak s červenou pral.

Party založené dřív mají uloženou barvu z původní sady (písková, růžová).
Ta se při načtení překlopí na nejbližší **volnou** z palety — bez ohlídání
obsazených by obě skončily na krémové, protože k ní mají nejblíž obě.

### Zrno

Zrno leží ve **třech vrstvách** a bez nich appka vypadá jako vysázená z vektorů.

1. **Pod obsahem** (`body::before`, `zrno.svg`, 160 px, krytí 50 %, `soft-light`) —
   oživí holý podklad. Plochá tmavá barva bez něj působila jako plast.
2. **Nad vším, co appka nakreslí** (`.app::before`, to samé zrno, `soft-light`) —
   karty, účtenka i barevné plochy by jinak zůstaly hladké, protože spodní
   vrstva na ně nedosáhne. Leží uvnitř `.app`, takže na plachty v `<body>`
   (detail úkolu, okna) nesahá — ty mají být čisté.
3. **Tisk na barevných plochách** (`zrno-tisk.svg`, `multiply`): karty kategorií
   (`.kat-karta::after`) a papír účtenky (zamíchaný rovnou do podkladu, ne
   vrstva nad textem, ta by rozmazala tisk). Plná barva přes celou kartu
   vypadala jako výplň z tiskárny, ne jako plakát.
4. **Zmuchlání účtenky** (`papir-zmuchlany.svg`, `overlay`): nasvícený šum
   (`feDiffuseLighting`) dá hřbety a stíny jako na papíru, co ležel v kapse.
   Plocha bez hřbetu vychází na střední šedou (`diffuseConstant 0.5`), takže
   `overlay` nechá barvu papíru být a ukáže jen přehyby — při plném nasvícení
   se účtenka vybílí do skoro bílé.

Žádná z vrstev nechytá dotyk a žádná nic neanimuje.

## Písmo

**Jedna rodina na všechno.** Logo je kresba, ne font.

- **Hagrid** (Cosimo Lorenzo Pancini, Zetafonts) — nadpisy i text.
  Bere se z Adobe Fonts, kit je vložený v `index.html`.
- **Bricolage Grotesque 800 + Outfit** — záloha uložená přímo v appce.
  Když Adobe neodpoví, není signál nebo doména není v kitu povolená,
  vysází se text jimi a nic se nerozsype.
- **Psaná ruka v appce není.** Byla v popisech úkolů, pak už jen ve vyprávění.
  Ani tam nesedí: appka má být čistá, ne pomalovaná, a v malém se hůř čte.
- **Strojopis jen na účtence** (`ui-monospace`, písmo systému, nic se nestahuje).
  Je to jediná výjimka z jedné rodiny a je vědomá: účtenka bez strojopisu není
  účtenka, je to tabulka. Nikde jinde v appce se neobjeví.

Kit se načítá **stranou, ne jako blokující styl** (`media="print"` a `onload`).
Appka musí vykreslit tmavý podklad a logo hned, i kdyby Adobe neodpovídalo —
jinak se vrací přesně to bliknutí, co stálo takovou práci vymýtit.

Nadpisové písmo se vybírá podle toho, co appka opravdu sází: **názvy hospod
v hero kartě**. Archivo Black i Unbounded lámaly „Lucky Bastard" i „Na dobré
cestě" na dva řádky, Syne dokonce uprostřed slova („BLÁHOVK / A"). Při každé
výměně se to musí zkusit znovu, ne odhadovat z ukázky s latinkou — a zkontrolovat
`ť ď ě ů ř Ú Š Č Ž Ň`.

Nepoužívej přejmenované řezy („Outfit UI" byla šestistovka tvářící se jako
čtyřstovka). Vypadá to v kódu jako další rodina a plete to.

### Tři velikosti, nic mezi tím

| token | velikost | kde |
|---|---|---|
| `--t-drobne` | 13 px | štítky, odznaky, podřádky |
| `--t-text` | 15 px | popisy, nápovědy, vedlejší tlačítka |
| `--t-hlavni` | 17 px | názvy v řádcích, tlačítka, pole |

Bylo jich deset (12, 12,5, 13, 13,5, 14, 14,5, 15, 16, 16,5, 17). Rozdíl o půl
bodu nikdo nepřečte jako záměr — vypadá to jako nepořádek a drobné písmo navíc
nutí nacpat na obrazovku víc, než se tam má vejít. **Nová velikost se nepřidává**,
hledá se, která ze tří sedí.

Pole formuláře musí zůstat aspoň na 16 px, jinak iOS při ťuknutí stránku přiblíží.

Čísla mají `font-variant-numeric: tabular-nums` (třída `.cislo`), aby skóre
při přepočítání neposkakovalo.

**Pozor na české znaky.** Architects Daughter ani Shadows Into Light nemají
`ť` a `ď`, a ty jsou v textech úkolů všude („Hoďte", „ať", „flanďáka").
Prohlížeč je dosadí z náhradního písma a je to v řádku poznat. Při výměně
psacího fontu zkontroluj `ť ď ě ů ř Ú Š Č Ž Ň`; dělá to `scripts/stahni-pisma.mjs`.

## Hero karta štace

Obrazovka Hra stojí na jedné kartě, která nese **všechno o téhle štaci**:
kolikátá je, jak se jmenuje, kde jsme na trase a co se tu dá zapsat.
Dřív to byly čtyři samostatné bloky se stejnou vahou — číslo, název, trasa
a dvě obří tlačítka — takže nic nevedlo a hlavní informace zanikla.

- **Číslo štace** je kolečko v krémové, jediný plný prvek nahoře.
- **Název hospody** je největší text na obrazovce (`clamp(27px, 7.8vw, 38px)`,
  verzálky, těsné prostrkání). Je to hlavní věc, kterou tam člověk hledá.
  Dlouhý název se zalomí do tří řádků a karta se roztáhne.
- **Posun po trase je švih do boku.** Karty všech štací stojí vedle sebe
  v pásu se `scroll-snap`; další vykukuje zpoza okraje, takže je vidět, že
  se tam dá sáhnout. V hospodě jednou rukou je švih rychlejší a spolehlivější
  než mířit na malý terč. Kulatá šipková tlačítka v rohu karty zůstala pro myš
  a pro jistotu — gesto, které nemá viditelnou obdobu, by někdo nenašel (HIG).
  Štace se přepne, **až posun ustane**: jinak by jeden švih přepsal stav týmu
  devětkrát za sebou.
- **Vykukující karta je ztlumená** na 45 % krytí, ať je jasné, která platí.
- **Která karta platí, si pás drží sám** a přepíná to v okamžiku, kdy se karta
  dostane do obrazu; do stavu týmu se to zapíše až po dojetí. Dřív se čekalo
  na obojí a karta se rozsvítila skoro vteřinu po švihu — vypadalo to, jako by
  se něco načítalo.
- **Zápis** jsou dvě odškrtávátka na dně karty, ne dvě plná tlačítka. Je to
  seznam dvou věcí, co se v každé špeluňce zapisují — tak ať to tak vypadá.
  Kolečko se při splnění zaplní krémovou, stejně jako u úkolů.
- **Název drží místo na dva řádky**, i když se vejde na jeden. Karty v pásu
  jsou stejně vysoké podle té nejdelší a bez toho by u kratších názvů zůstala
  díra a odškrtávátka by při švihu skákala nahoru a dolů.
- **Šipky jsou tiché** — bez plochy, v barvě drobného textu. Hlavní cesta je
  švih; šipky jsou záloha, ne nabídka.
- **Žádný vodoznak.** V dolním rohu karty bývaly čárky na 5 % krytí. Ležely
  přesně za texty odškrtávátek a na tmavém podkladu z nich byla šmouha, ne
  ozdoba. Čárky mají svoje místo ve skóre, kde něco znamenají.

Pod kartou jde skóre, pak pořadí týmů, pak úkoly — každý blok tišší než
ten nad ním.

### Úklid podle HIG

Karta nesla čtyři věci naráz: obrovský obrys čísla štace za nadpisem, jméno,
pruh trasy s „4/9" a řádku s časem. Obrys lezl přes jméno i přes pruh, takže
se nedalo poznat, co je na kartě hlavní — proti zásadě *obsah před ozdobou*
a *dát hlavní věci dost místa* (HIG: Layout → Visual hierarchy).

Číslo štace se proto přesunulo nahoru jako **tiché nadočko** („4. štace z 9").
Nese tu samou informaci, nic nepřekrývá, a odpadlo s ním „4/9" u pruhu —
jeden údaj dvakrát na jedné kartě. Pruh trasy je vlasový, šipky tišší.
Zůstala jedna osa shora dolů: číslo → jméno → trasa → čas → zápis.

## Navigace

Dvě cesty na to samé: **švih do boku** a **hamburger vpravo nahoře**.

Švih je rychlejší a v hospodě jednou rukou přirozený, ale je neviditelný —
kdo ho nezkusí, nenajde ho. Proto je vedle něj pořád tlačítko (HIG: gesto,
které nemá viditelnou obdobu, nesmí být jediná cesta).

Pořadí je stejné jako v menu: Hra → Úkoly → Týmy → Hospody → Pravidla.
Uvnitř kategorie se švihem chodí **mezi kategoriemi**, ne na jinou obrazovku —
tam člověk zrovna prochází úkoly a skok na Hospody by byl překvapení.

Švih se chytí, až je jasné, že je vodorovný (12 px a půldruhákrát víc do boku
než dolů); jakmile se jednou rozhodne pro svislý, už se nechytne, aby šikmý
tah nehýbal obrazovkou při obyčejném scrollování. Na vodorovných pásech uvnitř
obrazovky (hero karty, `[data-vodorovne]`) se nechytá vůbec — tam si švih řeší
pás sám.

Mezi obrazovkami se chodí **hamburgerem vpravo nahoře**, ne spodní lištou.
Lišta zabírala pruh přes celou šířku na každé obrazovce a z pěti obrazovek se
při hře používají hlavně dvě; teď je místo pro obsah.

Samotné rozcestí ale **vyjíždí zespodu**, jako ostatní okna. Horní roh je pro
palec ten nejhorší kus obrazovky a ťuká se do toho jednou rukou v hospodě —
tak ať je tam nahoře jenom spoušť a terče dole. Položka, na které zrovna jsi,
má světlejší plochu a fajfku; ťuknutí na ni jen zajede nahoru.

## Hierarchie tlačítek

Tři váhy, aby bylo poznat, co je hlavní akce:

1. **Hlavní** (`.tl.hlavni`) — světlá plocha, tmavý text, 58 px. Na obrazovce
   jsou nejvýš dvě a stojí ve vlastním bloku s odstupem.
2. **Hotová** (`.tl.hotovo`) — jen obrys. Splněná akce nesmí konkurovat nesplněné.
3. **Vedlejší** (`.tl.tise`) — bez plochy.

Posun po trase jsou **kulatá tlačítka v hlavičce štace**, ne tlačítka přes celou
šířku. Dřív stála hned nad hlavními akcemi a měla s nimi stejnou váhu, takže
nebylo poznat, co je důležité.

## Logo

Slovní značka je obtažená z kresby do drah (`scripts/prevod-loga.py` →
`logo.svg` a `src/lib/logo.ts`). Kreslí se `currentColor`, takže funguje na tmavém
i světlém podkladu.

**V rozhraní není.** Stála v horní liště vedle pilulky týmu a nefungovalo to:
je trojřádková, s rozervaným okrajem a bez jasné účaří, takže vedle úhledné
pilulky neměla co zarovnat, a protože seděla vlevo nahoře, prala se o místo
s nadpisem obrazovky. Výsledkem byly dva titulky nad sebou a ten skutečný
vypadal podřadně.

Značku teď nese **ikona appky**, **úvodní obrazovka při spuštění**
(`public/uvodni/`, generuje `scripts/uvodni-obrazovky.mjs`) a **patička Pravidel**,
kde stojí potichu na 30 % krytí. V horní liště je nadpis obrazovky vlevo
a vpravo tým s hamburgerem; na Hře nadpis chybí schválně — tam vede název
hospody na hero kartě a dva titulky nad sebou by si konkurovaly.

## Plochy a předěly

Obsah před ozdobami. Plochy jsou **ploché** — žádné přechody, žádné zrno, žádné
rámečky kolem karet. Oddělují je jen **vlasové linky** (`--linka-sl`) a odsazení.
Jediné zaoblení: 16 px plochy, 11 px pole, pilulka tlačítka.

Stínů je v celé appce minimum. Na tmavém podkladu nefungují a dělají nepořádek.

## Rozměry

Vzdušnost nedělá jedna velká mezera, ale **důsledný rytmus a málo prvků**:
`--mezera` (44 px) mezi sekcemi, `--vnitrek` (22 px) uvnitř ploch, rádius 24 px.
Když se obrazovka pořád zdá nacpaná, nepomůže přidat padding — pomůže ubrat
prvek. Proto na Hře zmizelo pořadí týmů, dokud hraje jedna parta: „vede, odstup
0" je jen řádek navíc.

- Jeden sloupec, okraj 20 px, max. šířka 540 px (na počítači uprostřed).
- Dotykové terče aspoň 44 px. Hlavní tlačítko 54 px, běžné 50 px,
  kulaté v řádku 36 px s odsazením okolo.
- Okna a rozcestí vyjíždějí od spodní hrany a respektují `safe-area-inset-bottom`.

## Úvod po spuštění

Běží **po každém spuštění** a vždycky jde přeskočit. Je to Mišákovo zadání:
appka se otvírá jednou za večer a úvod je kus té hry, ne překážka. *Přeskočit*
je proto pořád na očích, od první vteřiny, a ťuknutí kamkoli posune dál.

**Celý úvod je jedna neprůhledná vrstva** a uvnitř se jen přepíná obsah.
Dřív to byly dvě vrstvy přes sebe — statické logo odcházelo prolnutím a průprava
se zároveň zjevovala, takže mezi nimi na okamžik prosvítala appka.

**1. Značka.** Při spuštění z plochy ukáže iOS obrázek z `public/uvodni/`, hned po
něm naváže logo ve stránce (`#uvod` v `index.html`), aby bylo vidět dřív, než se
stáhne a spustí skript. React pak vykreslí svoje logo na přesně stejné místo
a statické odklidí v tom samém snímku. Proto se v `index.html` **nic neprolíná
ani nemění velikost**: React může převzít kdykoli a uprostřed prolnutí by jasnost
loga skočila z půlky na plnou.

Obě loga stojí na **pevných pixelech ze skriptu** (`--uvod-y`, `--uvod-w`),
ne na procentech okna, a obě jsou `position: fixed`. Tři důvody, všechny
vyzkoušené měřením (`největší posun při předání` musí být 0 px):

- iPhone při spuštění z plochy **ještě dorovnává výšku okna**, takže střed
  obrazovky se posune a logo na 50 % poskočí. Proto se střed počítá ze
  `screen.height`, ne z `innerHeight`, když appka běží z plochy.
- Jednotka `vw` se mění, **jakmile se objeví posuvník** — a ten se objeví
  přesně ve chvíli, kdy se pod úvodem vykreslí appka. Logo by tím při předání
  změnilo šířku.
- `absolute` by počítalo od odsazení rodiče, `fixed` od okna. Obě loga musí
  mít stejný počátek.

**Pod úvodem je appka schovaná** (`html.uvodni .app{visibility:hidden}`).
Na iOS umí jinak skleněné plochy (`backdrop-filter`) na okamžik probliknout
přes překryv; tahle pojistka je převzatá z osobní appky, kde se to řešilo dřív.
`visibility`, ne `display`: skrytý obsah se pořád rozměřuje, takže hero pás zná
své pozice a po odkrytí nemusí nic dopočítávat. A schovává se `.app`, ne `#app`
— úvod React kreslí dovnitř `#app` vedle `.app`, takže schovat celé `#app`
znamená schovat i úvod.

Značka odejde, až platí všechno tohle naráz: **uběhlo 1700 ms od načtení**,
**aspoň 1000 ms od startu Reactu** a **písma jsou načtená**. Každá podmínka
řeší jedno bliknutí:

- bez toho minima by na rychlém telefonu jen bliklo;
- bez minima od startu Reactu by se na pomalé síti (kde se stránka načítá dýl
  než 1700 ms) značka ukázala a ve stejném okamžiku zase odešla, takže by se
  čárky nestihly dokreslit — záblesk;
- `document.fonts.ready` na písma nestačí. Slibuje jen, že doběhlo, co si
  stránka **už vyžádala**, a dokud svítí logo, nic Bricolage ani psanou ruku
  nepoužívá. Proto se o ně musí říct ručně (`document.fonts.load`), jinak se
  průprava vysází náhradním písmem a po chvilce přeskočí do správného.

Logo přijede z 90 % velikosti a zespodu, odchází lehkým zvětšením; obsah se pod
ním zároveň zvedne o 8 px. Jeden pohyb, ne efekty.

**2. Průprava.** Čtyři stránky: ikona, nadpis a jedna věta. **Žádná se nepřehodí
sama** — dál se jde ťuknutím kamkoli na obrazovku, švihem do boku nebo popiskem
*Dál* dole. Ten popisek **není tlačítko**: je to tichý text bez plochy, protože
ťuknout jde stejně kamkoli a svítící pilulka dole by přetahovala pozornost
z toho, co se má přečíst. Proužky dole říkají, kolik
toho zbývá; úvod, u kterého není vidět konec, je otrava.

Stránka přichází **jako jeden kus**, o 160 ms později, než začne odcházet značka.
Dřív měl každý kousek vlastní zpoždění a tlačítko naskočilo rovnou na plno, takže
byl snímek, kde svítilo tlačítko nad skoro prázdnou obrazovkou. Prodleva proti
značce je tak dlouhá, aby mezi nimi nebyl prázdný snímek, ale ani aby text neležel
přes logo.

Na konci se úvod **vytratí**, nevypne se střihem.

**Podklad a rozměr loga jsou i v hlavičce `index.html`**, ne jen v `app.css`.
Než se stylopis stáhne, kreslí prohlížeč bílou a na tmavé appce to zabliká.

Logo je v `index.html` **vykreslené jako dráha**, ne jako `<img>`. Samostatný
soubor dorazí až po prvním vykreslení stránky, takže mezi úvodní obrazovkou iOS
(na které logo je) a naším logem bliklo černo — změřeno: box loga už stál na
místě, ale obrázek ještě nedorazil. Takhle se vykreslí s první stránkou a žádný
požadavek navíc není. Dráhu mezi značky `<!-- logo:start/end -->` píše
`scripts/prevod-loga.py`, ručně se needituje.

## Pohyb

Jeden okamžik, ne efekty všude: po zápisu čárky **vyletí `+1`** a zmizí.
Okna vyjíždějí zespodu. Všechno ostatní je jen krátký přechod stavu.
Křivka `cubic-bezier(.32,.72,0,1)`. `prefers-reduced-motion` všechno vypíná.

## Ikony

Tlusté siluety s průhlednými výstřižky, obrys křivý jako stříhaný tupýma nůžkama.
Generuje je `scripts/kresli-ikony.mjs`, ručně se needitují.

Tenké tahy se v malém slijí, proto je všechno tlusté. Kymácení okraje se musí
krotit podle velikosti tvaru: na proužcích hamburgeru (15 jednotek na výšku)
běžná hodnota 2,2 rozvlnila okraj tak, že se tři proužky slily do vlnovky.
Nová ikona se vždycky zkontroluje v malém, ne jen ve velkém.

Žádné emoji ani unicode znaky místo ikon.

## Čárky

Skóre se vedle číslice kreslí i jako **čárky, jak se počítaly v hospodě** — čtyři
svislé a pátá přes ně. Každá je jinak nakloněná a jinak dlouhá, ať to vypadá psané
rukou, ne vysázené. Je to jediný dekorativní prvek v appce a nese celé téma,
proto jinde žádná hospodská ozdoba není.

## Karty úkolů

Dlaždice v galerii a detail jsou **jedna a ta samá karta, jen větší**. Obě
stojí na stejném rozvržení, převzatém z plakátových karet: nahoře obraz,
dole text, a to, co se dá udělat, je u textu — ne nad obrazem.

**Dlaždice** (`KartaUkolu`): kresba si vezme volné místo nahoře, pod ní jméno
přes celou šířku a úplně dole řádka s čárkami a čtverečkem, co zapisuje.
Jméno musí mít celou šířku, jinak se láme uprostřed slova („Vyžebran / ej
chudák"). Čtvereček je čtvercový schválně — kolečka v appce odškrtávají,
tohle přidává.

**Detail** (`DetailUkolu`): nahoře vlevo kresba, vpravo to, co se s úkolem
dá udělat (čtvereček u jednorázového, počítadlo u opakovatelného). Pak vzduch
a dole všechen text: jméno, zadání, poznámka, pod tenkou linkou obtížnost
a kolik za to padne. Vpravo dole je **decentní šipka**, když má zadání víc
stránek; listuje se ťuknutím do textu, šipka jen říká, že je kam.

Kresba je v detailu schválně malá (124 px). Dokud si brala celou horní
polovinu, byla z karty ilustrace s popiskem, ne zadání úkolu.

Výška karty jde podle obsahu, se spodní mezí 420 px. Napevno musela být,
dokud byla kresba velká — jinak vypadala každá karta jinak. Teď je kresba
ukotvená nahoře, takže krátkému zadání sluší nízká karta líp než půl
obrazovky prázdna.

## Účtenka

Pořadí part je **účtenka z hospody**. Stojí na dvou místech: na Týmech,
kde se party přepínají a upravují, a na Hře pod kartami kategorií, protože
tam se za večer kouká nejvíc a chodit si pro pořadí přes menu nikdo nebude.
Na Hře je bez tužky — upravuje se na Týmech. Vypadá takhle: světlý papír, tmavý
inkoust, roztržený okraj nahoře i dole, tečkované vodiče mezi položkou a
číslem, tučný součet a dole čárky místo čárového kódu. Je to **jediné místo
v appce, kde se kreslí světlý podklad** — papír je `--text` a inkoust
`--podklad`, takže z palety neutíká, jen si ji prohodí.

Proč zrovna účtenka: rozpad čárek (za špeluňky, za škopky, za srandy) stával
u skóre na Hře, kde se nedal s nikým srovnat a vedle velkého čísla byl spíš
šum. Tady dává smysl, protože party stojí pod sebou. A účtenka je jediná
tabulka, co v hospodě nikoho nepřekvapí.

Vedoucí parta dostane **razítko „VEDE“** — ten samý rámeček od ruky jako
„HOTOVO“ na hero kartě. Leží přes tečkované vodiče, ne přes čísla, takže
nic nezakryje, a naskočí až od první čárky: na začátku večera nikdo nevede.

## Plochy, které jsme nekreslili

Označení textu, kurzor, obrys při procházení klávesnicí a posuvník mají vlastní
barvy z palety. Nechat je na výchozím vzhledu prohlížeče by byla jediná místa,
kde appka vypadá jako nedodělaná stránka.
