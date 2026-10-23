// Kresby pro úvod. Nejsou to ikony a nejsou to ani kresby úkolů: tohle jsou
// plakátové čmáranice — jeden tah, kulaté konce, nic vylitého. Dělají celou
// stránku, takže musí unést půl obrazovky.
//
// Kreslí se tahem, ne výplní (na rozdíl od KRESBY v kresby.ts), aby držely
// ten samý rukopis při každé velikosti: tloušťka čáry je v souřadnicích
// čtverce 0 0 100 100, takže roste s obrázkem.

export const UVOD_KRESBY: Record<string, string[]> = {
  // Škopek, co si to šlape po štacích.
  skopek: [
    "M24 39L70 39",
    "M24 39C22 30 30 28 33 32C36 25 44 26 47 31C51 24 59 26 61 32C66 28 72 32 70 39",
    "M25 39C24 57 26 71 29 79C41 84 55 84 66 79C69 69 70 55 69 39",
    "M69 47C85 45 87 65 70 67",
    "M39 85L37 96", "M28 97L38 96",
    "M56 85L59 96", "M68 97L59 96",
    "M41 56L41 60", "M56 56L56 60",
    "M42 67C46 72 52 72 56 67",
  ],
  // Čtyři čárky a pátá přes ně — a culí se to.
  carky: [
    "M24 16L20 56", "M39 15L43 55", "M57 16L53 56", "M73 15L77 55",
    "M14 48L83 22",
    "M38 70L38 74", "M62 70L62 74",
    "M40 80C47 88 56 88 63 80",
  ],
  // Šnek: kdo se loudá, ten nemá.
  snek: [
    "M20 76C34 83 60 83 76 76",
    "M20 76C19 67 24 60 32 58",
    "M76 76C83 74 87 68 85 60",
    "M85 60L89 47", "M88 44L89 46",
    "M79 61L74 49", "M73 46L74 48",
    "M62 48C62 37 53 30 44 33C34 36 30 47 35 56C40 65 52 67 60 60C67 54 66 44 59 40C53 37 47 39 45 45C43 50 47 55 52 54C55 53 56 49 54 47",
  ],
  // Koruna: celej bank bere jedna.
  koruna: [
    "M21 70L17 33L34 49L50 27L66 49L83 33L79 70",
    "M21 70C39 76 61 76 79 70",
    "M39 56L39 60", "M61 56L61 60",
    "M42 65C47 70 54 70 59 65",
    "M17 28L17 30", "M50 22L50 24", "M83 28L83 30",
  ],
};
