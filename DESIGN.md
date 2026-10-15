# Design

Zdroj pravdy v kódu: `styl.css` (tokeny jako CSS proměnné), `ui.js` (čárky, štítky
obtížnosti, ikony), `scripts/kresli-ikony.mjs` → `ikony.js`.
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
| `--akce` | `#EFEBE0` | hlavní tlačítko, aktivní položka lišty |
| `--na-akci` | `#070E0A` | text na světlé ploše |

Dřív tu byla limetka jako akcent. Vypadla — bez ní nese důraz jen světlost,
což je přísnější a barvu to uvolní pro jedinou věc, která ji opravdu potřebuje.

Nižší úrovně textu jsou tónované do podkladu, ne do šedi.

### Obtížnost úkolu

Jediné místo, kde barva nese význam:

| | barva | |
|---|---|---|
| 1 půllitr | `--ob1` `#7FD4C1` | Brnkačka |
| 2 půllitry | `--ob2` `#F2C14E` | Větší haluz |
| 3 půllitry | `--ob3` `#F2765A` | Betelná makačka |

Barva sama nikdy nestačí: vedle ní je vždycky **počet půllitrů i název**.
Kdo barvy nerozliší, pozná obtížnost stejně dobře (HIG: inclusive color).
Barvy týmů jsou zvlášť a schválně se s těmito třemi nepotkávají.

Všechny mají na podkladu kontrast hluboko nad WCAG AA. Při změně to musí projít znovu.

### Zrno

Přes celou appku leží jemné zrno (`zrno.svg`, 160 px, krytí 50 %, režim
`soft-light`). Leží nad podkladem a pod obsahem a nereaguje na dotyk.
Plochá tmavá barva bez něj působila jako plast.

## Písmo

Tři řezy, každý má svou práci. Logo je kresba, ne font.

- **Archivo Black** — nadpisy a velká čísla, vždycky verzálkami. Těžký grotesk,
  aby nadpis měl váhu.
- **Gloria Hallelujah** — popisy úkolů, vysvětlivky, pravidla. Psaná ruka sedí
  k hospodě. **Nikdy na ovládání** — tlačítka a popisky musí zůstat jednoznačné.
- **Outfit** — ovládání, názvy a čísla.

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
- **Název hospody** je největší text na obrazovce (`clamp(29px, 8.6vw, 40px)`,
  verzálky, těsné prostrkání). Je to hlavní věc, kterou tam člověk hledá.
  Dlouhý název se zalomí do tří řádků a karta se roztáhne.
- **Posun po trase** jsou kulatá tlačítka v rohu karty, ne tlačítka přes celou
  šířku pod ní.
- **Zápis** jsou dvě odškrtávátka na dně karty, ne dvě plná tlačítka. Je to
  seznam dvou věcí, co se v každé špeluňce zapisují — tak ať to tak vypadá.
  Kolečko se při splnění zaplní krémovou, stejně jako u úkolů.
- **Vodoznak z čárek** v dolním rohu je jediná ozdoba na kartě. Nese téma hry
  a je na 5 % krytí. Nahoře se pral se šipkami a vypadal jako šmouha.

Pod kartou jde skóre, pak pořadí týmů, pak úkoly — každý blok tišší než
ten nad ním.

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
`logo.svg` a `logo.js`). Kreslí se `currentColor`, takže funguje na tmavém
i světlém podkladu.

**V rozhraní není.** Stála v horní liště vedle pilulky týmu a nefungovalo to:
je trojřádková, s rozervaným okrajem a bez jasné účaří, takže vedle úhledné
pilulky neměla co zarovnat, a protože seděla vlevo nahoře, prala se o místo
s nadpisem obrazovky. Výsledkem byly dva titulky nad sebou a ten skutečný
vypadal podřadně.

Značku teď nese **ikona appky**, **úvodní obrazovka při spuštění**
(`uvodni/`, generuje `scripts/uvodni-obrazovky.mjs`) a **patička Pravidel**,
kde stojí potichu na 30 % krytí. Horní lištu drží nadpis obrazovky vlevo
a tým vpravo; na Hře je vlevo místo nadpisu „ŠTACE 2 Z 9".

## Plochy a předěly

Obsah před ozdobami. Plochy jsou **ploché** — žádné přechody, žádné zrno, žádné
rámečky kolem karet. Oddělují je jen **vlasové linky** (`--linka-sl`) a odsazení.
Jediné zaoblení: 16 px plochy, 11 px pole, pilulka tlačítka.

Stínů je v celé appce minimum. Na tmavém podkladu nefungují a dělají nepořádek.

## Rozměry

- Jeden sloupec, okraj 18 px, max. šířka 540 px (na počítači uprostřed).
- Dotykové terče aspoň 44 px. Hlavní tlačítko 54 px, běžné 50 px,
  kulaté v řádku 36 px s odsazením okolo.
- Spodní lišta je přisazená ke spodku, průsvitná s rozmazáním a vlasovou linkou
  nahoře, pět položek. Respektuje `safe-area-inset-bottom`.

## Úvodní obrazovka

Při spuštění z plochy ukáže iOS obrázek z `uvodni/`, hned po něm naváže
vlastní obrazovka ve stránce (`#uvod`). Obě mají stejný podklad a logo ve
stejném poměru (52 % šířky), takže přechod neposkočí.

Odejde, až platí všechno tohle naráz: **uběhlo 1050 ms od načtení**, **logo je
aspoň 550 ms vidět** a **písma jsou načtená**. Každá podmínka řeší jedno bliknutí:

- bez toho minima by na rychlém telefonu jen bliklo;
- animace se spouští teprve `data-nacteno` z `onload` obrázku — jinak by běžela
  nad prázdným místem, obrázek by dorazil později a logo by jen naskočilo;
- bez čekání na písma by text pod obrazovkou po jejím odchodu přeskočil.

Logo přijede z 90 % velikosti a zespodu, odchází lehkým zvětšením; obsah se pod
ním zároveň zvedne o 8 px. Jeden pohyb, ne efekty.

**Podklad a rozměr loga jsou i v hlavičce `index.html`**, ne jen ve `styl.css`.
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

Tenké tahy se v malém slijí, proto je všechno tlusté — ikony se používají i ve 20 px
ve spodní liště. Nová ikona se vždycky zkontroluje v malém, ne jen ve velkém.

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
