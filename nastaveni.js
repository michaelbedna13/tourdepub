// Připojení k Supabase pro živé pořadí mezi telefony.
// Dokud jsou URL a klíč prázdné, běží web jen z tohohle telefonu a v Týmech
// jsou vidět jenom ty, které sis tu založil. Postup je v README.
export const SUPABASE_URL = "";
export const SUPABASE_KEY = "";

// Tabulka, do které se zapisuje. Nemusíš kvůli hře zakládat nový projekt Supabase —
// tabulek může mít jeden projekt kolik chce, tak klidně použij ten, co už máš.
// Proto má tabulka předponu, ať se neplete s ostatními.
export const TABULKA = "tourdepub_tymy";

// Název hry. Když byste chtěli hrát víckrát, změň ho a ročníky se nebudou míchat.
export const HRA = "brno-2026";
