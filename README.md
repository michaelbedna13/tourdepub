# Tour de Pub — Brno edition

Web ke hře: devět brněnskejch špeluněk, 23 úkolů a počítání čárek.
Staví se na mobil do ruky v hospodě — velké terče, vysoký kontrast, hlavní akce dole
na dosah palce. Na počítači stojí uprostřed na ploše.

Žádný build, žádné npm. Je to HTML, jedno CSS a pár souborů JS jako modulů.
Nahraje se do repozitáře a servíruje přes GitHub Pages.

## Struktura

```
index.html        kostra stránky
app.js            obrazovky a ovládání
stav.js           co má parta splněno, bodování, ukládání
data.js           hospody a úkoly — tady se mění pravidla
ui.js             kreslení ikon, čárek a půllitrů
ikony.js          ZÁSTUPNÉ — generuje scripts/kresli-ikony.mjs, needitovat ručně
sync.js           živé pořadí přes Supabase (volitelné)
nastaveni.js      klíče k Supabase a název hry
styl.css          celý vzhled, jeden soubor
sw.js             service worker, drží web v telefonu i bez signálu
manifest.json     aby šel web přidat na plochu jako appka
pisma/            Bevan a Outfit, stažené lokálně
scripts/          generátor ikon a stahovač písem
supabase/party.sql struktura tabulky pro živé pořadí
```

## Jak se to ovládá při hře

Spodní lišta má čtyři obrazovky:

- **Hra** — aktuální štace, dvě velká tlačítka (*Jsme v špeluňce*, *Škopek padl*)
  a vaše čárky. Mezi hospodami se posouvá tlačítky *Zpátky* / *Další štace*.
- **Úkoly** — ve výchozím stavu jen to, co jde splnit v týhle štaci. Přepínač
  *Všechny úkoly* ukáže i zbytek. Jednorázové se odškrtávají ťuknutím na řádek,
  opakovatelné mají − a +.
- **Pořadí** — kdo vede. Bez Supabase ukazuje jen vaši partu.
- **Pravidla** — loňská pravidla, legenda půllitrů a seznam hospod. Tlačítkem *Sem*
  se dá skočit na kteroukoli štaci, kdyby se pořadí hospod na place změnilo.

Překlik se opraví stejným ťuknutím ještě jednou. *Vynulovat naši hru* je dole v Pravidlech.

## Bodování

Čárka = bod. Počítá se:

1. čárka za každou špeluňku, do který vlezete (max. 9),
2. čárka za škopek v každý štaci (max. 9),
3. čárky za úkoly podle obtížnosti — 1 půllitr brnkačka, 2 větší haluz, 3 betelná makačka.

Dohromady se dá urvat nejvíc **74 čárek** (9 + 9 + 56 z úkolů).

Úkoly jsou v `data.js`. Každý má:

| pole | co znamená |
|---|---|
| `piva` | obtížnost 1–3, kreslí se jako půllitry |
| `body` | kolik čárek padne za jedno splnění |
| `max` | kolikrát to jde opakovat |
| `hospoda` | jde jen v téhle špeluňce (Bullseye v č. 4) |
| `mezi` | jde jen na cestě mezi dvěma špeluňkami (Srostlý budny 3–4) |
| `exkluzivni` | čárku bere jen jedna parta (Hospodský Národní) |
| `jednouZaHospodu` | z každé špeluňky jen jednou (Brněnskej zloděj) |

Nový úkol se přidá jako další položka do `UKOLY` v `data.js`. Nic dalšího se
upravovat nemusí, obrazovky se podle toho dopočítají samy.

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

Bez nastavení běží web v **ukázkovém režimu**: všechno se ukládá jen do telefonu
a v Pořadí je vidět jen vaše parta. Hra tak funguje úplně bez internetu.

Když chcete, aby každá parta zapisovala na svém mobilu a viděla ostatní živě:

1. Na [supabase.com](https://supabase.com) založ projekt (stačí free).
2. V **SQL Editoru** spusť obsah `supabase/party.sql`.
3. V **Settings → API** zkopíruj *Project URL* a *anon public* klíč.
4. Vlož je do `nastaveni.js`:

```js
export const SUPABASE_URL = "https://neco.supabase.co";
export const SUPABASE_KEY = "eyJ...";
```

5. Nahraj a každá parta si otevře stejnou adresu a nastaví si svoje jméno a barvu.

Klíč `anon` je určený do prohlížeče, takže ho klidně nahraj do repozitáře.
Tabulka je ale otevřená komukoli s odkazem — je to na jeden večer mezi známými.
Kdyby to mělo viset na internetu dýl, přidej přihlášení.

`HRA` v `nastaveni.js` odděluje ročníky. Příští rok ji změň, ať se party nemíchají
s letošními.

Bez signálu se zapisuje dál do telefonu a pošle se to, až bude signál.

## Appka na ploše

Web má `manifest.json` i service worker, takže jde přidat na plochu jako appka:
v Safari **Sdílet → Přidat na plochu**. Pak se otevírá na celou obrazovku bez
adresního řádku a funguje i ve sklepě bez signálu.

**Po každé změně webu zvedni `VERZE` v `sw.js`.** Jinak si telefon nechá
starou verzi a nových úkolů se nedočkáš.

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

Bevan na nadpisy, Outfit na text, obojí SIL OFL a uložené v `pisma/`.
Lokálně kvůli dvěma věcem: web funguje bez signálu a nenačítá se nic z Googlu.

Stahuje je `scripts/stahni-pisma.mjs`. Subsety se poznávají podle `unicode-range`,
ne podle pořadí — **Bevan má na Googlu tři subsety** (vietnamese, latin-ext, latin)
a když se vezmou první dva, chybí pak Č, Ř, Š a Ů.

## Nasazení

1. Settings → Pages → větev `main`, složka `/`.
2. Případně do kořene `CNAME` s doménou.

Cesty k souborům jsou relativní, takže web funguje na doméně,
na `michaelbedna13.github.io/tourdepub/` i po otevření z disku.

© Mišák
