# Tour de Pub — Brno edition

Web ke hře: devět brněnskejch špeluněk, 23 úkolů a počítání čárek.
Staví se na mobil do ruky v hospodě — velké terče, vysoký kontrast, hlavní akce dole
na dosah palce. Na počítači stojí uprostřed na ploše.

Žádný build, žádné npm. Je to HTML, jedno CSS a pár souborů JS jako modulů.
Nahraje se do repozitáře a servíruje přes GitHub Pages.

## Struktura

```
index.html         kostra stránky
app.js             obrazovky a ovládání
stav.js            týmy, hospody, úkoly, bodování a ukládání
data.js            VÝCHOZÍ hospody a úkoly (jen startovní sada, dál se mění v appce)
ui.js              kreslení ikon, čárek a štítků obtížnosti
ikony.js           ZÁSTUPNÉ — generuje scripts/kresli-ikony.mjs, needitovat ručně
sync.js            živé pořadí přes Supabase (volitelné)
nastaveni.js       klíče k Supabase, název tabulky a název hry
styl.css           celý vzhled, jeden soubor
DESIGN.md          barvy, písmo, rozměry a proč jsou takové
sw.js              service worker, drží web v telefonu i bez signálu
manifest.json      aby šel web přidat na plochu jako appka
pisma/             Bevan a Outfit, stažené lokálně
scripts/           generátor ikon a stahovač písem
supabase/party.sql struktura tabulky pro živé pořadí
.claude/skills/    Apple HIG skilly (zdroj: raintree-technology/apple-hig-skills, MIT)
```

## Jak se to ovládá při hře

### Kdo smí upravovat

Hra je otevřená — kdo přijde na odkaz, vybere si tým a hraje. **Úpravy úkolů
a hospod se objeví až po zadání kódu** v Pravidlech → Režim správce. Kód je
`ADMIN_KOD` v `nastaveni.js`, uloží se v prohlížeči a přežije zavření.

Je to zámek proti omylu, **ne bezpečnost**. Web je statický a veřejný, takže kdo
se podívá do zdrojáku, kód si přečte. Brání tomu, aby někdo omylem přepsal úkoly
uprostřed hry. Kdyby mělo jít o víc, musela by přibýt opravdová práva v databázi.

Spodní lišta má pět obrazovek:

- **Hra** — aktuální štace se šipkami po trase, dvě velká tlačítka
  (*Jsme v špeluňce*, *Škopky jsme lupnuli*), vaše čárky a pod tím pořadí
  všech týmů s odstupem od vedoucího.
- **Úkoly** — nahoře přepínač kategorií, pod ním seznam. Jednorázové se odškrtávají
  ťuknutím na řádek, opakovatelné mají − a +. V režimu správce je u každého tužka.
- **Týmy** — kdo vede a za koho zapisuješ. Ťuknutím na tým se přepneš, takže z jednoho
  telefonu jde vést i celou hru. Tužka tým přejmenuje, přebarví nebo smaže.

  Telefon, který web jen otevře, **žádný tým ostatním neukáže**. Appka si sice
  jeden založí, ale posílá ho, až když ho někdo pojmenuje nebo s ním zapíše
  první čárku. Jinak by se v pořadí objevila „Naše parta" z každého mobilu
  i karty prohlížeče, která se kdy podívala. V režimu správce jde tým, co přišel
  z jiného telefonu, smazat košem — ostatním pak zmizí taky.
- **Hospody** — trasa. Pořadí se přehazuje šipkami, ťuknutím na název se tým přesune,
  tužka hospodu přejmenuje nebo smaže.
- **Pravidla** — pravidla, legenda obtížnosti a režim správce. Vynulovat čárky
  týmu jde jen ve správcovském režimu; je to nevratné.

Přes značku nahoře vpravo (jméno týmu) je rychlé přepnutí týmu odkudkoli.
Překlik se opraví stejným ťuknutím ještě jednou.

### Úkoly a hospody se dají měnit

Hospody i úkoly nejsou napevno v kódu. Příští ročník si trasu i srandy naklikáš
přímo v appce — `data.js` je jen to, čím se hra naplní poprvé.

Když smažeš hospodu, zmizí s ní i čárky, co z ní týmy měly. Když byl na tu hospodu
navázaný úkol (Bullseye jen *U Ričího*), omezení tím padá a úkol jde splnit kdekoli.

## Bodování

Čárka = bod. Počítá se:

1. čárka za každou špeluňku, do který vlezete (max. 9),
2. čárka za škopek v každý štaci (max. 9),
3. čárky za úkoly podle obtížnosti — 1 půllitr brnkačka, 2 větší haluz, 3 betelná makačka.

Dohromady se dá urvat nejvíc **74 čárek** (9 + 9 + 56 z úkolů).

Úkol má tahle pole (výchozí sada je v `data.js`, dál se mění v appce):

