// Připojení k Supabase pro živé pořadí mezi telefony.
// Je to projekt `osobni-aplikace` – kvůli hře není potřeba zakládat nový, tabulek může
// mít jeden projekt kolik chce. Klíč je publishable, do prohlížeče patří a je
// veřejný záměrně; data chrání Row Level Security (viz supabase/party.sql).
// Když se URL a klíč vyprázdní, běží web jen z tohohle telefonu.
export const SUPABASE_URL = "https://nvjyxwsyrcslaruvqkkm.supabase.co";
export const SUPABASE_KEY = "sb_publishable_dL451QgRqYCR-BFwGTHOzg_1IXdrP9I";

// Tabulka, do které se zapisuje. Nemusíš kvůli hře zakládat nový projekt Supabase —
// tabulek může mít jeden projekt kolik chce, tak klidně použij ten, co už máš.
// Proto má tabulka předponu, ať se neplete s ostatními.
export const TABULKA = "tourdepub_tymy";

// Název hry. Když byste chtěli hrát víckrát, změň ho a ročníky se nebudou míchat.
export const HRA = "brno-2026";

// Kód, kterým se odemknou úpravy úkolů a hospod. Kdo ho nezadá, může jenom hrát.
// POZOR: je to zámek proti omylu a zvědavosti, ne bezpečnost. Web je veřejný
// a statický, takže kdo se podívá do zdrojáku, kód si přečte. Na partu kamarádů
// to stačí; kdyby mělo jít o víc, musela by přibýt opravdová práva v databázi.
export const ADMIN_KOD = "sladek";
