import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Na GitHub Pages běží appka v podsložce /tourdepub/.
// S vlastní doménou stačí nastavit VITE_BASE=/ při buildu.
const base = process.env.VITE_BASE ?? "/tourdepub/";

export default defineConfig({
  base,
  build: { target: "es2022" },
});
