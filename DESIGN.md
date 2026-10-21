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

Rozhraní stojí na dvou barvách: skoro černá zeleň a krémová z loga.
**Akcentní barva žádná není.** Hlavní akce je světlá plocha s tmavým textem,
stejně jako logo — černá na krémové.

| token | hodnota | kde |
|---|---|---|
| `--podklad` | `#070E0A` | pozadí appky, skoro černá zeleň |
| `--vrstva` | `#0D1711` | plochy se seznamy |
| `--vrstva-2` | `#152219` | tlačítka, pole, kulatá tlačítka |
| `--text` | `#EFEBE0` | text, krémová z loga |
| `--text-2` | 62 % textu | popisy |
| `--text-3` | 38 % textu | drobnosti |
| `--linka` | 10 % textu | vlasové předěly |
| `--akce` | `#EFEBE0` | hlavní tlačítko, splněné odškrtávátko |
| `--na-akci` | `#070E0A` | text na světlé ploše |

Dřív tu byla limetka jako akcent. Vypadla — bez ní nese důraz jen světlost,
což je přísnější a barvu to uvolní pro jedinou věc, která ji opravdu potřebuje.

Nižší úrovně textu jsou tónované do podkladu, ne do šedi.

### Obtížnost úkolu

První ze dvou míst, kde barva nese význam:

| | barva | |
|---|---|---|
| 1 půllitr | `--ob1` `#7FD4C1` | Brnkačka |
| 2 půllitry | `--ob2` `#F2C14E` | Větší haluz |
| 3 půllitry | `--ob3` `#F2765A` | Betelná makačka |

Barva sama nikdy nestačí: vedle ní je vždycky **počet půllitrů i název**.
Kdo barvy nerozliší, pozná obtížnost stejně dobře (HIG: inclusive color).
Barvy týmů jsou zvlášť a schválně se s těmito třemi nepotkávají.

Všechny mají na podkladu kontrast hluboko nad WCAG AA. Při změně to musí projít znovu.

### Karty kategorií

Druhé místo. Obrazovka Úkoly je rozcestí: tři velké karty, každá v plné barvě
s tmavým textem (`--na-akci`, kontrast přes 10:1) a velkou ikonou jako vodoznakem.

| kategorie | barva |
|---|---|
| Kecy a šméčka | `--ob1` `#7FD4C1` |
| Tělo v luftě | `--ob2` `#F2C14E` |
| Žranice a divadlo | `--ob3` `#F2765A` |

**Jsou to schválně ty samé tři odstíny jako u obtížnosti.** Přidat další tři by
znamenalo šest barev v appce, která žádnou akcentní nemá — a to by vzalo barvě
všechnu váhu. Aby se dva významy nepletly, nestojí nikdy vedle sebe:

- na kartě kategorie není ani jeden štítek obtížnosti;
- v seznamu úkolů zůstane z barvy kategorie jen **čtyřpixelová čárka nad nadpisem**,
  nic dalšího se jí netónuje — význam tam nesou půllitry.

I tady platí, že barva sama nestačí: na kartě je vedle ní ikona kategorie,
její jméno i počet splněných úkolů.

### Zrno

Přes celou appku leží jemné zrno (`src/assets/zrno.svg`, 160 px, krytí 50 %, režim
`soft-light`). Leží nad podkladem a pod obsahem a nereaguje na dotyk.
Plochá tmavá barva bez něj působila jako plast.

## Písmo

**Dvě rodiny na všechno a jedna navíc jen na vyprávění.** Logo je kresba, ne font.

- **Bricolage Grotesque 800** — nadpisy, vždycky verzálkami.
- **Outfit** — všechno ostatní: ovládání, popisy úkolů, čísla, nápovědy.
  Řezy 400 / 500 / 600.
- **Gloria Hallelujah** — **jen** úvod po spuštění a první odstavce Pravidel.

Dřív se psaná ruka nacházela i v popisech úkolů, v nápovědách pod nadpisy,
v oknech a v prázdných stavech. Na jedné obrazovce se pak potkala tři písma
a bylo to cítit jako nepořádek, ne jako nálada — navíc se psaná ruka hůř čte
v malém a v hospodě po pár pivech. Teď je to **jediný hlas navíc a jen tam,
kde se vypráví**.