| pole | co znamená |
|---|---|
| `piva` | obtížnost 1–3, kreslí se jako půllitry |
| `body` | kolik čárek padne za jedno splnění |
| `max` | kolikrát to jde opakovat |
| `hospoda` | jde jen v téhle špeluňce (Bullseye v č. 4) |
| `mezi` | jde jen na cestě mezi dvěma špeluňkami (Srostlý budny 3–4) |
| `exkluzivni` | čárku bere jen jedna parta (Hospodský Národní) |
| `jednouZaHospodu` | z každé špeluňky jen jednou (Brněnskej zloděj) |

Nový úkol se přidává tlačítkem dole na obrazovce Úkoly. Kdo chce připravit celou sadu
dopředu, může místo toho upravit `VYCHOZI_UKOLY` v `data.js` — ta se ale načte jenom
při prvním spuštění, takže pak je potřeba v prohlížeči smazat uložená data.

Obtížnost a počet opakování spolu souvisí: **jednorázový úkol hodí tolik čárek, jaká je
jeho obtížnost** (betelná makačka = 3 čárky), kdežto **opakovatelný dává čárku za kus**.
Appka to dopočítá sama, ručně se to nenastavuje.

### Na co pozor u loňských pravidel

Tyhle tři věci nejsou v loňském PDF dořešené a web je zatím bere doslova:

- **Borec, co to cáluje** je za 1 půllitr, ale jde 5× — vyjde tedy na 5 čárek,
  víc než betelná makačka za 3.
- **Brněnskej zloděj** má u sebe 3 půllitry, ale pravidla dávají čárku za každou
  věc. Web to počítá jako 1 čárku za kus, nejvýš 9, tedy devět čárek za celou hru.
- **Hospodský Národní** bere jen jedna parta na hospodu. Web na to upozorní
  odznakem, ale nehlídá to — kdo první, ten bere, domluvíte se na place.

Taky není rozstřel při remíze; v pořadí se při shodě čárek řadí výš parta
s víc betelnejma makačkama.

## Živé pořadí (volitelné)

Bez nastavení běží web **jen z telefonu**: v Týmech jsou vidět ty, co sis tu založil,
a hra funguje úplně bez internetu. Z jednoho mobilu se dá vést i celá hra — přepneš
tým a zapisuješ za někoho jiného.

Živé pořadí se hodí, když chce každá parta zapisovat na svém telefonu a vidět ostatní.

### Nezakládej kvůli tomu nový projekt

Supabase má na free plánu strop **dva běžící projekty**, ale **tabulek může mít jeden
projekt kolik chce.** Takže pusť `supabase/party.sql` v projektu, který už používáš
(u nás `osobni-aplikace`). Tabulka se jmenuje `tourdepub_tymy`, takže se ti tam nic
nepomíchá, a za jeden večer se tří part nedotkne ani okraje půlgigového limitu.

1. Otevři projekt, co už máš — v Supabase se jmenuje **`osobni-aplikace`** —
   a vlevo dej **SQL Editor** → **New query**.
2. Vlož celý obsah `supabase/party.sql` a dej **Run**. Skript jde pustit
   i opakovaně, nic nerozbije.

   **Nevynechávej řádek s `grant`.** Samotná RLS pravidla nestačí — role `anon`,
   pod kterou jede klíč v prohlížeči, musí mít k tabulce přístup, jinak vrátí
   Supabase `42501 permission denied`. Tabulka založená přes Table Editor to
   dostane sama, založená přes SQL ne.
3. Ověř v **Table Editor**, že přibyla tabulka `tourdepub_tymy`.
4. V **Settings → API** zkopíruj *Project URL* a klíč a vlož je do `nastaveni.js`:

```js
export const SUPABASE_URL = "https://neco.supabase.co";
export const SUPABASE_KEY = "eyJ...";
```

4. Nahraj a každá parta si otevře stejnou adresu.

Klíč `anon` je určený do prohlížeče, takže ho klidně nahraj do repozitáře.
Tabulka je ale otevřená komukoli s odkazem — je to na jeden večer mezi známými.
Kdyby to mělo viset na internetu dýl, přidej přihlášení.

`HRA` v `nastaveni.js` odděluje ročníky. Příští rok ji změň, ať se party nemíchají
s letošními. `TABULKA` se mění jen tehdy, když by ti jméno kolidovalo s něčím vlastním.

Bez signálu se zapisuje dál do telefonu a pošle se to, až bude signál.

### Kdyby ses chtěl Supabase vyhnout úplně

Jde to přes Google Apps Script a Google tabulku — stejně jako přihláška na kemp
ve florbalkurim. Je to zadarmo, bez stropu na projekty a data vidíš rovnou v tabulce.
Není tam ale živé posílání změn, takže by se muselo jednou za pár vteřin ptát samo.
Pro dvě tři party na jeden večer by to stačilo; kdybys to chtěl, dopíšu to.

## Appka na ploše

Web má `manifest.json` i service worker, takže jde přidat na plochu jako appka:
v Safari **Sdílet → Přidat na plochu**. Pak se otevírá na celou obrazovku bez
adresního řádku a funguje i ve sklepě bez signálu.

