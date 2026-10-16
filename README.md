# Tour de Pub — Brno edition

Web ke hře: devět brněnskejch špeluněk, 23 úkolů a počítání čárek.
Staví se na mobil do ruky v hospodě — velké terče, vysoký kontrast, hlavní akce dole
na dosah palce. Na počítači stojí uprostřed na ploše.

Appka je ve stejném stroji jako osobní aplikace (untrois): **Vite + React + TypeScript**,
nasazení na GitHub Pages z Actions.

```bash
npm install
npm run dev        # vývoj na localhostu
npm run build      # produkce do dist/
npm run typecheck  # jenom kontrola typů
```

## Struktura

```
index.html              kostra stránky a úvodní obrazovka s logem
src/main.tsx            start appky
src/App.tsx             trasy a kostra obrazovky
src/obrazovky/          Hra, Úkoly, Kategorie, Týmy, Hospody, Pravidla
src/components/         Ikona, Čárky, Obtížnost, Hlava, Menu, Okno, Úvod, …
src/lib/stav.ts         týmy, hospody, úkoly, bodování a ukládání
src/lib/data.ts         VÝCHOZÍ hospody a úkoly (startovní sada, dál se mění v appce)
src/lib/sync.ts         živé pořadí přes Supabase (volitelné)
src/lib/nastaveni.ts    klíče k Supabase, název tabulky, název hry a kód správce
src/lib/format.ts       skloňování a vázání krátkých slov
src/lib/ikony.ts        ZÁSTUPNÉ — generuje scripts/kresli-ikony.mjs, needitovat ručně
src/lib/logo.ts         ZÁSTUPNÉ — generuje scripts/prevod-loga.py, needitovat ručně
src/styles/app.css      celý vzhled, jeden soubor
src/styles/pisma.css    @font-face, rozsahy znaků
src/assets/             písma, zrno a čárky (všechno, na co sahá CSS)
public/                 ikony appky, logo a úvodní obrazovky pro iPhone
DESIGN.md               barvy, písmo, rozměry a proč jsou takové
scripts/                generátor ikon, stahovač písem, převod loga
supabase/party.sql      struktura tabulky pro živé pořadí
.claude/skills/         Apple HIG skilly (zdroj: raintree-technology/apple-hig-skills, MIT)
```

### Stav bez knihovny na stav

`src/lib/stav.ts` drží jeden měnitelný objekt a seznam posluchačů; obrazovky se na něj
přihlásí přes `useStav()` (`useSyncExternalStore`). Zapisuje se do něj odkudkoli — z obrazovek,
ze synchronizace, z posluchače `online` — a kopírovat při každé čárce celý stav by bylo
k ničemu. Stejně je na tom `sync.ts` (`useSync()`) a `spravce.ts` (`useSpravce()`).

## Jak se to ovládá při hře

### Kdo smí upravovat

Hra je otevřená — kdo přijde na odkaz, vybere si tým a hraje. **Úpravy úkolů
a hospod se objeví až po zadání kódu** v Pravidlech → Režim správce. Kód je
`ADMIN_KOD` v `src/lib/nastaveni.ts`, uloží se v prohlížeči a přežije zavření.

Je to zámek proti omylu, **ne bezpečnost**. Web je statický a veřejný, takže kdo
se podívá do zdrojáku, kód si přečte. Brání tomu, aby někdo omylem přepsal úkoly
uprostřed hry. Kdyby mělo jít o víc, musela by přibýt opravdová práva v databázi.

Pod hamburgerem vpravo nahoře je pět obrazovek:

- **Hra** — hero karta štace: kolikátá je, jak se jmenuje, kde jste na trase
  a dvě odškrtávátka (*Jsme v špeluňce*, *Škopky jsme lupnuli*). **Karty se
  přepínají švihem do boku** — v hospodě jednou rukou je to rychlejší než mířit
  na šipku; šipky zůstaly pro myš a pro jistotu. Pod kartou vaše čárky a pořadí
  všech týmů s odstupem od vedoucího.
- **Úkoly** — tři barevné karty kategorií (kolik je splněno a kolik je tady
  na dosah). Ťuknutím se otevře seznam: jednorázové se odškrtávají ťuknutím na
  řádek, opakovatelné mají − a +. V režimu správce je u každého tužka.
