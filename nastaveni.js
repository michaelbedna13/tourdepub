// Připojení k Supabase pro živé pořadí mezi telefony.
// Je to projekt od untrois – kvůli hře není potřeba zakládat nový, tabulek může
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
