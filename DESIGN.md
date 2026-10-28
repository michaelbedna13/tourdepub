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
| `--podklad` | `#2B2B23` | pozadí appky, „night forest" |
| `--vrstva` | `#33332B` | plochy se seznamy a karty |
| `--vrstva-2` | `#3C3C33` | tlačítka, pole, kulatá tlačítka |
| `--text` | `#F2E7CF` | text, krémová z loga |
| `--text-2` | 66 % textu | popisy |
| `--text-3` | 47 % textu | drobnosti |
| `--linka` | 11 % textu | vlasové předěly |
| `--akce` | `#F2E7CF` | hlavní tlačítko, splněné odškrtávátko |
| `--na-akci` | `#2B2B23` | text na světlé ploše |

Podklad byl dřív skoro černý v jednom tónu (`#070E0A` až `#1C2D22`) a appka
z toho vycházela ponurá — mezi vrstvami nebyl rozdíl, co by se dal vidět.
Pak byla modrošedá `#151A20`, a to byla jediná studená barva v celé paletě:
retro karty na ní vypadaly jako nálepky nalepené na moderní appku. Teď je
to **tmavá olivová**, jediná teplá tmavá, co s plakátovými barvami drží.
Každá vrstva je o schod výš, takže je poznat, co na čem leží.

### Barva štace

Čtvrtá soustava, `BARVY_HOSPOD` v `src/lib/data.ts`. Každá hospoda má svou
barvu, vybírá se při zakládání a dá se změnit tužkou. Kreslí **celou hero
kartu**: ta je v barvě štace od kraje ke kraji, s lehkým přechodem do tmava.
Dřív to byla barva naředěná na devět procent do podkladu a devět štací
vypadalo jako devět stejných karet.

Píše se na ni **krémem, na všech štacích stejně** — jméno hospody má vypadat
pokaždé stejně. To znamená, že barva musí do tmy: `tonHospody()`
v `src/lib/barva.ts` ji stáhne pod mez, kde krém drží kontrast 4,5:1.
Nesráží je ale všechny na jednu světlost, jen je **přemapuje do pásma**
(0,075–0,132) — kdyby skončily na jedné hodnotě, florida, zlatý samet
a máslová by vyšly jako tři stejné hnědé. Takhle si pořadí i rozestupy
nesou s sebou. Odstín zůstává, sytost se u kalných barev naopak přitáhne,
protože tmavá a nesytá je šedivá.

Uvnitř karty se pak **všechno kreslí z `currentColor`** — pruh trasy, linky,
kolečka, nadočko. Krémové `--text*` by na pistáciové kartě zmizely.

Devět barev z palety a dvě navíc pro přidané hospody. Schválně se vyhýbají
barvám kategorií (`#006633`, `#F9A204`, `#E5331F`) — ty znamenají něco jiného.

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

Bydlí v `KATEGORIE` v `src/lib/data.ts` (`barva` a `karta`), ne v CSS:
kategorie se dají měnit v appce, takže barva patří k datům. Obrazovka si ji
vezme jako `--kat` a dál se z ní míchá všechno ostatní (`color-mix`):

- dlaždice úkolů a karta detailu (18 % do vrstvy),
- kresba na nich (55 % do textu),
- tlačítko *Splněno* a počítadlo (36 %).

**Na obrazovkách úkolů je zhasnutá teplá záře** (`.app.bez-zare`, nastavuje
`Kostra` v `App.tsx` podle adresy). Záře míchala oranžovou do barev kategorií
— zelená pod ní táhla do olivové a karty vypadaly zakouřeně. Jinde zůstává:
tam barvu nikdo nenese a appka bez ní vypadá jako terminál.

**Pozadí obrazovky kategorie barvu nenese.** Bylo nasvícené odstínem
kategorie shora, jenže dvě plochy téže barvy nad sebou — podklad a karty —
si vzájemně braly sílu a karty vycházely jako slabší verze pozadí. Na černé
jdou nahlas. Barva je na kartách, a nikde jinde.

Plná barva (`karta`) je zvlášť od barvy identity (`barva`): žlutá je na plochu
pod krémový text moc světlá, tak má plnou verzi o dva stupně tmavší. Text je
na všech třech krémový — jedna barva textu, ne tři.

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

Zrno leží ve **dvou vrstvách** a bez nich appka vypadá jako vysázená z vektorů.