- **Týmy** — kdo vede a za koho zapisuješ. Ťuknutím na tým se přepneš, takže z jednoho
  telefonu jde vést i celou hru. Tužka tým přejmenuje, přebarví nebo smaže.

  **Tým jde upravovat z kteréhokoli telefonu**, ne jen z toho, kde vznikl.
  Na server se posílá celý jeho stav, ne jen výsledné skóre, takže ho každé
  zařízení umí převzít a počítat dál. Když dva telefony sahají na stejný tým
  naráz, vyhraje pozdější zápis — v praxi má každá parta svůj, takže to nevadí.

  Telefon, který web jen otevře, **žádný tým ostatním neukáže**. Appka si sice
  jeden založí, ale posílá ho, až když ho někdo pojmenuje nebo s ním zapíše
  první čárku. Jinak by se v pořadí objevila „Naše parta" z každého mobilu
  i karty prohlížeče, která se kdy podívala. Smazaný tým zmizí i ostatním.
- **Hospody** — trasa. Pořadí se přehazuje šipkami, ťuknutím na název se tým přesune,
  tužka hospodu přejmenuje nebo smaže.
- **Pravidla** — pravidla, legenda obtížnosti a režim správce. Vynulovat čárky
  týmu jde jen ve správcovském režimu; je to nevratné.

Přes značku nahoře vpravo (jméno týmu) je rychlé přepnutí týmu odkudkoli.
Překlik se opraví stejným ťuknutím ještě jednou.

### Úkoly a hospody se dají měnit

Hospody i úkoly nejsou napevno v kódu. Příští ročník si trasu i srandy naklikáš
přímo v appce — `src/lib/data.ts` je jen to, čím se hra naplní poprvé.

Když smažeš hospodu, zmizí s ní i čárky, co z ní týmy měly. Když byl na tu hospodu
navázaný úkol (Bullseye jen *U Ričího*), omezení tím padá a úkol jde splnit kdekoli.

## Bodování

Čárka = bod. Počítá se:

1. čárka za každou špeluňku, do který vlezete (max. 9),
2. čárka za škopek v každý štaci (max. 9),
3. čárky za úkoly podle obtížnosti — 1 půllitr brnkačka, 2 větší haluz, 3 betelná makačka.

Dohromady se dá urvat nejvíc **74 čárek** (9 + 9 + 56 z úkolů).

Úkol má tahle pole (výchozí sada je v `src/lib/data.ts`, dál se mění v appce):

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
dopředu, může místo toho upravit `VYCHOZI_UKOLY` v `src/lib/data.ts` — ta se ale načte jenom
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
4. V **Settings → API** zkopíruj *Project URL* a klíč a vlož je do `src/lib/nastaveni.ts`:

```js
export const SUPABASE_URL = "https://neco.supabase.co";
export const SUPABASE_KEY = "eyJ...";
```

4. Nahraj a každá parta si otevře stejnou adresu.

Klíč `anon` je určený do prohlížeče, takže ho klidně nahraj do repozitáře.
Tabulka je ale otevřená komukoli s odkazem — je to na jeden večer mezi známými.
Kdyby to mělo viset na internetu dýl, přidej přihlášení.

`HRA` v `src/lib/nastaveni.ts` odděluje ročníky. Příští rok ji změň, ať se party nemíchají
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

### Service worker tu není

Dřív byl, kvůli běhu bez signálu. V hospodách na trase ale signál je, takže
nepřinášel nic – jen se kvůli němu nová verze dostávala do telefonu až na
popohnání a jednou po aktualizaci zůstala černá plocha.

Odhlášení po něm dělá pár řádků v `src/main.tsx`: appka při spuštění zruší každou
registraci a smaže zásobu. Prohlížeč, který si ten starý zaregistroval, by si ho
jinak držel dál. Až budou všechna zařízení chvíli bez něj, může ten kousek zmizet.

Na plochu se appka přidává pořád stejně – to zařizuje `manifest.json`,
service worker na to potřeba není. Bez signálu funguje jen tehdy, když je
už otevřená; zápisy se drží v telefonu a pošlou se, až bude síť.

