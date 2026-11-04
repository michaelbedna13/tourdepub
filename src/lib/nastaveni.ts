// Připojení k Supabase pro živé pořadí mezi telefony.
// Je to projekt `osobni-aplikace` – kvůli hře není potřeba zakládat nový, tabulek může
// mít jeden projekt kolik chce. Klíč je publishable, do prohlížeče patří a je
// veřejný záměrně; data chrání Row Level Security (viz supabase/party.sql).
// Když se URL a klíč vyprázdní, běží web jen z tohohle telefonu.
export const SUPABASE_URL: string = "https://nvjyxwsyrcslaruvqkkm.supabase.co";
export const SUPABASE_KEY: string = "sb_publishable_dL451QgRqYCR-BFwGTHOzg_1IXdrP9I";

// Tabulka, do které se zapisuje. Nemusíš kvůli hře zakládat nový projekt Supabase —
// tabulek může mít jeden projekt kolik chce, tak klidně použij ten, co už máš.
// Proto má tabulka předponu, ať se neplete s ostatními.
export const TABULKA = "tourdepub_tymy";

// Hospody a úkoly hry: jeden řádek na hru, společný pro všechny telefony.
// Zapisuje jen správce. Viz supabase/party.sql.
export const TABULKA_HRY = "tourdepub_hra";

// Název hry. Když byste chtěli hrát víckrát, změň ho a ročníky se nebudou míchat.
export const HRA = "brno-2026";

// Přihlášení. Do hry se pouští jen ten, kdo zná heslo hry; heslo neověřuje
// appka, ale Supabase Auth, takže ve zdrojáku není k přečtení. Jsou to dva
// účty v projektu osobni-aplikace a obě adresy jsou jen jména účtů, pošta
// na ně nechodí:
//  - společný účet hráčů: heslo hry zná celá parta,
//  - účet správce: odemkne úpravy úkolů a hospod a jako jediný smí mazat týmy.
// Kdo smí co, rozhoduje role v app_metadata účtu („hrac“ / „spravce“), na kterou
// se ptají pravidla v supabase/party.sql. Tu prohlížeč změnit neumí.
export const EMAIL_HRACE = "tourdepub-hrac@betelnarezba.cz";
export const EMAIL_SPRAVCE = "tourdepub-spravce@betelnarezba.cz";
