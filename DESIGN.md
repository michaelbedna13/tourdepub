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

Celé rozhraní stojí na třech barvách. Čtvrtá a pátá se objeví jen u obtížnosti úkolu.

| token | hodnota | kde |
|---|---|---|
| `--podklad` | `#0C1711` | pozadí appky, černě zelená |
| `--vrstva` | `#111E17` | plochy se seznamy a kartami |
| `--vrstva-2` | `#17281F` | tlačítka, pole, kulatá tlačítka v řádku |
| `--text` | `#ECEBE4` | text, off white (ne čistá bílá) |
| `--text-2` | 64 % textu | popisy, podtitulky |
| `--text-3` | 40 % textu | drobnosti, stavy bez důrazu |
| `--linka` | 10 % textu | vlasové předěly mezi řádky |
| `--akcent` | `#C3F53C` | **jediný akcent** — limetka |
| `--na-akcentu` | `#0C1711` | text na limetkové ploše |

Akcent nese jen čtyři věci: **hlavní tlačítko, skóre, aktivní položku v liště
a aktuální dílek trasy.** Nic jiného limetkové není, jinak přestane fungovat jako důraz.

Nižší úrovně textu jsou tónované do podkladu, ne do šedi — šedá na barevné ploše
vypadá špinavě.

### Obtížnost úkolu

Jediné místo, kde barva nese význam:

| | barva | |
|---|---|---|
| 1 půllitr | `--ob1` `#7FD4C1` | Brnkačka |
| 2 půllitry | `--ob2` `#F2C14E` | Větší haluz |
| 3 půllitry | `--ob3` `#F2765A` | Betelná makačka |

Barva sama nikdy nestačí: vedle ní je vždycky **počet půllitrů i název**.
Kdo barvy nerozliší, pozná obtížnost stejně dobře (HIG: inclusive color).

Všechny barvy mají na podkladu kontrast přes 6,5 : 1, tedy WCAG AA i pro běžný text.
Při změně barvy to musí projít znovu.

## Písmo

- **Bevan** — jen slovní značka „Tour de Pub" v hlavičce. Nikde jinde.
- **Outfit** — všechno ostatní. 400 text, 500 ovládání a názvy, 600 nadpisy a čísla.

Čísla mají `font-variant-numeric: tabular-nums` (třída `.cislo`), aby skóre při
přepočítání neposkakovalo.

Dřív byl Bevan i na nadpisech. Na obrazovce plné seznamů to bylo těžkopádné,
proto zůstal jen na značce, kde dělá charakter, a nadpisy nese Outfit.

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
