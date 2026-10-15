# Apple Design Context

Kontext pro skilly hig-* (Apple Human Interface Guidelines) v `.claude/skills/`.
Zdroj skillů: github.com/raintree-technology/apple-hig-skills (MIT).

## Product
- **Name**: Tour de Pub
- **Description**: Web ke hře na jeden večer. Parta obchází devět brněnskejch hospod,
  plní úkoly a sbírá čárky. Hraje se buď jedna parta proti sobě, nebo víc part proti sobě.
- **Category**: Hra / zapisování skóre
- **Stage**: Ve stavbě

## Platforms
| Platform | Supported | Min OS | Notes |
|----------|-----------|--------|-------|
| iOS      | Yes       | 16.4   | PWA přidaná na plochu (standalone), hlavní zařízení je iPhone |
| Android  | Yes       |        | PWA, stejné chování |
| macOS    | No        |        | Jen náhled v prohlížeči, appka stojí uprostřed na ploše |

## Technology
- **UI Framework**: Web bez buildu. HTML, jedno CSS, moduly JS. Žádný React, žádné npm.
  Rady z HIG převádět do HTML/CSS, ne do Swiftu.
- **Architecture**: Jedna stránka, přepínání pohledů spodní lištou. Stav v localStorage,
  volitelně Supabase pro živé pořadí.

## Design System
- **Base**: Vlastní, popsaný v DESIGN.md. Má přednost před obecnými radami HIG;
  HIG slouží k ověření ergonomie, ne k přepsání vizuálního stylu.
- **Brand Colors**: Černě zelený podklad `#0C1711`, off white text `#ECEBE4`,
  jeden akcent limetka `#C3F53C`. Tři barvy obtížnosti úkolu (mint, zlatá, korál).
- **Typography**: Bevan jen na slovní značku, Outfit na všechno ostatní. Lokálně v `pisma/`.
- **Dark Mode**: Appka je jen tmavá. Hraje se v noci v hospodě, světlý režim nedává smysl.
- **Dynamic Type**: Ne, pevná velikost písma.
- **Language**: Čeština, brněnský hantec v textech hry.

## Accessibility
- **Target Level**: Baseline (kontrast WCAG AA, dotykové cíle aspoň 44 px, popisky
  ovládacích prvků, Reduce Motion). Obtížnost se nikdy nepozná jen podle barvy —
  vedle barvy je vždy počet půllitrů a text.

## Users
- **Primary Persona**: Parta kamarádů, věk kolem třiceti. Každá parta má svůj telefon.
- **Key Use Cases**: Rychlý zápis čárky při příchodu do hospody a po pivu, odškrtnutí
  splněného úkolu, kouknutí na pořadí. Před hrou příprava týmů, hospod a úkolů.
- **Known Challenges**: Používá se v noci, v hlučné hospodě, jednou rukou, často
  po pár pivech. Terče musí být velké a nic se nesmí splést. Ve sklepích není signál.