1. **Filmové zrno nad vším, co appka nakreslí** (`.app::before`,
   `zrno-film.png`, `overlay`). Dlaždice je hotový obrázek: 192 × 192 px
   gaussovského šumu s průměrem přesně 128, takže střední šedá nemění nic
   a zrno jen rozkmitá to, co je pod ní — podklad zůstane `#2B2B23`.
   `background-size` se podle hustoty displeje přepíná na 192 / 96 / 64 px,
   aby **jeden pixel obrázku padl na jeden pixel displeje**. Když se měřítko
   netrefí, prohlížeč obrázek převáží a ze zrna je rozmazaná kaše.

   Dvě věci se tím opravily. Dřív to byla dlaždice z `feTurbulence` se čtyřmi
   oktávami, takže kromě zrna dělala i mraky — světlé a tmavé fleky přes půl
   obrazovky. A hlavně: `.app` je vlastní vrstvicí kontext (`position` +
   `z-index`) a ten je pro míchání izolovaný, takže se zrno uvnitř nemíchalo
   s ničím a ze `soft-light` zbyla půlprůhledná šedá přes celou appku.
   Podklad `#2B2B23` se tím na obrazovce zvedl na `#444440`: appka nebyla
   tmavá, byla šedivá. Proto `.app` teď kreslí svůj podklad sám.

   Leží uvnitř `.app`, takže na plachty v `<body>` (detail úkolu, okna)
   nesahá — ty mají být čisté.
2. **Tisk na barevných plochách** (`zrno-tisk.svg`, `multiply`): karty kategorií
   (`.kat-karta::after`) a papír účtenky (zamíchaný rovnou do podkladu, ne
   vrstva nad textem, ta by rozmazala tisk). Plná barva přes celou kartu
   vypadala jako výplň z tiskárny, ne jako plakát.
3. **Zmuchlání účtenky** (`papir-zmuchlany.svg`, `overlay`): nasvícený šum
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

## Rozostření horní hrany v appce z plochy