**Po každé změně webu zvedni `VERZE` v `sw.js`.** Jinak si telefon nechá
starou verzi a nových úkolů se nedočkáš.

Kdyby se přesto sešla stará stránka s novým skriptem, appka si kostru postaví
sama a nic se nerozsype — dřív v takovém případě zůstala černá plocha. A kdyby
spadlo něco jiného, ukáže se hláška s tlačítkem *Načíst znovu*, ne prázdno.

## Ikony

Ikony jsou tlusté siluety s výstřižky, obrys křivý jako stříhaný tupýma nůžkama.
Kreslí je `scripts/kresli-ikony.mjs` do `ikony.js`:

```bash
node scripts/kresli-ikony.mjs
```

Náhodnost je pevná, takže stejný kód dá pokaždé stejné ikony. Každá ikona má
vlastní semínko odvozené od názvu, takže změna jedné nepřekreslí ostatní.

Tenké tahy se v malém slijí do kaše, proto je všechno tlusté — ikony se používají
i ve 22 px ve spodní liště. Když přidáváš novou, zkontroluj ji v malém.

## Písma

Archivo Black na nadpisy, Gloria Hallelujah na popisy, Outfit na ovládání —
všechno SIL OFL a uložené v `pisma/`.
Lokálně kvůli dvěma věcem: web funguje bez signálu a nenačítá se nic z Googlu.

Stahuje je `scripts/stahni-pisma.mjs`. Subsety se poznávají podle `unicode-range`,
ne podle pořadí — některé fonty mají na Googlu tři subsety (vietnamese, latin-ext,
latin) a když se vezmou první dva, chybí pak Č, Ř, Š a Ů.

**U psacích fontů kontroluj `ť` a `ď`.** Architects Daughter ani Shadows Into Light
je nemají, a v textech úkolů jsou všude. Prohlížeč je dosadí z jiného písma a je to
v řádku poznat.

## Ikony appky

`ikona-*.png` a `ikona.svg` generuje:

```bash
node scripts/ikony-appky.mjs            # logo (výchozí)
node scripts/ikony-appky.mjs --pullitr  # místo loga půllitr
```

Kresba se snímkuje přes HTML obal, kde se roztáhne na celou plochu.
**Snímkovat SVG přímo nejde** — má vlastní rozměr, takže se místo zmenšení
jen ořízne roh. Přesně tím byla ikona na ploše dlouho skoro prázdná.

iOS si ikonu drží i po aktualizaci webu. Aby se projevila nová, je potřeba
appku z plochy smazat a přidat znovu.

## Logo

`logo.svg` a `logo.js` jsou obtažené z obrázku skriptem:

```bash
node scripts/prevod-loga.mjs <obrazek.png>
```

Kreslí se barvou textu (`currentColor`), takže funguje na světlém i tmavém podkladu.
`logo.js` je ten samý tvar jako modul, aby se vkládal rovnou do stránky bez dalšího
požadavku. Oba soubory jsou generované, needitovat ručně.

V rozhraní logo není — nese ho ikona appky, úvodní obrazovka a patička Pravidel.
Proč, je v `DESIGN.md`.

## Úvodní obrazovka

Jsou dvě a navazují na sebe. `uvodni/` jsou obrázky, které ukáže **iOS** při
spuštění appky z plochy — bez nich se objeví jen prázdná barva. Hned po nich
naváže **vlastní obrazovka ve stránce** (`#uvod` v `index.html`), která se drží
aspoň 1150 ms a pak odejde prolnutím. Délka se mění v `app.js` u `NEJMIN`.

Systémové obrázky generuje:

```bash
node scripts/uvodni-obrazovky.mjs
```

Skript vypíše i `<link>` značky — při přidání nového rozměru je potřeba je
přenést do `index.html` a soubory doplnit do seznamu v `sw.js`.

## Nasazení

Běží na GitHub Pages: **https://michaelbedna13.github.io/tourdepub/**

1. Settings → Pages → *Deploy from a branch*, větev `claude/admiring-euler-ci2d58`,
   složka `/ (root)`. Repozitář nemá `main`, tahle větev je výchozí.
2. Každý push na tu větev nasadí znovu, trvá to asi minutu. Postup je vidět
   v záložce Actions pod „pages build and deployment".
3. Prázdný soubor `.nojekyll` v kořeni vypíná Jekyll. Bez něj by GitHub stránku
   hnal přes generátor blogů, který zahazuje soubory začínající podtržítkem.
   Nic takového tu sice není, ale build je bez něj zbytečně pomalejší.
4. Případně do kořene `CNAME` s vlastní doménou.

**Když se změna neprojeví**, nejčastěji to není Pages, ale service worker —
zvedni `VERZE` v `sw.js`. Na telefonu, co appku má na ploše, jinak zůstane stará verze.

Cesty k souborům jsou relativní, takže web funguje na doméně,
na `michaelbedna13.github.io/tourdepub/` i po otevření z disku.

© Mišák