Kdyby něco spadlo, chytí to `<Zachrana>` a ukáže hlášku s tlačítkem *Načíst znovu*,
ne černou plochu. Názvy souborů v `dist/` nesou otisk obsahu, takže stará stránka
nemůže potkat nový skript.

## Ikony

Ikony jsou tlusté siluety s výstřižky, obrys křivý jako stříhaný tupýma nůžkama.
Kreslí je `scripts/kresli-ikony.mjs` do `src/lib/ikony.ts`:

```bash
node scripts/kresli-ikony.mjs
```

Náhodnost je pevná, takže stejný kód dá pokaždé stejné ikony. Každá ikona má
vlastní semínko odvozené od názvu, takže změna jedné nepřekreslí ostatní.

Tenké tahy se v malém slijí do kaše, proto je všechno tlusté — nejmenší jsou
půllitry obtížnosti ve 13 px. Když přidáváš novou, zkontroluj ji v malém:
hamburger se takhle poprvé slil do vlnovky, než se mu stáhlo kymácení.

## Písma

Archivo Black na nadpisy, Gloria Hallelujah na popisy, Outfit na ovládání —
všechno SIL OFL a uložené v `src/assets/fonts/`.
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

`logo.svg` a `src/lib/logo.ts` jsou obtažené z obrázku skriptem:

```bash
node scripts/prevod-loga.mjs <obrazek.png>
```

Kreslí se barvou textu (`currentColor`), takže funguje na světlém i tmavém podkladu.
`src/lib/logo.ts` je ten samý tvar jako dráha pro komponentu `<Logo>`, aby se vkládal
rovnou do stránky bez dalšího požadavku. Oba soubory jsou generované, needitovat ručně.

V rozhraní logo není — nese ho ikona appky, úvodní obrazovka a patička Pravidel.
Proč, je v `DESIGN.md`.

## Úvod po spuštění

Běží **po každém spuštění** a vždycky jde přeskočit. Má dvě části:

1. **Logo.** `public/uvodni/` jsou obrázky, které ukáže iOS při spuštění appky
   z plochy — bez nich se objeví jen prázdná barva. Hned po nich naváže
   `#uvod` v `index.html`: je rovnou ve stránce, aby naskočil dřív, než se stáhne
   skript. Drží se aspoň 1100 ms, než se načtou písma, a pak odejde prolnutím.
2. **Průprava.** Tři stránky s textem a animací (`src/components/Uvod.tsx`).
   Přehazují se samy po 2,4 s, ťuknutím nebo švihem do boku; *Přeskočit* je
   pořád na očích a poslední stránka má *Jedeme*.

Časování a obsah jsou nahoře v `Uvod.tsx` (`NA_STRANKU`, `LOGO_NEJMIN`, `PRUPRAVA`).
Appka se pod úvodem už kreslí a připojuje k Supabase, takže po doběhnutí je hotová.

Systémové obrázky generuje:

```bash
node scripts/uvodni-obrazovky.mjs
```

Skript vypíše i `<link>` značky — při přidání nového rozměru je potřeba je
přenést do `index.html`.

## Nasazení

Běží na GitHub Pages: **https://michaelbedna13.github.io/tourdepub/**

Appka se od přepisu do Reactu musí sestavit, takže ji nasazuje workflow,
ne servírování složky z větve.

1. **Settings → Pages → Source: `GitHub Actions`.** (Dřív tam bylo *Deploy from
   a branch* — tohle je jediná věc, kterou je po přepisu potřeba přepnout ručně.)
2. Každý push na `claude/admiring-euler-ci2d58` spustí
   `.github/workflows/nasazeni.yml`: `npm ci`, `npm run build`, nahrání `dist/`.
   Trvá to asi dvě minuty a je to vidět v záložce Actions.
3. Podsložku `/tourdepub/` zná build z `base` ve `vite.config.ts`. S vlastní
   doménou stačí build s `VITE_BASE=/` a `CNAME` v `public/`.

**Když se změna neprojeví**, je to buď ještě běžící workflow, nebo stará stránka
v telefonu — stačí ji zatáhnout dolů a načíst znovu. Service worker, který to
kdysi držel, už v appce není.

© Mišák