iOS 26 kreslí v appce přidané na plochu přes horní okraj webového pohledu
systémové rozostření („scroll edge effect", liquid glass), aby stavová lišta
zůstala čitelná nad čímkoli, co pod ní projede. **V prohlížeči se to
nekreslí**, takže stejná stránka je v Safari ostrá a z plochy ne. Vypnout se
to nedá — žádná meta ani vlastnost na to není, jen nativní appka si to umí
zakázat.

Dlouho se to honilo přes obsah: neprůhledný pruh na `body::before`, zrušené
`mix-blend-mode` na zrnu, jiný způsob rozmazání pod detailem. Nic z toho
nepomohlo, protože se nehledalo tam, **co se rozmazává**. Rozostření je vidět
jen na detailu, a horní pás appky byl plný detailu: filmové zrno
(`.app::before`) je pevné, leží přes celou obrazovku včetně horní hrany a je
to samá vysoká frekvence. Rozmazané zrno vedle ostrého je šmouha a tam, kde
efekt končí, je z toho navíc poznat hrana.

Takže v `@media (display-mode: standalone)`:

- `--pruh` = `safe-area-inset-top` (nejmíň 50) **plus 28 bodů rezervy**;
  rozostření sahá hlouběji než samotná stavová lišta.
- `body::before` je pevný pás té výšky přes celou šířku v **plné barvě**.
  Rozostřená plná barva je ta samá plná barva, takže po efektu nezbyde nic
  k vidění.
- **Zrno i záře začínají až pod pásem.** Zrno proto, aby u hrany nebylo co
  rozmazat. Záře proto, že pás je plná barva bez ní: kdyby záře počítala od
  nuly obrazovky, hned za hranou pásu by stránka byla o pár stupňů světlejší
  a pás by se četl jako samostatná deska, i když na samotné hraně barva sedí.
  Takhle má záře svých prvních rovných 76 bodů až pod pásem a stoupat začne
  o kus níž, kde už žádná hrana není.
- **Posledních 18 bodů pásu se prolíná** (`--prolnuti`): plná deska skončí,
  přejde do ztracena a pod ní se zrno postupně vynořuje. Bez toho začínalo
  zrno naráz a i při přesně sedící barvě byla hrana poznat — ne jako schod
  ve světlosti, ale jako hrana mezi hladkou plochou a zrnitou. Konec přechodu
  je psaný jako `rgba` téže barvy, ne `transparent`: některé prohlížeče
  prokládají přes průhlednou černou a byl by tam tmavý nádech.
- `--vrch` (odsazení obrazovky) vychází z `--pruh`, takže obsah začíná osm
  bodů pod ním. Plakáty úvodu se počítají ze stejného čísla.

Dvě věci, na kterých to stojí:

- **Barva pásu není `--podklad`.** Je to `#2D2D25`, tedy barva, kterou appka
  se zrnem na prvním řádku opravdu nakreslí (naměřeno (45,45,37)) — ta samá,
  co stojí v `theme-color` v `index.html`. S čistým podkladem by na konci pásu
  byl schod o dva stupně a šev tam, kde zrno začíná. Naměřeno v Chromiu:
  řádek nad pásem (45,45,37), řádek pod ním (44,9/44,3) — pod jeden stupeň.
  **Když se sáhne na zrno, přeměř obojí.**
- **`z-index: 61`**, tedy nad zrnem (60) a **pod průpravou** (120). V průpravě
  je horní pás plný podklad bez zrna — tam není co rozostřovat a pruh by nad
  ním jen svítil o dva stupně vedle.

WebKit navíc efekt vynechá úplně, když u horní hrany najde pevnou plochu přes
celou šířku (přes 90 % šířky, přes 10 bodů vysokou) s plnou barvou, a tou
barvou pak hranu vyplní (`LocalFrameView::fixedContainerEdges`). Pás tu
podmínku splňuje. Není to zaručené — pravidla nejsou nikde popsaná a projekty,
co to zkoušely, hlásí obojí — ale když to vyjde, je po efektu úplně, a když
ne, rozmazává se plná barva. **Ověřit se to tady nedá: v kontejneru není
WebKit a Chromium takový efekt nekreslí.**

Kdyby to pořád nestačilo, poslední cesta je přepnout
`apple-mobile-web-app-status-bar-style` z `black-translucent` na `default`:
web view pak začíná až pod stavovou lištou. Stojí to obsah pod lištou
a **appku je potřeba z plochy smazat a přidat znovu**, protože iOS si styl
pamatuje z instalace.

## Pruh nad stránkou v prohlížeči

Pruh nad stránkou kreslí Safari samo, **plnou barvou z `theme-color`** —
obsah pod něj nejde, na rozdíl od appky z plochy. Dřív nad teplou appkou
visel studený pruh a šev byl vidět přesně na hraně. Dvě věci se u té hrany
potkávají a obě musí sedět:

- **Záře (`.app::after`) je u hrany na nule.** Je to svislý přechod a prvních
  **76 bodů** je čistý podklad; teprve pak záře naskakuje a vrcholí kolem tří
  set. Rovný začátek je v **bodech, ne v procentech výšky**: pruh nad stránkou
  je vysoký pořád stejně, ať je telefon jakkoli dlouhý. Napoprvé to byl
  kruhový přechod, u hrany spočítaný na nulu — jenže hned pod ní stoupal
  strmě a oko to čte jako hranu, i když na samotné hraně barva sedí.
- **`theme-color` je `#2D2D25`, ne `--podklad`.** Zrno leží i přes první
  řádek a podklad o kousek zvedne (tečky jsou půl na půl, ale na tmavém
  podkladu bílá přidá víc, než černá ubere). Naměřeno: (43,43,35) bez zrna,
  (45,45,37) se zrnem. Dokud tam stál `#2B2B23`, byl mezi pruhem a stránkou
  schod o dva stupně. **Platí to oběma směry: když se sáhne na zrno, přeměř
  barvu.**

Dvě slepé uličky, obě vyzkoušené:

- **Maska na záři** (lineární přechod shora). Výsledek vypadal stejně, ale na
  iOS se tím celý horní pás dostal do vrstvy, kterou Safari vykresluje
  v nižším rozlišení: **logo a pilulka týmu pod ní byly rozmazané**, zbytek
  obrazovky ostrý. Spočítaný přechod dělá to samé a žádnou vrstvu navíc
  nepotřebuje. Ta samá příčina měla na svědomí i `mix-blend-mode` na zrnu.
- **Nechat záři a dopočítat barvu prvního řádku do `theme-color`.** Šev to
  odstranilo, ale nad gradientem pak visel pruh jedné ploché barvy a jako pás
  to bylo poznat pořád. Plochu je potřeba srovnat na obou stranách, ne jen
  hranu.

V appce z plochy na tom nezáleží: tam je lišta průhledná
(`apple-mobile-web-app-status-bar-style: black-translucent`), obsah jde pod
ni a o horní hranu se stará pás z minulé kapitoly.

## Horní lišta

Vlevo **značka**, vpravo za koho se zapisuje. Nadpis obrazovky stojí **pod
lištou**, na vlastní řádce.

Dřív byl nadpis v liště a značka nikde — v jedné řádce se tlačily tři věci
(nadpis, pilulka týmu, menu) a na značku nezbylo místo; nadpis se navíc musel
zkracovat třemi tečkami, aby se dlouhé jméno party vešlo. Takhle je to ten
samý zámek jako v úvodu (značka vlevo, drobnost vpravo) a nadpis má celou
šířku pro sebe, takže může být větší (`clamp(26px, 8vw, 34px)` místo
`clamp(22px, 7vw, 27px)`) a nekrátí se.

Na podstránce je místo značky **kolečko zpátky**: dvě věci vlevo by se zase
praly a cesta ven je tam potřebnější než logo.

Značka je zároveň **odkaz na Hru**. Je to to první, kam člověk ťukne, když
se chce vrátit, a nestojí to nic. Sama je vysoká 26 px, takže ťukací plocha
se dorovná na plných 44 (50 × 44) a záporným okrajem se vrátí do řádky.

## Hero karta štace

Obrazovka Hra stojí na jedné kartě, která nese **všechno o téhle štaci**:
kolikátá je, jak se jmenuje, kde jsme na trase a co se tu dá zapsat.
Dřív to byly čtyři samostatné bloky se stejnou vahou — číslo, název, trasa
a dvě obří tlačítka — takže nic nevedlo a hlavní informace zanikla.

- **Číslo štace** je tiché nadočko nad jménem („4. štace z 9").
- **Jméno hospody se vždycky zlomí na dva řádky**, i když by se vešlo na
  jeden (`naDvaRadky()` ve `format.ts`, zlom v místě, po kterém jsou oba
  řádky nejpodobnější). Karty v pásu jsou stejně vysoké a jméno na nich má
  mít pokaždé stejný tvar; nechat to na prohlížeči znamená, že se jedno
  jméno vejde na řádek a druhé ne, takže dvě sousední karty vypadají jako
  dva různé návrhy. Výjimka: jednopísmenná předložka nesmí zůstat na řádku
  sama, takže „U Ričího" se nezlomí. Jednořádkové jméno se v tom
  dvouřádkovém místě vycentruje (`align-content:center`), aby neviselo
  nahoře. Hagrid má jen čtyřstovku a sedmistovku, takže „ještě o kousek
  tučnější" dělá obtah `-webkit-text-stroke:.8px`.
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

## Rozcestník (FAB menu)

Po appce se chodí **kulatým červeným tlačítkem v pravém dolním rohu**, co se
rozbalí do pěti obrazovek. Je to **FAB menu z Material 3** — komponenta, co
nahradila starý „speed dial": nabídka visí nad tlačítkem, každá položka má
ikonu a jméno, a tlačítko se při otevření překlopí na křížek.

**Dole vpravo, ne nahoře.** Hamburger stával v pravém HORNÍM rohu, tedy v tom
nejhorším kusu obrazovky, jaký palec má — v hospodě se appka drží jednou
rukou, v druhé je škopek. Nabídka se rozbaluje nahoru, takže si prst nestíní
to, co vybírá.

- **Pět položek** je v rozsahu, co komponenta snese (dva až šest), a žádná
  z nich není podstránka něčeho jiného, tak nemá co být schovaná hlouběji.
- **Jména u ikon.** Appku člověk vidí potřetí v životě, v šeru a po pátém
  škopku; trofej ani korbel samy neřeknou „Týmy" a „Hospody". Drží se nadpisů
  obrazovek, ne hantecu z úkolů — musí sedět slovo, co se objeví hned po
  ťuknutí.
- **Kde zrovna jsem, svítí červeně.** Nabídka se otevírá odkudkoli, takže
  musí umět říct i to, odkud — jinak je to pět stejných lístků.
- **Dvě kresby v tlačítku přes sebe**, prolnou se: zavřené musí říct
  „nabídka", otevřené „zavřít". Otáčet plus na křížek šlo jednou kresbou,
  jenže plus říká „přidat".
- **Logová červená.** Je to jediná věc na obrazovce, co má křičet, a žádná
  kategorie tu barvu nenese jako plochu.
- **Položky naskakují jedna po druhé odspoda** (40 ms na řádek), ať oko stihne
  přečíst, co přibylo.
- **Ťuknutí na obrazovku, na které už jsem, vyjede nahoru.** To samé dělá iOS
  a na dlouhé galerii úkolů to ušetří půl minuty tahání.
- **Visí na `<body>`, ne uvnitř `.app`.** Appka má vlastní vrstvení
  (`position:relative; z-index:1`), takže cokoli uvnitř — i s `z-index:99` —
  zůstane pod plachtou kreslenou nad ní; tlačítko se při otevření ztmavovalo
  vlastní nabídkou.
- **Pod cizí vrstvou odejde** (detail úkolu, spodní okno): zůstalo by jako
  jediná ostrá věc nad rozmazanou appkou. Pod vlastní nabídkou zůstat musí.

Kolečko i řádky jsou stříhané nůžkama (`ram-fab`, `ram-fabRadek`), jen se
slabším střihem: na malém kruhu dělala plná vlna boule, co vypadaly jako
chyba vykreslení, ne jako nůžky.

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
je proto pořád na očích, od první vteřiny, a listuje se ťuknutím do obrazovky:
**vpravo dál, vlevo zpátky**.

**1. Značka.** Při spuštění z plochy ukáže iOS obrázek z `public/uvodni/`, hned po
něm naváže logo ve stránce (`#uvod` v `index.html`), aby bylo vidět dřív, než se
stáhne a spustí skript.

Značka se **skládá písmeno po písmenu** a běží to celé v `index.html`, ne
v Reactu. Logo svítí od prvního snímku; animace, která by se rozběhla až po
načtení skriptu, by buď naskočila v půlce, nebo by písmena na okamžik zmizela
a začala znova. **React proto značku vůbec nekreslí** — jeho vrstva (`.uvod`)
je do příchodu průpravy průhledná (`.uvod.znacka`) a značka pod ní prosvítá.
Teprve s první stránkou dostane `#uvod` třídu `odchazi`, vytratí se a odklidí.

Logo je kvůli tomu rozdělené na **devět samostatných písmen**. Dráha vznikla
obtažením obrázku a je to jediná cesta s pravidlem `evenodd`, takže počítadla
(díry v O, U, D, P, B) jsou samostatné podcesty — rozdělit to podle „M" by je
vybarvilo. Dělá to `scripts/pismena-loga.mjs`: podcesta, která leží uvnitř
jiné, se přilepí k ní, zbytek se seřadí po řádcích shora a zleva. Zapisuje
`LOGO_PISMENA` do `src/lib/logo.ts` i rozdělenou značku do `index.html`,
a pouští se po každém `prevod-loga.py`.

`transform-box: fill-box` je u písmen nutnost: bez něj se každé zmenšuje ke
středu celé značky a místo složení se to rozletí do stran.

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
  písmena nestihla složit — záblesk;
- `document.fonts.ready` na písma nestačí. Slibuje jen, že doběhlo, co si
  stránka **už vyžádala**, a dokud svítí logo, nic Bricolage ani psanou ruku
  nepoužívá. Proto se o ně musí říct ručně (`document.fonts.load`), jinak se
  průprava vysází náhradním písmem a po chvilce přeskočí do správného.

**Značka odchází nadvakrát.** Nejdřív se vytratí samo logo (zmenší se o čtyři
procenta a zvedne o 16 px) na svém vlastním tmavém podkladu, a teprve potom
zmizí podklad a objeví se barevná stránka. Kdyby se prolínalo obojí naráz,
prosvítala by skrz logo barva první stránky a značka by na okamžik zežloutla —
vypadalo by to, že mění barvu. Ze stejného důvodu leží `#uvod` **nad** vrstvou
Reactu (z-index 130 proti 120), ne pod ní: pod ní se díval na průhlednou
vrstvu, která se zrovna přebarvovala.

**Úvodní obrazovky mají číslo verze v názvu souboru** (`…@3x-2.png`), ne jako
`?v=` za adresou. iOS si je uloží ve chvíli, kdy se appka přidává na plochu,
a sám od sebe je nikdy nepřenačte — po změně palety proto na ploše pořád
problikávala stará tmavě modrá. Dotaz za adresou je u
`apple-touch-startup-image` riziko: iOS obrázek s dotazem nemusí s médiem
spárovat vůbec a pak nenakreslí nic. Číslo se zvedá při každé změně barev,
ale **appku je stejně potřeba z plochy smazat a přidat znovu**, jinak si iOS
sáhne pro svou uloženou kopii.

**Úplně na konci je záchytná obrazovka bez média.** iOS bere první odkaz,
který sedí; když nesedí žádný — jiný iPhone, nebo jen jiný stav okna při
startu — nakreslí si prázdnou plochu systémovou barvou, a ta je studená
tmavá. Vypadá to přesně jako bliknutí staré tmavě modré palety, i když ji
appka nikde nemá. Proto ten poslední odkaz: použije se jen tehdy, když nic
jiného nesedlo.

**2. Průprava.** Pět plakátů a na nich **pravidla, ne jejich převyprávění**:
texty se berou z `src/lib/pravidla.ts`, odkud je čte i obrazovka Pravidla, tak
se nemůžou rozejít. Jeden plakát = jedna kapitola a jedna kresba, co říká to
samé: budík k času, šnek k loudání, čárky k bodování, kotel k banku.

Stránka je **plakát**, ne obrazovka s nádechem barvy. Plná barva přes celou
plochu, jeden inkoust na všechno a jedna velká čmáranice uprostřed. Nahoře
značka a *Přeskočit*, dole šipka zpátky, proužky a *Dál*. Šipka vlevo si drží
místo i na prvním plakátu, kde nemá kam vést — jinak by proužky uprostřed při
každém listování poskočily. Pro čtečku je číslo stránky v popisku proužků.

**Nadpis se měří na telefonu, ne v testu.** Písmo z Adobe se do testovacího
prohlížeče nedostane a náhradní je užší, takže se nadpis lámal na dva řádky
a vypadal v pořádku — na telefonu, kde Hagrid naběhne, z toho byly tři řádky
a vytlačily kresbu i větu. Velikost je proto 8,5 % šířky, ne deset.

**Nadpis je těžký.** Globální `h1` má v appce čtyřstovku (velké nadpisy jsou
schválně lehké), tady se váha vrací na sedmistovku a obtah
(`-webkit-text-stroke: .7px`) přidá ten kousek navíc, co Hagrid nemá — stejný
trik jako u jména hospody na hero kartě. Prokládání je stažené pod jedničku:
velký blok verzálek drží pohromadě a tím působí těžší, aniž by se musel
zvětšovat. `text-wrap: balance` vyrovná délku řádků, ať na druhém nezůstane
viset jedno slovo.

Věta pod nadpisem je výklad, ne druhý nadpis: tišší a s volnějším prokladem,
aby mezi ní a nadpisem byl rozdíl **ve váze, ne jen ve velikosti**.

**Kresba, nadpis a věta jsou jeden blok a ten je vycentrovaný** mezi
hlavičkou a lištou. Volné místo se tím rozdělí nad něj a pod něj stejným
dílem, takže každá stránka dýchá stejně, ať je text nahoře, uprostřed nebo
dole.

Napoprvé rostla jen kresba a zbytek byl pevný. Na stránkách, kde vede text,
se tím nadpis slepil rovnou pod značku a všechen vzduch zůstal dole u kresby
— vypadalo to, že se text o hlavičku opírá. Kresba proto **nesmí růst**
(`flex: 0 1 auto`): kdyby rostla, přetáhne si volné místo zpátky k sobě
a vycentrování je k ničemu. Výšku má podle displeje
(`clamp(190px, 38vh, 320px)`), ne podle toho, kolik zbylo textu — čtyři
plakáty vedle sebe mají mít kresbu stejně velkou. Smrsknout se smí, když se
blok nevejde.

Naměřený vzduch nad blokem a pod ním (čtyři stránky za sebou):

| displej | kresba | nad / pod |
|---|---|---|
| 375 × 667 | 253 px | 42/42 · 22/22 · 30/29 · 43/42 |
| 393 × 852 | 320 px | 99/99 · 79/79 · 87/87 · 100/99 |
| 430 × 932 | 320 px | 136/136 · 116/116 · 136/136 · 137/136 |

Rozdíl mezi stránkami je jen délkou textu, souměrnost drží všude.

**Žádné dvě stránky nejsou poskládané stejně.** Čtyři stejné obrazovky za
sebou vypadají jako formulář, ne jako série plakátů, takže se střídají tři
skladby (text pod kresbou / nadpis nahoře a věta dole / text celý nahoře)
a tři kotvy kresby (na střed, k levému kraji, k pravému). Kresba se u kraje
zúží — dokud zabírala celou šířku, nebylo poznat, že je přitisknutá,
a vypadalo to jen jako nepovedené vycentrování.

Barvu i inkoust nese stránka sama (`--papir`, `--inkoust`, viz `PRUPRAVA`
v `Uvod.tsx`): dvě stránky jsou tmavé s krémovým inkoustem, dvě světlé
s černým. **Nic uvnitř se proto neodvozuje od `--text` ani od `--podklad`** —
všechno je `currentColor`, jinak by polovina stránek zmizela.

Čmáranice kreslí `scripts/kresli-uvod.mjs` **tou samou rukou jako ikony**:
tlusté siluety s výstřižky, obrys křivý jako stříhaný tupýma nůžkama, a
stejná maska při vykreslení (plocha v barvě inkoustu, výstřižky průhledné).
Nejdřív to byly obrysové tahy a vedle zbytku appky to byl cizí rukopis.

Dva rozdíly proti ikonám, oba kvůli velikosti:

- **Kymácení je mírnější** (`amp` 1,3 místo 2,2). Amplituda je v souřadnicích
  čtverce, takže se s velikostí nemění — co v dvaadvaceti bodech vypadá jako
  střih nůžkami, je na plakátu přes půl obrazovky rozmáčklý tvar.
- **Kolečka mají hodně bodů a skoro žádnou výchylku.** Na malé ploše je
  kymácení vidět nejvíc a z očí byly kosočtverce.

Co se při kreslení ukázalo: odlesky skla ve škopku vedly přesně přes oči
a pusu, takže buď sklo, nebo tvář — ne obojí. A oči vystřižené do koruny
z ní udělaly kočku, takže koruna má místo obličeje kámen a čelenku.

**Žádná stránka se nepřehodí sama** — ťuká se do obrazovky: **vpravo dál,
vlevo zpátky**. Hranice není v polovině, ale ve **dvou pětinách**: dopředu se
jde pětkrát, zpátky málokdy, takže větší strana patří tomu častějšímu a kdo
ťukne „někam doprostřed", protože chce dál, se netrefí zpátky.

Cedule dole (*Dál*, šipka zpátky) **nejsou tlačítka**: je to tichý text bez
plochy, protože ťuknout jde stejně do celé strany a svítící pilulka dole by
přetahovala pozornost z toho, co se má přečíst. Proužky dole říkají, kolik
toho zbývá; úvod, u kterého není vidět konec, je otrava.

`.uvod` má **`touch-action: none`**. Bez toho si vodorovný tah vezme
prohlížeč, `pointerup` se změní na `pointercancel` a švih mezi stránkami se
nikdy nechytne — přesně ta samá past jako u pásu hero karet.

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
chudák").

**Dělení slov je vypnuté** (`hyphens: manual`). Safari umí česky a opravdu
dělilo — „Balení starý-ho kusu", „Tichá špeluň-ka", „Rada za vše-chny
prachy" — a na dvouřádkovém jménu na malé kartě to nevypadá jako sazba, ale
jako chyba. Zlom se dělá jen v mezerách, `overflow-wrap: break-word` zůstává
jako poslední záchrana pro slovo, které se na řádek nevejde ani samo (žádné
takové mezi úkoly není: nejdelší je „Vyžebranej" a „hókuspókus", obě se
vejdou). `text-wrap: balance` vyrovná délku řádků. Čtvereček je čtvercový schválně — kolečka v appce odškrtávají,
tohle přidává.

**Detail** (`DetailUkolu`): nahoře vlevo kresba, vpravo nahoře v rohu to, co
se s úkolem dá udělat (čtvereček u jednorázového, počítadlo u opakovatelného).
Křížek na zavření je pryč a odškrtávátko si vzalo jeho místo: byly to dva
terče vedle sebe a ten horní nic nedělal. Zavírá se ťuknutím vedle, švihem
dolů a Escapem. Pak vzduch
a dole všechen text: jméno, zadání, poznámka, pod tenkou linkou obtížnost
a kolik za to padne. Dlouhé zadání se **posouvá** (`.detail-telo`, `data-posuv`).

Dřív se listovalo po stránkách ťuknutím do textu a vpravo dole byla decentní
šipka. Nebylo to na kartě poznat a ťuknutí si lidi vykládali jinak — vypadalo
to, že appka na ťuknutí nereaguje. Posouvání je to, co každý zkusí první.
Tah, co začne v `[data-posuv]`, proto `useSvihDolu` ignoruje: jinak by se
místo posunutí textu zavřel celý detail. Zavřít jde odkudkoli jinud.

Kresba je v detailu 152 px. Velká na půl karty z ní dělala ilustraci
s popiskem, ne zadání úkolu; malá v rohu zase plavala v prázdnu, protože
karta měla spodní mez 420 px a text se tlačil k dolní hraně
(`margin-top: auto`). Mezera mezi kresbou a nadpisem tím vycházela na každém
úkolu jinak. **Mezera je proto pevná (24 px) a spodní mez karty nižší
(300 px)** — karta sedne na obsah.

**Kresbu má každý úkol.** Buď obtaženou od ruky (`kresby.ts`), nebo
kreslenou (`ukol-kresby.ts`, generuje `scripts/kresli-ukoly.mjs` — ta samá
ruka jako ikony, jen velká). Obtažená má vždycky přednost; kreslená je
výplň, dokud k úkolu žádná od ruky není, a sama ustoupí, jakmile přibude.

Co se při kreslení ukázalo — na čtvercové ploše o sto bodech je
**rozpoznatelnost věc jednoho nápadu, ne detailu**. Mince nad nastavenou
dlaní vyšla jako hlava nad trupem (busta, ne žebrák), růže se soustřednými
kroužky jako terč a se dvěma oblouky uvnitř jako obličej, dvě postavičky nad
sebou jako jeden flíček. Pokaždé pomohlo vyměnit nápad, ne doladit tvary:
z růže srdce, z nošení na ramenou bota nad čárou země.

**Náhradní ikona vyplní rámeček stejně jako kresba.** Dřív byla o třetinu
menší (104 proti 136), takže úkol s kresbou a úkol bez ní vypadaly jako dvě
různě velké karty.

Velikost a posun si **každá kresba může doladit** (`LADENI_KRESEB`
v `src/lib/kresby-ladeni.ts`). Kresby se do čtverce ořezávají na obálku, takže
ho všechny vyplní na doraz — jenže ne každá v něm má stejnou váhu: štíhlá
postava se ve čtvercovém rámečku ztratí, rozmáchlá kresba se do něj tlačí.
Srovnává se to okem, kresbu po kresbě; pravidlo na to není a co v tabulce
není, kreslí se tak, jak přišlo.

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
„HOTOVO“ na hero kartě. Sedí v řádce se jménem party; přes tečkované vodiče
vypadalo, že přebilo číslo, které k nim patří. Naskočí až od první čárky:
na začátku večera nikdo nevede.

Skladba je **převzatá z opravdové účtenky**: štítek a číslo dokladu nahoře,
pod tím značka, heslo mezi lomítky, datum mezi přerušovanými čarami, položky
s vodicími tečkami, součet a dole drobná patička. Položky začínají na stejné
levé hraně jako jméno party — jméno je hlavička bloku, ne nadpis seznamu.
Součet má nejsilnější linku z celé účtenky, ale pořád tečkovanou: plná čára
tu byla jediná a vedle tří tečkovaných nad sebou vypadala jako podtržení
z textového editoru. Číslo dokladu je **den a měsíc, lomítko a počet čárek na stole dohromady**
(`2810/0008`), jak to tiskne opravdová pokladna. Pořadí během večera naskakuje
jako počítadlo a je to pořád pravdivý údaj. Samotné datum (`281026`) by se do
šesti číslic vešlo přesně, jenže tři řádky pod tím stojí DATUM a byla by to ta
samá informace dvakrát; takhle se den propíše a číslo přitom zůstane číslem
dokladu, ne datem potřetí.
Červená je `#E5331F` na velké texty; na drobné popisky by na krémovém papíru
neudržela kontrast, tak je pro ně tmavší (`#B4220F`).

## Rozostřené pozadí pod vrstvou

Pod otevřeným detailem nebo oknem se rozmaže **obsah** (`filter` na
`.obrazovka`), ne podklad plachty. `backdrop-filter` si Safari vzorkuje zvlášť
a po překreslení u kraje selhával.

U krajů se ale ukázalo něco, co není chyba prohlížeče: **karty galerie stojí
dvacet bodů od hrany obrazovky**, rozostření jim tu hranu rozmázne na obě
strany a doleva dosáhne asi čtrnáct bodů — takže posledních pár bodů u hrany
zůstane holý podklad. Dokud je obraz ostrý, čte se ten pruh jako okraj
stránky; jakmile se rozmaže, vypadá jako pruh, co „není rozmazaný".
Naměřeno na telefonu: od kraje k šestému bodu plochá barva, pak hladký náběh
přes třicet bodů — přesně tvar gaussovského rozostření. Rozostřit se tam
nemá co.

Zkoušelo se roztáhnout `.obrazovka` o kus ven z obrazovky, ať slábnoucí hrana
filtru padne mimo viditelnou plochu. **Nezměřilo se žádné zlepšení** a není
divu: problém není hrana prvku, ale že obsah ke kraji nedosahuje. Vrátilo se
to zpátky.

Spravit se to dá jedině tím, že ten okraj přestane být náhodný: plachta má po
stranách **vinětu** (nejtmavší u hrany, do 16 % šířky se ztratí). Náběh karet
do ní zapadne a žádný pruh tam není — vypadá to jako rámovaný obraz, ne jako
chyba.

## Plochy, které jsme nekreslili

Označení textu, kurzor, obrys při procházení klávesnicí a posuvník mají vlastní
barvy z palety. Nechat je na výchozím vzhledu prohlížeče by byla jediná místa,
kde appka vypadá jako nedodělaná stránka.