Nadpisové písmo se vybíralo podle toho, co appka opravdu sází: **názvy hospod
v hero kartě**. Archivo Black i Unbounded lámaly „Lucky Bastard" i „Na dobré
cestě" na dva řádky, Syne dokonce uprostřed slova („BLÁHOVK / A"). Bricolage
se vejde na jeden řádek u všech devíti. Při výměně se to musí zkusit znovu,
ne odhadovat z ukázky s latinkou.

Nepoužívej přejmenované řezy („Outfit UI" byla šestistovka tvářící se jako
čtyřstovka). Vypadá to v kódu jako čtvrtá rodina a plete to.

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
- **Vodoznak z čárek** v dolním rohu je jediná ozdoba na kartě. Nese téma hry
  a je na 5 % krytí. Nahoře se pral se šipkami a vypadal jako šmouha.

Pod kartou jde skóre, pak pořadí týmů, pak úkoly — každý blok tišší než
ten nad ním.

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

- Jeden sloupec, okraj 18 px, max. šířka 540 px (na počítači uprostřed).
- Dotykové terče aspoň 44 px. Hlavní tlačítko 54 px, běžné 50 px,
  kulaté v řádku 36 px s odsazením okolo.
- Okna a rozcestí vyjíždějí od spodní hrany a respektují `safe-area-inset-bottom`.

## Úvod po spuštění

Běží **po každém spuštění** a vždycky jde přeskočit. Je to Mišákovo zadání:
appka se otvírá jednou za večer a úvod je kus té hry, ne překážka. *Přeskočit*
je proto pořád na očích, od první vteřiny, a ťuknutí kamkoli posune dál.

**1. Logo.** Při spuštění z plochy ukáže iOS obrázek z `public/uvodni/`, hned po něm
naváže vlastní obrazovka ve stránce (`#uvod`). Obě mají stejný podklad a logo ve
stejném poměru (52 % šířky), takže přechod neposkočí. React logo nekreslí — kreslí
ho rovnou `index.html`, aby bylo vidět dřív, než se stáhne a spustí skript; `<Uvod>`
nad ním drží jen *Přeskočit* a pak ho odklidí.

Odejde, až platí všechno tohle naráz: **uběhlo 1100 ms od načtení**, **logo je
načtené** a **písma jsou načtená**. Každá podmínka řeší jedno bliknutí:

- bez toho minima by na rychlém telefonu jen bliklo;
- animace se spouští teprve `data-nacteno` z `onload` obrázku — jinak by běžela
  nad prázdným místem, obrázek by dorazil později a logo by jen naskočilo;
- bez čekání na písma by text pod obrazovkou po jejím odchodu přeskočil.

Logo přijede z 90 % velikosti a zespodu, odchází lehkým zvětšením; obsah se pod
ním zároveň zvedne o 8 px. Jeden pohyb, ne efekty.

**2. Průprava.** Tři stránky: ikona, nadpis a jedna věta psanou rukou. Přehazují se
samy po 2,4 s, ťuknutím nebo švihem; poslední má *Jedeme*. Tři proužky dole říkají,
kolik toho zbývá — úvod, u kterého není vidět konec, je otrava. Na každé stránce
se hýbe jedna věc po druhé (ikona, nadpis, text), ne všechno naráz.

**Podklad a rozměr loga jsou i v hlavičce `index.html`**, ne jen v `app.css`.
Než se stylopis stáhne, kreslí prohlížeč bílou a na tmavé appce to zabliká.

Logo je tu jako `<img src="logo-uvodni.svg">` s barvou zapečenou napevno.
V `<img>` si `currentColor` vzít nejde, vyšel by černý. Proto je ta varianta
zvlášť a generuje se spolu s ostatními.

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

## Plochy, které jsme nekreslili

Označení textu, kurzor, obrys při procházení klávesnicí a posuvník mají vlastní
barvy z palety. Nechat je na výchozím vzhledu prohlížeče by byla jediná místa,
kde appka vypadá jako nedodělaná stránka.
